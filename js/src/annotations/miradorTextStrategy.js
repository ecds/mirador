(function ($) {
  $.MiradorTextStrategy = function (options) {
    jQuery.extend(this, {

    }, options);
    this.init();
  };

  $.MiradorTextStrategy.prototype = {
    init: function () {

    },

    // Check whether an annotation is supported under this formatting strategy
    isThisType: function (annotation) {
      if (annotation.on && annotation.on instanceof Array) {
        annotation.on = annotation.on[0];
      }
      if (annotation.on.selector.item &&
        annotation.on.selector.item['@type'] === 'RangeSelector') {
          return true;
      }
    },

    // Parse the annotation into the OsdRegionDrawTool instance (only if its format is supported by this strategy)
    parseRegion: function (annotation, osdRegionDrawTool) {
      if (this.isThisType(annotation)) {
        return annotation.on.selector.item;
      }
    }
  };
}(Mirador));