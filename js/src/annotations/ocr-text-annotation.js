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
      osd: null
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
        this.parseTextAnno();
      }
    },

    parseOaAnno() {
      this.uuid = this.oaAnno['@id'];
      this.annoTooltip = new $.AnnotationTooltip({
        targetElement: jQuery(this.osd.element),
        state: this.state,
        eventEmitter: this.eventEmitter,
        windowId: this.windowId
      });
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
      // TODO WHAT ABOUT THE END? THE RANGE IS EXCLUSIVE. THERE WILL BE NO
      // nextElementSibling IF LAST WORD IS SELECTED.
      if (previousToStart) {
        range = jQuery(`#${previousToStart.id}`).nextUntil(`#${end.id}`, 'span');
      } else {
        range = jQuery(`#${start.id}`).nextUntil(`#${end.id}`, 'span');
        range.prepend(jQuery(start));
      }
      range.each(function(word){words.push(range.get(word).id)});
      // let words = this._copy(jQuery(`#${start.id}`).nextUntil(`#${end.id}`));
      let startOffset = this.oaAnno.on.selector.item.startSelector.refinedBy.start;
      let endOffset = this.oaAnno.on.selector.item.endSelector.refinedBy.end;
      this._insertLinks(words, startOffset, endOffset);
    },

    parseTextAnno() {
      let words = this._copy(this.textAnnotation.words);
      let startOffset = this.textAnnotation.range.startOffset;
      let endOffset = this.textAnnotation.range.endOffset;
      this._insertLinks(words, startOffset, endOffset);
    },

    _insertLinks(selectedWords, startOffset, endOffset) {
      if (selectedWords.length == 1) {
        this._handelPart(selectedWords.pop(), { startOffset, endOffset });
        // _this.handelEnd(selectedWords.pop(), _this.textAnnotation.range.endOffset);  
      } else {
        this._handelStart(selectedWords.shift(), startOffset);
        this._handelEnd(selectedWords.pop(), endOffset);
      }
      console.log('selectedWords', selectedWords);
      // console.log('RANGE', _this.textAnnotation.range);
      if (selectedWords.length > 0) {
        selectedWords.forEach(wordElement => {
          this._wrapWord(wordElement);
        });
        if (startOffset != 0 || endOffset != selectedWords[0].innerText.length) {
          console.log('PART!!!!')
          // _this.handelPart(_this.textAnnotation.range);
        }
      } else {
        console.log('WHOLE!!!!')
        // _this.wrapWord(_this.textAnnotation.range.startContainer.parentElement.id);
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
      console.log('wordSpan', wordSpan);
      const word = wordSpan.innerText;
      const link = this._createLink();
      console.log('link', link);
      link.innerText = word.slice(offset, word.length);
      console.log('link', link);
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
      console.log('LINK', link);
      wordSpan.innerHTML = start;
      wordSpan.append(link);
      wordSpan.append(end);
      console.log('wordSpan', wordSpan);
    },
    
    _uuidv4() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },
    
    _createLink() {
      const link = document.createElement('a');
      link.setAttribute('href', '#');
      link.setAttribute('data-id', this.uuid);
      link.setAttribute('title', this.uuid);
      link.addEventListener('mouseenter', () => {
        console.log(this.annoTooltip);
      });
      return link;
    },
    
    _wrapWord(id) {
      const wordSpan = document.getElementById(id);
      console.log(wordSpan);
      const word = wordSpan.innerText;
      console.log(word);
      const link = this._createLink();
      link.innerText = word;
      console.log(link);
      wordSpan.innerHTML = '';
      wordSpan.append(link);
    },

    _copy(words) {
      let copy = [];
      words.forEach(word => {
        copy.push(word);
      });
      return copy;
    }
  }
}(Mirador));