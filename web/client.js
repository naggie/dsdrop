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

var gauges = {}
$(function() {
	$.ajax({
		url      : 'stats',
		success  : initGauges,
	})

	setInterval(function(){
		$.ajax({
			url      : 'stats',
			success  : updateGauges,
		})
	},1000)

	$('#dashboard').on('click',function() {
		var e = $(this).get(0)
		if      (e.requestFullscreen)       e.requestFullscreen()
		else if (e.mozRequestFullScreen)    e.mozRequestFullScreen()
		else if (e.webkitRequestFullScreen) e.webkitRequestFullScreen()
	})
})
window.odometerOptions = {
	amimation : 'count', // minimal
	duration  : 1000,    // same as polling interval
}
var initGauges = function(stats) {
	gauges.storage = new JustGage({
		id              : "storage",
		value           : stats.storage_used,
		min             : 0,
		max             : stats.storage_limit,
		title           : "STORAGE",
		label           : stats.storage_units,
		gaugeWidthScale : 0.5,
		valueFontColor  : "#888888",
		gaugeColor      : "#dddddd",
		showInnerShadow : 0,
		levelColors     : ["#888888","#888888","#fa5050"],
		levelColorsGradient : 0,
	})

	gauges.network = new JustGage({
		id              : "network",
		value           : stats.network_used,
		min             : 0,
		max             : stats.network_max,
		title           : "NETWORK",
		label           : stats.network_units,
		gaugeWidthScale : 0.5,
		valueFontColor  : "#888888",
		gaugeColor      : "#dddddd",
		showInnerShadow : 0,
		levelColors     : ["#888888","#888888","#fa5050"],
		levelColorsGradient : 0,
	})

	gauges.database = new JustGage({
		id              : "database",
		value           : stats.memory_used,
		min             : 0,
		max             : stats.memory_limit,
		title           : "DATABASE",
		label           : stats.memory_units,
		gaugeWidthScale : 0.5,
		valueFontColor  : "#888888",
		gaugeColor      : "#dddddd",
		showInnerShadow : 0,
		levelColors     : ["#888888","#888888","#fa5050"],
		levelColorsGradient : 0,
	})

	$('#uploaded .value').text(stats.upload_count)
	$('#downloaded .value').text(stats.download_count)

	$('#retention .value').text(stats.retention_days)
}

var updateGauges = function(stats) {
	gauges.storage.refresh(stats.storage_used)
	gauges.network.refresh(stats.network_used)
	gauges.database.refresh(stats.memory_used)

	$('#uploaded .value').text(stats.upload_count)
	$('#downloaded .value').text(stats.download_count)
	$('#retention .value').text(stats.retention_days)
}
