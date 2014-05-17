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

var config = require('../lib/autoconfig')//.init(__dirname+'/../default/server.yml')
//config.override_argv()
//config.override_maybe()


var restify = require('restify')
var hashbin = require('../lib/hashbin')
hashbin.root = config.data_dir

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


// file download!
server.get(/[A-Za-z0-9]{8}/,function(req,res,next) {
	var token = req.params[0]
})

// information for dashboard
server.get('/stats',function(req,res,next) {
})

// file upload!
server.post('/upload',function(req,res,next) {
	var file = {
		path : req.files.filedata.path,
		name : req.files.filedata.name,
		size : req.files.filedata.size,
		mime : req.files.filedata.type,
	}

	// callback(err,hash,isnew,binpath)
	hashbin.assimilate(file.path,function(ierr,hash,isnew,binpatg){
		console.log(arguments)
	})

	res.send()
	return next()
})


// web dashboard
server.get(/.+/,restify.serveStatic({
	directory:__dirname+'/../web/',
	default:'index.html',
	//maxAge:3600,
	maxAge:0, // disable cache
}))


server.listen(config.port,config.listen, function () {
	//console.log('%s listening at %s', server.name, server.url)
})

