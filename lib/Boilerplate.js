// OO + INHERITANCE FROM EVENTEMITTER TEMPLATE
//
// usage:
// 	var Banana = require('banana')
//      var banana = new Banana()
//
// Inspiration:
// http://www.hacksparrow.com/node-js-eventemitter-tutorial.html
// Read also:
// http://www.joyent.com/developers/node/design/errors

var util = require('util')
var EventEmitter = require('events').EventEmitter

var Main = function() {
	// Reference object in method context
	var self = this

	if (!arguments[0])
		this.emit('error','Must specify options to constructor')

	this.filepath = params.filepath || emit('error','Must specify filepath to constructor')

	// construct here
	console.log('This module was constructed')

	this.example_public_method = function() {
		console.log('You called the example method. An event was emitted.')
		self.emit('speech','Hello there')
	}

	var example_private_method = function() {
		console.log("Not exposed in instance!")
	}
}

// Inheritance
util.inherits(Main, EventEmitter)
// Exposure
module.exports = Main

