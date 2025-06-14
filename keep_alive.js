var http = require('http')

http.createServer(function (res, res) {
  res.write('I´m alive');
  res.end();
}).listen(8080);
