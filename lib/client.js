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

var request  = require('request')
var fs       = require('fs')
var path     = require('path')
var hashfile = require('./hashbin').hashfile
var querystring = require('querystring')
var yaml     = require('js-yaml')
var util     = require('util')

// OO + INHERITANCE FROM EVENTEMITTER
//
// usage:
// 	var Banana = require('banana')
//      var banana = new Banana()
//
// Inspiration:
// http://www.hacksparrow.com/node-js-eventemitter-tutorial.html

var Main = function() {
	// Reference object in method context
	var self = this

	// TODO read client drop URL from server config
	this.url = 'https://drop.darksky.io/'

	// TODO fix terrible hack to ignore Self-signed cert
	process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

	this.configFilePath = process.env.HOME+'/.dsdrop.yml'

	// error codes: compare generic error callback value with these to allow programatic response
	this.TOKEN_INVALID = 'Session token is no longer valid. Login required.'

	this.publish = function(filepath,done) {
		if (!self.token) return done(self.TOKEN_INVALID)
		if (!self.url)   return done('Client library: URL attribute not set')

		hashfile(filepath,function(err,hash) {
			if (err) return console.log(err)
			var r = request.post(self.url+'/instant-upload', function(err,httpResponse,body) {
				if (err)
					return done(err)

				var msg = JSON.parse(body)

				// server does not have file, so send it
				if (httpResponse.statusCode == 404)
					return fullUpload(filepath,done)

				if (httpResponse.statusCode == 403)
					return done(self.TOKEN_INVALID)

				if (httpResponse.statusCode !== 200)
					// an error
					return done(msg)

				done(null,JSON.parse(body))
			})
			var form = r.form()
			form.append('token',self.token)
			form.append('hash',hash)
			form.append('name',path.basename(filepath))
		})
	}

	this.login = function(username,password,done) {
		if (!self.url) return done('Client library: URL attribute not set')
		var query = querystring.stringify({
			username:username,
			password:password,
			old:self.token,
		})

		request({
			uri : self.url+'/token?'+query,
			method : 'GET',
		},function(err,httpResponse,body) {
			if (err) return done(err)
			var msg = JSON.parse(body)

			if (httpResponse.statusCode == 200) {
				self.token = msg
				done(null)
				self.save()
			} else // an error
				done(msg)
		})
	}

	var fullUpload = function(filepath,done) {
		var r = request.post(self.url+'/full-upload', function(err,httpResponse,body) {
			if (err) return done(err)

			if (httpResponse.statusCode !== 200)
				return done('Error '+httpResponse.statusCode+' from server: '+body)

			done(null,JSON.parse(body))
		})
		var form = r.form()
		form.append('token',self.token)
		form.append('filedata',fs.createReadStream(filepath))
	}

	this.describe = function(done) {
		if (!self.url) return done('Client library: Server URL not set')

		request({
			uri : self.url+'/token',
			method : 'GET',
		},function(err,httpResponse,body) {
			if (err) return done(err)

			if (httpResponse.statusCode != 403)
				return done('Invalid response from server')

			done(err,JSON.parse(body))
		})
	}

	// save state (token, url)
	this.save = function() {
		var contents = yaml.safeDump({
			url : this.url,
			token : this.token,
		})

		fs.writeFileSync(this.configFilePath,contents)
	}

	// load or create state (token,url)
	this.load = function() {
		if ( !fs.existsSync(this.configFilePath))
			return

		var saved = yaml.safeLoad(fs.readFileSync(this.configFilePath,'utf8'))

		this.url = saved.url
		this.token = saved.token
	}

	// CONSTRUCTOR
	// load config now
	this.load()
}

//  Create a class called Main
var EventEmitter = require('events').EventEmitter
util.inherits(Main, EventEmitter)
module.exports = Main

