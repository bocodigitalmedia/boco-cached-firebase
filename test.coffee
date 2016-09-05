EventEmitter = require('events').EventEmitter
BocoCachedFirebase = require './source'
LocalStorage = require('node-localstorage').LocalStorage

createMockFirebaseDb = (refs) ->
  ref: (path) -> ref = refs[path]

createMockFirebaseRef = (key) ->
  mockFirebaseRef = new EventEmitter()
  mockFirebaseRef.key = key
  mockFirebaseRef.ref = mockFirebaseRef
  mockFirebaseRef.off = (args...) -> @removeListener args...
  mockFirebaseRef.set = (value) ->
    emitValue = => @emit 'value', createMockFirebaseSnapshot(value)
    setTimeout emitValue, 200

  mockFirebaseRef

createMockFirebaseSnapshot = (value) ->
  val: -> value

logError = (error) ->
  throw error

mockFirebaseRefs =
  '/users/cb': createMockFirebaseRef('cb')
  '/users/fr': createMockFirebaseRef('fr')

mockFirebaseDb =
  ref: (path) ->
    mockFirebaseRefs[path]

data =
  users:
    cb: 'CB'
    fr: 'FR'

localStorage = new LocalStorage './storage'
localStorageKey = 'testData'

factory = new BocoCachedFirebase.CachedObjectFactory
  cache: new BocoCachedFirebase.DomCache {localStorage, localStorageKey}
  firebaseDb: createMockFirebaseDb(mockFirebaseRefs)

factory.cache.setData
  users:
    cb: 'CB'
    fr: 'FR'

cb = factory.create '/users/cb'
fr = factory.create '/users/fr'

cb.watch (value) -> console.log 'watch', cb.cacheRef.path, value
fr.watch (value) -> console.log 'watch', fr.cacheRef.path, value

cb.on 'error', logError
fr.on 'error', logError

emitEvents = ->
  console.log 'emitting events'
  mockFirebaseRefs['/users/cb'].emit 'value', createMockFirebaseSnapshot('foo')
  mockFirebaseRefs['/users/fr'].emit 'value', createMockFirebaseSnapshot('bar')

finishUp = ->
  console.log 'data', factory.cache.getData()
  process.exit 0

setTimeout emitEvents, 200
setTimeout finishUp, 2200
