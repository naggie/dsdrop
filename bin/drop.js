#! /usr/bin/env node
/*
   Sends a file via dsdrop

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
// basic implementation
// TODO: config system
// TODO: oneshot flag





if (!process.argv[2]) {
	console.log('usage:',process.argv[1],'<file to send>')
	process.exit()
}

if (!process.env.TOKEN) {
	console.log('Please set token via TOKEN env var for now. Also this is hardcoded for localhost:9000 at the moment')
	process.exit()
}

var url      = 'http://localhost:9000/full-upload'
var filepath = process.argv[2]
var token    = process.env.TOKEN

var request  = require('request')
var fs       = require('fs')

var r = request.post(url, function(err, httpResponse, body) {
	if (err) {
		return console.error(err)
	}
	console.log(JSON.parse(body))
})
var form = r.form()
form.append('token',token)
form.append('filedata', fs.createReadStream(filepath))

