#! /usr/bin/env node
/*
   Manages file instances, user/system balances

   Data/cache are separate, uses redis

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
// TODO fix true false in database
// TODO log everything in database:log
// {time:unixtime(),event:,user:,ip)
// TODO: validate (file) names
var redis    = require('redis')
var yaml     = require('js-yaml')
var fs       = require('fs')
var mimetype = yaml.safeLoad( fs.readFileSync( __dirname+'/mimetypes.yml', 'utf8') )

var rclient
var keygen
var config

function unixtime() {
	return Math.floor( Date.now()/1000 )
}

exports.init = function(p) {
	if (!arguments.length) var p = {}

	if (!p.rclient)
		rclient = redis.createClient()
	else
		rclient = p.rclient

	exports.quit = rclient.quit

	if (p.keygen)
		keygen = p.keygen
	else {
		console.log()
	}

	config = p.config

	return exports
}

// add an instance of a file already in the hashbin.
// file object:
// 	name (must have)
// 	mimetype (optional, taken from file extension)
// 	oneshot (flag, only allow one download)
// 	user (authenticated username)
// 	size (file size in byte. TRUST ONLY THE HASHBIN)
// 	new (flag if the file is new to the hashbin)
exports.add = function (instance, done) {
	if ( !instance.name || !instance.user || !instance.size || !instance.hash)
		return done('Database add: Incomplete instance object')

	if (!instance.mimetype)
		instance.mimetype = mimetype[instance.name.match(/[a-z0-9]{1,4}$/)] || mimetype['default']

	// get token
	keygen(function(err,token) {
		if (err) return done(err)
		instance.token = token
		// publish instance
		rclient.hmset('instance:'+token,instance,function(err) {
			done(false,token)
		})
	})
	// Update LRU
	rclient.zadd('hash_lru',unixtime(),instance.hash)
	if (instance.new) rclient.incrby('disk_usage',instance.size)
}

// remove file DATA by hash (emergency GC)
exports.delete = function (hash, done) {
	// just tell the hashbin to remove just the hash?  instances could
	// simply return a 404. Re-uploading the file would then restore all
	// instances!
}

// remove an instance, not the data
// if all instances are removed, the data still remains. This is good, as it
// will be kept as long as possible until LRU GC. It also means that any
// re-uploads are instant.
exports.unlink = function (token, done) {

}

// callback with everything required to download a file
// and also update stats, and LRU set
exports.extract = function(token,done) {
	// get instance object
	rclient.hgetall('instance:'+token,function(err,instance) {
		if (err) return done(err)
		if (!instance) return done('File instance not found')
		done(err,instance)
		// update LRU
		rclient.zadd('lru',unixtime(),instance.hash)
		// stats
		rclient.incrby('total_downloaded_bytes',instance.size)
		rclient.hincrby('instance:'+token,'downloads',1)
		rclient.zincrby('hash_downloads',1,instance.hash)
		rclient.zincrby('instance_downloads',1,token)
	})
}

// returns aggregated stats of a user
exports.userstats   = function(username,done) {

}

// returns aggregated stats of entire database
exports.serverstats = function(done) {
	rclient.multi()
		.info()
		.exec(function(err,replies) {
			var info = {}
			// ugh this is not parsed...
			var bits = replies[0].toString().split('\r\n')
			for (var i in bits) {
				var tmp = bits[i].split(':')
				info[ tmp[0] ] = parseInt(tmp[1])
			}

			done(err,{
				// todo auto units
				memory_used   : (info.used_memory/(1024*1024)).toFixed(2),
				memory_limit  : config.memory_limit_MB,
				memory_units  : 'MB',
				storage_used  : 'coming soon',
				storage_limit : config.storage_limit_GB,
				storage_units : 'GB',
				network_used  : (exports.throughput/(1024*1024/8)).toFixed(0),
				network_max   : config.network_max_Mbps,
				network_units : 'Mbps',
				uptime_days   : info.uptime_in_days,

			})
		})
}

// runs last-recently-used garbage collection until 100% of quota
// or 100% of quota minus given space in bytes
// TODO make this more intelligent, and deal with full situation when multiple uploads are happening
exports.lrugc = function(required,done) {

}

// log event to logqueue in std format
exports.log  = function() {}

// convert GB/TB etc to bytes. Eg, 20GB,3TB,1KB
exports.toBytes = function(from) {

}

var integrator = 0
exports.integrateThroughput = function (bytes) {
	integrator += parseInt(bytes)
}
// gate
setInterval(function() {
	exports.throughput = integrator
	integrator = 0
},1000)
