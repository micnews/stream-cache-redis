# stream-cache-redis
Cache a stream in redis

## Install

```
npm install stream-cache-redis
```

## Usage

```js
var getSlowStream = require('./my-slow-stream')

var cachedStream = require('stream-cache-redis')({
  cache: redisClient, // redis-compatible object (get/set/expire)
  key: 'abc',         // cache key
  ttl: 60 * 60,       // expiration in seconds
  get: getSlowStream  // function that returns a stream
})

// this will be faster
cachedStream.pipe(process.stdout)

```
