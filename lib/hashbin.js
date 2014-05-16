fs     = require('fs')
path   = require('path')
crypto = require('crypto')
mkdirp = require('mkdirp')


exports.root = __dirname+'/hashbin-cache'

// hashing with one thread, in sequence is much faster.
// Also, as this is I/O bound, JS is about as fast as OpenSSL/sha1sum.
var hashFile = function(filepath,done) {
        var hash = crypto.createHash('sha1')

        var h = fs.ReadStream(filepath)
        h.on('data', function(d) {
                hash.update(d)
        })

	h.on('error',done)

        h.on('end',function() {
                done(false, hash.digest('hex') )
        })
}


// collect a file, returning its hash to callback and also, if the file is new
// callback(err,hash,isnew)
exports.assimilate = function(filepath,done) {
	hashFile(filepath,function(err,hash) {
		if (err) return done(err)

		var binpath = hash_to_filepath(hash)
		var bindir  = path.dirname(binpath)

		fs.exists(binpath, function (exists) {
			if (exists)
				done(false,hash,false)
			else
				mkdirp(bindir,function(err) {
					if (err) return done(err)

					link_or_copy(filepath,binpath,function(err) {
						done(err,hash,true,binpath)
					})
				})
		})
	})
}

// return filepath on hash callback, or false on cache miss
// error if cannot read callback(err,filepath)
exports.extract = function(hash,done) {
	var binpath = hash_to_filepath(hash)

	fs.open(binpath,'r',function(err,fp){
		if (err) return done(err)

		fs.close(fp,function() {
			done(false,binpath)
		})
	})

}

// delete a file by hash
// done(err,already_gone)
exports.delete = function(hash,done) {
	var binpath = hash_to_filepath(hash)

	fs.exists(binpath, function (exists) {
		if (!exists) return done(false,true)

		fs.unlink(binpath,function(err) {
			done(err,false)
		})
	})
}

// get filename, binned by first 2 chars of hash
var hash_to_filepath = function (hash,ext) {
	//if (!arguments[1]) var ext = 'bin'
	// see: https://github.com/jimjibone/crates-analyser/issues/8
	//if (!arguments[1]) var ext = 'mp3'
	// analyser does not like .bin, but loves crb (crates binary file)
	if (!arguments[1]) var ext = 'crb'

	return path.resolve(
		exports.root,
		hash.substr(0,2),
		hash.substr(2) + '.' + ext
	)
}

// remove all files from hashbin
// done(err)
exports.flush = function (done) {
	done('Not implemented')
}

// either link or copy a file over, depending on configuration and/or
// what is possible
// done(err)
var link_or_copy = function(src,dest,done) {
	fs.link(src,dest,function(err) {
		if (!err) return done(false)

		copyFile(src,dest,done)
	})
}

// http://stackoverflow.com/questions/11293857/fastest-way-to-copy-file-in-node-js
function copyFile(source,target,cb) {
	var cbCalled = false

	function done(err) {
		if (!cbCalled) {
			cb(err)
			cbCalled = true
		}
	}

	var rd = fs.createReadStream(source)
	rd.on("error", done)
	var wr = fs.createWriteStream(target)
	wr.on("error", done)
	wr.on("close", function(ex) {
		done(false)
	})
	rd.pipe(wr)
}

// reverse lookup: given a hash filepath, return the original, valid, hash if it exists.
// (normally just to restore database, not for normal use)
exports.reverse = function (done) {
	done('Not implemented')
}

// return dictionary of all hashes to filepaths
// (normally just to restore database, not for normal use)
exports.dump = function (done) {
	done('Not implemented')
}

// for cover art
exports.assimilateStream = function(stream,done) {
	done('stream assimilation not implemented')
}
