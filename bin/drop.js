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
var Uploader = require('../lib/Uploader')
var clipboard = require('copy-paste')
var prompt = require('prompt')
var ProgressBar = require('progress')
require('colors')

var uploader = new Uploader()

uploader.on('uploadStart',function() {
	var bar = new ProgressBar('Uploading [:bar] :percent :etas', {
		complete: '=',
		incomplete: ' ',
		width: 30,
		total: uploader.filesize,
	})

	uploader.on('uploadProgress',function(val) {
		bar.update(val/uploader.filesize)
	})
})

uploader.on('hashStart',function() {
	var bar = new ProgressBar('Analysing [:bar] :percent :etas', {
		complete: '=',
		incomplete: ' ',
		width: 30,
		total: uploader.filesize,
	})

	uploader.on('hashProgress',function(val) {
		bar.update(val/uploader.filesize)
	})
})

uploader.on('error',function(err) {
	console.error(err.message.red)
	process.exit(23)
})

uploader.uploadFile(filepath)


function publish () {
	uploader.publish(function(err,url) {
		// new session token, pls
		if (err == uploader.TOKEN_INVALID) login(publish)
		if (err) return process.stderr.write(err.yellow+"\n")


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
}

function login(success) {
	console.log('Connecting to '+uploader.url)

	uploader.describe(function(err,description) {
		if (err) return console.log(err)

		process.stderr.write("\n"+description+"\n\n")

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
			if (err) return console.log('Invalid input')

			uploader.login(result.username,result.password,function(err) {
				process.stderr.write("\n")

				if (err)
					process.stderr.write(err.red+"\n")
				else {
					process.stderr.write("Login Successful!\n\n".green)
					success()
				}
			})
		})
	})
}



