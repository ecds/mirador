(function ($) {
  $.TextOverlay = function (options) {
    jQuery.extend(this, {
      name: 'TextOverlay',
      logoClass: 'text_format',
      idPrefix: 'ocr_',
      tooltip: 'ocrTooltip',
      osd: null,
      canvasID: null,
      words: [],
      wordOverlays: [],
      volume: null,
      page: null,
      eventEmitter: null,
      state: null,
      annotationState: null,
      windowId: null,
      eventsSubscriptions: [],
      selecting: false,
      showTextOverlay: false,
      displayAnnotations: false,
      annotationCanvas: null,
      ocrOverlayContainer: null
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
              jQuery(value.on[0].selector.item.value).appendTo(_this.ocrContainer);
              var loc = value.on[0].selector.default.value.split('=')[1].split(',').map(function (i) {
                return parseInt(i);
              });
              var ocrEl = document.getElementById(value['@id']);
              // _this.words.push(ocrEl);
              ocrEl.style.width = 'auto';
              ocrEl.style.letterSpacing = (ocrEl.offsetWidth) / (ocrEl.innerText.length + 1) + 'px';

              ocrEl.width = loc[2];

              var word = {
                element: ocrEl,
                location: new OpenSeadragon.Rect(loc[0], loc[1], loc[2], loc[3])
              };

              _this.words.push(word);

              var wordOverlay = _this.osd.addOverlay(word);
              console.log('wordOverlay', ocrEl);
              // if (index === 0) {
              // _this.osd.canvas = ocrEl.parentElement;
              _this.annotationCanvas = _this.osd.canvas.lastElementChild;
              console.log('annoCanv', _this.osd.canvas.lastElementChild);
              // }

              // _this.osd.updateOverlay(word);
              _this.wordOverlays.push(wordOverlay.currentOverlays[wordOverlay.currentOverlays.length - 1]);


            }
          });
        },
        error: function (error) {
          if (typeof errorCallback === "function") {
            errorCallback();
          }
        }
      });

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
      var _this = this;
      // Just a reminder. Will probably never need this.
      // document.addEventListener('selectionchange', event => {
      //   console.log('Selection changed.'); 
      // });
      this.annotationCanvas.style.display = 'none';
      
      jQuery(_this.osd.canvas).css("cursor", "text");
      
      this.osd.canvas.addEventListener('mousedown', event => {
        this.osd.setMouseNavEnabled(false);
        this.osd.gestureSettingsMouse.clickToZoom = false;
        this.osd.mouseNavEnabled = false;
        this.osd.panVertical = false;
        this.osd.panHorizontal = false;
      });

      this.osd.canvas.addEventListener('mouseup', event => {
        _this.annotationCanvas.style.display = 'block';
        let selected = window.getSelection().getRangeAt(0);
        let textAnnotation = {
          range: window.getSelection(),
          words: []
        }
        selected.cloneContents().querySelectorAll('span').forEach(event => {
          if (event.id) {
            textAnnotation.words.push(event.id)
            console.log('ocr', event.id, event.innerText)
          }
        });

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
            return textAnnotation.words.length;
          },
          onAnnotationCreated: function (oaAnno) {
            _this.eventEmitter.publish('onAnnotationCreated.' + _this.windowId, [oaAnno]);
          },
          onEditFinish: function () {
            var _this = this;
            jQuery.each(this.draftPaths, function (index, value) {
              if (_this.path.name === value.name) {
                _this.draftPaths[index] = _this.path;
              }
            });
          },
        });
      });
      _this.words.forEach(function (word) {
      });
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
        // placeholder
      }));

      this.eventsSubscriptions.push(_this.eventEmitter.subscribe('modeChange.' + _this.windowId, function (event, mode) {
        if (mode === 'displayAnnotations' && !_this.showTextOverlay) {
          _this.showTextOverlay = true;
          _this.addTextOverlay();
        } else if (mode === 'default' && _this.showTextOverlay) {
          // placeholder
        }

      }));

      this.eventsSubscriptions.push(_this.eventEmitter.subscribe('toggleDrawingTool.' + _this.windowId, function (event, tool) {
        console.log('mouse enabled toggle tool', _this.osd.isMouseNavEnabled(), tool);

        if (tool === _this.logoClass) {
          _this.selecting = true;

          // setTimeout(function(){_this.enableSelecting()}, 1000);
          _this.enableSelecting()
        }
      }));

      this.eventsSubscriptions.push(_this.eventEmitter.subscribe('windowUpdated.' + _this.windowId, function (event, tool) {
        if (_this.annotationState === 'on') {
          // _this.addTextOverlay();
        }
      }));

      this.eventsSubscriptions.push(_this.eventEmitter.subscribe('SET_CURRENT_CANVAS_ID.' + _this.windowId, function (event, canvasID) {
        _this.canvasID = canvasID;
        console.log('change canvas');
        _this.removeTextOverlay();
        _this.updateCanvasId();
      }));

      this.eventsSubscriptions.push(_this.eventEmitter.subscribe('onAnnotationCreated.' + _this.windowId, function (event, oaAnno) {
        // should remove the styles added for newly created annotation
        for (var i = 0; i < _this.draftPaths.length; i++) {
          if (_this.draftPaths[i].data && _this.draftPaths[i].data.newlyCreated) {
            _this.draftPaths[i].strokeWidth = _this.draftPaths[i].data.strokeWidth; // TODO: removed newlyCreatedStrokeFactor stuff here
            delete _this.draftPaths[i].data.newlyCreated;
            delete _this.draftPaths[i].data.newlyCreatedStrokeFactor;
          }
        }

        var writeStrategy = new $.MiradorDualStrategy();
        writeStrategy.buildAnnotation({
          annotation: oaAnno,
          window: _this.state.getWindowObjectById(_this.windowId),
          overlay: _this
        });

        // save to endpoint
        _this.eventEmitter.publish('annotationCreated.' + _this.windowId, [oaAnno, function () {
          // stuff that needs to be called after the annotation has been created on the backend
          // return to pointer mode
          _this.inEditOrCreateMode = false;

          _this.eventEmitter.publish('SET_STATE_MACHINE_POINTER.' + _this.windowId);

          // re-enable viewer tooltips
          _this.eventEmitter.publish('enableTooltips.' + _this.windowId);

          _this.clearDraftData();
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
    }

  };
}(Mirador));