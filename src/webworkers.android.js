/**********************************************************************************
 * (c) 2016-2019, Master Technology
 * Licensed under the MIT license or contact me for a Support or Commercial License
 *
 * I do contract work in most languages, so let me solve your problems!
 *
 * Any questions please feel free to email me or put a issue up on the github repo
 * Version 0.0.3                                      Nathan@master-technology.com
 *********************************************************************************/
"use strict";
/* global require */

const application = require('tns-core-modules/application');
const fs = require('tns-core-modules/file-system');

/* jshint node: true, browser: true, unused: false, undef: true */
/* global android, com, java, javax, unescape, global, NSObject, NSString, NSLocale */

//noinspection JSUnresolvedVariable,JSUnusedLocalSymbols
const _WebChromeClient = android.webkit.WebChromeClient.extend({
    wrapper: null,
    onJsConfirm: function(webView, url, message, result) {
        const self = this;
        setTimeout(function() {
            self.wrapper._clientMessage(message);
        },0);
        return false;
    }
});

//noinspection JSUnresolvedVariable,JSUnusedLocalSymbols
const _WebViewClient = android.webkit.WebViewClient.extend({
   wrapper: null,
    onPageFinished: function(webView, url) {
        const self = this;
        setTimeout(function() {
          self.wrapper._finishedLoading(null);
        },0);
    },
    onReceivedError: function(webView, request, error) {
        this.wrapper._finishedLoading(error);
    }
});


// TODO: Determine if we need to pause these threads in the future using something like what is documented
// here: http://stackoverflow.com/questions/2040963/webview-threads-never-stop-webviewcorethread-cookiesyncmanager-http0-3

function WebWorker(js) {
    this._running = true;
    this._initialized = false;
    this._messages = [];
    this._executes = [];


    //noinspection JSUnresolvedVariable
    this.android = new android.webkit.WebView(application.android.context);

    // TODO: Setup DB Storage  setDatabaseEnabled

    //noinspection JSUnresolvedFunction
    this.android.getSettings().setJavaScriptEnabled(true);
    //noinspection JSUnresolvedFunction
    this.android.getSettings().setDomStorageEnabled(true);
    //noinspection JSUnresolvedFunction
    this.android.getSettings().setDatabaseEnabled(true);
    //noinspection JSUnresolvedFunction
    this.android.getSettings().setUserAgentString("NativeScript-WebWorker");

    const WCC = new _WebChromeClient();
    WCC.wrapper = this;
    const WVC = new _WebViewClient();
    WVC.wrapper = this;

    //noinspection JSUnresolvedFunction
    this.android.setWebChromeClient(WCC);
    //noinspection JSUnresolvedFunction
    this.android.setWebViewClient(WVC);

    if (js == null || js === '') {
        console.error("WebWorkers: can not find JavaScript file: ", js);
        //noinspection JSUnresolvedFunction
        this.android.loadUrl("about:blank");
        return;
    } else if (js.HTML != null) {
        const baseDataUrl = "file:///" + fs.knownFolders.currentApp().path + "/";
        this.android.loadDataWithBaseURL(js.baseURL || baseDataUrl, js.HTML, "text/html", "utf-8", null);
    } else if (js.script != null) {
        const baseDataUrl = "file:///" + fs.knownFolders.currentApp().path + "/";
        this.android.loadDataWithBaseURL(js.baseURL || baseDataUrl, "<script type='text/javascript'>"+js.script+"</script>", "text/html", "utf-8", null);
    } else {
        if (js[0] === '/' || (js[1] === '/' && (js[0] === '.' || js[0] === '~'))) {
            if (js[0] === '~' || js[0] === '.') {
                // TODO: Check to see if ./ is working properly
                js = fs.path.join(fs.knownFolders.currentApp().path, js.substr(2));
            }
            if (fs.File.exists(js)) {
                const baseJSUrl = "file://" + js.substring(0, js.lastIndexOf('/') + 1);
                const fileName = js.substring(baseJSUrl.length - 7);

                //noinspection JSUnresolvedFunction
                this.android.loadDataWithBaseURL(baseJSUrl, "<script type='text/javascript' src='" + fileName + "'></script>", "text/html", "utf-8", null);
            } else {
                console.error("WebWorkers: can not find JavaScript file: ", js);
                //noinspection JSUnresolvedFunction
                this.android.loadUrl("about:blank");
            }
        } else {
            // Check for http(s)://
            if ((js[0] === 'h' || js[0] === 'H') && (js[6] === '/' && (js[5] === '/' || js[7] === '/'))) {
                //noinspection JSUnresolvedFunction
                this.android.loadUrl(js);
            } else {
                const baseDataUrl = "file:///" + fs.knownFolders.currentApp().path + "/";
                //noinspection JSUnresolvedFunction
                this.android.loadDataWithBaseURL(baseDataUrl, "<script type='text/javascript'>" + js + "</script>", "text/html", "utf-8", null);
            }
        }
    }
    //this._setupBridge();
}

WebWorker.prototype.executeJS = function(script) {
    if (!this._running) { return false; }
    if (!this._initialized) {
        this._executes.push(script);
        return true;
    }
    this.android.evaluateJavascript(script, null);
    return true;
};

WebWorker.prototype._setupBridge = function() {
    this._initialized = true;
    // TODO: Add "ImportScripts(script[, script...])
    const script = "window.postMessage = function(data) { try { confirm(JSON.stringify(data)); } catch (e) { console.error(e); } }; " +
        "window._WW_receiveMessage = function(d) { setTimeout(function() { _WW_timedMessage(d); },0); }; " +
        "window._WW_timedMessage = function(d) { try { window.onmessage(d); } catch (e) { console.error(e); postMessage({_BRM: 'error', error: e}); } }; " +
        "window.close = function() { postMessage({_BRM: 'close'}); }; " +
        "if (typeof onready === 'function') { onready(); } ";

    //noinspection JSUnresolvedFunction
    this.android.evaluateJavascript(script, null);
};

WebWorker.prototype._clientMessage = function(m) {
    let data;
    if (m[0] === '{') {
        try {
            data = JSON.parse(m);
        }
        catch (e) {
            data = m;
        }
    } else {
        data = m;
    }
    //noinspection JSUnresolvedVariable
    if (data._BRM) {
        //noinspection JSUnresolvedVariable
        if (data._BRM === "close") {
            this.terminate();
        } else {
            //noinspection JSUnresolvedVariable
            if (data._BRM === "error") {
                this.onerror(data.error);
            }
        }
        return;
    }
    this.onmessage(data);
};

WebWorker.prototype._finishedLoading = function(err) {
    this._setupBridge();
    if (this._messages.length) {
        while (this._messages.length) {
            let m = this._messages.pop();
            this.postMessage(m);
        }
    }
    if (this._executes.length) {
        while (this._executes.length) {
            const m = this._executes.pop();
            this.executeJS(m);
        }
    }

    if (err) {
        onerror(err);
    }
    this.onready();
};

WebWorker.prototype.postMessage = function(data) {
    if (!this._running) { return; }
    if (!this._initialized) {
        this._messages.push(data);
    } else {
        // TODO: Send errors to actual onerror system?
        //noinspection JSUnresolvedFunction
        this.android.evaluateJavascript("try { _WW_receiveMessage(" + JSON.stringify(data) + "); } catch (e) { console.error(e); }", null);
    }
};

WebWorker.prototype.terminate = function() {
    this._running = false;
    //noinspection JSUnresolvedFunction
    this.android.destroy();
    this.android = null;
};

WebWorker.prototype.onerror = function(e) {
    console.log("NativeScript-WebWorker error:", e);
    // Do Nothing.
};

WebWorker.prototype.onmessage = function() {
    console.log("NativeScript-WebWorker message");
    // Do Nothing.
};

WebWorker.prototype.onready = function() {
  // Do nothing; this allows the end user to override this
};

/* if (!global.Worker) {
    global.Worker = WebWorker;
} */

// Make TS Compatible;
WebWorker.WebWorker = WebWorker;

module.exports = WebWorker;