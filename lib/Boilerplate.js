// OO + INHERITANCE FROM EVENTEMITTER TEMPLATE
//
// This is opinionated.
//
// http://www.joyent.com/developers/node/design
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

var util = require('util')
var EventEmitter = require('events').EventEmitter

// Custom operational errors (which can be programmatically 
// http://stackoverflow.com/questions/8802845/inheriting-from-the-error-object-where-is-the-message-property
// Emitting these errors means that we can programmatically test for operational
// error type, and respond accordingly. Test name attribute in switch statement.
function fileNotFoundError(msg) {
	var err = Error.call(this, msg)
	err.name = arguments.callee.name
	return err
}

function loginRequiredError(msg) {
	var err = Error.call(this, msg)
	err.name = arguments.callee.name
	return err
}

// Main class that represents this module. Control inheritance below.
var Main = function() {
	if (!(this instanceof Main)) return new Main()
	EventEmitter.call(this)

	// Reference object in method context
	var self = this

	// called outside. Outside does not provide callback, but listens on
	// events to control a GUI, for example.
	// optional next() if used internally and externally
	this.example_public_method = function() {
		console.log('You called the example method. An event was emitted.')
		self.emit('speech','Hello there')
	}

	// convention: private methods, part of a mechanism, only set instance
	// attributes. They will fire next() only on success, emitting an error
	// otherwise. They may emit status updates for consumption only outside
	// the instance.
	// next() required
	var example_private_method = function(next) {
		console.log("Not exposed in instance!")
		next()
	}

}

// Inheritance
util.inherits(Main, EventEmitter)
// Exposure
module.exports = Main

