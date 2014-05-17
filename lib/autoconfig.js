// YAML+ENV+package.json inheritance based automatic configuration system
yaml = require('js-yaml')
fs   = require('fs')

var config = yaml.safeLoad( fs.readFileSync(__dirname+'/../defaults/server.yml', 'utf8') )


// overide from file specified
if ( ! process.argv[2] ) {
	console.log()
	console.log('Overide config in default.config.yml by specifying another yml file:')
	console.log('    '+process.argv[1]+' <yml config file>')
	console.log('Alternatively, use DSPA_* environment variables')
	console.log()
} else {
	console.log('Loading ',process.argv[2],'...')
	var override = yaml.safeLoad( fs.readFileSync( process.argv[2], 'utf8') )

	for (var key in override)
		config[key] = override[key]
}

// ENV overrides
for (var key in process.env)
	if ( key.match(/^DSPA_/) ) {
		// convert to config file key
		value = process.env[key]
		key = key.replace('DSPA_','').toLowerCase()
		config[key] = value
	}

// a few exceptions...
if (process.env.PORT) config.port   = process.env.PORT
if (process.env.IP)   config.listen = process.env.IP


// dynamic things
config.url = 'http://'+config.hostname+':'+config.port+'/'

// normalise/complete URL
//serverUrl = serverUrl.concat('/').replace(/\/+$/,'/')
//if ( ! serverUrl.match(/https?/) )
//	serverUrl = 'http://'+serverUrl


// load to module namespace
for (var key in config)
	exports[key] = config[key]


console.log('> Config:')
console.log(config)
