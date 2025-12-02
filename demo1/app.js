let http = require('http');
let port = 8080;
let host = 'localhost';

let server = http.createServer((req, res) => {
    res.write('Hello World\n');
    res.end();

    console.log(`New request`);
    console.log('URL: ', req.url)
    console.log('Request method: ', req.method)


});

server.listen(port, host, function() {
    console.log(`Server is running on http://${host}:${port}`);
})