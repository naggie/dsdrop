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
// null login authentication model for dsdrop. Consider it a template.
exports.description = 'Token generation is manually handled by the administrator. There is currently no login mechanism enabled.'
var config


exports.init = function(pconfig) {
	config = pconfig

	return exports
}

exports.login = function(username,password,done) {
	return done('Login system not enabled. Please ask an adminstrator to generate a token.',false)
}

// should the user attempt to use this?
// Should be false if not implemented or not applicable
exports.active = false
