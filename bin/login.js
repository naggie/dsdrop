#!/usr/bin/env node
//TODO: consolidate into cli-client
var prompt = require('prompt')
var client = require('../lib/client').init()
require('colors')

console.log(client.url)

prompt.start()

function login() {
	prompt.get({
		properties: {
			username: {
				required: true,
				default: process.env.USER
			},
			password: {
				hidden: true,
				required: true,
			}
		}
	},function (err, result) {
		if (err) return console.log('Invalid input')

		client.login(result.username,result.password,function(err) {
			process.stderr.write("\n")

			if (err)
				process.stderr.write(err.red+"\n")
			else
				process.stderr.write("Login Successful!\n".green)
		})
	})
}

client.describe(function(err,description) {
	process.stderr.write("\n"+description+"\n\n")
	login()
})
