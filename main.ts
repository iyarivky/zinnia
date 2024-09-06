import { Hono } from "jsr:@hono/hono";

const app = new Hono();
const DIRECTORY_PATH = "./";

async function getTextFiles(dirPath: string): Promise<string[]> {
  const files: string[] = [];
  const allowedExtensions = [
    ".txt", ".js", ".ts", ".rs", ".py", ".c", ".cpp", 
    ".java", ".html", ".css", ".xml", ".json", ".md", 
    ".go", ".rb", ".php", ".sh", ".bat"
  ];

  for await (const dirEntry of Deno.readDir(dirPath)) {
    if (dirEntry.isFile) {
      const fileExtension = "." + dirEntry.name.split('.').pop()?.toLowerCase();
      if (allowedExtensions.includes(fileExtension)) {
        files.push(dirEntry.name);
      }
    }
  }
  return files;
}

async function getFileContent(filePath: string): Promise<string> {
  try {
    return await Deno.readTextFile(filePath);
  } catch (error) {
    console.error("Error reading file:", error);
    return `// File tidak ditemukan atau tidak dapat dibaca: ${error}`;
  }
}

function generateHTML(files: string[]): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Modern Directory Text Editor</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.js"></script>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.css">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/javascript/javascript.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/rust/rust.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/python/python.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/clike/clike.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/xml/xml.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/css/css.min.js"></script>
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap" rel="stylesheet">
      ${generateCSS()}
    </head>
    <body>
      <div class="container">
        <div id="file-list">
          <h2>Files</h2>
          <ul>
            ${files.map(file => `<li><a href="#" class="file-link" data-file="${file}">${file}</a></li>`).join('')}
          </ul>
        </div>
        <div id="editor-container">
          <h2 id="current-file">Select a file to edit</h2>
          <div id="editor-wrapper">
            <textarea id="editor"></textarea>
          </div>
          <button id="save-button" style="display:none;">Save Changes</button>
        </div>
      </div>
      ${generateJavaScript()}
    </body>
    </html>
  `;
}

function generateCSS(): string {
  return `
    <style>
      body { 
        font-family: 'Roboto', sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
        color: #333;
      }
      .container {
        display: flex;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      #file-list {
        width: 250px;
        background-color: #fff;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
      }
      #file-list h2 {
        margin-top: 0;
        color: #2c3e50;
      }
      #file-list ul {
        list-style-type: none;
        padding: 0;
      }
      #file-list li {
        margin-bottom: 10px;
      }
      .file-link {
        text-decoration: none;
        color: #3498db;
        transition: color 0.3s ease;
      }
      .file-link:hover {
        color: #2980b9;
      }
      #editor-container {
        flex-grow: 1;
        margin-left: 20px;
        background-color: #fff;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
      }
      #current-file {
        margin-top: 0;
        color: #2c3e50;
      }
      #editor-wrapper {
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      .CodeMirror {
        height: 400px;
        font-size: 14px;
      }
      #save-button { 
        margin-top: 15px;
        padding: 10px 20px;
        background-color: #2ecc71;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s ease;
      }
      #save-button:hover {
        background-color: #27ae60;
      }
    </style>
  `;
}

function generateJavaScript(): string {
  return `
    <script>
      let editor;
      let currentFile = '';

      function getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
      }

      function getCodeMirrorMode(extension) {
        const modeMap = {
          'js': 'javascript',
          'rs': 'rust',
          'py': 'python',
          'c': 'clike',
          'cpp': 'clike',
          'java': 'clike',
          'html': 'xml',
          'xml': 'xml',
          'css': 'css',
          // Tambahkan lebih banyak pemetaan ekstensi-ke-mode di sini
        };
        return modeMap[extension] || 'text/plain';
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

        document.querySelectorAll('.file-link').forEach(link => {
          link.addEventListener('click', async (e) => {
            e.preventDefault();
            currentFile = e.target.dataset.file;
            const content = await fetchFileContent(currentFile);
            const fileExtension = getFileExtension(currentFile);
            const mode = getCodeMirrorMode(fileExtension);
            editor.setOption('mode', mode);
            editor.setValue(content);
            document.getElementById('current-file').textContent = "Editing: " + currentFile;
            document.getElementById('save-button').style.display = 'block';
          });
        });

        document.getElementById("save-button").addEventListener("click", saveFile);
      });

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
    </script>
  `;
}

app.get("/", async (c) => {
  const files = await getTextFiles(DIRECTORY_PATH);
  return c.html(generateHTML(files));
});

app.get("/file/:name", async (c) => {
  const fileName = c.req.param('name');
  const content = await getFileContent(DIRECTORY_PATH + fileName);
  return c.text(content);
});

app.post("/save/:name", async (c) => {
  const fileName = c.req.param('name');
  const { content } = await c.req.json();
  try {
    await Deno.writeTextFile(DIRECTORY_PATH + fileName, content);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error writing file:", error);
    return c.json({ success: false }, 500);
  }
});

Deno.serve({ port : 9002},app.fetch);