#! /usr/bin/env node
/*
   Manages API keys (list/create/delete/re-issue/extend) for notification bots

   Data stored:
	   name, key, description, date, expiry time

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
// API keys are unique across all time. Even if they expire.
// A name may not have a valid API key, and a key might be expired, with no name
// // POSSIBLE FUTURE FEATURES:
// TODO: rates, total, log, expire time. Maybe, not needed for current scope.
//
// TODO: record generic 'source' set for each successful and not auth attempt.
// if there are more than n sources, warn and configure. A source could be an
// IP or hostname. Could also store number of failed auth attempts per source.
// TODO: timestamps
// TODO: credits
// TODO: contact
var crypto    = require('crypto')
var redis     = require('redis')

var rclient
exports.init = function(client) {
	if (!arguments.length)
		rclient = redis.createClient()
	else
		rclient = client

	exports.quit = rclient.quit

	return exports
}

// make an 8 char base64-based key
function generate_potential_key() {
        var hash = crypto.createHash('sha1')
	var rand = Math.random().toString()
	hash.update(rand)
	var key = hash.digest('base64')

	return key.substr(0,8)
}

// generate a high quality key, returning to callback
// from char set A-Z a-z 0-9
// and unique
function generate_valid_key(done) {
	var key
	// look for a key without + or /
	while (true) {
		key = generate_potential_key()
		if ( ! key.match(/\+|\//) )
			break
	}

	// check it's unique
	rclient.sadd('api:keys',key,function(err,unique) {
		if (err) console.log('error',err)

		if (unique)
			done(null,key)
		else
			generate_unique_key(done)
	})
}

// p.name, p.Description, p.expiry in hours
// p.done = function(err)
exports.create_identity = function(p) {
	if (!validate(p.name))
		return p.done('Invalid name')

	if (!validate(p.description))
		return p.done('Invalid description')

	// check name does not exist by trying to add
	rclient.sadd('api:names',p.name,function(err,unique) {
		if (!unique)
			return p.done('Name must be unique.')

		generate_valid_key(function(err,key){
			// associate the key/description with that name
			// and fire callback when key->name is set (and therefore identity is ready)
			// this indicates a name has a valid key, and the key is active.
			rclient.hmset('api:identity:'+p.name,{
				description : p.description,
				key         : key,
			},function(err) {
				p.done(err,key)
			})
			//rclient.hset('api:key-name',key,p.name,function(err) {
			//	p.done(err,key)
			//})
		})

	})
}

// prevent XSS (Too simple?)
function validate(string) {
	return !string.match('<')
}



exports.list_identities = function(done) {
	var identities = {}
	// enumerate names
	rclient.smembers('api:names',function(err,names) {
		var multi = rclient.multi()

		for (var i in names)
			multi.hgetall('api:identity:'+names[i])

		multi.exec(function(err,identities) {
			// re-add names
			for (var i in names)
				identities[i].name = names[i]

			// forward error, if any
			done(err,identities)
		})
	})
}

// return the identity or error to the callback
// iterates through identities at the moment. Not fastest, but ok for now.
exports.authenticate = function(key,done) {
	exports.list_identities(function(err,identities){
		var found = false
		for (var i in identities)
			if (identities[i].key == key) {
				found = true
				done(err,identities[i])
			}
		if (!found)
			done('Invalid API key',false)
	})
}

exports.delete = function(name,done) {
	if (!arguments[1])
		var done = function(){}

	rclient.srem('api:names',name)
	rclient.del('api:identity:'+name,function(err,existed) {
		if (existed)
			done(null)
		else
			done('Name does not exist')
	})
}

exports.regenerate = function(name,done) {
	rclient.hgetall('api:identity:'+name,function(err,identity) {
		if (identity)
			generate_valid_key(function(err,key){
				if (err) return done(err)

				rclient.hset('api:identity:'+name,'key',key,function(err){
					done(err,key)
				})
			})
		else
			done('Identity not found')
	})
}

exports.flushall = function(done) {
	exports.list_identities(function(err,identities) {
		for (var i in identities)
			exports.delete(identities[i].name,i == identities.length-1?done:false)
	})
}
