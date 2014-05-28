#! /usr/bin/env node
/*
   Talk to the dsdrop API

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


var request  = require('request')
var fs       = require('fs')
var path     = require('path')
var hashfile = require('./hashbin').hashfile

//var EventEmitter = require('events').EventEmitter

//util.inherits(Master, EventEmitter)
//var Master = module.exports = function(){}

exports.publish = function(filepath,done) {
	if (!exports.token) return done('Token attribute not set')
	if (!exports.token) return done('URL attribute not set')

	hashfile(filepath,function(err,hash) {
		if (err) return console.log(err)
		var r = request.post(exports.url+'/instant-upload', function(err,httpResponse,body) {
			if (err)
				return done(err)

			// server does not have file, so send it
			if (httpResponse.statusCode == 404)
				return fullUpload(filepath,done)

			if (httpResponse.statusCode !== 200)
				return done('Error '+httpResponse.statusCode+' from server: '+body)

			done(null,JSON.parse(body))
		})
		var form = r.form()
		form.append('token',exports.token)
		form.append('hash',hash)
		form.append('name',path.basename(filepath))
	})
}

// not sure if needed, given TODO instances can expire + oneshot
//exports.unpublish(ref) {
//	// decide if instance token, filename, or sha1 hash
//}
//
//var unpublish_hash     = function() {}
//var unpublish_instance = function() {}
//var unpublish_filename = function() {}

var fullUpload = function(filepath,done) {
	var r = request.post(exports.url+'/full-upload', function(err,httpResponse,body) {
		if (err)
			return done(err)

		if (httpResponse.statusCode !== 200)
			return done('Error '+httpResponse.statusCode+' from server: '+body)

		done(null,JSON.parse(body))
	})
	var form = r.form()
	form.append('token',exports.token)
	form.append('filedata',fs.createReadStream(filepath))
}
