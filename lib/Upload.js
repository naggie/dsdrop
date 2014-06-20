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
var crypto   = require('crypto')
var querystring = require('querystring')
var yaml     = require('js-yaml')
var util     = require('util')

// TODO: direction: event based

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

	this.uploadFile = function(filepath) {
		fs.stat(filepath,function(err,stats){
			if (err) return emit('error',Error(err))
			self.filesize = stats['size']
			self.filepath = filepath

			// TODO auto set filename, so override is possible with zip
			//self.filename = ...

			self.emit('newFile')
		})
	}

	//this.uploadMultiple = function()
	//var elaborateFiles  = function

	var attemptInstantUpload = function() {
		if (!self.url)      return self.emit('error',Error('Client library: URL attribute not set'))
		if (!self.token)    return self.emit('loginReqired')

		var r = request.post(self.url+'/instant-upload', function(err,httpResponse,body) {
			if (err) return self.emit('error',err)

			var msg = JSON.parse(body)

			// server does not have file, so send it
			if (httpResponse.statusCode == 404)
				return self.emit('instantUploadNotPossible')

			if (httpResponse.statusCode == 403)
				return self.emit('loginReqired',this)

			if (httpResponse.statusCode !== 200)
				// an error
				return self.emit('error',Error(msg))

			self.emit('done',msg)
		})
		var form = r.form()
		form.append('token',self.token)
		form.append('hash',self.hash)
		form.append('name',path.basename(self.filepath))
	}

	this.login = function(username,password) {
		if (!self.url) return self.emit('error',Error('Client library: URL attribute not set'))
		var query = querystring.stringify({
			username:username,
			password:password,
			old:self.token,
		})

		request({
			uri : self.url+'/token?'+query,
			method : 'GET',
		},function(err,httpResponse,body) {
			if (err) return emit('error',Error(err))
			var msg = JSON.parse(body)

			if (httpResponse.statusCode == 200) {
				self.token = msg
				self.emit('authenticated')
				self.save()
			} else // an error
				self.emit('authenticationFailure',msg)
		})
	}

	var fullUpload = function(next) {
		self.emit('uploadStart')
		var r = request.post(self.url+'/full-upload', function(err,httpResponse,body) {
			if (err) return emit('error',Error(err))

			if (httpResponse.statusCode !== 200)
				return emit('error',Error('Error '+httpResponse.statusCode+' from server: '+body))

			clearInterval(interval)
			self.emit('progress',r.req.connection.socket._bytesDispatched)
			self.emit('done',JSON.parse(body))
		})

		var interval = setInterval(function() {
			self.emit('uploadProgress',r.req.connection.socket._bytesDispatched)
		},100)

		var form = r.form()
		form.append('token',self.token)
		form.append('filedata',fs.createReadStream(self.filepath))
	}

	var getDescription = function() {
		request({
			uri : self.url+'/token',
			method : 'GET',
		},function(err,httpResponse,body) {
			if (err) return done(err)

			if (httpResponse.statusCode != 403)
				return done('Invalid response from server')

			self.description = JSON.parse(body)
			self.emit('description',self.description)
		})
	}

	// hashing with one thread, in sequence is much faster.
	// Also, as this is I/O bound, JS is about as fast as OpenSSL/sha1sum.
	var hashfile = function() {
		self.emit('hashStart')

		var progress = 0

		var hash = crypto.createHash('sha1')

		var h = fs.ReadStream(self.filepath)
		h.on('data', function(d) {
			hash.update(d)
			progress += d.length
		})

		// forward error
		h.on('error',function(err){ self.emit('error',err) })

		h.on('end',function() {
			self.hash = hash.digest('hex')
			clearInterval(interval)
			self.emit('hashProgress',progress)
			self.emit('hash',self.hash)
		})

		var interval = setInterval(function() {
			self.emit('hashProgress',progress)
		},100)
	}

	// save state (token, url)
	this.save = function() {
		var contents = yaml.safeDump({
			url   : self.url,
			token : self.token,
		})

		fs.writeFileSync(this.configFilePath,contents)
	}

	// load or create state (token,url)
	this.load = function() {
		if ( !fs.existsSync(this.configFilePath))
			return

		var saved = yaml.safeLoad(fs.readFileSync(this.configFilePath,'utf8'))

		self.url = saved.url
		self.token = saved.token
	}

	var promptLoginContinue = function(){
		self.emit('plsLogin')
		this.once('authenticated',attemptInstantUpload)
	}

	// CONSTRUCTOR
	// load config now
	this.load()

	// workflow protocol (methods also emit events, and may require an external workflow)
	this.on('newFile'                  ,hashfile)
	this.on('hash'                     ,attemptInstantUpload)
	this.on('instantUploadNotPossible' ,fullUpload)
	// need a new session before re-attempt branch
	this.on('loginReqired'             ,getDescription)
	this.on('description'              ,promptLoginContinue)
}

//  Create a class called Main
var EventEmitter = require('events').EventEmitter
util.inherits(Main, EventEmitter)
module.exports = Main

