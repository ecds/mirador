(function ($) {
  $.OcrTextAnnotation = function (options) {
    jQuery.extend(this, {
      textAnnotation: null,
      oaAnno: null,
      canvasId: null,
      eventEmitter: null,
      eventsSubscriptions: [],
      overlay: null,
      uuid: null,
      state: null,
      windowId: null,
      viewer: null,
      links: [],
      boundingBoxes: []
    }, options);
    this.init(options);
  };

  $.OcrTextAnnotation.prototype = {
    init: function (options) {
      if (options) {
        this.textAnnotation = options.textAnnotation;
        this.oaAnno = options.oaAnno;
        this.canvasId = options.canvasId;
        this.overlay = options.overlay;
        this.uuid = this._uuidv4();
        this.oaAnno.item = this._constructItem();
        this.oaAnno['@id'] = this.uuid;
        this.eventEmitter = options.eventEmitter;
        this.parseTextAnno();
        this.listenForActions();
      }
    },

    listenForActions() {
      let _this = this;
      this.eventsSubscriptions.push(_this.eventEmitter.subscribe('onAnnotationCreated.' + _this.windowId, function (event, oaAnno) {
      }));
      
      this.eventsSubscriptions.push(_this.eventEmitter.subscribe('updateTooltips.' + _this.windowId, function (event, location, absoluteLocation) {
        // if (_this.annoToolTip && !_this.annoToolTip.inEditOrCreateMode) {
          _this.showTooltipsFromMousePosition(event, location, absoluteLocation);
        // }
      }));

      this.eventsSubscriptions.push(_this.eventEmitter.subscribe('annotationEditSave.' + _this.windowId, function (event, oaAnno) {
      console.log("TCL: listenForActions -> oaAnno", oaAnno)
        if (_this.annoToolTip) {
          _this.annoToolTip.inEditOrCreateMode = false;
        }
        if ((oaAnno.on instanceof Array && oaAnno.on[0].selector.item['@type'] != 'RangeSelector') || (oaAnno.on instanceof Object && oaAnno.on.selector && oaAnno.on.selector.item['@type'] != 'RangeSelector')) return;
        console.log('it is a text anno')
        // if (oaAnno.on.selector.item['@type'] != 'RangeSelector') return;
        _this.inEditOrCreateMode = false;
        var onAnnotationSaved = jQuery.Deferred();
        _this.eventEmitter.publish('annotationUpdated.' + _this.windowId, [oaAnno]);
        onAnnotationSaved.resolve();
        jQuery.when(onAnnotationSaved.promise()).then(function () {
          _this.eventEmitter.publish('SET_STATE_MACHINE_POINTER.' + _this.windowId);
 
        }, function () {
          // confirmation rejected don't do anything
        // });
          // console.log(oaAnno.on.selector.item['@type'], _this.annoToolTip)
        });
      }));

      // this.eventsSubscriptions.push(this.eventEmitter.subscribe('ANNOTATIONS_LIST_UPDATED', function (event, options) {
      // }));


      var _updateSizeLocation = function() { _this.updateSizeLocation()}

      this.viewer.addHandler('animation', _updateSizeLocation());
      this.viewer.addHandler('animation-finish', _updateSizeLocation());
      this.viewer.addHandler('update-viewport', _updateSizeLocation());
      this.viewer.addHandler('resize', _updateSizeLocation());
      this.viewer.addHandler('constrain', _updateSizeLocation());
},

    showTooltipsFromMousePosition(event, location, absoluteLocation) {
      // if (this.links.length > 0) {
        // console.log('link', this.links);
      // }
      if (this._in_boundingBox(absoluteLocation)) {
        this.annoToolTip.showViewer({
          annotations: [this.oaAnno],
          triggerEvent: event,
          isTextAnno: true,
          shouldDisplayTooltip: api => {
            return this.inEditOrCreateMode;
          }
              });
      }
      
    },

    updateSizeLocation(event) {
      // console.log('Update Size and Location', event);
    },

    parseOaAnno(timeout=0) {
      // I don't like this timeout, but we have to wait for the OCR spans
      // to be added before we can add the text annotations.
      // This is only a problem when navigating between canvases with annotations
      // showing.
      setTimeout(() => {
        this.uuid = this.oaAnno['@id'];
        if (this.oaAnno.on instanceof Array) {
          this.oaAnno.on = this.oaAnno.on[0];
        }
        this._setBoundingBox(this.oaAnno.on.selector.value);
        this.annoToolTip = new $.AnnotationTooltip({
          targetElement: jQuery(this.viewer.element),
          state: this.state,
          eventEmitter: this.eventEmitter,
          windowId: this.windowId,
          isTextAnno: true,
          textAnno: this.oaAnno
        });

        var windowElement = this.state.getWindowElement(this.windowId);

        this.annoToolTip.initializeViewerUpgradableToEditor({
          container: windowElement,
          viewport: windowElement
        });
      
        this.listenForActions();

        let start = document.evaluate(
          this.oaAnno.on.selector.item.startSelector.value,
          document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
          ).singleNodeValue;

        let end = document.evaluate(
          this.oaAnno.on.selector.item.endSelector.value,
          document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
          ).singleNodeValue;

        if (!start && !end) return;
        
        let range = null;
        let words = [];
        
        let previousToStart = start.previousElementSibling;
        let ocrLayer = jQuery('#ocr-layer');
        
        if (previousToStart) {
            range = jQuery(`#${previousToStart.id}`).nextUntil(`#${end.id}`, 'span');
          } else {
            range = jQuery(`#${start.id}`).nextUntil(`#${end.id}`, 'span');
          }
        
        range.each(function(word){words.push(range.get(word).id)});
        
        if (start.id == ocrLayer.children('span').first().attr('id')) {
          words.push(start.id);
        } else if (end.id == ocrLayer.children('span').last().attr('id')) {
          words.push(end.id);
        }
        let startOffset = this.oaAnno.on.selector.item.startSelector.refinedBy.start;
        let endOffset = this.oaAnno.on.selector.item.endSelector.refinedBy.end;
        this._insertLinks(words, startOffset, endOffset);
      }, timeout);
    },

    parseTextAnno() {
      let words = this._copy(this.textAnnotation.words);
      let startOffset = this.textAnnotation.range.startOffset;
      let endOffset = this.textAnnotation.range.endOffset;
      this._insertLinks(words, startOffset, endOffset);
      setTimeout(() => {
        if (this.oaAnno.on && this.oaAnno.on instanceof Array) {
          this.oaAnno.on = this.oaAnno.on[0];
        }
        this._setBoundingBox(this.oaAnno.on.selector.item.value);
        this.annoToolTip = new $.AnnotationTooltip({
          targetElement: jQuery(this.viewer.element),
          state: this.state,
          eventEmitter: this.eventEmitter,
          windowId: this.windowId,
          isTextAnno: true,
          textAnno: this.oaAnno,
          inEditOrCreateMode: false
        });
        var windowElement = this.state.getWindowElement(this.windowId);
  
        this.annoToolTip.initializeViewerUpgradableToEditor({
          container: windowElement,
          viewport: windowElement
        });

        this.links.forEach(link => {
          jQuery(link).mousemove( event => {
            this.showTooltipsFromMousePosition(event, {x: event.pageX, y: event.pageY}, {x: event.pageX, y: event.pageY})
          })
        })
      }, 1000);
    },

    _insertLinks(selectedWords, startOffset, endOffset) {
      if (selectedWords.length == 0) return;
      if (selectedWords.length == 1) {
        this._handelPart(selectedWords.pop(), { startOffset, endOffset });
      } else {
        this._handelStart(selectedWords.shift(), startOffset);
        this._handelEnd(selectedWords.pop(), endOffset);
      }
      if (selectedWords.length > 0) {
        selectedWords.forEach(wordElement => {
          this._wrapWord(wordElement);
        });
        if (startOffset != 0 || endOffset != document.getElementById(selectedWords[0]).innerText.length) {
          // console.log('PART!!!!')
          // this.handelPart(this.textAnnotation.range);
        }
      } else {
        // console.log('WHOLE!!!!')
        // this.wrapWord(this.textAnnotation.range.startContainer.parentElement.id);
      }

      if (!this.oaAnno.on) {
        var writeStrategy = new $.MiradorDualStrategy();
        writeStrategy.buildAnnotation({
          annotation: this.oaAnno,
          window: this.canvasId,
          overlay: this.overlay
        });
      }
    },

    _deconstructItem() {
      //
    },

    _constructItem() {
      // console.log('this.textAnnotation', this.textAnnotation);
      let words = this._copy(this.textAnnotation.words);
      let startElementId = words[0]
      let endElementId = null;
      let lastSelected = document.getElementById(words.reverse()[0]);
      if (lastSelected.nextElementSibling) {
        endElementId = lastSelected.nextElementSibling.id;
      } else {
        endElementId = lastSelected.id;
      }
      return {
        "@type": "RangeSelector",
        startSelector: {
            "@type": "XPathSelector",
            value: `//*[@id='${startElementId}']`,
            refinedBy : {
                "@type": "TextPositionSelector",
                start: this.textAnnotation.range.startOffset
            }
        },
        endSelector: {
            "@type": "XPathSelector",
            value: `//*[@id='${endElementId}']`,
            refinedBy : {
                "@type": "TextPositionSelector",
                end: this.textAnnotation.range.endOffset
            }
        }
      }
    },

    _handelStart(wordElement, offset) {
      if (!wordElement) return;
      const wordSpan = document.getElementById(wordElement);
      // console.log('wordSpan', wordSpan);
      const word = wordSpan.innerText;
      const link = this._createLink();
      // console.log('link', link);
      link.innerText = word.slice(offset, word.length);
      // console.log('link', link);
      wordSpan.innerHTML = `${word.slice(0, offset)}`;
      wordSpan.append(link);
    },
    
    _handelEnd(wordElement, offset) {
      if (!wordElement) return;
      const wordSpan = document.getElementById(wordElement);
      const word = wordSpan.innerText;
      const link = this._createLink();
      link.innerText = word.slice(0, offset);
      wordSpan.innerHTML = word.slice(offset, word.length);
      wordSpan.prepend(link);
    },
    
    _handelPart(wordElement, range) {
      const wordSpan = document.getElementById(wordElement);
      const word = wordSpan.innerText;
      const link = this._createLink();
      const start = word.slice(0, range.startOffset);
      const end = word.slice(range.endOffset, word.length);
      link.innerText = word.slice(range.startOffset, range.endOffset);
      // console.log('LINK', link);
      wordSpan.innerHTML = start;
      wordSpan.append(link);
      wordSpan.append(end);
      // console.log('wordSpan', wordSpan);
    },
    
    _uuidv4() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },
    
    _createLink() {
      const link = document.createElement('a');
      // this.linkId = this._uuidv4();
      link.setAttribute('href', '#');
      link.setAttribute('data-id', this.uuid);
      link.setAttribute('title', this.uuid);
      this.links.push(link);
      return link;
    },
    
    _wrapWord(id) {
      const wordSpan = document.getElementById(id);
      // console.log(wordSpan);
      const word = wordSpan.innerText;
      // console.log(word);
      const link = this._createLink();
      link.innerText = word;
      // console.log(link);
      wordSpan.innerHTML = '';
      wordSpan.append(link);
    },

    _copy(words) {
      let copy = [];
      words.forEach(word => {
        copy.push(word);
      });
      return copy;
    },

    _setBoundingBox(value) {
      // parse the value to an array of ints.
      let boxes = []
      if (this.links.length > 0) {
        this.links.forEach(link => {
          boxes.push(link.getBoundingClientRect());
        })
      }
      this.boundingBoxes = boxes;
      // let [x, y, w, h] = value.split('=')[1].split(',').map(function(x) { return parseInt(x, 10) })
      // console.log(x,y,w,h)
      // this.boundingBox = {
      //   a: x,
      //   b: x + w,
      //   c: y,
      //   d: y + h
      // }
    },

    _in_boundingBox(point) {
      this._setBoundingBox();
      if (this.boundingBoxes.length == 0) return;
      // if (this.uuid) {
      //   let links = querySelectorAll
      // }
      let {x, y} = point;
      hits = [];
      // let { a, b, c, d } = this.boundingBox;
      // return (a <= x ) && ( x <= b) && (c <= y) && (y <= d);
      this.boundingBoxes.forEach(box => {
        hits.push(box.x <= x && x <= box.x + box.width &&
               box.y <= y && y <= box.y + box.height)
      });
      return hits.includes(true);
    }
  }
}(Mirador));