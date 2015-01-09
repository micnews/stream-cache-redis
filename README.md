# stream-cache-redis
Cache a stream in redis

## Install

```
npm install stream-cache-redis
```

## Usage

```js
var getSlowStream = require('./my-slow-stream')

var getStream = require('stream-cache-redis')({
  client: redisClient,
  key: 'abc',
  ttl: 60 * 60, // 1 hour
  get: getSlowStream
})

// this will always be fast
getStream.pipe(process.stdout)

```


same as doing this:

```js
var concat = require('concat-stream')
var resumer = require('resumer')
var cache = require('./redisClient')

var out = resumer()
var key = 'abc'

cache.get(key, function(err, value) {
  if (!value) {
    slowStream.pipe(concat(function(val) {
      cache.set(key, val, function(err) {

      })
      out.queue(val).end()
    }))
    return
  }
  out.queue(value).end()
})

```