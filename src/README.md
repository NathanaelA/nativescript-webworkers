[![npm](https://img.shields.io/npm/v/nativescript-webworkers.svg)](https://www.npmjs.com/package/nativescript-webworkers)
[![npm](https://img.shields.io/npm/l/nativescript-webworkers.svg)](https://www.npmjs.com/package/nativescript-webworkers)
[![npm](https://img.shields.io/npm/dt/nativescript-webworkers.svg?label=npm%20d%2fls)](https://www.npmjs.com/package/nativescript-webworkers)


# nativescript-webworkers
NativeScript WebWorkers (threads) for Android and iOS
This is really only useful if you need to access a hidden WebView now; NativeScript has internal support for WebWorkers for a long time now.   

## License

This is released under the MIT License, meaning you are free to include this in any type of program -- However for entities that need a support contract, changes, enhancements and/or a commercial license please contact me at [http://nativescript.tools](http://nativescript.tools).

I also do contract work; so if you have a module you want built for NativeScript (or any other software projects) feel free to contact me [nathan@master-technology.com](mailto://nathan@master-technology.com).

[![Donate](https://img.shields.io/badge/Donate-PayPal-brightgreen.svg?style=plastic)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=HN8DDMWVGBNQL&lc=US&item_name=Nathanael%20Anderson&item_number=nativescript%2dwebworkers&no_note=1&no_shipping=1&currency_code=USD&bn=PP%2dDonationsBF%3ax%3aNonHosted)
[![Patreon](https://img.shields.io/badge/Pledge-Patreon-brightgreen.svg?style=plastic)](https://www.patreon.com/NathanaelA)

## Breaking Changes
v2.00 No longer attempts to assign the global Worker object; NativeScript has Native WebWorker support for a long time now. 


## Notes

Please note The WebWorker environment is a LIMITED JavaScript shell.  It does have AJAX/HTTP(s) ability; but it does NOT have any access to any of the NativeScript api.  It also does not have any access to the Native iOS or Android api's.  It is strictly a JS thread.  In addition at this moment "ImportScripts" has not been implemented.  It should be fairly easy to implement; and if anyone wants to do a pull request to implement this; I'd be happy to add it to the code that gets injected into the environment.

If the device has more than one CPU; the Worker threads should not impact the main NativeScript thread.  However, if the device only has one CPU; and depending on how busy you make the worker, it will impact the primary NativeScript thread.

## Installation

Run `tns plugin add nativescript-webworkers` in your ROOT directory of your project.

## Usage

To use the  module you must first `require()` it:

```js
const WebWorker = require( 'nativescript-webworkers' );

const myWorker = new WebWorker('~/web.worker.js'); // i.e. using the WebWorker variable returned by the require statement.
```


## new WebWorker(data) 
### data can be:
- File path to a JS file (either relative `~/.../somescript.js` or full path `/..../somescript.js`)
- Object with a `.HTML` - which allows you to pass in your own HTML file
  - please make sure the HTML is proper and not malformed.
- Object with a `.script` - which allows you to pass in your own javascript code
  - Object can have its own custom `.baseURL`, otherwise defaults to the proper baseURL.

## NativeScript environment
### Events
####.onmessage(data)
This will have the JSON object that was sent from the worker

####.onerror
This will have any errors that occurred (this may be unreliable; as not all errors can be tracked properly)

####.onready
This is fired when the webworker environment is ready to go.  
**This is NOT a standard webworker function**

#### .executeJS
This allows you to send some JS into the environment.
**This is NOT a standard webworker function**

### Methods
####.postMessage(data)
This posts the message into the webworker environment
####.terminate()
This terminates the webworker environment; after this is ran; DO NOT attempt to continue doing anything on this webworker.


## WebWorker Environment
### Events

####onmessage(data)
The function that gets any messages from the NativeScript environment

####onready()
This function will get called if it exists once the webworker is able to communicate with the NativeScript host.
**This is NOT a standard webworker function**

### Methods
####postMessage(data)
The function you use to send message back to the NativeScript environment

####close()
Terminates this environment


##Example:
### NativeScript code:
```js
  const WebWorker = require( 'nativescript-webworkers' );
  var myWorker = new WebWorker('~/test.worker.js');
  myWorker.onmessage = function(m) { console.log("Webworker said:", m); };
  myWorker.postMessage("Hello");
```

### test.worker.js
```js
  onmessage = function(m) {
    console.log("NativeScript said" + m);	
  };
  onready = function() {
    postMessage("Hi");
  };
```  
