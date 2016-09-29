configure = ({JsonPointer, EventEmitter, Promise} = {}) ->

  if typeof require is 'function'
    JsonPointer ?= require 'json-ptr'
    Promise ?= require 'bluebird'
    EventEmitter ?= require('events').EventEmitter

  pathToPointer = (path) ->
    isPresent = (val) -> val? and typeof val is 'string' and /[^\s]/.test(val)
    parts = path.split(/\/+/).filter(isPresent)
    JsonPointer.encodePointer parts

  class EventEmitterProxy
    emitter: null
    on: (args...) -> @emitter.on args...
    once: (args...) -> @emitter.once args...
    addListener: (args...) -> @emitter.addListener args...
    removeListener: (args...) -> @emitter.removeListener args...
    removeAllListeners: (args...) -> @emitter.removeAllListeners args...
    listenerCount: (args...) -> @emitter.listenerCount args...
    emit: (args...) -> @emitter.emit args...

  class Cache
    constructor: (props) ->
      @[key] = val for own key, val of props
      @setDefaults()

    setDefaults: ->
      # do nothing by default

    write: (path, data, done) ->
      done Error('Not implemented.')

    read: (path, done) ->
      done Error('Not implemented')

    ref: (path) ->
      cache = @
      new CacheReference {cache, path}

  class DomCache extends Cache
    localStorage: null
    localStorageKey: null
    pathToPointer: pathToPointer

    getData: ->
      json = @localStorage.getItem @localStorageKey
      json ?= '{}'
      data = JSON.parse json
      data

    setData: (value = {}) ->
      json = JSON.stringify value
      @localStorage.setItem @localStorageKey, json

    write: (path, value, done) ->
      data = @getData()
      pointer = @pathToPointer path

      JsonPointer.set data, pointer, value, true

      @setData data
      done null

    read: (path, done) ->
      pointer = @pathToPointer path
      value = JsonPointer.get @getData(), pointer

      done null, value

    getReference: (path) ->
      cache = @
      new CacheReference {cache, path}

  class MemoryCache extends Cache
    data: null
    pathToPointer: pathToPointer

    setDefaults: ->
      @data ?= {}

    write: (path = '/', value, done) ->
      error = null

      try
        pointer = @pathToPointer path
        JsonPointer.set @data, pointer, value, true
      catch e
        error = e
      finally
        done error

    read: (path = '/', done) ->
      pointer = @pathToPointer path
      value = JsonPointer.get @data, path
      done null, value

    getReference: (path = '/') ->
      new CacheReference
        cache: @
        path: path

  class CacheReference
    cache: null
    path: null

    constructor: (props) ->
      @[key] = val for own key, val of props

    write: (value, done) ->
      @cache.write @path, value, done

    read: (done) ->
      @cache.read @path, done

  class CachedObject extends EventEmitterProxy
    @DEFAULT_LOAD_TIMEOUT: 1000

    firebaseRef: null
    cacheRef: null
    emitter: null
    loadFromFirebaseTimeout: null
    firebaseValueListener: null

    constructor: (props) ->
      @[key] = val for own key, val of props
      @emitter ?= new EventEmitter
      @loadFromFirebaseTimeout ?= 1000

    readCache: (done) ->
      @cacheRef.read done

    writeCache: (value, done) ->
      @cacheRef.write value, done

    emitCancel: (cancelError) ->
      @emit 'cancel', cancelError

    emitError: (error) ->
      @emit 'error', error

    emitValue: (value) ->
      @emit 'value', value

    handleFirebaseValue: (snapshot) ->
      value = snapshot.val()
      @emitValue value
      @writeCache value, @handleError.bind(@)

    handleFirebaseCancel: (cancelError) ->
      @emitCancel cancelError

    handleError: (error) ->
      @emitError error if error?

    watch: (callback) ->
      @load (value) =>
        @firebaseValueListener ?= @addFirebaseValueListener()
        callback value
        @on 'value', callback

    addFirebaseValueListener: ->
      callback = @handleFirebaseValue.bind @
      cancelCallback = @handleFirebaseCancel.bind @
      @firebaseRef.on 'value', callback, cancelCallback
      callback

    removeFirebaseValueListener: ->
      @firebase.off 'value', @firebaseValueListener
      @firebaseValueListener = null

    unwatch: (callback) ->
      @off 'value', callback
      @removeFirebaseValueListener() if @listenerCount('value') is 0

    getLoadedPromise: ->

      promiseFn = (resolve, reject) =>
        noop = -> # noop

        onError = (error) ->
          resolve = noop
          reject error

        onData = (data) =>
          @removeListener 'error', onError
          reject = noop
          resolve data

        @once 'error', onError
        @load onData

      new Promise promiseFn

    load: (callback) ->
      isLoaded = false
      timeoutId = null

      loadFromFirebase = =>
        @firebaseRef.once 'value', onFirebaseValue

      onFirebaseValue = (snapshot) =>
        return if isLoaded
        value = snapshot.val()
        onLoadComplete value
        @writeCache value, @handleError.bind(@)

      loadFromCache = =>
        @readCache onCacheRead

      onCacheRead = (error, value) =>
        return if isLoaded
        @handleError error if error?
        onLoadComplete value

      onLoadComplete = (value) =>
        isLoaded = true
        clearTimeout timeoutId
        @firebaseRef.off 'value', onFirebaseValue
        callback value

      timeoutId = setTimeout loadFromCache, @loadFromFirebaseTimeout
      loadFromFirebase()

  class FirebaseObjectDropIn
    $cachedObject: null

    constructor: ({$cachedObject}) ->
      @$cachedObject = $cachedObject

      @$watchObserver = (data) =>
        @[key] = val for own key, val of data

      @$cachedObject.watch @$watchObserver

    $on: (args...) ->
      @$cachedObject.on args...

    $once: (args...) ->
      @$cachedObject.once args...

    $removeListener: (args...) ->
      @$cachedObject.removeListener args...

    $watch: (args...) ->
      @$cachedObject.watch args...

    $unwatch: (args...) ->
      @$cachedObject.unwatch args...

    $loaded: ->
      @$cachedObject.getLoadedPromise()

    $destroy: ->
      @$cachedObject.unwatch @$watchObserver
      @$cachedObject = null

  class CachedObjectFactory
    firebaseDb: null
    cache: null

    constructor: (props) ->
      @[key] = val for own key, val of props

    create: (path) ->
      firebaseRef = @firebaseDb.ref path
      cacheRef = @cache.ref path
      new CachedObject {firebaseRef, cacheRef}

    createFirebaseObjectDropIn: (path) ->
      $cachedObject = @create path
      new FirebaseObjectDropIn {$cachedObject}

  {
    configure
    EventEmitterProxy
    DomCache
    MemoryCache
    CacheReference
    CachedObject
    CachedObjectFactory
  }

module.exports = configure()
