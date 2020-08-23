var fs = require('fs'),
    http = require('http');

http.createServer(function (req, res) {
  var url = new URL(req.url, `http://${req.headers.host}`);
  fs.readFile(__dirname + url.pathname, function (err,data) {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200);
    res.end(data);
  });
}).listen(8080);

