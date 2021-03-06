#!/usr/bin/env node
/*
    DSDROP: Instant file sharing server
    Copyright (C) 2014-2015  Callan Bryant <callan.bryant@gmail.com>

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
// TODO: garbage collection with metering
// TODO: one-shot
// TODO: metering for stats
// TODO: what todo if user already uploaded file?

var config = require('../lib/autoconfig')//.init(__dirname+'/../default/server.yml')
//config.override_argv()
//config.override_maybe()


var redis     = require('redis')
var rclient   = redis.createClient()
var restify   = require('restify')
var hashbin   = require('../lib/hashbin')
var mkdirp    = require('mkdirp')
var fs        = require('fs')
hashbin.root  = config.data_dir
var tokenauth = require('../lib/tokenauth').init(rclient)
var log       = require('../lib/objectlog').init(rclient).log
var database  = require('../lib/database').init({
	rclient : rclient,
    	// may as well share same token keyspace with token auth
	keygen  : tokenauth.generate_valid_unique_token,
    	config  : config,
})

var server = restify.createServer({
	name: config.hostname,
	//certificate:'string',
	//key:'string',
	//version: '0.0.1'
})

// might not exist. Data dir is created by hashbin.
mkdirp.sync(config.tmp_dir)

server.use(restify.acceptParser(server.acceptable))
server.use(restify.queryParser())
server.use(restify.bodyParser({
	// req.body is then JSON content
	mapParams : false,
	uploadDir : config.tmp_dir,
}))
server.use(restify.jsonp())

// file download!
server.get(/([A-Za-z0-9]{8})$/,function(req,res,next) {
	var token = req.params[0]

	// instance
	database.extract(token,function(err,instance) {
		if (err) return res.send(404,err)

		hashbin.extract(instance.hash,function(err,file) {
			if (err) return res.send(404,err)

			log({
				token:token,
				req:req,
				publisher:instance.user,
				filename:instance.name,
				action:'DOWNLOAD_START',
			})

			// headers (mime type, size)
			res.header('Content-Length',file.size)
			res.header('Content-Type',instance.mimetype)
			//res.header('Content-Disposition',"attachment; filename="+instance.name)
			res.header('Content-Disposition',"inline; filename="+instance.name)

			// stream file
			var stream = fs.createReadStream(file.binpath)
			// to meter: do on data, record separately, maybe
			stream.pipe(res)
			var prevBytesWritten = 0
			stream.on('data',function(data){
				// HACK
				res.socket.bytesWritten
				// hacky way of detecting cancelled download. Otherwise, there is spike in transfer rate.
				if (res.socket.bytesWritten == prevBytesWritten) return 0
				database.integrateThroughput(data.length)
				prevBytesWritten = res.socket.bytesWritten
			})
			stream.on('end',res.end)
		})
	})
})

// information for dashboard
server.get('/stats',function(req,res,next) {
	res.header('Cache-Control','no-cache')
	database.serverstats(function(err,stats) {
		if (err) return res.send(500,err)
		res.send(200,stats)
	})
})

var auth = require('../lib/auth/'+config.auth_module || '../lib/auth/').init(config)
server.get('/token',function (req,res,next) {
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
	// won't be used, could still be valid. Plug the hole.
	tokenauth.invalidateToken(req.params.old)
	if (! req.params.username) {
		res.send(403,auth.description)
		return next()
	}
	auth.login(req.params.username,req.params.password,function(err,authentic) {
		if (err)        return res.send(500,err)
		if (!authentic) return res.send(403,'Access denied.')

		tokenauth.create(req.params.username,ip,function(err,token) {
			if (err) return res.send(500,err)
			res.send(200,token)
			return next()
		})
	})
})

// authentication, match uploads only
server.use(function(req,res,next) {
	if (!req.url.match(/upload/)) return next()
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress

	tokenauth.authenticate(req.body.token,ip,function(err,username) {
		if (err) return res.send(403,err)
		req.username = username
		return next()
	})
})

// Instant file upload by hash not file
// Assumes server already has file. If not, this will fail with 404 and client
// must attempt a full-upload
server.post('/instant-upload',function(req,res,next) {
	// is it there?
	hashbin.extract(req.body.hash,function(err,file) {
		if (!err) {
			database.add({
				hash     : req.body.hash,
				name     : req.body.name,
				user     : req.username,
				oneshot  : !!req.body.oneshot,
				size     : file.size,
				new      : false,
			}, function(err,token){
				if (err) return res.send(500,err)
				res.send(200,config.url+token)
			})
		} else
			res.send(404,err)
	})
})

// file upload by actual file, assuming the instant upload attempt has just failed
// file is filedata
server.post('/full-upload',function(req,res,next) {
	var uploaded = Object.keys(req.files).length
	if (!uploaded)
		return req.send(500,'...Upload a file next time...')

	hashbin.assimilate(req.files.filedata.path,function(err,file){
		if (!err) {
			database.add({
				// hash is added later by hashbin
				name     : req.files.filedata.name,
				user     : req.username,
				oneshot  : !!req.body.oneshot,
				new      : file.new,
				size     : file.size,
				hash     : file.hash,
			},function(err,token){
				if (err) return res.send(500,err)
				res.send(200,config.url+token)
			})
			fs.unlink(req.files.filedata.path)
		} else
			res.send(500,err)
	})
})

// web dashboard
server.get(/.+/,restify.serveStatic({
	directory:__dirname+'/../web/',
	default:'index.html',
	//maxAge:3600,
//	maxAge:0, // disable cache
}))


server.listen(config.port,config.listen, function () {
	console.log('dsdrop: %s listening at %s', server.name, server.url)
})

