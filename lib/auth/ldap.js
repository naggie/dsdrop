// ldap login authentication model for dsdrop. Consider it a template.
exports.description = "LDAP account authentication."
var config


exports.init = function(pconfig) {
	config = pconfig

	return exports
}

exports.auth = function(username,password) {
	return done(null,'Login successful')
}

var ldap = require('ldapjs')

var client = ldap.createClient({
	//url: 'ldaps://ldapmaster.darksky.io'
	socketPath: '/var/run/slapd/ldapi',
})

// config.ldap_user_common_dn
// config.ldap_group_dn

client.bind('uid=naggie,ou=users,dc=darksky,dc=io', process.env.BEANS, function (err) {
	console.log(err)
	client.unbind()
})


// should the user attempt to use this?
// Should be false if not implemented or not applicable
exports.active = true
