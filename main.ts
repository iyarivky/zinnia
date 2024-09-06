import { Hono } from "jsr:@hono/hono";
import { serveStatic } from "jsr:@hono/hono/deno";

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

// Serve static files from the /static directory
app.use("/*", serveStatic({ root: "./static" })); // Changed to serve all static files

app.get("/", (c) => c.redirect("/index.html")); 

app.get("/api/files", async (c) => {
  const files = await getTextFiles(DIRECTORY_PATH);
  return c.json(files);
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

Deno.serve({ port: 9002 }, app.fetch);