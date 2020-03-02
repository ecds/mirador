(function ($) {
  $.TextOverlay = function (options) {
    jQuery.extend(this, {
      name: 'TextOverlay',
      logoClass: 'fa-i-cursor',
      idPrefix: 'ocr_',
      tooltip: 'Select Text',
      useFontAwesome: true,
      osd: null,
      canvasID: null,
      words: [],
      wordOverlays: [],
      volume: null,
      page: null,
      eventEmitter: null,
      state: null,
      windowId: null,
      eventsSubscriptions: [],
      selecting: false,
      showTextOverlay: false,
      displayAnnotations: false,
      annotationCanvas: null,
      ocrOverlayContainer: null,
      annotationsList: null,
      highlightColor: '#00bfff'
    }, options);
    this.init();
  };

  $.TextOverlay.prototype = {
    init: function () {
      this.ocrContainer = document.getElementById('ocr')
      this.updateCanvasId();
      if (this.eventEmitter !== null) {
        this.listenForActions();
      }
    },

    updateCanvasId() {
      if (this.canvasID) {
        this.volume = this.canvasID.split('/').reverse()[2];
        this.page = this.canvasID.split('/').reverse()[0];
      }
    },

    addTextOverlay: function () {
      var _this = this;
      // TODO: this should not be needed or handled by the Readux endpoint
      jQuery.ajax({
        url: '/iiif/v2/' + _this.volume + '/list/' + _this.page,
        type: 'GET',
        dataType: 'json',
        headers: {},
        data: {},
        contentType: "application/json; charset=utf-8",
        success: function (data) {
          jQuery.each(data.resources, function (index, value) {
            // Things get out of sync when changing canvases. This check for an element with
            // the id is to make sure we don't add the word more than once.
            // TODO: add a class for the OCR spans. That way we can do a check for the class once
            // and skip the ajax call and the loop.
            // TODO: or, don't store the span in the database and create them on the fly here.
            if (value.resource["@type"] === 'cnt:ContentAsText' && !document.getElementById(value['@id'])) {
              jQuery(value.resource.chars).appendTo(_this.ocrContainer);
              var loc = value.on.selector.value.split('=')[1].split(',').map(function (i) {
                return parseInt(i);
              });
              var ocrEl = document.getElementById(value['@id']);
              ocrEl.style.width = 'auto';

              ocrEl.width = loc[2];

              var word = {
                element: ocrEl,
                location: new OpenSeadragon.Rect(loc[0], loc[1], loc[2], loc[3]),
                onDraw: function(position, size, element) {
                  /* 
                    Overrides OpenSeadragon.Overlay's `onDraw` function to scale
                    and rotate the OCR overlay elements.
                    This is where all the magic happens.
                  */
                  var style = this.style;
                  style.left = position.x + "px";
                  style.top = position.y + "px";
                  style.fontSize = `${size.y / 1.6}px`;
                  /*
                    When the Readux app creates the span elements for the OCR,
                    it includes a `data-letter-spacing` attribute. This is a
                    percentage of the initial calculated letter spacing of the
                    overall width of the element.
                    
                  */
                  style.letterSpacing = `${parseFloat(element.getAttribute('data-letter-spacing')) * size.x}px`;
                  if (this.width !== null) {
                      style.width = size.x + "px";
                  }
                  if (this.height !== null) {
                      style.height = size.y + "px";
                  }
                  var positionAndSize = this._getOverlayPositionAndSize(_this.osd.viewport);

                  var rotate = positionAndSize.rotate;
                  var transformOriginProp = OpenSeadragon.getCssPropertyWithVendorPrefix(
                      'transformOrigin');
                  var transformProp = OpenSeadragon.getCssPropertyWithVendorPrefix(
                      'transform');
                  if (transformOriginProp && transformProp) {
                      if (rotate) {
                          style[transformOriginProp] = this._getTransformOrigin();
                          style[transformProp] = "rotate(" + rotate + "deg)";
                      } else {
                          style[transformOriginProp] = "";
                          style[transformProp] = "";
                      }
                  }

                  if (style.display !== 'none') {
                      style.display = 'block';
                  }
                }
              };

              _this.words.push(word);

              var wordOverlay = _this.osd.addOverlay(word);
              _this.annotationCanvas = _this.osd.canvas.lastElementChild;
              ocrEl.parentElement.id = 'ocr-layer';

              _this.osd.updateOverlay(word);
              _this.wordOverlays.push(wordOverlay.currentOverlays[wordOverlay.currentOverlays.length - 1]);


            } else {
              // 
            }
          });
        },
        error: function (error) {
          if (typeof errorCallback === "function") {
            errorCallback();
          }
        }
      });
      this.loadAnnotations();
      return this.words;
    },

    dragHandler: function (event) {
      this.osd.setMouseNavEnabled(false);
      this.osd.gestureSettingsMouse.clickToZoom = false;
      this.osd.mouseNavEnabled = false;
      this.osd.panVertical = false;
      this.osd.panHorizontal = false;
    },

    enableSelecting() {
      setTimeout(() => {

        var _this = this;
        this.annotationCanvas.style.display = 'none';
        
        jQuery(_this.osd.canvas).css("cursor", "text");
        document.getElementById(_this.osd.id).classList.remove('no-select-ocr');
        
        this.osd.canvas.addEventListener('mousedown', event => {
          this.osd.setMouseNavEnabled(false);
          this.osd.gestureSettingsMouse.clickToZoom = false;
          this.osd.mouseNavEnabled = false;
          this.osd.panVertical = false;
          this.osd.panHorizontal = false;
        });
  
        this.osd.canvas.addEventListener('mouseup', event => {
          _this.annotationCanvas.style.display = 'block';
          let selection = window.getSelection();
          if (!selection.rangeCount) return;
          if (selection.anchorOffset == selection.focusOffset) return;
          let range = selection.getRangeAt(0);
          _this.textAnnotation = {
            range: range,
            words: []
          }
          range.cloneContents().querySelectorAll('span').forEach(word => {
            if (word.id) {
              _this.textAnnotation.words.push(word.id)
            }
          });
  
          if (_this.textAnnotation.words.length == 0) {
            _this.textAnnotation.words.push(range.startContainer.parentElement.id)
          }
          
          this.annoTooltip = new $.AnnotationTooltip({
            targetElement: jQuery(_this.osd.element),
            state: this.state,
            eventEmitter: this.eventEmitter,
            windowId: this.windowId
          });
          
          this.annoTooltip.initializeViewerUpgradableToEditor({
            container: document.getElementsByClassName('slot')[0],
            viewport: document.getElementsByClassName('slot')[0]
          });
          
          this.annoTooltip.showEditor({
            annotation: {},
            onSaveClickCheck: function () {
              return _this.textAnnotation.words.length;
            },
            onTextAnnotationCreated: function (oaAnno) {
              // TODO: Maybe move `constructItem` to the write strategy `buildAnnotation`
              _this.ocrTextAnnotation = new $.OcrTextAnnotation(
                {
                  textAnnotation: _this.textAnnotation,
                  oaAnno: oaAnno,
                  canvasId: _this.state.getWindowObjectById(_this.windowId),
                  overlay: _this,
                  viewer: _this.osd,
                  eventEmitter: _this.eventEmitter,
                  state: _this.state,
                  highlightColor: _this.highlightColor
                }
              );
              selection.empty();
              _this.eventEmitter.publish('onTextAnnotationCreated.' + _this.windowId, [_this.ocrTextAnnotation.oaAnno]);
            },
          });
        });
      }, 500);
    },

    // The delay argument is passed to textAnno. It sets the timeout
    // for adding the text annotations. It has to wait for the OCR
    // spans to be added to the DOM. :(
    loadAnnotations: function(delay=1000) {
      var _this = this;
      
      if (this.annotationsList) {
        this.annotationsList.forEach(function(oaAnno) {
          if (oaAnno.on && oaAnno.on instanceof Array) {
            oaAnno.on = oaAnno.on[0];
          }
          if (oaAnno && oaAnno.on && oaAnno.on.selector && oaAnno.on.selector.item['@type'] === 'RangeSelector') {
            var textAnno = new $.OcrTextAnnotation();
            textAnno.viewer = _this.osd;
            textAnno.eventEmitter = _this.eventEmitter;
            textAnno.oaAnno = oaAnno;
            textAnno.state = _this.state;
            textAnno.windowId = _this.windowId;
            textAnno.parseOaAnno(delay);
          }
        });
      }
    },

    removeTextOverlay: function () {
      var _this = this;
      if (this.words.length > 0) {
        this.words.forEach(function (word, index) {
          _this.osd.removeOverlay(word.element.id);
          if (document.getElementById(word.element.id)) {
            document.getElementById(word.element.id).remove();
          }
        });
        _this.words = [];
      }
      if (this.wordOverlays.length > 0) {
        this.wordOverlays.forEach(function (wordOverlay) {
          wordOverlay.destroy();
        });
        _this.wordOverlays = [];
      }
    },

    listenForActions: function () {
      var _this = this;

      this.eventsSubscriptions.push(_this.eventEmitter.subscribe('refreshOverlay.' + _this.windowId, function (event) {
        if (_this.showTextOverlay) {
          _this.loadAnnotations(500);
        }
      }));
      
      this.eventsSubscriptions.push(_this.eventEmitter.subscribe('modeChange.' + _this.windowId, function (event, mode) {
        if (mode === 'displayAnnotations' && !_this.showTextOverlay) {
          _this.showTextOverlay = true;
          _this.addTextOverlay();
          _this.loadAnnotations();
          document.getElementById(_this.osd.id).classList.remove('hide-annotations');
        } else if (mode === 'default' && _this.showTextOverlay) {
          document.getElementById(_this.osd.id).classList.add('hide-annotations');
          _this.showTextOverlay = false;
        }

      }));

      this.eventsSubscriptions.push(_this.eventEmitter.subscribe('toggleDrawingTool.' + _this.windowId, function (event, tool) {

        if (!tool) {
          _this.selecting = true;
          _this.enableSelecting()
        } else {
          _this.selecting = false;
        }
      }));

      this.eventsSubscriptions.push(_this.eventEmitter.subscribe('changeBorderColor.' + _this.windowId, function (event, color) {
        _this.highlightColor = color;
      }));

      this.eventsSubscriptions.push(_this.eventEmitter.subscribe('SET_CURRENT_CANVAS_ID.' + _this.windowId, function (event, canvasID) {
        _this.canvasID = canvasID;
        _this.removeTextOverlay();
        _this.updateCanvasId();
      }));

      this.eventsSubscriptions.push(_this.eventEmitter.subscribe('onTextAnnotationCreated.' + _this.windowId, function (event, oaAnno) {
        // save to endpoint
        _this.eventEmitter.publish('annotationCreated.' + _this.windowId, [oaAnno, function () {
          // stuff that needs to be called after the annotation has been created on the backend
          // return to pointer mode
          _this.inEditOrCreateMode = false;

          _this.eventEmitter.publish('SET_STATE_MACHINE_POINTER.' + _this.windowId);

          // re-enable viewer tooltips
          _this.eventEmitter.publish('enableTooltips.' + _this.windowId);

          // _this.clearDraftData();
          _this.annoTooltip = null;
          _this.annoEditorVisible = false;
        }]);


      }));
    },

    updateSelection: function () {},

    onHover: function () {},

    onMouseUp: function () {},

    translate: function () {},

    rotate: function () {},

    onMouseDrag: function () {},

    onResize: function () {},

    onMouseMove: function () {},

    setCursor: function () {},

    onMouseDown: function () {},

    onDoubleClick: function () {},

    destroy: function () {
      var _this = this;
      this.words = [];
      this.eventsSubscriptions.forEach(function (event) {
        _this.eventEmitter.unsubscribe(event.name, event.handler);
      });
    },

    // constructItem() {
    //   let words = this._copy(this.textAnnotation.words);
    //   let startElementId = words[0]
    //   let endElementId = document.getElementById(words.reverse()[0]).nextElementSibling.id
    //   return {
    //     "@type": "RangeSelector",
    //     startSelector: {
    //         "@type": "XPathSelector",
    //         value: `//*[@id='${startElementId}']`,
    //         refinedBy : {
    //             "@type": "TextPositionSelector",
    //             start: this.textAnnotation.range.startOffset
    //         }
    //     },
    //     endSelector: {
    //         "@type": "XPathSelector",
    //         value: `//*[@id='${endElementId}']`,
    //         refinedBy : {
    //             "@type": "TextPositionSelector",
    //             end: this.textAnnotation.range.endOffset
    //         }
    //     }
    //   }
    // },

    // handelStart(wordElement, offset) {
    //   if (!wordElement) return;
    //   const wordSpan = document.getElementById(wordElement);
    //   const word = wordSpan.innerText;
    //   const link = this.createLink();
    //   link.innerText = word.slice(offset, word.length);
    //   wordSpan.innerHTML = `${word.slice(0, offset)}`;
    //   wordSpan.append(link);
    // },
    
    // handelEnd(wordElement, offset) {
    //   if (!wordElement) return;
    //   const wordSpan = document.getElementById(wordElement);
    //   const word = wordSpan.innerText;
    //   const link = this.createLink();
    //   link.innerText = word.slice(0, offset);
    //   wordSpan.innerHTML = word.slice(offset, word.length);
    //   wordSpan.prepend(link);
    // },
    
    // handelPart(wordElement, range) {
    //   const wordSpan = document.getElementById(wordElement);
    //   const word = wordSpan.innerText;
    //   const link = this.createLink();
    //   const start = word.slice(0, range.startOffset);
    //   const end = word.slice(range.endOffset, word.length);
    //   link.innerText = word.slice(range.startOffset, range.endOffset);
    //   wordSpan.innerHTML = start;
    //   wordSpan.append(link);
    //   wordSpan.append(end);
    // },
    
    uuidv4() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },
    
    // createLink() {
    //   const link = document.createElement('a');
    //   link.setAttribute('href', '#');
    //   link.setAttribute('data-id', this.uuid);
    //   link.setAttribute('title', this.uuid);
    //   link.className += this.uuid;
    //   return link;
    // },
    
    // wrapWord(id) {
    //   const wordSpan = document.getElementById(id);
    //   const word = wordSpan.innerText;
    //   const link = this.createLink();
    //   link.innerText = word;
    //   wordSpan.innerHTML = '';
    //   wordSpan.append(link);
    // },

    _copy(array) {
      let copy = [];
      array.forEach(a => {
        copy.push(a);
      });
      return copy;
    },

    _hexToRgb(hex) {
      let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      let rgb = result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 255, g: 20, b: 147 }
      return `rgba(${r}, ${g}, ${b}, 0.5)`
    }

  };
}(Mirador));