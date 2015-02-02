/*
    DSDROP: Instant file sharing server
    Copyright (C) 2014-2015  Callan Bryant <callan.bryant@gmail.com>

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.

   Sends a file via dsdrop, using node-webkit
*/

// Note, this gui is targeted at non-technical users. The command-line client
// is for technical users.

var upload = new Upload()
var clipboard = gui.Clipboard.get()
	//alert($)


var filepath = gui.App.argv[0]
//var filepath = '/Users/naggie/Downloads/darkbuntu-1031-master.iso'

window.onload = function() {
	choosePage('about')
		choosePage('login')

	if (filepath)
		upload.uploadFile(filepath)

	$('#login form').submit(login)

//	gui.Window.get().showDevTools()
}

upload.on('hashStart',function() {
	choosePage('process')
	$('#processmsg').text('Analysing file...')
	var bar = new ProgBar('#hashbar')
	bar.max = upload.filesize
	upload.on('hashProgress',bar.set)
})

upload.on('uploadStart',function() {
	choosePage('process')
	$('#processmsg').text('Uploading file...')
	var bar = new ProgBar('#uploadbar')
	bar.max = upload.filesize
	upload.on('uploadProgress',bar.set)
})

upload.on('publishing',function() {
	$('#processmsg').text('Publishing..')
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
	choosePage('success')
	$('#success input').val(url)
	clipboard.set(url,'text')
})

upload.on('plsLogin',function(){
	choosePage('login')
	$('#loginmsg').text(upload.description)
})

upload.on('authenticated',function() {
	choosePage('process')
	$('#processmsg').text('Authentication and authorisation succeded!')
})

var login = function() {
	upload.login(
		$('#username').val(),
		$('#password').val()
	)
	return false
}

var choosePage = function(id) {
	$('.page').css('display','none')
	$('#'+id) .css('display','block')
}

var ProgBar = function(selector) {
	var self = this

	var handle = $(selector)
	var filler = $('<div class="filler"></div>')
	handle.addClass('bar').empty().append(filler)

	this.max = 100
	this.set = function(val) {
		var percent = val*100/self.max

		//filler.stop(1).animate({
		//	width : percent+'%',
		//})
		filler.css('width',percent+'%')
	}
}
