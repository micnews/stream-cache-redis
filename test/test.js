var ok = require('assert').ok
var equal = require('assert').equal
var Cache = require('..')
var fs = require('fs')
var concat = require('concat-stream')

var hit = false

var redisClient = function() {
  var cache = {}
  return {
    get: function(key, cb) {
      hit = false
      if (cache[key]) {
        hit = true
        return cb(null, cache[key])
      }
      cb(new Error('Not found'))
    },
    set: function(key, val, cb) {
      cache[key] = val
      cb(null)
    },
    expire: function(key, ttl, cb) {
      setTimeout(function() {
        delete cache[key]
      }, ttl)
      cb(null)
    }
  }
}()

var getSlowStream = function() {
  return fs.createReadStream(__filename)
}

var opts = {
  cache: redisClient,
  key: 'abc',
  ttl: 100,
  get: getSlowStream
}

it('should getStream', function(done) {
  Cache(opts).pipe(concat(function(a) {
    getSlowStream().pipe(concat(function(b) {
      ok(a.toString() === b.toString(), 'wrong value')
      done()
    }))
  }))
})

it('should getStream from cache', function(done) {
  Cache(opts).pipe(concat(function(a) {
    getSlowStream().pipe(concat(function(b) {
      ok(a.toString() === b.toString(), 'wrong value')
      ok(hit === true, 'not from cache')
      done()
    }))
  }))
})

it('should getStream expired cache', function(done) {
  setTimeout(function() {
    Cache(opts).pipe(concat(function(a) {
      getSlowStream().pipe(concat(function(b) {
        ok(a.toString() === b.toString(), 'wrong value')
        ok(hit === false, 'should not cache hit')
        done()
      }))
    }))
  }, 200)
})

it('should forward errors', function(done) {
  var err = new Error
  var stream = Cache({
    cache: redisClient,
    key: String(Math.random()),
    ttl: 100,
    get: function() {
      var stream = getSlowStream()
      process.nextTick(function() {
        stream.emit('error', err)
      })
      return stream
    }
  })
  stream.on('error', function(_err) {
    equal(_err, err)
    done()
  })
})

