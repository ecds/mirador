const overlay = document.getElementById('ocr-overlay');
const uuid = null;
const output = document.getElementById('output');
const words = [];

overlay.addEventListener('mouseup', event => {
  this.words = []
  this.uuid = this.uuidv4();
  this.addRow();
  let selected = window.getSelection();
  let link = document.createElement('a')
  if (selected.rangeCount) {
    let range = selected.getRangeAt(0);
    let contents = range.cloneContents().querySelectorAll('span');
    selectedWords = [];
    contents.forEach(word => {
      if (word.id) {
        selectedWords.push(word);
      }
    });
    this.handelStart(selectedWords.shift(), range.startOffset);
    this.handelEnd(selectedWords.pop(), range.endOffset);
    if (selectedWords.length > 0) {
      selectedWords.forEach(wordElement => {
        this.wrapWord(wordElement.id);
      });
    } else if (range.startOffset != 0 || range.endOffset != range.startContainer.data.length) {
      this.handelPart(range);
    }else {
      this.wrapWord(range.startContainer.parentElement.id);
    }
    // range.surroundContents(link);
    // selected.removeAllRanges();
    // selected.addRange(range);
  }
  // output.innerHTML = words.join(' ');
});

handelStart = (wordElement, offset) => {
  if (!wordElement) return;
  const wordSpan = document.getElementById(wordElement.id);
  const word = wordSpan.innerText;
  const link = this.createLink();
  link.innerText = word.slice(offset, word.length);
  wordSpan.innerHTML = `${word.slice(0, offset)}`;
  wordSpan.append(link);
  this.addToTable(wordElement.id, link.innerHTML);
}

handelEnd = (wordElement, offset) => {
  if (!wordElement) return;
  const wordSpan = document.getElementById(wordElement.id);
  const word = wordSpan.innerText;
  const link = this.createLink();
  link.innerText = word.slice(0, offset);
  wordSpan.innerHTML = word.slice(offset, word.length);
  wordSpan.prepend(link);
  this.addToTable(wordElement.id, link.innerHTML);
}

handelPart = (range) => {
  const wordSpan = range.startContainer.parentElement
  const word = wordSpan.innerText;
  const link = this.createLink();
  const start = word.slice(0, range.startOffset);
  const end = word.slice(range.endOffset, word.length);
  link.innerText = word.slice(range.startOffset, range.endOffset);
  wordSpan.innerHTML = start;
  wordSpan.append(link);
  wordSpan.append(end);
  this.addToTable(wordSpan.id, link.innerHTML)
}

uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

createLink = () => {
  const link = document.createElement('a');
  link.setAttribute('href', '#');
  link.setAttribute('data-id', this.uuid);
  link.setAttribute('title', this.uuid);
  return link;
}

wrapWord = (id) => {
  const wordSpan = document.getElementById(id);
  console.log(wordSpan);
  const word = wordSpan.innerText;
  console.log(word);
  const link = this.createLink();
  link.innerText = word;
  console.log(link);
  wordSpan.innerHTML = '';
  wordSpan.append(link);
  this.addToTable(id, link.innerHTML)
}

addRow = () => {
  const tr = document.createElement('tr');
  const cell = document.createElement('td');
  cell.setAttribute('colspan', '2');
  cell.setAttribute('class', 'new-anno');
  cell.innerText = `User Annotation: ${this.uuid}`;
  tr.appendChild(cell);
  document.getElementById('output').appendChild(tr);
}

addToTable = (annoId, content) => {
  const tr = document.createElement('tr');
  const idCell = document.createElement('td');
  const contentCell = document.createElement('td');
  idCell.innerText = annoId;
  contentCell.innerText = content;
  tr.appendChild(idCell);
  tr.appendChild(contentCell);
  document.getElementById('output').appendChild(tr);
}