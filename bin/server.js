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

var config      = require('./autoconfig')
var restify     = require('restify')

var server = restify.createServer({
	name: 'dsdrop',
	//certificate:'string',
	//key:'string',
	//version: '0.0.1'
})


server.use(restify.acceptParser(server.acceptable))
server.use(restify.queryParser())
server.use(restify.bodyParser({mapParams: false})) // req.body is then JSON content
server.use(restify.jsonp())
//server.use(restify.gzipResponse()); // breaks page load


server.get('/zones',function(req,res,next) {
var zones = ['not','implemented','yet']
	res.send(200,zones)
	return next()
})
/*
// announce a `msg` with a `chime` on a zone
server.post('/:zone',function(req,res,next) {
	var success = aggregator.publish(req.params.id)
	res.send(success?200:404,{success:success})
	return next()
})

*/

// announce a `msg` with a `chime`
server.post('/',function(req,res,next) {
	if (config.key && req.body.key != config.key) {
		res.send({
			success: false,
			msg: 'Incorrect API key',
		})
		return next()
	}

	if (!req.body.msg || req.body.msg.length < 2) {
		res.send({
			success: false,
			msg: 'Invalid msg given',
		})
		return next()
	}

	// don't know why, but this is a string
	if (req.body.personality == 'true' || config.personality)
		req.body.msg = personality.modify(req.body.msg)

	conductor.broadcast({
		msg: req.body.msg,
		chime: req.body.chime || 'belt',
		zone: req.body.zone,
		callback: function(client_count,error) {
			// broadcast,
			// also send number of clients, etc
			if (client_count)
				res.send({
					success : true,
					msg     : "Broadcasted to "+client_count+" clients"
				})
			else
				res.send({
					success :false,
					msg     :error,
				})

			return next()
		},
	})
})

server.get('/status',function(req,res,next) {
	res.send({
		chimes:conductor.chimes,
		//zones:conductor.zones,
	})
	next()
})

server.get(/\/chimes\/.+/,restify.serveStatic({
	// HACK: symlink to chimes in chimes
	directory:__dirname+'/chimes/',
	//maxAge:3600,
}))

// cached rendered TTS
server.get(/\/[0-9a-f]{32}\.?.+/,restify.serveStatic({
	directory:__dirname+'/cache/',
	//maxAge:3600,
}))


// test client
server.get(/.+/,restify.serveStatic({
	directory:__dirname+'/web/',
	default:'index.html',
	//maxAge:3600,
	maxAge:0, // disable cache
}))


conductor.listen(server)
server.listen(config.port,config.listen, function () {
	//console.log('%s listening at %s', server.name, server.url)
})

