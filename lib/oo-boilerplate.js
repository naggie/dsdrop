// OO + INHERITANCE FROM EVENTEMITTER TEMPLATE
//
// usage:
// 	var Banana = require('banana')
//      var banana = new Banana()
//
// Inspiration:
// http://www.hacksparrow.com/node-js-eventemitter-tutorial.html

var util = require('util')
var EventEmitter = require('events').EventEmitter

var Main = function() {
	// Reference object in method context
	var self = this

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

