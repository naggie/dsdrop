// OO + INHERITANCE FROM EVENTEMITTER TEMPLATE
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
//
// This is opinionated.
//
// http://www.joyent.com/developers/node/design
// http://www.wekeroad.com/2012/04/05/cleaning-up-deep-callback-nesting-with-nodes-eventemitter/
// READ THIS!
//
// usage:
// 	var Banana = require('banana')
//      var banana = new Banana()
//
// Inspiration:
// http://www.hacksparrow.com/node-js-eventemitter-tutorial.html
// Read also:
// http://www.joyent.com/developers/node/design/errors
// TLDR: OO code needs to handle event based operational errors being too
// complex for a simple error callback.
//
// EventEmitters are useful when one callback isn't enough
//
// The prototype attr contains default attrs for a given object
// this can be used, recursively, for inheritance

var util = require('util')
var EventEmitter = require('events').EventEmitter

// Custom operational errors (which can be programmatically 
// http://stackoverflow.com/questions/8802845/inheriting-from-the-error-object-where-is-the-message-property
// Emitting these errors means that we can programmatically test for operational
// error type, and respond accordingly. Test name attribute in switch statement.
//
// Alternatively, simply emit a regular event (loginRequired) etc, only
// Emitting Error()s in case of programatic errors.
function fileNotFoundError(file) {
	var msg = file + ' not found'
	var err = Error.call(this, msg)
	err.name = arguments.callee.name
	return err
}

function loginRequiredError() {
	var err = Error.call(this, msg)
	err.name = arguments.callee.name
	return err
}
// alternatively, construct errors on the fly:
// {name:'fileNotFound',msg:'whatever.exe not found'}

// Main class that represents this module. Control inheritance below.
var Main = function() {
	if (!(this instanceof Main)) return new Main()

	// call parent constructor, with parameters also!
	EventEmitter.call(this)

	// Reference object in method context
	var self = this

	// called outside. Outside does not provide callback, but listens on
	// events to control a GUI, for example.
	this.example_public_method = function(name) {
		console.log('You called the example method. An event was emitted.')
		self.emit('newuser',name)
		// -or-
		self.emit('loginRequired',name,this) // login externally, then re-run step
	}

	// convention: private methods, part of a mechanism, only set instance
	// attributes.
	var example_private_method = function(name) {
		console.log("Not exposed in instance!")
		self.emit('validated',name)
	}

	// workflow protocol example
	// http://www.wekeroad.com/2012/04/05/cleaning-up-deep-callback-nesting-with-nodes-eventemitter/
	// pass parameter, or use instance attributes if possible
	// Methods also emit events, and may require an external workflow: eg,
	// if plsLogin is emitted, the enternal login function may be required
	// to call login(), which will emit an event captured by the method that said plsLogin.
	this.on('newuser',example_private_method)
	this.on('validated',add_to_database)
	this.on('added',send_notification)
	this.on('added',update_cache)
}

// Inheritance
util.inherits(Main, EventEmitter)
// Exposure
module.exports = Main

// ...alternatively, if only one instance will be used ever
//module.exports = new Main()

