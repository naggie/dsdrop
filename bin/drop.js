#! /usr/bin/env node
/*
   Sends a file via dsdrop

   Copyright 2013 Callan Bryant <callan.bryant@gmail.com>

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
// basic implementation
// TODO: config system
// TODO: oneshot flag

if (!process.argv[2]) {
	console.log('usage:',process.argv[1],'<file to send>')
	process.exit()
}

var filepath = process.argv[2]
var Upload = require('../lib/Upload')
var clipboard = require('copy-paste')
var prompt = require('prompt')
var ProgressBar = require('progress')
require('colors')

var upload = new Upload()

upload.on('uploadStart',function() {
	var bar = new ProgressBar('Uploading [:bar] :percent :etas', {
		complete: '=',
		incomplete: ' ',
		width: 30,
		total: upload.filesize,
	})

	upload.on('uploadProgress',function(val) {
		bar.update(val/upload.filesize)
	})
})

upload.on('hashStart',function() {
	var bar = new ProgressBar('Analysing [:bar] :percent :etas', {
		complete: '=',
		incomplete: ' ',
		width: 30,
		total: upload.filesize,
	})

	upload.on('hashProgress',function(val) {
		bar.update(val/upload.filesize)
	})
})

// programatic error
upload.on('error',function(err) {
	console.error(err.message.red)
	process.exit(23)
})


upload.on('authenticationFailure',function(msg) {
	process.stderr.write(err.red+"\n")
	proces.exit()
})

upload.on('done',function(url) {
	// TMUX messes up copy and paste in mac os x
	clipboard.copy(url,function(err) {
		if (!err && ! (process.env.TMUX && process.platform == 'darwin') )
			process.stderr.write("\nURL in clipboard: ".green)
		else
			process.stderr.write("\nURL: ".green)

		console.log(url)

		// this is necessary, due to
		// https://github.com/xavi-/node-copy-paste/issues/17 (Process will not exit)
		// https://github.com/xavi-/node-copy-paste/issues/18 (error callback fired twice)
		process.exit(0)
	})
})

upload.on('plsLogin',function(){
	console.log('Connecting to '+upload.url)

	process.stderr.write("\n"+upload.description+"\n\n")

	prompt.start()

	prompt.get({
		properties: {
			username: {
				required: true,
				default: process.env.USER
			},
			password: {
				hidden: true,
				required: true,
			}
		}
	},function (err, result) {
		if (err) return console.log('Invalid input'.yellow)
		upload.login(result.username,result.password)
	})
})

upload.on('authenticated',function() {
	console.log("\nAuthentication and authorisation successful".green)
})


upload.uploadFile(filepath)
