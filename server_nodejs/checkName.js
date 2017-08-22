var http = require('http');
var exec = require('child_process').exec;
var url = require('url');
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient,
    co = require('co');

var re = /^\d+$/;

http.createServer(function(req, res) {
    function* fn() {
        var outputJson = {"test": "ok"};
        var urlParsed = url.parse(req.url, true);
        var gene = urlParsed['query']["gene"];
        var tumor = urlParsed['query']["tumor"];


        var db = yield MongoClient.connect('mongodb://localhost:27017/sv');

        var gene_field;
        if (re.test(gene)) {
            gene_field = "entrezid";
        } else {
            gene_field = "symbol";
        }

        // gene_expression: expression information of genes
        try {
            var collection = db.collection('gene_expression_' + tumor);
            if (gene_field == "symbol") {
                var gene_expression_result = yield collection.findOne({symbol: gene});
            } else {
                var gene_expression_result = yield collection.findOne({entrezid: gene});
            }
            delete gene_expression_result["_id"];
        } catch(err){
            console.log(err)
        }
//        console.log(gene_expression_result);

        
        // tx_pattern: transcripts information
        try{
            var collection = db.collection('tx_pattern');
            if (gene_field == "symbol") {
                var tx_pattern_result = yield collection.findOne({symbol: gene});
            } else {
                var tx_pattern_result = yield collection.findOne({entrezid: gene});
            }
        } catch(err){
            console.log(err)
        }

        if (tx_pattern_result == null | gene_expression_result == null) {
            outputJson = {gene: false};
        } else {
            outputJson = {gene: true};
        }

        res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin':'*'});
        res.write(JSON.stringify(outputJson));
        res.end();

        // Db close
        db.close();
    };

    co(fn());

}).listen(8082, 'localhost');
console.log('Server running at http://localhost:8082/');

