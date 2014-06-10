// OO + INHERITANCE FROM EVENTEMITTER TEMPLATE
//
// usage:
// 	var Banana = require('banana')
//      var banana = new Banana()
//
// Inspiration:
// http://www.hacksparrow.com/node-js-eventemitter-tutorial.html

var Main = function() {
	// Reference object in method context
	var self = this

	// construct here
	console.log('This module was constructed')

	this.example_method = function() {
		console.log('You called the example method. An event was emitted.')
		self.emit('speech','Hello there')
	}
}

//  Create a class called Main
var EventEmitter = require('events').EventEmitter
util.inherits(Main, EventEmitter)
module.exports = Main

