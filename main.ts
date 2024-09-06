// main.ts
import { Hono } from "jsr:@hono/hono";
import { serveStatic } from 'jsr:@hono/hono/deno';

const app = new Hono();

const FILE_PATH = "./halo.js";

app.get("/", async (c) => {
  let fileContent = "";
  try {
    fileContent = await Deno.readTextFile(FILE_PATH);
  } catch (error) {
    console.error("Error reading file:", error);
    fileContent = `// File tidak ditemukan atau tidak dapat dibaca ${error}`;
  }

  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CodeMirror Text Editor - halo.js</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.js"></script>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.css">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/javascript/javascript.min.js"></script>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        #editor { width: 100%; height: 400px; }
        #save-button { margin-top: 10px; padding: 5px 10px; }
      </style>
    </head>
    <body>
      <h1>CodeMirror Text Editor - halo.js</h1>
      <textarea id="editor">${fileContent}</textarea>
      <button id="save-button">Simpan Perubahan</button>
      <script>
        const editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
          lineNumbers: true,
          mode: "javascript",
          theme: "default"
        });

        document.getElementById("save-button").addEventListener("click", async () => {
          const content = editor.getValue();
          const response = await fetch("/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content })
          });
          if (response.ok) {
            alert("File berhasil disimpan!");
          } else {
            alert("Gagal menyimpan file.");
          }
        });
      </script>
    </body>
    </html>
  `);
});

app.post("/save", async (c) => {
  const { content } = await c.req.json();
  try {
    await Deno.writeTextFile(FILE_PATH, content);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error writing file:", error);
    return c.json({ success: false }, 500);
  }
});

app.use("/public/*", serveStatic({ root: "./" }));

Deno.serve(app.fetch);