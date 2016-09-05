# boco-cached-firebase

Fully-offline cached objects that sync to firebase references.

## Usage

```coffee
# Requires
Firebase = require 'firebase'
LocalStorage = require 'node-localstorage'
CachedFirebase = require 'boco-cached-firebase'

# Initialize your firebase application
Firebase.initializeApp
  apiKey: "<API_KEY>",
  authDomain: "<PROJECT_ID>.firebaseapp.com",
  databaseURL: "https://<DATABASE_NAME>.firebaseio.com",

# Initialize the cache
LocalStorage = require 'node-localstorage'

cache = new CachedFirebase.DomCache
  localStorage: new LocalStorage('./storage')
  localStorageKey: 'cached-firebase'

# Create an object factory
objectFactory = new CachedFirebase.ObjectFactory
  cache: cache
  firebaseDb: Firebase.database()

# Create a cached firebase object
myObject = objectFactory.create '/path/to/myObject'

# Watch the object for changes.
# Once watched, a cached object  will automatically sync changes
# and data will be available from the cache when fully offline
onValue = (newValue) ->
  console.log 'myObject value:', newValue

myObject.watch onValue

# All 'error' events are emitted by the watched object
myObject.on 'error', (error) ->
  console.error error

# If you lose rights to the data, a 'cancel' event is emitted
myObject.on 'cancel', (cancelError) ->
  console.error error

# When finished with this object you may call unwatch
# to remove all 'change' event listeners
myObject.unwatch
```
