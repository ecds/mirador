
describe('Table of Contents', function() {
  beforeEach(function(){
    jasmine.getJSONFixtures().fixturesPath = 'spec/fixtures';

    this.eventEmitter = new Mirador.EventEmitter();
    this.v1SimpleStructures = getJSONFixture('simpleStructuresFixtureV1.json'),
    this.v1SimpleStructuresTemplateData = '[{"@id":"http://www.example.org/iiif/book1/range/r1.json","@type":"sc:Range","label":"Introduction","canvases":["http://www.example.org/iiif/book1/canvas/p1.json"],"id":"http://www.example.org/iiif/book1/range/r1.json","within":"root","level":0,"children":[{"@id":"http://www.example.org/iiif/book1/range/r2.json","@type":"sc:Range","label":"Part 1","within":"http://www.example.org/iiif/book1/range/r1.json","canvases":["http://www.example.org/iiif/book1/canvas/p2.json","http://www.example.org/iiif/book1/canvas/p3.json#xywh=0,0,750,300"],"id":"http://www.example.org/iiif/book1/range/r2.json","level":1}]}]',
    this.v2SimpleStructures = getJSONFixture('simpleStructuresFixtureV2.json'),
    // v21SimpleStructures = getJSONFixture('simpleStructuresFixtureV21.json'),
    this.realisticV1 = getJSONFixture('Richardson7manifest.json'),
    this.realisticV2 = getJSONFixture('BNF-condorcet-florus-dispersus-manifest.json');
    // this.realisticV21 = {},

    this.sandbox = sandbox();

  });

  afterEach(function() {
  });

  describe('Initialisation', function(){

    it('should render a table of contents element', function() {
      var testToc = new Mirador.TableOfContents({
        structures: this.v1SimpleStructures.structures,
        manifestVersion: '1',
        appendTo: this.sandbox,
        windowId: 'dummyID',
        canvasID: 1234,
        eventEmitter: this.eventEmitter
      });

      expect(this.sandbox.find('.toc')).toExist();
      expect(testToc.structures.length).toEqual(2);
    });

    it('should assign a range ID to toc link elements', function() {
      var testToc = new Mirador.TableOfContents({
        structures: this.v1SimpleStructures.structures,
        manifestVersion: '1',
        appendTo: this.sandbox,
        windowId: 'dummyID',
        canvasID: 1234,
        eventEmitter: this.eventEmitter
      });

      expect(this.sandbox.find('.toc-link')).toExist();
      expect(this.sandbox.find('.toc-link').first().data().rangeid).toBe('http://www.example.org/iiif/book1/range/r2.json');
    });

    it('should render an empty template if there are no structures', function(){
      var testToc = new Mirador.TableOfContents({
        structures: [],
        appendTo: this.sandbox,
        windowId: 'dummyID',
        canvasID: 1234,
        eventEmitter: this.eventEmitter
      });

      expect(this.sandbox.find('.toc')).toExist();
      expect(this.sandbox.find('h2 span')).toContainText('No index available');
    });

    it('should set tocData with a cached element for each range', function() {
      var testToc = new Mirador.TableOfContents({
        structures: this.v1SimpleStructures.structures,
        manifestVersion: '1',
        appendTo: this.sandbox,
        windowId: 'dummyID',
        canvasID: 1234,
        eventEmitter: this.eventEmitter
      });

      expect(Object.keys(testToc.tocData).length).toEqual(2);
      expect(testToc.tocData['http://www.example.org/iiif/book1/range/r1.json']).not.toBeUndefined();
      expect(testToc.tocData['http://www.example.org/iiif/book1/range/r2.json']).not.toBeUndefined();

      expect(testToc.tocData['http://www.example.org/iiif/book1/range/r1.json'].element).not.toBeUndefined();
      expect(testToc.tocData['http://www.example.org/iiif/book1/range/r2.json'].element).not.toBeUndefined();
    });
  });

  describe('Template data', function() {
    xit('should set structures property with children if there is only one "structure"', function() {
    });

    xit('should set structures property with top-level ranges if there is more than one "structure"', function() {

    });

    it('should return a tree of ranges from the structures (v1.0)', function() {
      var testToc = new Mirador.TableOfContents({
        structures: this.v1SimpleStructures.structures,
        manifestVersion: '1',
        appendTo: this.sandbox,
        windowId: 'dummyID',
        canvasID: 1234,
        eventEmitter: this.eventEmitter
      });

      expect(testToc.structures.length).toEqual(2);
      expect(JSON.stringify(testToc.extractV1RangeTrees(testToc.structures)))
        .toEqual(this.v1SimpleStructuresTemplateData);
    });

    xit('should return a tree of ranges from the structures (v2.0)', function() {

      var testToc = new Mirador.TableOfContents({
        structures: this.v2SimpleStructures.structures,
        manifestVersion: '2',
        appendTo: this.sandbox,
        windowId: 'dummyID',
        canvasID: 1234,
        eventEmitter: this.eventEmitter
      });

      expect(testToc.structures.length).toEqual(2);
      expect(JSON.stringify(testToc.extractV2RangeTrees(this.v2SimpleStructures)))
        .toEqual(this.v1SimpleStructuresTemplateData);
    });

    xit('should return a tree of ranges from the structures (v2.1)', function() {

    });
  });

  describe('render conditions', function() {
    it('should render the correct selected ranges for the initial canvasID', function() {
      var testToc = new Mirador.TableOfContents({
        structures: this.v2SimpleStructures.structures,
        manifestVersion: '2',
        appendTo: this.sandbox,
        windowId: 'dummyID',
        canvasID: 1234,
        eventEmitter: this.eventEmitter
      });
    });
    it('should re-render when the canvasID is updated', function() {
    });
    it('should re-render when a caret is clicked', function() {
    });
  });

  describe('Open, closed, selected, unselected states', function() {
    it('should set an item to active when one of its child canvases are deemed the "currentCanvasID"', function(){
    });
    it('should close the previous selected range when a new range is selected', function() {
    });
    it('should set a toc item to "open" when the caret is clicked', function() {
    });
    it('should close the previous selected range when a new range is selected, even when another range has been manually expanded', function(){

    });
    it('should close the previous selected range when a new range is selected, even when another range inside the parent range of the newly selected range has been manually expanded', function() {
    });
    it('should scroll to a newly selected range', function() {

    });
    it('should not scroll to a range that has been toggled open when the selected canvas has not changed', function() {

    });
  });

  describe('Tab state interactions', function() {
    xit('shows the toc element on tabStateUpdated when the selected tab is not the tocTab', function(){

    });

    xit('hides the toc element on tabStateUpdated when the selected tab is the tocTab', function(){

    });
  });
});
