#!/usr/bin/env node
/*
   Copyright 2014 Callan Bryant <callan.bryant@gmail.com>

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

// TODO: insertion of instance
// TODO: garbage collection with metering
// TODO: one-shot
// TODO: metering for stats

var config = require('../lib/autoconfig')//.init(__dirname+'/../default/server.yml')
//config.override_argv()
//config.override_maybe()


var redis     = require('redis')
var rclient   = redis.createClient()
var restify   = require('restify')
var hashbin   = require('../lib/hashbin')
hashbin.root  = config.data_dir
var tokenauth = require('../lib/tokenauth').init(rclient)
var database  = require('../lib/database').init(rclient)

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


//server.use(restify.gzipResponse()); // breaks page load


// file download!
// TODO: html/text disposition inline?
// /srv/drop/9c/462c047e22df523d20df9e8626ff009d6031d3.bin
server.get(/([A-Za-z0-9]{8})$/,function(req,res,next) {
	var token = req.params[0]

	// headers (mime type, size)
	res.header('Content-Length',1010827264)
	res.header('Content-Type:','application/octet-stream')
	res.header('Content-Disposition',"attachment; filename=beans.iso")

	// stream file
	//var stream = fs.createReadStream('/srv/drop/9c/462c047e22df523d20df9e8626ff009d6031d3.bin')
	var stream = fs.createReadStream('/srv/drop/d4/d44272ee5f5bf887a9c85ad09ae957bc55f89d.bin')
	// to meter: do on data, record separately, maybe
	stream.pipe(res)
        stream.on('end',res.end)
})

// information for dashboard
server.get('/stats',function(req,res,next) {
})

// authentication, match uploads only
server.use(function(req,res,next) {
	if (!req.url.match(/upload/)) return next()

	tokenauth.authenticate(req.body.token,function(err,identity) {
		if (err) return res.send(403,err)
		req.identity = identity
		return next()
	})
})

// Instant file upload by hash not file
// Assumes server already has file. If not, this will fail with 404 and client
// must attempt a full-upload
server.post('/instant-upload',function(req,res,next) {
	var instance = {
		hash     : req.body.hash,
		name     : req.body.name,
		user     : req.identity.name,
		oneshot  : !!req.body.oneshot,
	}

	// is it there?
	hashbin.extract(instance.hash,function(err,file) {
		if (!err) {
			instance.size = file.size
			database.add(instance,function(err,token){
				if (err) return res.send(500,err)
				res.send(200,'Successful instant upload')
			})
		} else
			res.send(404,err)
	})
})

// file upload by actual file, assuming the instant upload attempt has just failed
server.post('/full-upload',function(req,res,next) {
	var uploaded = Object.keys(req.files).length
	if (!uploaded)
		return req.send(500,'...Upload a file next time...')

	var tmp_path = req.files.filedata.path
	var file = {
		// hash is added later by hashbin
		name     : req.files.filedata.name,
		size     : req.files.filedata.size,
		mime     : req.body.mime,
	}

	// callback(err,hash,isnew,binpath)
	hashbin.assimilate(file.tmp_path,function(err,object){
		file.hash = object.hash
			console.log('Publish',file)
		fs.unlink(tmp_path)

		res.send()
		return next()
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

