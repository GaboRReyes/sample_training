var http = require ('http');

http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    var url = req.url;
    if (url === '/') {
        res.write('<h1>Home Page</h1>');
    } else if (url === '/about') {
        res.write('<h1>About Page</h1>');
    } else if (url === '/contact') {
        res.write('<h1>Contact Page</h1>');
    } else {
        res.write('<h1>404 Not Found</h1>');
        res.end();
    }
})
.listen(3000, function() {
    console.log('Server is running on http://localhost:3000');
})