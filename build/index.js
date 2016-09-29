// Generated by CoffeeScript 1.10.0
var configure,
  slice = [].slice,
  hasProp = {}.hasOwnProperty,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

configure = function(arg) {
  var Cache, CacheReference, CachedObject, CachedObjectFactory, DomCache, EventEmitter, EventEmitterProxy, JsonPointer, MemoryCache, Promise, pathToPointer, ref;
  ref = arg != null ? arg : {}, JsonPointer = ref.JsonPointer, EventEmitter = ref.EventEmitter, Promise = ref.Promise;
  if (typeof require === 'function') {
    if (JsonPointer == null) {
      JsonPointer = require('json-ptr');
    }
    if (Promise == null) {
      Promise = require('bluebird');
    }
    if (EventEmitter == null) {
      EventEmitter = require('events').EventEmitter;
    }
  }
  pathToPointer = function(path) {
    var isPresent, parts;
    isPresent = function(val) {
      return (val != null) && typeof val === 'string' && /[^\s]/.test(val);
    };
    parts = path.split(/\/+/).filter(isPresent);
    return JsonPointer.encodePointer(parts);
  };
  EventEmitterProxy = (function() {
    function EventEmitterProxy() {}

    EventEmitterProxy.prototype.emitter = null;

    EventEmitterProxy.prototype.on = function() {
      var args, ref1;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return (ref1 = this.emitter).on.apply(ref1, args);
    };

    EventEmitterProxy.prototype.once = function() {
      var args, ref1;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return (ref1 = this.emitter).once.apply(ref1, args);
    };

    EventEmitterProxy.prototype.addListener = function() {
      var args, ref1;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return (ref1 = this.emitter).addListener.apply(ref1, args);
    };

    EventEmitterProxy.prototype.removeListener = function() {
      var args, ref1;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return (ref1 = this.emitter).removeListener.apply(ref1, args);
    };

    EventEmitterProxy.prototype.removeAllListeners = function() {
      var args, ref1;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return (ref1 = this.emitter).removeAllListeners.apply(ref1, args);
    };

    EventEmitterProxy.prototype.listenerCount = function() {
      var args, ref1;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return (ref1 = this.emitter).listenerCount.apply(ref1, args);
    };

    EventEmitterProxy.prototype.emit = function() {
      var args, ref1;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return (ref1 = this.emitter).emit.apply(ref1, args);
    };

    return EventEmitterProxy;

  })();
  Cache = (function() {
    function Cache(props) {
      var key, val;
      for (key in props) {
        if (!hasProp.call(props, key)) continue;
        val = props[key];
        this[key] = val;
      }
      this.setDefaults();
    }

    Cache.prototype.setDefaults = function() {};

    Cache.prototype.write = function(path, data, done) {
      return done(Error('Not implemented.'));
    };

    Cache.prototype.read = function(path, done) {
      return done(Error('Not implemented'));
    };

    Cache.prototype.ref = function(path) {
      var cache;
      cache = this;
      return new CacheReference({
        cache: cache,
        path: path
      });
    };

    return Cache;

  })();
  DomCache = (function(superClass) {
    extend(DomCache, superClass);

    function DomCache() {
      return DomCache.__super__.constructor.apply(this, arguments);
    }

    DomCache.prototype.localStorage = null;

    DomCache.prototype.localStorageKey = null;

    DomCache.prototype.pathToPointer = pathToPointer;

    DomCache.prototype.getData = function() {
      var data, json;
      json = this.localStorage.getItem(this.localStorageKey);
      if (json == null) {
        json = '{}';
      }
      data = JSON.parse(json);
      return data;
    };

    DomCache.prototype.setData = function(value) {
      var json;
      if (value == null) {
        value = {};
      }
      json = JSON.stringify(value);
      return this.localStorage.setItem(this.localStorageKey, json);
    };

    DomCache.prototype.write = function(path, value, done) {
      var data, pointer;
      data = this.getData();
      pointer = this.pathToPointer(path);
      JsonPointer.set(data, pointer, value, true);
      this.setData(data);
      return done(null);
    };

    DomCache.prototype.read = function(path, done) {
      var pointer, value;
      pointer = this.pathToPointer(path);
      value = JsonPointer.get(this.getData(), pointer);
      return done(null, value);
    };

    DomCache.prototype.getReference = function(path) {
      var cache;
      cache = this;
      return new CacheReference({
        cache: cache,
        path: path
      });
    };

    return DomCache;

  })(Cache);
  MemoryCache = (function(superClass) {
    extend(MemoryCache, superClass);

    function MemoryCache() {
      return MemoryCache.__super__.constructor.apply(this, arguments);
    }

    MemoryCache.prototype.data = null;

    MemoryCache.prototype.pathToPointer = pathToPointer;

    MemoryCache.prototype.setDefaults = function() {
      return this.data != null ? this.data : this.data = {};
    };

    MemoryCache.prototype.write = function(path, value, done) {
      var e, error, error1, pointer;
      if (path == null) {
        path = '/';
      }
      error = null;
      try {
        pointer = this.pathToPointer(path);
        return JsonPointer.set(this.data, pointer, value, true);
      } catch (error1) {
        e = error1;
        return error = e;
      } finally {
        done(error);
      }
    };

    MemoryCache.prototype.read = function(path, done) {
      var pointer, value;
      if (path == null) {
        path = '/';
      }
      pointer = this.pathToPointer(path);
      value = JsonPointer.get(this.data, path);
      return done(null, value);
    };

    MemoryCache.prototype.getReference = function(path) {
      if (path == null) {
        path = '/';
      }
      return new CacheReference({
        cache: this,
        path: path
      });
    };

    return MemoryCache;

  })(Cache);
  CacheReference = (function() {
    CacheReference.prototype.cache = null;

    CacheReference.prototype.path = null;

    function CacheReference(props) {
      var key, val;
      for (key in props) {
        if (!hasProp.call(props, key)) continue;
        val = props[key];
        this[key] = val;
      }
    }

    CacheReference.prototype.write = function(value, done) {
      return this.cache.write(this.path, value, done);
    };

    CacheReference.prototype.read = function(done) {
      return this.cache.read(this.path, done);
    };

    return CacheReference;

  })();
  CachedObject = (function(superClass) {
    extend(CachedObject, superClass);

    CachedObject.DEFAULT_LOAD_TIMEOUT = 1000;

    CachedObject.prototype.firebaseRef = null;

    CachedObject.prototype.cacheRef = null;

    CachedObject.prototype.emitter = null;

    CachedObject.prototype.loadFromFirebaseTimeout = null;

    CachedObject.prototype.firebaseValueListener = null;

    function CachedObject(props) {
      var key, val;
      for (key in props) {
        if (!hasProp.call(props, key)) continue;
        val = props[key];
        this[key] = val;
      }
      if (this.emitter == null) {
        this.emitter = new EventEmitter;
      }
      if (this.loadFromFirebaseTimeout == null) {
        this.loadFromFirebaseTimeout = 1000;
      }
    }

    CachedObject.prototype.readCache = function(done) {
      return this.cacheRef.read(done);
    };

    CachedObject.prototype.writeCache = function(value, done) {
      return this.cacheRef.write(value, done);
    };

    CachedObject.prototype.emitCancel = function(cancelError) {
      return this.emit('cancel', cancelError);
    };

    CachedObject.prototype.emitError = function(error) {
      return this.emit('error', error);
    };

    CachedObject.prototype.emitValue = function(value) {
      return this.emit('value', value);
    };

    CachedObject.prototype.handleFirebaseValue = function(snapshot) {
      var value;
      value = snapshot.val();
      this.emitValue(value);
      return this.writeCache(value, this.handleError.bind(this));
    };

    CachedObject.prototype.handleFirebaseCancel = function(cancelError) {
      return this.emitCancel(cancelError);
    };

    CachedObject.prototype.handleError = function(error) {
      if (error != null) {
        return this.emitError(error);
      }
    };

    CachedObject.prototype.watch = function(callback) {
      return this.load((function(_this) {
        return function(value) {
          if (_this.firebaseValueListener == null) {
            _this.firebaseValueListener = _this.addFirebaseValueListener();
          }
          callback(value);
          return _this.on('value', callback);
        };
      })(this));
    };

    CachedObject.prototype.addFirebaseValueListener = function() {
      var callback, cancelCallback;
      callback = this.handleFirebaseValue.bind(this);
      cancelCallback = this.handleFirebaseCancel.bind(this);
      this.firebaseRef.on('value', callback, cancelCallback);
      return callback;
    };

    CachedObject.prototype.removeFirebaseValueListener = function() {
      this.firebase.off('value', this.firebaseValueListener);
      return this.firebaseValueListener = null;
    };

    CachedObject.prototype.unwatch = function(callback) {
      this.off('value', callback);
      if (this.listenerCount('value') === 0) {
        return this.removeFirebaseValueListener();
      }
    };

    CachedObject.prototype.$watch = function(callback) {
      return this.watch(callback);
    };

    CachedObject.prototype.$loaded = function() {
      var promiseFn;
      promiseFn = (function(_this) {
        return function(resolve, reject) {
          var noop, onData, onError;
          noop = function() {};
          onError = function(error) {
            resolve = noop;
            return reject(error);
          };
          onData = function(data) {
            _this.removeListener('error', onError);
            reject = noop;
            return resolve(data);
          };
          _this.once('error', onError);
          return _this.load(onData);
        };
      })(this);
      return new Promise(promiseFn);
    };

    CachedObject.prototype.load = function(callback) {
      var isLoaded, loadFromCache, loadFromFirebase, onCacheRead, onFirebaseValue, onLoadComplete, timeoutId;
      isLoaded = false;
      timeoutId = null;
      loadFromFirebase = (function(_this) {
        return function() {
          return _this.firebaseRef.once('value', onFirebaseValue);
        };
      })(this);
      onFirebaseValue = (function(_this) {
        return function(snapshot) {
          var value;
          if (isLoaded) {
            return;
          }
          value = snapshot.val();
          onLoadComplete(value);
          return _this.writeCache(value, _this.handleError.bind(_this));
        };
      })(this);
      loadFromCache = (function(_this) {
        return function() {
          return _this.readCache(onCacheRead);
        };
      })(this);
      onCacheRead = (function(_this) {
        return function(error, value) {
          if (isLoaded) {
            return;
          }
          if (error != null) {
            _this.handleError(error);
          }
          return onLoadComplete(value);
        };
      })(this);
      onLoadComplete = (function(_this) {
        return function(value) {
          isLoaded = true;
          clearTimeout(timeoutId);
          _this.firebaseRef.off('value', onFirebaseValue);
          return callback(value);
        };
      })(this);
      timeoutId = setTimeout(loadFromCache, this.loadFromFirebaseTimeout);
      return loadFromFirebase();
    };

    return CachedObject;

  })(EventEmitterProxy);
  CachedObjectFactory = (function() {
    CachedObjectFactory.prototype.firebaseDb = null;

    CachedObjectFactory.prototype.cache = null;

    function CachedObjectFactory(props) {
      var key, val;
      for (key in props) {
        if (!hasProp.call(props, key)) continue;
        val = props[key];
        this[key] = val;
      }
    }

    CachedObjectFactory.prototype.create = function(path) {
      var cacheRef, firebaseRef;
      firebaseRef = this.firebaseDb.ref(path);
      cacheRef = this.cache.ref(path);
      return new CachedObject({
        firebaseRef: firebaseRef,
        cacheRef: cacheRef
      });
    };

    return CachedObjectFactory;

  })();
  return {
    configure: configure,
    EventEmitterProxy: EventEmitterProxy,
    DomCache: DomCache,
    MemoryCache: MemoryCache,
    CacheReference: CacheReference,
    CachedObject: CachedObject,
    CachedObjectFactory: CachedObjectFactory
  };
};

module.exports = configure();

//# sourceMappingURL=index.js.map
