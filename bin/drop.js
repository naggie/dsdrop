#! /usr/bin/env node
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
