describe('Utils', function() {
  beforeEach(function() {
    this.utils = Mirador;
    this.imagesList = [{
      '@id':     '1',
      'title':  '1r',
      'height': 10,
      'width':  20
    }, {
      '@id':     '2',
      'title':  '1v',
      'height': 15,
      'width':  25
    }];

    this.imageTitlesAndIds = [{
      '@id':     '1',
      'title': '1r'
    }, {
      '@id':     '2',
      'title': '1v'
    }];
    this.manifests = {
      "manifest-1234": {
        "uri":"http://xyz.edu/data/Manifest.json",
        "metadata": {
          "details": {
            'label': 'Collection 123'
          }
        },
        "sequences": [{
          "imagesList": this.imagesList
        }]
      }
    };
  });

  it('should trim trailing whitespaces from a string', function() {
    expect(this.utils.trimString('  abc ')).toEqual('abc');
  });

  describe('XHR utils', function() {
    beforeEach(function() {
      this.server = sinon.fakeServer.create();
    });

    afterEach(function() {
      this.server.restore();
    });

    // it('should return JSON data for a given URL via ajax call', function() {
    //   var data = { 'a': 'b' },
    //   error; // undefined
    //
    //   this.server.respondWith("GET", "http://manifest/url/success",
    //                           [200, { "Content-Type": "application/json" },
    //                             JSON.stringify(data)]);
    //   this.server.respondWith("GET", "http://manifest/url/failed",
    //                           [500, {}, '']);

    //   var callback = sinon.spy();
    //   myLib.getCommentsFor("/manifest/url", callback);
    //   this.server.respond();

    //   // spyOn(jQuery, 'ajax').and.callFake(function(params) {
    //   //   if (/success$/.test(params.url)) {
    //   //     params.success(data);
    //   //   } else {
    //   //     params.error(error);
    //   //   }
    //   // });

    //   expect(this.utils.getJsonFromUrl('http://manifest/url/success', true)).toEqual(data);
    //   expect(this.utils.getJsonFromUrl('http://manifest/url/success', false)).toEqual(data);
    //   expect(this.utils.getJsonFromUrl('http://manifest/url/failed', false)).toEqual(error);
    // });
  });
  
  describe('isOnScreen', function() {
    var subject, win, el_offset, el;
    beforeEach(function() {
      subject = this.utils;
      win = {
        scrollTop: jasmine.createSpy('scrollTop').and.returnValue(320),
        scrollLeft: jasmine.createSpy('scrollLeft').and.returnValue(48),
        outerHeight: jasmine.createSpy('outerHeight').and.returnValue(200),
        outerWidth: jasmine.createSpy('outerWidth').and.returnValue(150)
      };
      el_offset = {
        top: 0,
        left: 0
      };
      el = {
        offset: jasmine.createSpy().and.callFake(function() {
          return el_offset;
        }),
        height: jasmine.createSpy().and.returnValue(16),
        width: jasmine.createSpy().and.returnValue(32)
      };
      spyOn(window, 'jQuery').and.callFake(function(arg) {
        if (arg === window) {
          return win;
        }
        else {
          return el;
        }
      });
    });
    it('should return true for things on screen', function() {
      el_offset = { top: 330, left: 60 };
      expect(subject.isOnScreen('elem')).toBe(true);
      el_offset = { top: 660, left: 200 };
      expect(subject.isOnScreen('elem', 2)).toBe(true);
    });
    it('should return false for things off screen', function() {
      jQuery.each([{ top: 0, left: 60 }, { top: 900, left: 60 }, { top: 330, left: 0 }, { top: 650, left: 2000 }], function(k, eo) {
        el_offset = eo;
        expect(subject.isOnScreen('elem')).toBe(false);
      });
      jQuery.each([{ top: 0, left: 100 }, { top: 1900, left: 100 }, { top: 650, left: 0 }, { top: 330, left: 700 }], function(k, eo) {
        el_offset = eo;
        expect(subject.isOnScreen('elem', 2)).toBe(false);
      });
    });
  });
  
  describe('getRangeIDByCanvasID', function() {
    it('should find ranges correctly', function() {
      var canvasID = 'http://0.0.0.0/iiif/0/canvas',
          structures = [
            {
              '@id': 'http://0.0.0.0/iiif/no1/sequence',
              canvases: [ 'http://0.0.0.0/iiif/1/canvas', 'http://0.0.0.0/iiif/2/canvas' ]
            },
            {
              '@id': 'http://0.0.0.0/iiif/no2/sequence',
              canvases: [ ]
            },
            {
              '@id': 'http://0.0.0.0/iiif/yes1/sequence',
              canvases: [ 'http://0.0.0.0/iiif/0/canvas' ]
            },
            {
              '@id': 'http://0.0.0.0/iiif/yes2/sequence',
              canvases: [ 'http://0.0.0.0/iiif/1/canvas', 'http://0.0.0.0/iiif/0/canvas' ]
            },
          ];
      expect(this.utils.getRangeIDByCanvasID(structures, canvasID)).toEqual(['http://0.0.0.0/iiif/yes1/sequence', 'http://0.0.0.0/iiif/yes2/sequence']);
    });
  });

  describe('createImagePromise', function() {

    it('should load an image if the request is good', function(done) {
      var dataUri = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

      var imagePromise = Mirador.createImagePromise(dataUri);

      imagePromise.done(function(image) {
        expect(image).toBe(dataUri);
        console.log(image);
        done();
      });

    });

    xit('should return an error message to the console if the result is bad', function(done) {
      var dataUri = 'http://thing.notanimagehfhfhfhf.png/';
      spyOn(console, 'log').and.returnValue();
      var imagePromise = Mirador.createImagePromise(dataUri);
      imagePromise.fail(function(image) {
        expect(image).toBe(dataUri);
        expect(console.log).toHaveBeenCalledWith('image failed to load: http://0.0.0.0/invalid.png');
        done();
      });
    });
  });

  describe('getImageIndexById', function() {
    it('should return index of the image with the given id', function() {
      expect(this.utils.getImageIndexById(this.imagesList, '1')).toBe(0);
      expect(this.utils.getImageIndexById(this.imagesList, '2')).toBe(1);
      // TODO: should expect -1 or throw exception instead
      expect(this.utils.getImageIndexById(this.imagesList, '0')).toBe(0);
    });
  });

  xdescribe('getThumbnailForCanvas', function() {
    it('should get the proper thumbnail for a canvas', function () {
      
    });
  });

  describe('getQueryParams', function() {
    it('should properly parse a url with query parameters', function() {
      var queryParams = this.utils.getQueryParams('http://zimeon.github.io/iiif-dragndrop/e-codices-help.html?manifest=http://www.e-codices.unifr.ch/metadata/iiif/kba-0003/manifest.json&canvas=http://www.e-codices.unifr.ch/metadata/iiif/kba-0003/canvas/kba-0003_002r.json');
      expect(queryParams.manifest).toBe("http://www.e-codices.unifr.ch/metadata/iiif/kba-0003/manifest.json");
      expect(queryParams.canvas).toBe("http://www.e-codices.unifr.ch/metadata/iiif/kba-0003/canvas/kba-0003_002r.json");
    });
    it('should properly parse a url without query parameters', function() {
      var queryParams = this.utils.getQueryParams('http://www.google.com');
      expect(queryParams).toEqual({});
    });
  });
});
