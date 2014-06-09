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
// TODO: event emitter to give progress in percent
// TODO: info functions (user/file/server)


var request  = require('request')
var fs       = require('fs')
var path     = require('path')
var hashfile = require('./hashbin').hashfile
var querystring = require('querystring')
var yaml     = require('js-yaml')

//var EventEmitter = require('events').EventEmitter

//util.inherits(Master, EventEmitter)
//var Master = module.exports = function(){}
// TODO inherit default config from server or something
//exports.url = 'http://localhost:9002'
//exports.url = 'http://localhost:9000'
// TODO FIXME TODO FIXME
// hardcoded
exports.url = 'https://drop.darksky.io/'

// TODO fix terrible hack to ignore Self-signed cert
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

exports.configFilePath = process.env.HOME+'/.dsdrop.yml'

exports.init = function() {
	exports.load()
	return exports
}

exports.publish = function(filepath,done) {
	if (!exports.token) return done('Client library: Token attribute not set')
	if (!exports.url)   return done('Client library: URL attribute not set')

	hashfile(filepath,function(err,hash) {
		if (err) return console.log(err)
		var r = request.post(exports.url+'/instant-upload', function(err,httpResponse,body) {
			if (err)
				return done(err)

			var msg = JSON.parse(body)

			// server does not have file, so send it
			if (httpResponse.statusCode == 404)
				return fullUpload(filepath,done)

			if (httpResponse.statusCode == 403)
				return done('Client: Token invalid. Please login to get a new token.')

			if (httpResponse.statusCode !== 200)
				// an error
				return done(msg)

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

exports.login = function(username,password,done) {
	if (!exports.url) return done('Client library: URL attribute not set')
	var query = querystring.stringify({
		username:username,
		password:password,
		old:exports.token,
	})

	request({
		uri : exports.url+'/token?'+query,
		method : 'GET',
	},function(err,httpResponse,body) {
		if (err) return done(err)
		var msg = JSON.parse(body)

		if (httpResponse.statusCode == 200) {
			exports.token = msg
			done(null)
			exports.save()
		} else // an error
			done(msg)
	})
}

var fullUpload = function(filepath,done) {
	var r = request.post(exports.url+'/full-upload', function(err,httpResponse,body) {
		if (err) return done(err)

		if (httpResponse.statusCode !== 200)
			return done('Error '+httpResponse.statusCode+' from server: '+body)

		done(null,JSON.parse(body))
	})
	var form = r.form()
	form.append('token',exports.token)
	form.append('filedata',fs.createReadStream(filepath))
}

exports.describe = function(done) {
	if (!exports.url) return done('Server URL not set')

	request({
		uri : exports.url+'/token',
		method : 'GET',
	},function(err,httpResponse,body) {
		if (err) return done(err)

		if (httpResponse.statusCode != 403)
			return done('Invalid response from server')

		done(err,JSON.parse(body))
	})
}

// save state (token, url)
exports.save = function() {
	var contents = yaml.safeDump({
		url : exports.url,
		token : exports.token,
	})

	fs.writeFileSync(exports.configFilePath,contents)
}

// load or create state (token,url)
exports.load = function() {
	if ( !fs.existsSync(exports.configFilePath))
		return

	var saved = yaml.safeLoad(fs.readFileSync(exports.configFilePath,'utf8'))

	exports.url = saved.url
	exports.token = saved.token
}
