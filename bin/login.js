#!/usr/bin/env node
//TODO: consolidate into cli-client
var prompt = require('prompt')
var client = require('../lib/client')

prompt.start()

prompt.get({
	properties: {
		username: {
			required: true,
		},
		password: {
			hidden: true,
			required: true,
		}
	}
},function (err, result) {
	if (err) return console.log('Invalid input')
	client.login(result.username,result.password,function(err,token) {

	})
})
