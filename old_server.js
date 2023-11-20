const http = require('http');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const EventEmitter = require('events');
const logEvents = require('./logEvents'); // custom module

// define the web server port
const PORT = process.env.PORT || 3500;

// event emitter will listen for events and log them to corresponding files
const myEmitter = new EventEmitter();
myEmitter.on('log', (msg, fileName) => logEvents(msg, fileName));


// function that will serve the file (response)
const serveFile = async (filePath, contentType, response) => {
  try {
    const rawData = await fsPromises.readFile(
      filePath, 
      !contentType.includes('image') ? 'utf8' : ''
    );
    const data = contentType === 'application/json' 
      ? JSON.parse(rawData) : rawData;
    response.writeHead(
      filePath.includes('404.html') ? 404 : 200, 
      {'Content-Type': contentType}
    );
    response.end(
      contentType === 'application/json' ? JSON.stringify(data) : data
    );
  } catch (err) {
    console.log(err);
    myEmitter.emit('log', `${err.name}: ${err.message}`, 'errLog.txt');
    response.statusCode = 500; // internal server error
    response.end();
  }
}
// create and configure the server
const server = http.createServer((req, res) => {
  console.log(req.url, req.method);
  myEmitter.emit('log', `${req.url}\t${req.method}`, 'reqLog.txt');

  // store file extension of the request url
  const extension = path.extname(req.url);

  let contentType;

  // manage contentType according to file extension of the url
  switch (extension) {
    case '.css':
      contentType = 'text/css';
      break;
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.jpg':
      contentType = 'image/jpeg';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.txt':
      contentType = 'text/plain';
      break;
    default:
      contentType = 'text/html';
  }

  let filePath =
    contentType === 'text/html' && req.url === '/'
      ? path.join(__dirname, 'views', 'index.html')
      : contentType === 'text/html' && req.url.slice(-1) === '/' // if last character in url is '/'
        ? path.join(__dirname, 'views', req.url, 'index.html') // req.url will specify the subdir
        : contentType === 'text/html' // if req.url is not a slash and last char not a slash
          ? path.join(__dirname, 'views', req.url) // just look for url in the views folder
          : path.join(__dirname, req.url); // if url not in views, just use req.url

  // makes .html extension not required int the browser
  if (!extension && req.url.slice(-1) !== '/') filePath += '.html';

  // serve the file if it exists
  const fileExists = fs.existsSync(filePath);
  if (fileExists) {
    serveFile(filePath, contentType, res);
  } 
  // if file does not exist, response will vary
  else {
    switch (path.parse(filePath).base) {
      case 'old-page.html':
        res.writeHead(301, {'Location': 'new-page.html'}); // redirect to new page
        res.end(); // end the response
        break;
      case 'www-page.html':
        res.writeHead(301, {'Location': '/'}); // redirect to root page
        res.end(); // end the response
        break;
      default:
        // serve a 404 response
        serveFile(path.join(__dirname, 'views', '404.html'), 'text/html', res);
    };
    // https://nodejs.org/api/path.html#pathparsepath
  }
});

server.listen(PORT, () => console.log(`Server running and listening on port ${PORT}`));