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
(function($) {

  $.ReaduxEndpoint = function(options) {

    jQuery.extend(this, {
      dfd:             null,
      annotationsList: [],
      windowID:        null,
      eventEmitter:    null
    }, options);

    this.init();
  };

  $.ReaduxEndpoint.prototype = {
    init: function() {},

    // Search endpoint for all annotations with a given URI in options
    search: function(options, successCallback, errorCallback) {
      var _this = this;
      _this.volume = options.uri.split('/').reverse()[2];
      _this.page = options.uri.split('/').reverse()[0];
      this.annotationsList = [];

      this.getAnnotationList();
    },
    
    // Delete an annotation by endpoint identifier
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
    
    // Update an annotation given the OA version
    update: function(oaAnnotation, successCallback, errorCallback) {
      delete oaAnnotation.endpoint;
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
          oaAnnotation.endpoint = _this;
        },
        error: function() {
          if (typeof errorCallback === "function") {
            errorCallback();
          }
        }
      });
    },

    // takes OA Annotation, gets Endpoint Annotation, and saves
    // if successful, MUST return the OA rendering of the annotation
    create: function(oaAnnotation, successCallback, errorCallback) {
      var _this = this;
      var keys = [];

      jQuery.each(oaAnnotation.on, function(index, value) {
        if (jQuery.inArray(value.full, keys) === -1) {
          keys.push(value.full);
        }
      });

      if (keys.length === 0) {
        if (typeof errorCallback === "function") {
          errorCallback();
        }
      }

      oaAnnotation.annotatedBy = { name: 'Me' };
      _this.annotationsList.push(oaAnnotation);

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
          data.oa_annotation.endpoint = _this;
          successCallback(data.oa_annotation);
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

    userAuthorize: function(action, annotation) {
      return !0;
    },

    getAnnotationList: function() {
      var _this = this;

      //use options.uri
      jQuery.ajax({
        url: '/readux/annotations/' + _this.volume + '/' + _this.page,
        type: 'GET',
        dataType: 'json',
        headers: { },
        data: { },
        contentType: "application/json; charset=utf-8",
        success: function(data) {
          jQuery.each(data, function(index, value) {
            value.oa_annotation.endpoint = _this;
            _this.annotationsList.push(value.oa_annotation);
          });
          _this.dfd.resolve(true);
        },
        error: function() {
          //
        }
      });
    }
  };
}(Mirador));
