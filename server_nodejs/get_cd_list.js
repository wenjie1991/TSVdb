var http = require('http');
var exec = require('child_process').exec;
var url = require('url');
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;
var zlib = require('zlib');

http.createServer(function(req, res) {
    var urlParsed = url.parse(req.url, true);
    var tumor = urlParsed['query']["tumor"];

    MongoClient.connect('mongodb://localhost:27017/sv', function(err, db) {
        if (err) throw err;
        db.collection("clinical_" + tumor).find({}).toArray(function(err, result){
            if (err) throw err;
            var cd_list = [];
            for (i in result) {
                cd_list.push(result[i]["cd"]);
            }
            var outputJson = {
                cd_list: cd_list
            };
            var buf = new Buffer(JSON.stringify(outputJson), "utf-8");
            zlib.gzip(buf, function (_, result) {  // The callback will give you the 
                res.writeHead(200, {
                    'Content-Type': 'application/json', 
                    'Access-Control-Allow-Origin':'*',
                    'Content-Encoding': 'gzip'
                });
                res.end(result);                     // result, so just send it.
            });
            db.close()
        });
    });
}).listen(8084, 'localhost');
console.log('Server running at http://localhost:8084/');
