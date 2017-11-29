// Write your module here
// It must attach an object to the window that exposes a function getFields().
// getFields() should return a list of  { name:label } pairs describing all the fields in each frame
(function() {
	//how long to wait to get a response back from an iframe before we conclude that it's not running our widget, in milliseconds
	//assumption:  given that the testcase is timeboxed to 10 seconds, an excessively slow page-load can be counted as a 'network error'
	const iframeTimeout = 5000;

	//event/message names
	const frameLoadedEvent = 'frames:loaded';			//fired when the initial scan of the document is complete
	const frameUpdatedEvent = 'frames:updated';			//fired when a rescan of the document has detected any change in the field data
	const scanRequestEvent = 'fieldScanner:request';	//message sent to child frames when a parent frame wants to interrogate their status
	const scanResponseEvent = 'fieldScanner:response';	//message sent from child frame when they have data to report to their parent frame

	//attach to an available spot in the global scope (window)
	let moduleName = "fieldScanner";
	if (! window[moduleName]) {
		window[moduleName] = {};
	}
	else {
		//someone has already used our module name; either we've been loaded twice (in which case, no action
		//is required) or something else has taken our preferred name (in which case, pick a new name!)
		if (! window[moduleName].getFields || typeof window[moduleName].getFields !== 'function') {
			//something else has taken our preferred name; so pick a new name
			while (window[moduleName]) {
				moduleName += Math.random();
			}
			window[moduleName] = {};
		}
		else {
			//as far as we can tell, we've been loaded twice; bail out
			console.log("WARN:  The 'fieldScanner' module appears to have been loaded twice!");
			return;
		}
	}

	//CustomEvent fix for Microsoft browsers prior to Edge; see:  https://stackoverflow.com/questions/26596123/internet-explorer-9-10-11-event-constructor-doesnt-work
	if (! window.CustomEvent || typeof window.CustomEvent !== 'function' ) {
		let CustomEvent = function( event, params ) {
	    	params = params || { bubbles: false, cancelable: false, detail: undefined };
	    	var evt = document.createEvent( 'CustomEvent' );
	    	evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
	    	return evt;
		};

	  	CustomEvent.prototype = window.Event.prototype;

  		window.CustomEvent = CustomEvent;
	}
	//FIXME:  also postMessage fix for IE?
	//FIXME:  and if we're really serious about it, Promises as well


	//internal methods
	let isIframe = function() {	//test whether or not we're running in an iframe
		//FIXME:  this appears to erroneously detect the topmost page as running in a frame; or maybe that's just an artifact of the test harness?
		try {
			return window.self !== window.top;
		} catch (ex) {
			return true;
		}
	};

	//gets the first key within an object; see:  https://stackoverflow.com/questions/3298477/get-first-key-from-javascript-object
	let firstKey = function(obj) {
		if (! obj) {
			return undefined;
		}

		let keys = Object.keys(obj);
		return keys[0];		//will be 'undefined' if obj is empty
	};

	//checks whether or not two arrays are the same
	let arrayEquals = function(left, right) {
		if (! left && ! right) {
			return true;
		}
		if (! left || ! right) {
			return false;
		}

		//inefficient, but adequate for throw-away code and very concise
		return JSON.stringify(left) == JSON.stringify(right);
	};

	let numFrames = 0;				//the number of child frames we're waiting to hear from
	let childFields = {};			//any fields that have been reported to us from child frames; this object will conain one list for each child frame
	let domReady = function() {
		let frames = document.getElementsByTagName("iframe");
		numFrames = frames.length;

		//if we're running inside of an iframe or with child frames, we need to prepare to receive messages
		let framePromises = [];
		if (isIframe() || numFrames > 0) {		//we could just always add the event listener(s), but it's better to only listen for 'postMessage' events if we're actually expecting to get some
			//register to receive and respond to messages from the parent frame
			window.addEventListener('message', (msg) => {
				//as our widget might be hosted in any page, we can't effectively validate the message origin
				//instead we just have to accept any message that appears syntactically valid
				let data = msg.data;

				if (data && data.frameId !== undefined && data.eventType) {
					if (isIframe() && data.eventType === scanRequestEvent) {
						//the message is syntactically valid; we should respond promptly with our own message
						let myFrameId = data.frameId;
						let sourceWindow = msg.source;

						scanFields((result) => {
							sourceWindow.postMessage({eventType: scanResponseEvent, frameId: myFrameId, fields: result}, "*");
						});
					}
					else if (data.eventType === scanResponseEvent && data.fields) {
						//the message is syntactically valid; we got the data we asked for, resolve the promise
						let childFrameId = data.frameId;
						let resolve = framePromises[childFrameId];		//not sure if passing promise resolution methods around like this is a good idea or not, but it works
																		//passing the entire Promise object and using Promise.resolve() should be another way to accomplish the same effect
						if (resolve) {
							resolve({frameId: childFrameId, fields: data.fields});
						}
					}
				}
			});
		}

		//add onload handlers to any iframe elements on the page; we need to interrogate these after they load
		for (let index = 0; index < numFrames; index++) {
			let frame = frames[index];
			frame.addEventListener('load', () => {
				//FIXME:  this code won't work in Internet Explorer (should be okay in Edge)
				if (window.Promise && typeof Promise === 'function') {
					//we don't know whether or not the frame will actually be hosting our widget, so let's try to find out
					let frameId = index;
					childFields[frameId] = [];
					new Promise((resolve, reject) => {
						//it becomes the event handler's responsibility to resolve the promise
						framePromises.push(resolve);
						frame.contentWindow.postMessage({eventType: scanRequestEvent, frameId: frameId}, "*");

						//fail the promise if we don't get a response back in a reasonable amount of time
						setTimeout(() => {
							reject();
						}, iframeTimeout);
					})
					.then((result) => {
						//we got a message back, it should contain a frame-id and the fields that were found within that frame
						if (result && result.frameId !== undefined && result.fields) {
							let childFrameId = result.frameId;
							let fields = result.fields;

							childFields[childFrameId] = fields;
						}

						//we're no longer waiting for this frame
						numFrames--;
					})
					.catch(() => {
						//the promise has been rejected; we're no longer waiting for this frame
						numFrames--;
					});
				}
				else {
					//Internet Explorer...
					numFrames--;
				}
			});
		}

		//now that the document has loaded, we can scan for fields
		scanFields(frameLoadedEvent);

		//also start observing changes to the document
		if (window.MutationObserver && typeof MutationObserver === 'function') {
			//XXX:  technically this appears to be an extension to the provided spec, however it seems reasonable to be able to detect and respond to DOM updates
			//for newer browsers (that support 'MutationObserver'), we can monitor DOM changes and rescan automatically; older browsers (IE < 11) miss out, unfortunately
			observer = new MutationObserver((changeList, obs) => {
				scanFields(frameUpdatedEvent);		//we use a different event name here, to ensure that anyone listening for 'frames:loaded' and
													//expecting only one event is not caught out unprepared; API consumers will need to add a
													//listener for 'frames:updated' if they want to receive these notifications

				//note that this is somewhat of a half-baked idea at the moment; to really work properly we'd also need to allow child frames to
				//propagate their change notifications up to their parent page so that it can collect all of the changes.  That seems like it
				//would be getting a bit carried away, however, as this idea doesn't appear to be in-spec to begin with.  Should that not be
				//the case please let me know and I'll code it.
			});

			//configure the observer to detect structural changes within the document
			observer.observe(document, {childList: true, subtree: true});
		}
	};

	//scan the fields in the current document
	let scannedFields = undefined;	//the last set of scanned fields
	let scanFields = function(eventNameOrCallback) {
		if (numFrames > 0) {
			//we're still waiting for child documents to report their results (or time-out); try again later
			setTimeout(() => {
				scanFields(eventNameOrCallback);
			}, iframeTimeout / 10);
			return;
		}

		let newFields = [];

		//assumption:  only form controls that are actually contained within a 'form' element should be scanned
		for (let form of document.forms) {
			//assumption:  we only count labels that are specified with a correctly structured 'label' element
			let formLabels = {};
			for (let label of form.getElementsByTagName("label")) {
				formLabels[label.htmlFor] = label.innerText;
			}

			for (let element of form.elements) {
				//assumption:  if the element doesn't have a label, then it should be ignored
				if (formLabels[element.id]) {
					var meta = {};
					meta[element.name] = formLabels[element.id];
					newFields.push(meta);
				}
			}
		}

		//now append the child fields to the list
		for (let key in childFields) {
			newFields = newFields.concat(childFields[key]);
		}

		//sort alphabetically by key
		newFields.sort((left, right) => {
			//assumption:  default case-sensitivity is fine
			return firstKey(left).localeCompare(firstKey(right));
		});

		//see if anything has changed; if nothing has, do not dispatch any events
		let anyChanges = ! arrayEquals(scannedFields, newFields);
		scannedFields = newFields;

		//scan complete; dispatch an event to any listeners that may exist
		if (eventNameOrCallback) {
			if (typeof eventNameOrCallback === 'function') {
				//callbacks are always executed, even if nothing has changed since the last scan (the code requesting the callback may still need the results)
				eventNameOrCallback(scannedFields);
			}
			else if (anyChanges) {
				//events are only dispatched when something has changed
				let detail = { widget: moduleName };
				document.dispatchEvent(new CustomEvent(eventNameOrCallback, { detail: detail }));
			}
		}
	};

	//expose our public API
	const fieldScanner = window[moduleName];
	fieldScanner.getFields = function() {		//could do this in a more object-oriented way using 'prototype', but that seems like overkill; we don't expect anyone to create new instances of this widget
		return scannedFields;
	};

	//add onload handler to the current document, so that we don't start scanning for fields until the DOM is ready
	if (document.readyState == "loading") {
		document.addEventListener("DOMContentLoaded", domReady);
	}
	else {
		//we're already loaded; call the 'ready' function directly
		domReady();
	};
}());
