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
var fs       = require('fs')
var yaml     = require('js-yaml')
var dns      = require('dns')

var rclient

function unixtime() {
	return Math.floor( Date.now()/1000 )
}

exports.init = function(_rclient) {
	if (!_rclient)
		rclient = redis.createClient()
	else
		rclient = _rclient

	exports.quit = rclient.quit

	return exports
}

// order of column titles for CSV (if present)
exports.order = ['action','url','hostname','ip']

// log event to userlog queue and pubsub in std format
// hostname and time are automatic, IP an hostname are derrived from ip which
// can be derived from req
// TODO: calculate URL from token
exports.log = function(event) {
	//event.time = unixtime()
	event.date = Date()

	// TODO Namespacing per action?
	if (event.req) {
		event.ip = event.req.headers['x-forwarded-for'] || event.req.connection.remoteAddress
		delete event.req // don't make this into YAML!
	}

	// yes, silent failure. Be careful!
	// TODO just log this to errorlog
	if (!event.ip) return
	if (!event.action) event.action = 'NOTSET'

	dns.reverse(event.ip,function(err,domains) {
		if (!err && domains.length)
			 event.hostname = domains[0]

		var encoded = yaml.safeDump(event)
		rclient.lpush('user_log_queue',encoded)
		rclient.publish('user_log_pubsub',encoded)
	})
}

// extract all keys, convert to CSV
exports.dumpUserLog = function(filepath) {

}

exports.error = function(event) {

}
