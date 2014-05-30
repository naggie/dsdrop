// ldap login authentication model for dsdrop. Consider it a template.
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
		done(err)
	})
}


// config.ldap_user_common_dn
// config.ldap_group_dn

// should the user attempt to use this?
// Should be false if not implemented or not applicable
exports.active = true
