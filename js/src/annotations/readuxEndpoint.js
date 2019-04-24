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
      popStateEvent: false
    }, options);

    this.init();
  };

  $.ReaduxEndpoint.prototype = {
    init: function() {
      var _this = this;
      _this.windowID = this.windowID ? this.windowID : this.windowIDwindowID;
      
      // Listener to update the canvas if user navigates with the forward or back buttons.
      window.addEventListener("popstate", function(event) {
        // If new canvas is loading b/c user navigated with back or forward buttons
        // we need to skip the `history.pushState()` call.
        _this.popStateEvent = true;
        var pathParts = document.location.pathname.split('/').reverse();
        var newCanvasID = document.location.protocol + '//' + document.location.host + '/iiif/' + pathParts[1] + '/canvas/' + pathParts[0];
        _this.eventEmitter.publish('SET_CURRENT_CANVAS_ID.' + _this.windowID, newCanvasID.replace(/%3A/g, ':'), this);
      });
    },

    //Search endpoint for all annotations with a given URI in options
    search: function(options, successCallback, errorCallback) {
      var linkContainer = document.getElementById("myLink");
      var link = document.createElement('a');
      var linkText = document.createTextNode(options.uri);
      link.href = options.uri;
      link.title = 'Stable link for canvas';
      link.appendChild(linkText);
      linkContainer.innerHTML='';
      linkContainer.appendChild(link);
      var _this = this;
      var volume = options.uri.split('/').reverse()[2];
      var page = options.uri.split('/').reverse()[0];
      // If the user navigated to the canvas using the back or forward buttons,
      // we don't want to mess with the state. Doing so would clear any forward states
      // and make the back only one canvas deep.
      // All we do if the load is due to a `popstate` event is reset flag for the
      // next switch.
      if (_this.popStateEvent) {
        _this.popStateEvent = false;
      } else {
        // If the new canvas load is due to the user using any of the Mirador
        // navigation, we need to update the location and history with the new
        // canvas id.
        history.pushState(history.state, '', page.replace(/:/g, '%3A'));
      }
      this.annotationsList = [];

      //use options.uri
      jQuery.ajax({
        url: '/iiif/v2/' + volume + '/list/' + page,
        type: 'GET',
        dataType: 'json',
        headers: { },
        data: { },
        contentType: "application/json; charset=utf-8",
        success: function(data) {
          //check if a function has been passed in, otherwise, treat it as a normal search
          if (typeof successCallback === "function") {
            // successCallback(data);
          } else {
            jQuery.each(data.resources, function(index, value) {
              if (value["@type"] !== 'cnt:ContentAsText') {                
                value.endpoint = _this;
                _this.annotationsList.push(value);
              }
            });
            _this.dfd.resolve(true);
            return _this.annotationsList;
          }
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
        url: '',
        type: 'DELETE',
        dataType: 'json',
        headers: {
          'X-CSRFToken': document.getElementsByName('csrfmiddlewaretoken')[0].value
        },
        contentType: "application/json; charset=utf-8",
        success: function(data) {
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
      console.log(oaAnnotation);
      var annotation = this.getAnnotationInEndpoint(oaAnnotation),
      _this = this;
      
      jQuery.ajax({
        url: '/iiif/annotations/' + oaAnnotation['@id'],
        type: 'POST',
        dataType: 'json',
        headers: {
          'X-CSRFToken': document.getElementsByName('csrfmiddlewaretoken')[0].value
        },
        data: JSON.stringify({ "oa_annotation": JSON.stringify(oaAnnotation) }),
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
      console.log(('oaAnnotation:', oaAnnotation));
      var _this = this;
      var canvas = oaAnnotation.on[0].full.split('/').reverse()[0];
      
      jQuery.ajax({
        url: '/iiif/canvas/' + oaAnnotation +'/annotation/new',
        type: 'POST',
        dataType: 'json',
        headers: {
          'X-CSRFToken': document.getElementsByName('csrfmiddlewaretoken')[0].value
        },
        data: JSON.stringify({ "oa_annotation": JSON.stringify(oaAnnotation) }),
        contentType: "application/json; charset=utf-8",
        success: function(data) {
          console.log('data', data);
          // if (typeof successCallback === "function") {
          //   successCallback(_this.getAnnotationInOA(data));
          // }
        },
        error: function(error) {
          console.log('error', error);
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
      console.log('AUTH!!!');
      return true;
    }
  };

}(Mirador));
