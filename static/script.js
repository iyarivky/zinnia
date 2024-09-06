let editor;
let currentFile = '';

function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
}

function getCodeMirrorMode(extension) {
  const modeMap = {
    'js': 'javascript',
    'ts': 'javascript',
    'rs': 'rust',
    'py': 'python',
    'c': 'clike',
    'cpp': 'clike',
    'java': 'clike',
    'html': 'xml',
    'xml': 'xml',
    'css': 'css',
    'md': 'markdown'
    // Tambahkan lebih banyak pemetaan ekstensi-ke-mode di sini
  };
  return modeMap[extension] || 'text/plain';
}

async function loadFiles() {
  const response = await fetch('/api/files');
  const files = await response.json();
  const filesContainer = document.getElementById('files-container');
  filesContainer.innerHTML = files.map(file => `<li><a href="#" class="file-link" data-file="${file}">${file}</a></li>`).join('');
  
  document.querySelectorAll('.file-link').forEach(link => {
    link.addEventListener('click', loadFile);
  });
}

async function loadFile(e) {
  e.preventDefault();
  currentFile = e.target.dataset.file;
  const content = await fetchFileContent(currentFile);
  const fileExtension = getFileExtension(currentFile);
  const mode = getCodeMirrorMode(fileExtension);
  editor.setOption('mode', mode);
  CodeMirror.autoLoadMode(editor, mode);
  editor.setValue(content);
  document.getElementById('current-file').textContent = "Editing: " + currentFile;
  document.getElementById('save-button').style.display = 'block';
}

async function fetchFileContent(fileName) {
  const response = await fetch('/file/' + fileName);
  return await response.text();
}

async function saveFile() {
  const content = editor.getValue();
  const response = await fetch("/save/" + currentFile, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content })
  });
  if (response.ok) {
    alert("File saved successfully!");
  } else {
    alert("Failed to save file.");
  }
}

document.addEventListener('DOMContentLoaded', () => {
  editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
    lineNumbers: true,
    theme: "default",
    autoCloseBrackets: true,
    matchBrackets: true,
    indentUnit: 2,
    tabSize: 2,
  });

  loadFiles();

  document.getElementById("save-button").addEventListener("click", saveFile);
});