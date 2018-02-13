var http = require('http');
var exec = require('child_process').exec;
var url = require('url');
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;
var zlib = require('zlib');

function res_return() {

}

http.createServer(function(req, res) {
    var urlParsed = url.parse(req.url, true);
    var term = urlParsed['query']["term"].toUpperCase();

    MongoClient.connect('mongodb://localhost:27017/sv', function(err, db) {
        if (err) throw err;


        db.collection("gene_autocomplete").find({SYMBOL: {'$regex': '^' + term}}).toArray(function(err, result_symbol){
            var result = [];
            if (err) throw err;

            for (var i=0; i<result_symbol.length; i++) {
                var next_item = 0;
                for (var j=0; j<result.length; j++) {
                    if (result[j].SYMBOL === result_symbol[i].SYMBOL) {
                        next_item = 1;
                        break;
                    }
                }
                if (result.length === 10) {
                    break;
                } else if (next_item) {
                    continue;
                }
                result = result.concat(result_symbol[i]);
            }


            if (result.length < 10) {

                db.collection("gene_autocomplete").find({ALIAS: {'$regex': term}}).toArray(function(err, result_alias){

                    for (var i=0; i<result_alias.length; i++) {
                        var next_item = 0;
                        for (var j=0; j<result.length; j++) {
                            if (result[j].SYMBOL === result_alias[i].SYMBOL) {
                                next_item = 1;
                                break;
                            }
                        }
                        if (result.length === 10) {
                            break;
                        } else if (next_item) {
                            continue;
                        }
                        result = result.concat(result_alias[i]);
                    }

                    var outputJson = [];
                    var i_max = result.length > 10 ? 10 : result.length;
                    for (var i=0; i<i_max; i++) {
                        outputJson = outputJson.concat({
                            label: result[i].display,
                            value: result[i].SYMBOL
                        });
                    }
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

            } else {

                var outputJson = [];
                var i_max = result.length > 10 ? 10 : result.length;
                for (var i=0; i<i_max; i++) {
                    outputJson = outputJson.concat({
                        label: result[i].display,
                        value: result[i].SYMBOL
                    });
                }
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

            }
        });
    });
}).listen(8085, 'localhost');

