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
