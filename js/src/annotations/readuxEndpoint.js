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
      eventEmitter:    null
    }, options);

    this.init();
  };

  $.ReaduxEndpoint.prototype = {
    init: function() {
      //whatever initialization your endpoint needs       
    },

    //Search endpoint for all annotations with a given URI in options
    search: function(options, successCallback, errorCallback) {
      var _this = this;
      var volume = options.uri.split('/').reverse()[2];
      var page = options.uri.split('/').reverse()[0];
      this.annotationsList = [];

      //use options.uri
      jQuery.ajax({
        url: '/readux/annotations/' + volume + '/' + page,
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
            jQuery.each(data, function(index, value) {
            value.oa_annotation.endpoint = _this;
            _this.annotationsList.push(value.oa_annotation);
            });
            console.log(_this.annotationsList);
            _this.dfd.resolve(true);
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
        url: '/readux/annotations/' + annotationID,
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
      // var annotation = this.getAnnotationInEndpoint(oaAnnotation),
      _this = this;
      
      jQuery.ajax({
        url: '/readux/annotations/' + oaAnnotation['@id'],
        type: 'PUT',
        dataType: 'json',
        headers: {
          'X-CSRFToken': document.getElementsByName('csrfmiddlewaretoken')[0].value
        },
        data: JSON.stringify({ "iiif_annotation": JSON.stringify(oaAnnotation) }),
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
      console.log('before pus: ', _this.annotationsList);
      jQuery.ajax({
        url: '/readux/annotations',
        type: 'POST',
        dataType: 'json',
        headers: {
          'X-CSRFToken': document.getElementsByName('csrfmiddlewaretoken')[0].value
        },
        data: JSON.stringify({ "iiif_annotation": JSON.stringify(oaAnnotation) }),
        contentType: "application/json; charset=utf-8",
        success: function(data) {
          console.log('data', data);
          // if (typeof successCallback === "function") {
          //   successCallback(_this.getAnnotationInOA(data));
          // } else {
          data.oa_annotation.endpoint = _this;
          _this.annotationsList.push(data.oa_annotation);
          console.log('after push: ', _this.annotationsList);
          _this.dfd.resolve(true);
          // _this.search({ uri: data.oa_annotation.on[0].full }, null, null);
      // }
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
    }
  };

}(Mirador));
