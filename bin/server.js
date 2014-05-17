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
// /srv/drop/9c/462c047e22df523d20df9e8626ff009d6031d3.bin
server.get(/([A-Za-z0-9]{8})$/,function(req,res,next) {
	var token = req.params[0]

	// headers (mime type, size)
	// stream file
	var stream = fs.createReadStream('/srv/drop/9c/462c047e22df523d20df9e8626ff009d6031d3.bin')
	stream.pipe(res)
        stream.on('end', function() {
		res.end()
	})
})

// information for dashboard
server.get('/stats',function(req,res,next) {
})

// file upload!
// maybe ppipe if memory
server.post('/upload',function(req,res,next) {
	var file = {
		tmp_path : req.files.filedata.path,
		name     : req.files.filedata.name,
		size     : req.files.filedata.size,
		mime     : req.files.filedata.type,
	}

	// callback(err,hash,isnew,binpath)
	hashbin.assimilate(file.tmp_path,function(ierr,hash,isnew,binpath){
		file.hash = hash
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

