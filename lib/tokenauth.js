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

   Manages session tokens to be given to a user after authentication and
   authorization

   create  : make a new token against a username
   authenticate   : retrieve username from token, if not expired
   delete  : invalidate all tokens for a user
   deleteall : invalidate all tokens for user

   create/auth accepts a context (IP, user agent, string, etc)
   Max 3 contexts per session before token is expired (allow device to roam
   networks, but detect compromised token)
   Max 1 week before token expires
*/
// API tokens are unique across all time. Even if they expire.
var crypto    = require('crypto')
var redis     = require('redis')

// TODO: make token expiry a global config thing
// 1 week
exports.expiry = 60*60*24*7
exports.maxContexts = 3

// error codes: compare generic error callback value with these to allow programatic response
exports.TOKEN_COMPROMISED = 'Token invalidated, number of allowable contexts exceeded for device'
exports.TOKEN_EXPIRED     = 'Token expired or non-existant'

var rclient
exports.init = function(client) {
	if (!arguments.length)
		rclient = redis.createClient()
	else
		rclient = client

	exports.quit = rclient.quit

	return exports
}

// make an 8 char base64-based token
function generate_potential_token() {
        var hash = crypto.createHash('sha1')
	var rand = Math.random().toString()
	hash.update(rand)
	var token = hash.digest('base64')

	return token.substr(0,8)
}

// generate a high quality token, returning to callback
// from char set A-Z a-z 0-9
// and unique
// 8 characters = ~ 150ppm collisions which are avoided
exports.generate_valid_unique_token = function(done) {
	var token
	// look for a token without + or /
	while (true) {
		token = generate_potential_token()
		if ( ! token.match(/\+|\//) )
			break
	}

	// authenticate it's unique
	rclient.sadd('tokenauth:spent_tokens',token,function(err,unique) {
		if (err) return done(err)

		if (unique)
			done(null,token)
		else {
			exports.generate_valid_unique_token(done)
			rclient.incr('tokenauth:collisions')
		}
	})
}

exports.create = function(username,context,done) {
	if (!validate(username))
		return done('Tokenauth: Invalid username')

	if (!arguments[1]) var context = 'UNKNOWN'

	if (!validate(context))
		return done('Tokenauth: Invalid context')

	// check name does not exist by trying to add
	rclient.sadd('tokenauth:usernames',username,function(err,unique) {

		exports.generate_valid_unique_token(function(err,token){
			if (err) return done(err)
			rclient.set('tokenauth:tokens:'+token,username,function(err) {
				done(err,token)
			})
			// record a context
			rclient.sadd('tokenauth:contexts:'+token,context)
			rclient.expire('tokenauth:tokens:'+token,exports.expiry)
			rclient.expire('tokenauth:contexts:'+token,exports.expiry+1)
		})

	})
}

// prevent XSS or memory exhaustion (Too simple?)
function validate(string) {
	return !string.match('<') || string.length > 64
}


// list usernames -> tokens -> contexts
exports.list = function(done) {
	var sessions = {}
	// enumerate tokens, collected by users
	// can is a better alternative than keys. However, the set is small.
	rclient.keys('tokenauth:tokens:*',function(err,keys) {
		if (err) return done(err)

		var multi = rclient.multi()

		var tokens = []
		var map = {}

		for (var i in keys) {
			multi.get(keys[i])
			tokens.push( keys[i].split(':')[2] )
		}


		multi.exec(function(err,usernames) {
			for (var i in usernames)
				map[ usernames[i] ] = []

			for (var i in usernames)
				map[ usernames[i] ].push(tokens[i])

			// forward error, if any
			done(err,map)
		})
	})
}

// return the identity or error to the callback
exports.authenticate = function(token,context,done) {
	rclient.get('tokenauth:tokens:'+token,function(err,username) {
		if (err) return done(err)
		if (!username) return done(exports.TOKEN_EXPIRED)

		// assert context and count contexts
		rclient.sadd('tokenauth:contexts:'+token,context,function(err) {
			if (err) return done(err,false)
			rclient.scard('tokenauth:contexts:'+token,function(err,count) {
				if (err) return done(err)
				if (count > exports.maxContexts)
					return done(exports.TOKEN_COMPROMISED,false)
				else
					return done(null,username)
			})
		})
	})
}

// expire a token
exports.invalidateToken = function(token) {
	rclient.del('tokenauth:tokens:'+token)
	rclient.del('tokenauth:contexts:'+token)
}

// log out everyone!
exports.flush = function() {
	exports.list(function(err,tokens) {
		for (var user in tokens)
			for (var i in tokens[user])
				exports.invalidateToken(tokens[user][i])
	})
}

// logout one user
exports.logout = function(user) {
	exports.list(function(err,tokens) {
		for (var i in tokens[user])
			exports.invalidateToken(tokens[user][i])
	})
}

exports.init()

//exports.create('naggie','whatevs!',function(err,token){
//	console.log('done',err,token)
//	process.exit()
//})
//
//exports.list(function(err,list) {
//	console.log(err,list)
//})

//exports.authenticate('gBtnOHMO','biieiians',function(err,username) {
//	console.log(err,username)
//	process.exit()
//})

