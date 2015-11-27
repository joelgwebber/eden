/// <reference path="node.d.ts"/>
/// <reference path="ws.d.ts"/>

var ws = require('ws');
var http = require('http');

var port: number = process.env.PORT || 2112;

var server = http.createServer();
server.listen(port)

var sockServer = new ws.Server({ server: server });

sockServer.on('connection', sock => {
  sock.on('message', message => {
    try {
      console.log(message);
      sock.send(message);
    } catch (e) {
      console.error(e.message);
    }
  });
});

console.log('Server is running on port', port);
