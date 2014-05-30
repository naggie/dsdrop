// null login authentication model for dsdrop. Consider it a template.
exports.description = "Local account authenication on dsdrop server."
var config


exports.init = function(pconfig) {
	config = pconfig

	return exports
}

exports.login = function(username,password) {
	return done(null,'Login successful')
}

// should the user attempt to use this?
// Should be false if not implemented or not applicable
exports.active = false
