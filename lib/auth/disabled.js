// null login authentication model for dsdrop. Consider it a template.
exports.description = 'Token generation is manually handled by the administrator. There is currently no login mechanism enabled.'
var config


exports.init = function(pconfig) {
	config = pconfig

	return exports
}

exports.login = function(username,password,done) {
	return done('Login system not enabled. Please ask an adminstrator to generate a token.')
}

// should the user attempt to use this?
// Should be false if not implemented or not applicable
exports.active = false
