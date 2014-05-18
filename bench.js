var redis   = require('redis')
var rclient = redis.createClient()
var auth = require('./lib/tokenauth').init(rclient)
var async = require('async')

//for (var i = 0; i < 100000; i++)
//	auth.generate_valid_unique_key(function (error,key) {
//		//console.log(key)
//		if (error) process.exit()
//	})
//
//rclient.quit()
//

//async.times(1000000,auth.generate_valid_unique_key,process.exit)

rclient.flushall()

async.times(1000000, function(n, next){
	    auth.generate_valid_unique_key(function(err, user) {
		          next(err, user)
		        })
}, function(err, users) {
	rclient.get('token:collisions',function(err,collisions) {
		console.log(collisions,'ppm colisions')
		process.exit()
	})
});
