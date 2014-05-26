#!/usr/bin/env node
var prompt = require('prompt')


prompt.start()

prompt.get({
	properties: {
		name: {
			required: true,
		},
		password: {
			hidden: true,
			required: true,
		}
	}
},function (err, result) {
	if (err) return console.log('Invalid input')
	console.log(result)
})
