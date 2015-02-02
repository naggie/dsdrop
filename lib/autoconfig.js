// YAML+ENV+package.json inheritance based automatic configuration system
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
var yaml = require('js-yaml')
var fs   = require('fs')

var config = yaml.safeLoad( fs.readFileSync(__dirname+'/../defaults/server.yml', 'utf8') )


// overide from file specified
if ( ! process.argv[2] ) {
	console.log()
	console.log('Overide config in default.config.yml by specifying another yml file:')
	console.log('    '+process.argv[1]+' <yml config file>')
	console.log('Alternatively, use DSDROP_* environment variables')
	console.log()
} else {
	console.log('Loading ',process.argv[2],'...')
	var override = yaml.safeLoad( fs.readFileSync( process.argv[2], 'utf8') )

	for (var key in override)
		config[key] = override[key]
}

// ENV overrides
for (var key in process.env)
	if ( key.match(/^DSDROP_/) ) {
		// convert to config file key
		value = process.env[key]
		key = key.replace('DSDROP_','').toLowerCase()
		config[key] = value
	}

// a few exceptions...
if (process.env.PORT) config.port   = process.env.PORT
if (process.env.IP)   config.listen = process.env.IP


// dynamic things
//config.url = 'http://'+config.hostname+'/' //:'+config.port+'/'


// normalise/complete URL
//serverUrl = serverUrl.concat('/').replace(/\/+$/,'/')
//if ( ! serverUrl.match(/https?/) )
//	serverUrl = 'http://'+serverUrl


// load to module namespace
for (var key in config)
	exports[key] = config[key]


console.log('> Config:')
console.log(config)

config.package = require(__dirname+'/../package.json')
