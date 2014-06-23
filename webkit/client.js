/*
   Sends a file via dsdrop, using node-webkit

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

// Note, this gui is targeted at non-technical users. The command-line client
// is for technical users.

var upload = new Upload()
var clipboard = gui.Clipboard.get()
//gui.Window.get().showDevTools()
	//alert($)


var filepath = gui.App.argv[0]
var filepath = '/tmp/Upload.js'

$(function() {
	choosePage('about')

	if (filepath)
		upload.uploadFile(filepath)
})

upload.on('uploadStart',function() {
	choosePage('process')
		//total: upload.filesize,

	upload.on('uploadProgress',function(val) {
		console.log(val/upload.filesize)
	})
})

upload.on('hashStart',function() {
	choosePage('process')
//		total: upload.filesize,

	upload.on('hashProgress',function(val) {
		console.log(val/upload.filesize)
	})
})

// programatic error
upload.on('error',function(err) {
	choosePage('error')
	$('#error').text(err.message)
})


upload.on('authenticationFailure',function(msg) {
	choosePage('login')
	$('#loginmsg').text(msg).css('color','red')
})

upload.on('done',function(url) {
	clipboard.set(url,'text')
})

upload.on('plsLogin',function(){
	choosePage('login')
	$('#loginmsg').text(upload.description)

})

upload.on('authenticated',function() {
	choosePage('process')
	console.log("\nAuthentication and authorisation successful".green)
})

var choosePage = function(id) {
	$('.page').css('display','none')
	$('#'+id) .css('display','block')
}
