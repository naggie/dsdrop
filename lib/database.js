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

   Manages file instances, user/system balances

   Data/cache are separate, uses redis
*/
// TODO fix true false in database
// TODO: validate (file) names
var redis    = require('redis')
var yaml     = require('js-yaml')
var fs       = require('fs')
var mimetype = yaml.safeLoad( fs.readFileSync( __dirname+'/mimetypes.yml', 'utf8') )
var yaml     = require('js-yaml')

var rclient
var keygen
var config

function unixtime() {
	return Math.floor( Date.now()/1000 )
}

// 3SF with no exponential notation above 3 digits
function formatNumber(number) {
	if (number > 999 ||  number < -999)
		return number.toFixed(0)
	else
		return number.toPrecision(3)

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
	if (instance.new) rclient.incrby('stats:disk_usage_bytes',instance.size)
	rclient.incr('stats:total_upload_count')
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
		if (!instance) return done('Database: File instance not found')
		done(err,instance)
		// update LRU
		rclient.zadd('hash_lru',unixtime(),instance.hash)
		// stats
		rclient.incrby('stats:total_downloaded_bytes',instance.size)
		rclient.incr('stats:total_download_count')
		rclient.hincrby('instance:'+token,'downloads',1)
		rclient.zincrby('stats:hash_downloads',1,instance.hash)
		rclient.zincrby('stats:instance_downloads',1,token)
	})
}

// returns aggregated stats of a user
exports.userstats   = function(username,done) {

}

// returns aggregated stats of entire database
// TODO cache this with TTL < 1 second
exports.serverstats = function(done) {
	rclient.multi()
		.info()
		.get('stats:disk_usage_bytes')
		.get('stats:total_downloaded_bytes')
		.get('stats:total_download_count')
		.get('stats:total_upload_count')
		.zrangebyscore('hash_lru',-Infinity,+Infinity,'WITHSCORES','LIMIT','0','1')
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
				memory_used   : formatNumber(info.used_memory/(1024*1024)),
				memory_limit  : config.memory_limit_MB,
				memory_units  : 'MB',

				storage_used  : formatNumber(replies[1]/(1024*1024*1024)),
				storage_limit : config.storage_limit_GB,
				storage_units : 'GB',

				network_used  : formatNumber(exports.throughput/(1024*1024/8)),
				network_max   : config.network_max_Mbps,
				network_units : 'Mbps',

				transferred          :  formatNumber(replies[2]/(1024*1024*1024)),
				transferred_units    : 'GB',
				download_count       : replies[3],
				download_count_units : 'files',
				upload_count         : replies[4],
				upload_count_units   : 'files',

				active_count  : 'coming soon',
				unique_count  : 'coming soon',
				uptime_days   : info.uptime_in_days,

				retention_days : parseInt(((unixtime()-replies[5][1])/(60*60*24))),

			})
		})
}

// runs last-recently-used garbage collection until 100% of quota
// or 100% of quota minus given space in bytes
// TODO make this more intelligent, and deal with full situation when multiple uploads are happening
exports.lrugc = function(required,done) {

}

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

//exports.init()
//exports.userlog({
//	ip:'8.8.8.8',
//	url:'http://darksky.io/',
//	user:'naggie',
//	filename:'foo.bar',
//})
