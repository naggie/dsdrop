// null login authentication model for dsdrop. Consider it a template.
exports.description = 'Dummy login: anyone can login, with username the same as password. FOR TESTING ONLY.'

var config


exports.init = function(pconfig) {
	config = pconfig

	return exports
}

exports.login = function(username,password,done) {
	return done(null,username == password)
}

// should the user attempt to use this?
// Should be false if not implemented or not applicable
exports.active = true
