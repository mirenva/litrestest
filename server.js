var http = require('http'),
	url = require('url'),
	querystring = require('querystring'),
	static = require('node-static'),
	file = new static.Server('.', {
		cache: 0
	})


function accept(req, res) {
	file.serve(req, res)
}


// ------ запустить сервер -------

if (!module.parent) {
	http.createServer(accept).listen(8080);
} else {
	exports.accept = accept;
}