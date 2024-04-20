const http = require("http");
const fs = require("fs");
require("dotenv").config();

const basedir = "../";
const host = "localhost";
const port = parseInt(process.env.PORT ?? 3000);

const requestListener = function (req, res) {
  switch (req.url) {
    case "/":
      res.writeHead(200, { "content-type": "text/html" });
      fs.createReadStream(basedir + "/index.html").pipe(res);
      break;
    case "/favicon.ico":
      res.writeHead(200, { "content-type": "image/x-icon" });
      fs.createReadStream(basedir + "/css/favicon.ico").pipe(res);
      break;
    case "/css/favicon.ico":
      res.writeHead(200, { "content-type": "image/x-icon" });
      fs.createReadStream(basedir + req.url).pipe(res);
      break;
    case "/css/reset.css":
      res.writeHead(200, { "content-type": "text/css" });
      fs.createReadStream(basedir + req.url).pipe(res);
      break;
    case "/css/styles.css":
      res.writeHead(200, { "content-type": "text/css" });
      fs.createReadStream(basedir + req.url).pipe(res);
      break;
    case "/js/config.js":
      res.writeHead(200, { "content-type": "text/javascript" });
      fs.createReadStream(basedir + "/js/config_offline.js").pipe(res);
      break;
    case "/js/common.js":
      res.writeHead(200, { "content-type": "text/javascript" });
      fs.createReadStream(basedir + req.url).pipe(res);
      break;
    case "/js/isotope.js":
      res.writeHead(200, { "content-type": "text/javascript" });
      fs.createReadStream(basedir + req.url).pipe(res);
      break;
    case "/js/movies.js":
      res.writeHead(200, { "content-type": "text/javascript" });
      fs.createReadStream(basedir + req.url).pipe(res);
      break;
    case "/offline/movies.xml":
      if (fs.existsSync(basedir + req.url)) {
        res.writeHead(200, { "content-type": "application/xml" });
        fs.createReadStream(basedir + req.url).pipe(res);
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: "Resource not found" }));
        console.warn("XML not found, please run the scraper");
      }
      break;
    default:
      if (req.url.match(/^\/offline\/thumbs\/.*\.jpg$/)) {
        if (fs.existsSync(basedir + req.url)) {
          res.writeHead(200, { "content-type": "image/jpeg" });
          fs.createReadStream(basedir + req.url).pipe(res);
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ error: "Resource not found" }));
          console.warn("Cover image not found, please run the scraper");
        }
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: "Resource not found" }));
        console.warn(`"${req.url}" not found`);
      }
  }
};

const server = http.createServer(requestListener).on("error", err => {
  console.error(err);
});
server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});
