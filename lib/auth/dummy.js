// null login authentication model for dsdrop. Consider it a template.
exports.description = 'Anyone can login, with username the same as password. FOR TESTING ONLY.'

var config


exports.init = function(pconfig) {
	config = pconfig

	return exports
}

exports.auth = function(username,password) {
	if (username == password)
		return done(null,'Login successful')
	else
		return done('Invalid login.')
}

// should the user attempt to use this?
// Should be false if not implemented or not applicable
exports.active = true
