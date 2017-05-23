var express = require('express')
var http = require('http');
var reload = require('reload')
var app = express()

app.use(express.static('public'));

app.set('port', process.env.PORT || 5000)

var server = http.createServer(app);

reload(server, app);

server.listen(app.get('port'), function() {
    console.log("Listening on localhost:" + app.get('port'));
});

