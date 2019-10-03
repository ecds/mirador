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
        console.log("TCL: options", options)
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
        console.log("TCL: listenForActions -> oaAnno", oaAnno)
      }));
      
      this.eventsSubscriptions.push(_this.eventEmitter.subscribe('updateTooltips.' + _this.windowId, function (event, location, absoluteLocation) {
      // console.log("TCL: listenForActions -> event", event)
        if (_this.annoToolTip && !_this.annoToolTip.inEditOrCreateMode) {
          _this.showTooltipsFromMousePosition(event, location, absoluteLocation);
        }
      }));

      this.eventsSubscriptions.push(_this.eventEmitter.subscribe('annotationEditSave.' + _this.windowId, function (event, oaAnno) {
        if (oaAnno.on.selector.item['@type'] != 'RangeSelector') return;
        var onAnnotationSaved = jQuery.Deferred();
        _this.eventEmitter.publish('annotationUpdated.' + _this.windowId, [oaAnno]);
        onAnnotationSaved.resolve();
        jQuery.when(onAnnotationSaved.promise()).then(function () {
          _this.inEditOrCreateMode = false;
          _this.eventEmitter.publish('SET_STATE_MACHINE_POINTER.' + _this.windowId);
          _this.annoToolTip = new $.AnnotationTooltip({
            targetElement: jQuery(_this.viewer.element),
            state: _this.state,
            eventEmitter: _this.eventEmitter,
            windowId: _this.windowId,
            isTextAnno: true,
            textAnno: oaAnno
          });
          // _this.annoToolTip.inEditOrCreateMode = false;
          // _this.eventEmitter.publish('SET_OVERLAY_TOOLTIP.' + _this.windowId, { tooltip: null, visible: false, paths: [] })
          // _this.eventEmitter.publish('enableTooltips.' + _this.windowId);
          // _this.eventEmitter.publish('annotationEditSaveSuccessful.' + _this.windowId);
          // // _this.eventEmitter.publish('SET_ANNOTATION_EDITING.' + _this.windowId, {
          // //   annotationId: oaAnno['@id'],
          // //   isEditable: false,
          // //   tooltip: _this
          // // });
          // // _this.annoToolTip = null;
          // _this.annoEditorVisible = false;
          // _this.inEditOrCreateMode = false;
        }, function () {
          // confirmation rejected don't do anything
        // });
          // console.log(oaAnno.on.selector.item['@type'], _this.annoToolTip)
        });
      }));


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
            // track whether the cursor is within the tooltip (with the specified tolerance) and disables show/hide/update functionality.
            // if (api.elements.tooltip) {
            //     var cursorWithinTooltip = true;
            //     var leftSide = api.elements.tooltip.offset().left;
            //     var rightSide = api.elements.tooltip.offset().left + api.elements.tooltip.width();
            //     if (absoluteLocation.x < leftSide || rightSide < absoluteLocation.x) {
            //         cursorWithinTooltip = false;
            //       }
            //       var topSide = api.elements.tooltip.offset().top;
            //       var bottomSide = api.elements.tooltip.offset().top + api.elements.tooltip.height();
            //       if (absoluteLocation.y < topSide || bottomSide < absoluteLocation.y) {
            //           cursorWithinTooltip = false;
            //         }
            //         return !cursorWithinTooltip;
            //       }
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
        console.log("TCL: parseOaAnno -> this.oaAnno.on.selector.value", this.oaAnno.on.selector.value)
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
        
        // If selection begins with the the first OCR element, there will be no
        // `previousToStart`.
        if (previousToStart) {
          range = jQuery(`#${previousToStart.id}`).nextUntil(`#${end.id}`, 'span');
        } else {
          range = jQuery(`#${start.id}`).nextUntil(`#${end.id}`, 'span');
          range.prepend(jQuery(start));
        }
        console.log("TCL: parseOaAnno -> range", range)
        range.each(function(word){words.push(range.get(word).id)});
        // let words = this._copy(jQuery(`#${start.id}`).nextUntil(`#${end.id}`));
        let startOffset = this.oaAnno.on.selector.item.startSelector.refinedBy.start;
        let endOffset = this.oaAnno.on.selector.item.endSelector.refinedBy.end;
        this._insertLinks(words, startOffset, endOffset);
      }, timeout);
    },

    parseTextAnno() {
      console.log('parse', this.oaAnno);
      let words = this._copy(this.textAnnotation.words);
      let startOffset = this.textAnnotation.range.startOffset;
      let endOffset = this.textAnnotation.range.endOffset;
      this._insertLinks(words, startOffset, endOffset);
    },

    _insertLinks(selectedWords, startOffset, endOffset) {
      if (selectedWords.length == 0) return;
      if (selectedWords.length == 1) {
        this._handelPart(selectedWords.pop(), { startOffset, endOffset });
        // _this.handelEnd(selectedWords.pop(), _this.textAnnotation.range.endOffset);  
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
      let endElementId = document.getElementById(words.reverse()[0]).nextElementSibling.id
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
      link.addEventListener('mouseover', event => {
      console.log('TOOLTIP', this.annoToolTip);
    });
    // link.addEventListener('mouseleave', event => { console.log('mouse left')})
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