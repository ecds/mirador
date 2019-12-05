/*
 * All Endpoints need to have at least the following:
 * annotationsList - current list of OA Annotations
 * dfd - Deferred Object
 * init()
 * search(options, successCallback, errorCallback)
 * create(oaAnnotation, successCallback, errorCallback)
 * update(oaAnnotation, successCallback, errorCallback)
 * deleteAnnotation(annotationID, successCallback, errorCallback) (delete is a reserved word)
 * TODO:
 * read() //not currently used
 *
 * Optional, if endpoint is not OA compliant:
 * getAnnotationInOA(endpointAnnotation)
 * getAnnotationInEndpoint(oaAnnotation)
 */
(function($){

  $.ReaduxEndpoint = function(options) {

    jQuery.extend(this, {
      dfd:             jQuery.Deferred(),
      annotationsList: [],        //OA list for Mirador use
      windowID:        null,
      eventEmitter:    null,
      popStateEvent: false,
      username: 'mirador'
    }, options);

    this.init();
  };

  $.ReaduxEndpoint.prototype = {
    init: function() {
      var _this = this;
      this.windowID = this.windowID ? this.windowID : this.windowIDwindowID;
      // Listener to update the canvas if user navigates with the forward or back buttons.
      window.addEventListener("popstate", function(event) {
        // If new canvas is loading b/c user navigated with back or forward buttons
        // we need to skip the `history.pushState()` call.
        _this.popStateEvent = true;
        var pathParts = document.location.pathname.split('/').reverse();
        var newCanvasID = `${document.location.protocol}//${document.location.host}/iiif/${pathParts[2]}/canvas/${pathParts[0]}`;
        _this.newCanvasID = newCanvasID;
        _this.eventEmitter.publish('SET_CURRENT_CANVAS_ID.' + _this.windowID, newCanvasID.replace(/%3A/g, ':'), this);
      });
      
      _this.canvasEvent = new CustomEvent('canvasswitch', {bubbles: true, detail: {}});
      
      this.eventEmitter.subscribe('windowUpdated', (event, new_state) => {

        _this.canvasEvent.detail.volume = _this.volume;
        _this.canvasEvent.detail.canvas = _this.page;
        window.dispatchEvent(_this.canvasEvent);
        
        // If the user navigated to the canvas using the back or forward buttons,
        // we don't want to mess with the state. Doing so would clear any forward states
        // and make the back only one canvas deep.
        // If the new canvas load is due to the user using any of the Mirador
        // navigation, we need to update the location and history with the new
        // canvas id.
        if (!this.popStateEvent) {
          var pathParts = document.location.pathname.split('/').reverse();
          var newCanvasID = document.location.protocol + '//' + document.location.host + '/iiif/' + pathParts[1] + '/canvas/' + pathParts[0];
          document.title = pathParts[0]
          this.newCanvasID = newCanvasID;
          if (new_state.viewType == 'ThumbnailsView') {
            history.pushState(history.state, '', 'all');
          } else {
            history.pushState(history.state, '', this.page.replace(/:/g, '%3A'));
          }
        } else {
          // All we do if the load is due to a `popstate` event is reset flag for the
          // next switch.
          this.popStateEvent = false;
        }
        // Wait until the history has been updated so `window.location` is accurate.
        if (document.getElementById("mySpan") !== null) {
          document.getElementById("mySpan").innerHTML = window.location.href;
        }
      });
  },
  
  //Search endpoint for all annotations with a given URI in options
  search: function(options, successCallback, errorCallback) {
    // if (this.username == null) return;
    this.annotationsList = [];
    // Vue.set(readux.$refs["rx-url-canvas"], "url", options.uri); // readux is the vue instance
    // Vue.set(readux.$refs["rx-url-canvas"], "label", "Stable Canvas"); // readux is the vue instance
    // Vue.set(readux.$refs["rx-url-stable-page"], "url", window.location.href); // readux is the vue instance
    // Vue.set(readux.$refs["rx-url-stable-page"], "label", "Stable Page"); // readux is the vue instance
    // var linkContainer = document.getElementById("myLink");
    // var link = document.createElement('a');
    // var linkText = document.createTextNode(options.uri);
    // link.href = options.uri;
    // link.title = 'Stable link for canvas';
    // link.appendChild(linkText);
    // linkContainer.innerHTML='';
    // linkContainer.appendChild(link);
    this.volume = options.uri.split('/').reverse()[2];
    this.page = options.uri.split('/').reverse()[0];

    let _this = this;
    
    //use options.uri
    jQuery.ajax({
      url: `/annotations/${options.username}/${_this.volume}/list/${_this.page}`,
      type: 'GET',
      dataType: 'json',
      headers: { },
      data: { },
      contentType: "application/json; charset=utf-8",
      success: function(data) {
        //check if a function has been passed in, otherwise, treat it as a normal search
        // if (typeof successCallback === "function") {
        //   // successCallback(data);
        // } else {
          jQuery.each(data, function(index, value) {
            // if (!value) return;
            if (value && value instanceof Array) {
              value.forEach(annotation => {                
                // TODO: Maybe a check for annotated by current user?
                // if (value.resource["@type"] !== 'cnt:ContentAsText') {  
                //   value.endpoint = _this;
                if (annotation.resource) {
                  annotation.endpoint = _this;
                  _this.annotationsList.push(annotation);
                }
              })
              // if (!value.resource) continue;
            }
            // }
          });
          _this.canvasEvent.detail.annotationsOnPage = _this.annotationsList.length;
          _this.dfd.resolve(true);
          return _this.annotationsList;
        // }
      },
      error: function() {
        if (typeof errorCallback === "function") {
          errorCallback();
        }
      }
    });
  },
    
    //Delete an annotation by endpoint identifier
    deleteAnnotation: function(annotationID, successCallback, errorCallback) {
      var _this = this;        
      jQuery.ajax({
        url: '/annotations-crud/',
        type: 'DELETE',
        dataType: 'json',
        headers: {
          'X-CSRFToken': document.getElementsByName('csrfmiddlewaretoken')[0].value
        },
        data: JSON.stringify({"id": annotationID }),
        contentType: "application/json; charset=utf-8",
        success: function(data) {
          _this.canvasEvent.detail.annotationsOnPage = parseInt(_this.canvasEvent.detail.annotationsOnPage) - 1;
          window.dispatchEvent(_this.canvasEvent);
          if (typeof successCallback === "function") {
            successCallback();
          }
        },
        error: function() {
          if (typeof errorCallback === "function") {
            errorCallback();
          }
        }
      });
    },
    
    //Update an annotation given the OA version
    update: function(oaAnnotation, successCallback, errorCallback) {
      delete oaAnnotation.endpoint;
      var annotation = this.getAnnotationInEndpoint(oaAnnotation),
      _this = this;
      
      jQuery.ajax({
        url: '/annotations-crud/',
        type: 'PUT',
        dataType: 'json',
        headers: {
          'X-CSRFToken': document.getElementsByName('csrfmiddlewaretoken')[0].value
        },
        data: JSON.stringify({"id": oaAnnotation['@id'], "oa_annotation": JSON.stringify(oaAnnotation) }),
        contentType: "application/json; charset=utf-8",
        success: function(data) {
          // if (typeof successCallback === "function") {
          //   successCallback();
          // }
          oaAnnotation.endpoint = _this;
        },
        error: function() {
          if (typeof errorCallback === "function") {
            errorCallback();
          }
        }
      });
    },

    //takes OA Annotation, gets Endpoint Annotation, and saves
    //if successful, MUST return the OA rendering of the annotation
    create: function(oaAnnotation, successCallback, errorCallback) {
      
      var _this = this;
      var canvas = oaAnnotation.on[0].full.split('/').reverse()[0];
      if (!oaAnnotation['@id']) {
        oaAnnotation['@id'] = _this.uuidv4();
      }
      
      jQuery.ajax({
        url: '/annotations-crud/',
        type: 'POST',
        dataType: 'json',
        headers: {
          'X-CSRFToken': document.getElementsByName('csrfmiddlewaretoken')[0].value
        },
        data: JSON.stringify({ "oa_annotation": JSON.stringify(oaAnnotation) }),
        contentType: "application/json; charset=utf-8",
        success: function(data) {
          _this.canvasEvent.detail.annotationsOnPage = parseInt(_this.canvasEvent.detail.annotationsOnPage) + 1;
          window.dispatchEvent(_this.canvasEvent);
          oaAnnotation = data;
          oaAnnotation.endpoint = _this;
          if (typeof successCallback === 'function') {
            successCallback(oaAnnotation);
          }
        },
        error: function(error) {
          if (typeof errorCallback === "function") {
            errorCallback();
          }
        }
      });
    },

    set: function(prop, value, options) {
      if (options) {
        this[options.parent][prop] = value;
      } else {
        this[prop] = value;
      }
    },

    //Convert Endpoint annotation to OA
    getAnnotationInOA: function(annotation) {
    },

    // Converts OA Annotation to endpoint format
    getAnnotationInEndpoint: function(oaAnnotation) {
    },

    userAuthorize: function(action, annotation) {
      return true;
    },
    
    uuidv4() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  };

}(Mirador));
