const http = require("http");
const fs = require("fs");
const url = require("url");

const server = http.createServer((request, response) => {
  const parsedUrl = url.parse(request.url, true);
  const pathname = parsedUrl.pathname;
  const method = request.method;

  // POST method
  if (method === "POST" && pathname === "/submit") {
    let body = "";
    request.on("data", chunk => (body += chunk));
    request.on("end", () => {
      const newResume = JSON.parse(body);
      fs.readFile("resumes.json", "utf-8", (err, data) => {
        const resumes = err ? [] : JSON.parse(data || "[]");
        resumes.push(newResume);
        fs.writeFile("resumes.json", JSON.stringify(resumes, null, 2), err => {
          response.end(err ? "Failed to save resume" : "Resume submitted!");
        });
      });
    });
    return;
  }

  // GET method
  if (method === "GET" && pathname === "/resumes") {
    fs.readFile("resumes.json", "utf-8", (err, data) => {
      if (err) {
        response.writeHead(500);
        response.end("Error reading file");
        return;
      }

      let resumes = JSON.parse(data || "[]");
      const { name, domain } = parsedUrl.query;

      if (name) {
        resumes = resumes.filter(r => r.name.toLowerCase().includes(name.toLowerCase()));
      }
      if (domain) {
        resumes = resumes.filter(r => r.primaryDomain.toLowerCase().includes(domain.toLowerCase()));
      }

      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify(resumes));
    });
    return;
  }

  // PUT method
  if (method === "PUT" && pathname.startsWith("/resumes/")) {
    const email = decodeURIComponent(pathname.split("/")[2]);
    let body = "";

    request.on("data", chunk => (body += chunk));
    request.on("end", () => {
      const updated = JSON.parse(body);

      fs.readFile("resumes.json", "utf-8", (err, data) => {
        let resumes = JSON.parse(data || "[]");
        const index = resumes.findIndex(r => r.email === email);
        if (index === -1) return res.end("Resume not found");

        resumes[index] = updated;

        fs.writeFile("resumes.json", JSON.stringify(resumes, null, 2), err => {
          response.end(err ? "Failed to update" : "Resume updated");
        });
      });
    });
    return;
  }

  if (request.method === "GET" && (pathname === "/" || pathname.endsWith(".html"))) {
    const filePath = pathname === "/" ? "index.html" : pathname.slice(1);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        response.writeHead(404);
        response.end("File not found");
      } else {
        response.writeHead(200, { "Content-Type": "text/html" });
        response.end(data);
      }
    });
    return;
  }

  response.writeHead(404);
  response.end("Not found");
});

server.listen(3022, () => {
  console.log("Server running on port number:3022");
});
