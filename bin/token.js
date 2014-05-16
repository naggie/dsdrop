#! /usr/bin/env node
/*
   keys.js; Manages API keys (list/create/delete/re-issue/extend) for notification bots
   Data stored:
	   name, key, description, date, expiry time

   Copyright 2013 Callan Bryant <callan.bryant@gmail.com>

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

var program = require('commander')
var rclient = require('redis').createClient()
var apiauth = require('./apiauth').init(rclient)
var printf  = require('printf')

program
	.command('create <name> <description>')
	.description('Generate a new API identity')
	.action(function(name,description) {
		apiauth.create_identity({
			name: name,
			description: description,
			done: function(err,key) {
				if (err)
					console.log(err)
				else
					console.log(key)
				rclient.quit()
			}
		})
	})

program
	.command('del <name>')
	.description('Delete an API identity given a name or key')
	.action(function(name) {
		apiauth.delete(name,function(err) {
			if (err)
				console.log(err)

			rclient.quit()
		})
	})


program
	.command('regen <name>')
	.description('Regenerate an identity key, given a name')
	.action(function(name) {
		apiauth.regenerate(name,function(err,key) {
			if (err)
				console.log(err)
			else
				console.log(key)

			rclient.quit()
		})
	})



program
	.command('list')
	.description('List all identities')
	.action(function(){
		apiauth.list_identities(function(err,identities) {
			var format = "%-12s %-60s %-8s\n"
			printf(process.stdout,format,'NAME','DESCRIPTION','KEY')
			for (var i in identities)
				printf(
					process.stdout,
					format,
					identities[i].name,
					identities[i].description,
					identities[i].key
				)

			//apiauth.quit()
			rclient.quit()
		})
	})

program
	.command('flush')
	.description('Delete all identities')
	.action(function() {
		apiauth.flushall(function(){
			rclient.quit()
		})
	})

//program
//	.option('-n, --name',        'Name of identity')
//	.option('-d, --description', 'Description of identity')
//	.option('-e, --expires',     'Days for key to be valid')

program
	.parse(process.argv)

if (process.argv.length == 2)
	program.help()

