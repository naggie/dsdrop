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
*/
// ldap login authentication model for dsdrop.
// https://github.com/trentm/node-ldapauth
// TODO base on above standard, or above
exports.description = "LDAP account authentication enabled. Please log in with your LDAP account."
var config

var ldap = require('ldapjs')

exports.init = function(pconfig) {
	config = pconfig

	if (!config.ldap_user_dn) {
		console.log('configuration lda_user_dn required')
		process.exit(3)
	}

	return exports
}

exports.login = function(username,password,done) {
	var user_dn = config.ldap_user_dn.replace('{username}',username)

	var client = ldap.createClient({
		//url: 'ldaps://ldapmaster.darksky.io'
		socketPath: '/var/run/slapd/ldapi',
	})

	//client.bind('uid=naggie,ou=users,dc=darksky,dc=io', process.env.BEANS, function (err) {
	client.bind(user_dn, password, function (err) {
		client.unbind()

		if (err && err.message == 'Invalid Credentials')
			done(null,false)
		else
			done(err,!err)
	})
}


// config.ldap_user_common_dn
// config.ldap_group_dn

// should the user attempt to use this?
// Should be false if not implemented or not applicable
exports.active = true
