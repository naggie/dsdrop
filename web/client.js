
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
})

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
}

var updateGauges = function(stats) {
	gauges.storage.refresh(stats.storage_used)
	gauges.network.refresh(stats.network_used)
	gauges.database.refresh(stats.memory_used)
}
