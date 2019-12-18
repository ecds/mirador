(function ($) {
  $.AnnotationTooltip = function (options) {
    jQuery.extend(this, {
      targetElement: null,
      annotations: [],
      windowId: '',
      eventEmitter: null
    }, options);

    this.init();
  };

  $.AnnotationTooltip.prototype = {

    init: function () {
      this.editor = $[this.state.currentConfig.annotationBodyEditor.module];
      this.editorOptions = this.state.currentConfig.annotationBodyEditor.options;

      this.activeEditor = null;
      this.activeEditorTip = null;
      this.inEditOrCreateMode = false;
    },

    /**
     * @param params: {
     *   annotation: any -- annotation JSON
     *   onAnnotationCreated: (annotation) => void
     *   onCompleted: () => void
     *   onCancel: () => void
     * }
     */
    showEditor: function (params) {
    console.log("TCL: params", params)
      var _this = this;
      if (_this.activeEditor) { return; }

      var editorContainer = _this.editorTemplate({
        id: jQuery.isEmptyObject(params.annotation) ? '' : params.annotation['@id'],
        windowId: _this.windowId
      });
      var selector = '#annotation-editor-' + _this.windowId;

      _this.activeEditor = new _this.editor(
        jQuery.extend({}, _this.editorOptions, {
          annotation: params.annotation,
          windowId: _this.windowId
        }));
      _this.activeEditorTip = _this.targetElement.qtip({
        content: {
          text: editorContainer
        },
        position: {
          my: 'center',
          at: 'center',
          container: _this.targetElement,
          viewport: _this.targetElement
        },
        style: {
          classes: 'qtip-bootstrap qtip' + _this.windowId
        },
        show: {
          event: false
        },
        hide: {
          fixed: true,
          delay: 300,
          event: false
        },
        events: {
          render: function (event, api) {
            _this.eventEmitter.publish('disableTooltips.' + _this.windowId);

            api.elements.tooltip.draggable();

            jQuery(selector).on('submit', function (event) {
              event.preventDefault();
              jQuery(selector + ' a.save').click();
            });

            jQuery(selector + ' a.cancel').on('click', function (event) {
              event.preventDefault();

              var cancelCallback = function () {
                api.destroy();
              };

              _this.eventEmitter.publish('onAnnotationCreatedCanceled.' + _this.windowId, [cancelCallback, !_this.activeEditor.isDirty()]);
            });

            jQuery(selector + ' a.save').on('click', function (event) {
              event.preventDefault();
              if (!params.onSaveClickCheck()) {
                return;
              }
              var annotation = _this.activeEditor.createAnnotation();
              if (params.onAnnotationCreated) { params.onAnnotationCreated(annotation); }
              if (params.onTextAnnotationCreated) { params.onTextAnnotationCreated(annotation); }

              api.destroy();
              _this.activeEditor = null;
              _this.activeEditorTip = null;
            });

            _this.activeEditor.show(selector);
            _this.eventEmitter.publish('annotationEditorAvailable.' + _this.windowId);
          }

        }
      });
      _this.activeEditorTip.qtip('show');
    },

    /**
     * @param params: {
     *   container: HTMLElement
     *   viewport: HTMLElement
     *   getAnnoFromRegion: (regionId: string) => any[]
     *   onTooltipShown: (event: QTipShowEvent, api: QTipAPI) => void
     *   onTooltipHidden: (event: QTipShowEvent, api: QTipAPI) => void
     *   onEnterEditMode: (api: QTipAPI, oaAnno: any) => void
     *   onExitEditMode: (api: QTipAPI, oaAnno: any) => void
     *   onAnnotationSaved: (annotation) => void
     * }
     */
    initializeViewerUpgradableToEditor: function (params) {
      var _this = this;
      _this.activeEditorTip = jQuery(_this.targetElement).qtip({
        overwrite: true,
        content: {
          text: ''
        },
        position: {
          target: 'mouse',
          my: 'bottom left',
          at: 'top right',
          adjust: {
            mouse: false,
            method: 'shift'
          },
          container: params.container,
          viewport: params.viewport
        },
        style: {
          classes: 'qtip-bootstrap qtip-viewer',
          tip: false
        },
        show: {
          event: false
        },
        hide: {
          fixed: true,
          delay: 300,
          event: false
        },
        events: {
          show: function (event, api) {
            if (params.onTooltipShown) { params.onTooltipShown(event, api); }
            api.cache.hidden = false;
          },
          hidden: function (event, api) {
            if (params.onTooltipHidden) { params.onTooltipHidden(event, api); }
            _this.removeAllEvents(api, params);
            api.cache.hidden = true;
          },
          visible: function (event, api) {

          },
          move: function (event, api) {

          }
        }
      });
      var api = jQuery(_this.targetElement).qtip('api');
      api.cache.annotations = [];
      api.cache.hidden = true;
      api.cache.params = params;
      return params;
    },

    removeAllEvents: function (api, viewerParams) {
      var _this = this;
      var editorSelector = '#annotation-editor-' + _this.windowId;
      var viewerSelector = '#annotation-viewer-' + _this.windowId;
      jQuery(viewerSelector + ' a.delete').off('click');
      jQuery(viewerSelector + ' a.edit').off('click');
      jQuery(editorSelector + ' a.save').off('click');
      jQuery(editorSelector + ' a.cancel').off('click');
    },

    addViewerEvents: function (api, viewerParams) {
      var _this = this;
      var selector = '#annotation-viewer-' + _this.windowId;

      jQuery(selector + ' a.delete').on('click', function (event) {
        event.preventDefault();
        var elem = this;
        new $.DialogBuilder(viewerParams.container).dialog({
          message: i18next.t('deleteAnnotation'),
          closeButton: false,
          buttons: {
            no: {
              label: i18next.t('no'),
              className: 'btn-default',
              callback: function () {

              }
            },
            yes: {
              label: i18next.t('yes'),
              className: 'btn-primary',
              callback: function () {
                var display = jQuery(elem).parents('.annotation-display');
                var id = display.attr('data-anno-id');
                var callback = function () {
                  _this.removeAllEvents();
                  api.hide();
                  display.remove();
                };

                _this.eventEmitter.publish('onAnnotationDeleted.' + _this.windowId, [id, callback]);
              }
            }
          }
        });
      });

      jQuery(selector + ' a.edit').on('click', function (event) {
        event.preventDefault();
        var display = jQuery(this).parents('.annotation-display');
        var id = display.attr('data-anno-id');
        console.log("TCL: id", id, _this.oaAnno)
        var oaAnno = null;
        console.log("TCL: _this.oaAnno", _this.oaAnno)
        if (_this.isTextAnno) {
          oaAnno = _this.textAnno;
        } else if (_this.oaAnno) {
          oaAnno = _this.oaAnno;
        } else {
          oaAnno = viewerParams.getAnnoFromRegion(id)[0];
        }
        // Don't show built in editor if external is available
        if (!_this.state.getStateProperty('availableExternalCommentsPanel')) {
          _this.freezeQtip(api, oaAnno, viewerParams);
          _this.removeAllEvents(api, viewerParams);
          _this.addEditorEvents(api, viewerParams);
        } else {
          _this.eventEmitter.publish('annotationInEditMode.' + _this.windowId, [oaAnno]);
          _this.removeAllEvents(viewerParams);
          api.destroy();
          jQuery(api.tooltip).remove();
        }

        _this.eventEmitter.publish('SET_ANNOTATION_EDITING.' + _this.windowId, {
          annotationId: id,
          isEditable: true,
          tooltip: _this
        });
        _this.eventEmitter.publish('modeChange.' + _this.windowId, 'editingAnnotation');
      });
    },

    addEditorEvents: function (api, viewerParams) {
      var _this = this;
      var selector = '#annotation-editor-' + _this.windowId;

      jQuery(selector).on('submit', function (event) {
        event.preventDefault();
        jQuery(selector + ' a.save').click();
      });

      jQuery(selector + ' a.save').on('click', function (event) {
        event.preventDefault();
        var display = jQuery(this).parents('.annotation-editor');
        var id = display.attr('data-anno-id');
        var oaAnno = null;
        if (_this.isTextAnno) {
          oaAnno = _this.textAnno;
        } else if (_this.oaAnno) {
          oaAnno = _this.oaAnno;
        } else {
          oaAnno = viewerParams.getAnnoFromRegion(id)[0];
        }        
        if (_this.isTextAnno) {
          _this.activeEditor.updateAnnotation(_this.textAnno);
          _this.eventEmitter.publish('annotationEditSave.' + _this.windowId, [_this.textAnno]);
        } else {
          _this.activeEditor.updateAnnotation(oaAnno);
          _this.eventEmitter.publish('annotationEditSave.' + _this.windowId, [oaAnno]);  
        }
      });

      jQuery(selector + ' a.cancel').on('click', function (event) {
        event.preventDefault();
        var display = jQuery(this).parents('.annotation-editor');
        var id = display.attr('data-anno-id');
        var oaAnno = viewerParams.getAnnoFromRegion(id)[0];
        _this.removeAllEvents();
        _this.unFreezeQtip(api, oaAnno, viewerParams);
        _this.eventEmitter.publish('annotationEditCancel.' + _this.windowId, [id]);
      });
    },

    /**
     * Shows annotation tooltip initialized with
     * <code>initializeViewerUpgradableToEditor()</code>
     *
     * @param params: {
     *   annotations: any[]
     *   triggerEvent: MouseEvent
     *   shouldDisplayTooltip: (api: QTipAPI) => boolean
     * }
     */
    showViewer: function (params) {
      // console.log('showViewer', params.annotations, this)
      var _this = this;
      var api = jQuery(_this.targetElement).qtip('api');
      // console.log('target', _this.targetElement, params)
      // console.log('API', api, params)
      if (!api) { return; }
      if (params.shouldDisplayTooltip && !params.shouldDisplayTooltip(api) && !params.isTextAnno) {
        return;
      }
      // if (params.isTextAnno) {
      //   console.log('ITS TEXT!', this, params)
      //   console.log('MADE IT')
      // }
      if (params.annotations.length === 0) {
        // console.log('no annotations')
        if (!api.cache.hidden) {
          api.disable(false);
          api.hide(params.triggerEvent);
          api.cache.annotations = [];
          api.cache.hidden = true;
          api.disable(true);
        }
      } else {
        // console.log('has annotations')
        var oldAnnotations = api.cache.annotations;
        var isTheSame = oldAnnotations.length == params.annotations.length;
        // console.log('is the same', isTheSame);
        if (isTheSame) {
          for (var i = 0; i < params.annotations.length; i++) {
            if (oldAnnotations[i] != params.annotations[i]) {
              isTheSame = false;
              break;
            }
          }
        }
        if (api.cache.hidden || !isTheSame) {
          // if (params.isTextAnno) {
          //   api.set({
          //     'hide.event': false
          //   });
          // }
          api.disable(false);
          _this.setTooltipContent(params.annotations);
          console.log("TCL: params.annotations", params.annotations)
          api.cache.origin = params.triggerEvent;
          api.reposition(params.triggerEvent, true);
          api.show(params.triggerEvent);
          api.cache.annotations = params.annotations;
          api.cache.hidden = false;
          _this.removeAllEvents();
          _this.addViewerEvents(api, api.cache.params);
        }
      }
    },

    setTooltipContent: function (annotations) {
      // console.log('TOOLTIP', annotations);
      var _this = this;
      var api = jQuery(this.targetElement).qtip('api');
      if (api) {
        api.set({ 'content.text': this.getViewerContent(annotations) });
        _this.eventEmitter.publish('tooltipViewerSet.' + this.windowId);
      }
    },

    getViewerContent: function (annotations) {
      let _this = this;
      var annoText,
      tags = [],
      htmlAnnotations = [],
      id;
      
      jQuery.each(annotations, function (index, annotation) {
        tags = [];
        if (jQuery.isArray(annotation.resource)) {
          jQuery.each(annotation.resource, function (index, value) {
            if (value['@type'] === 'oa:Tag') {
              tags.push(value.chars);
            } else {
              annoText = value.chars;
              // TODO: This is sort of a hack to make sure the correct
              // annotation is set for the editor.
              _this.oaAnno = value;
        }
          });
        } else {
          annoText = annotation.resource.chars;
          // TODO: This is sort of a hack to make sure the correct
          // annotation is set for the editor.
          _this.oaAnno = annotation;
          console.log("TCL: annoText", annoText)
        }
        var username = '';
        if (annotation.annotatedBy && annotation.annotatedBy.name) {
          username = annotation.annotatedBy.name;
        }

        var showUpdate = false;
        // THIS RIGHT HERE!!!!!!!
        if (annotation.endpoint !== 'manifest') {
          showUpdate = annotation.endpoint.userAuthorize('update', annotation);
        }
        var showDelete = false;
        if (annotation.endpoint !== 'manifest') {
          showDelete = annotation.endpoint.userAuthorize('delete', annotation);
        }
        htmlAnnotations.push({
          annoText: $.sanitizeHtml(annoText),
          tags: tags,
          id: annotation['@id'],
          username: username,
          showUpdate: showUpdate,
          showDelete: showDelete
        });
      });

      var template = this.viewerTemplate({
        annotations: htmlAnnotations,
        windowId: this.windowId
      });
      return template;
      // return combination of all of them
    },

    freezeQtip: function (api, oaAnno, viewerParams) {
      var _this = this;
      if (this.inEditOrCreateMode) { throw 'AnnotationTooltip already in edit mode'; }
      this.inEditOrCreateMode = true;
      _this.eventEmitter.publish('disableRectTool.' + this.windowId);
      var editorContainer = this.editorTemplate({
        id: jQuery.isEmptyObject(oaAnno) ? '' : oaAnno['@id'],
        windowId: this.windowId
      });
      api.set({
        'content.text': editorContainer,
        'hide.event': false
      });
      // add rich text editor
      this.activeEditor = new this.editor(
        jQuery.extend({}, this.editorOptions, {
          annotation: oaAnno,
          windowId: this.windowId
        }));
      this.activeEditor.show('form#annotation-editor-' + this.windowId);
      _this.eventEmitter.publish('annotationEditorAvailable.' + this.windowId);
      jQuery(api.elements.tooltip).removeClass('qtip-viewer');
      api.elements.tooltip.draggable();
      if (viewerParams.onEnterEditMode) {
        viewerParams.onEnterEditMode(api, oaAnno);
      }
    },

    unFreezeQtip: function (api, oaAnno, viewerParams) {
      var _this = this;
      if (!this.inEditOrCreateMode) { throw 'AnnotationTooltip not in edit mode'; }
      this.inEditOrCreateMode = false;
      _this.eventEmitter.publish('enableRectTool.' + this.windowId);
      api.set({
        'content.text': this.getViewerContent([oaAnno]),
        'hide.event': 'mouseleave'
      }).hide();
      jQuery(api.elements.tooltip).addClass('qtip-viewer');
      if (viewerParams.onExitEditMode) {
        viewerParams.onExitEditMode(api, oaAnno);
      }
    },

    // when this is being used to edit an existing annotation, insert them into the inputs
    editorTemplate: $.Handlebars.compile([
      '<form id="annotation-editor-{{windowId}}" class="annotation-editor annotation-tooltip" {{#if id}}data-anno-id="{{id}}"{{/if}}>',
      '<div>',
      // need to add a delete, if permissions allow
      '<div class="button-container">',
      '<a href="#cancel" class="cancel"><i class="fa fa-times-circle-o fa-fw"></i>{{t "cancel"}}</a>',
      '<a href="#save" class="save"><i class="fa fa-database fa-fw"></i>{{t "save"}}</a>',
      '</div>',
      '</div>',
      '</form>'
    ].join('')),

    viewerTemplate: $.Handlebars.compile([
      '<div class="all-annotations" id="annotation-viewer-{{windowId}}">',
      '{{#each annotations}}',
      '<div class="annotation-display annotation-tooltip" data-anno-id="{{id}}">',
      '<div class="button-container">',
      '{{#if showUpdate}}<a href="#edit" class="edit"><i class="fa fa-pencil-square-o fa-fw"></i>{{t "edit"}}</a>{{/if}}',
      '{{#if showDelete}}<a href="#delete" class="delete"><i class="fa fa-trash-o fa-fw"></i>{{t "delete"}}</a>{{/if}}',
      '</div>',
      '<div class="text-viewer">',
      '{{#if username}}<p class="user">{{username}}:</p>{{/if}}',
      '<p>{{{annoText}}}</p>',
      '</div>',
      '<div id="tags-viewer-{{windowId}}" class="tags-viewer">',
      '{{#each tags}}',
      '<span class="tag">{{this}}</span>',
      '{{/each}}',
      '</div>',
      '</div>',
      '{{/each}}',
      '</div>'
    ].join(''))
  };
}(Mirador));
