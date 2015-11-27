/// <reference path="node.d.ts"/>
/// <reference path="ws.d.ts"/>
var ws = require('ws');
var http = require('http');
var port = process.env.PORT || 2112;
var server = http.createServer();
server.listen(port);
var sockServer = new ws.Server({ server: server });
sockServer.on('connection', function (sock) {
    sock.on('message', function (message) {
        try {
            console.log(message);
            sock.send(message);
        }
        catch (e) {
            console.error(e.message);
        }
    });
});
console.log('Server is running on port', port);
