var ok = require('assert').ok
var equal = require('assert').equal
var Cache = require('..')
var fs = require('fs')
var concat = require('concat-stream')

var redisClient = function() {
  var cache = {}
  return {
    get: function(key, cb) {
      if (cache[key]) return cb(null, cache[key])
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

it('should create stream on cache miss', function(done) {
  var miss = false
  Cache({
    cache: redisClient,
    key: String(Math.random()),
    ttl: 100,
    get: function() {
      miss = true
      return getSlowStream()
    }
  }).pipe(concat(function(a) {
    getSlowStream().pipe(concat(function(b) {
      ok(a.toString() === b.toString(), 'same value')
      ok(miss, 'cache miss')
      done()
    }))
  }))
})

it('should read cache on cache hit', function(done) {
  var key = String(Math.random())
  var miss = false
  var opts = {
    cache: redisClient,
    key: key,
    ttl: 100,
    get: function() {
      miss = true
      return fs.createReadStream(__filename)
    }
  }
  Cache(opts).pipe(concat(function(a) {
    equal(miss, true, 'cache miss')
    miss = false
    Cache(opts).pipe(concat(function(b) {
      equal(miss, false, 'cache hit')
      equal(a.toString(), b.toString(), 'same value')
      done()
    }))
  }))
})

it('should getStream expired cache', function(done) {
  var key = String(Math.random())
  var miss = false
  var opts = {
    cache: redisClient,
    key: key,
    ttl: 100,
    get: function() {
      miss = true
      return fs.createReadStream(__filename)
    }
  }
  Cache(opts).pipe(concat(function(a) {
    equal(miss, true, 'cache miss')
    miss = false
    setTimeout(function() {
      Cache(opts).pipe(concat(function(b) {
        equal(miss, true, 'cache miss after expiry')
        equal(a.toString(), b.toString(), 'same value')
        done()
      }))
    }, 200)
  }))
})
