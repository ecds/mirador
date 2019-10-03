(function ($) {
  $.MiradorOcrStrategy = function (options) {
    jQuery.extend(this, {

    }, options);
    this.init();
  };

  $.MiradorOcrStrategy.prototype = {
    init: function () {

    },

    // Check whether an annotation is supported under this formatting strategy
    isThisType: function (annotation) {
      if (annotation.resource['@type'] === 'cnt:ContentAsText' &&
          annotation.on.selector.item) {
        return annotation;
      }
      return false;
    },

    // Parse the annotation into the OsdRegionDrawTool instance (only if its format is supported by this strategy)
    parseRegion: function (annotation) {
      if (this.isThisType(annotation)) {
        return [annotation];
      }
    }
  };
}(Mirador));