var http = require('http');
var exec = require('child_process').exec;
var url = require('url');
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient,
    co = require('co');
var zlib = require('zlib');

var re = /^\d+$/;

http.createServer(function(req, res) {
    function* fn() {
        var urlParsed = url.parse(req.url, true);
        var gene = urlParsed['query']["gene"];
        var tumor = urlParsed['query']["tumor"];
        var cd = urlParsed['query']["cd"];
        var area = urlParsed['query']["area"];


        var db = yield MongoClient.connect('mongodb://localhost:27017/sv');

        var gene_field;
        if (re.test(gene)) {
            gene_field = "entrezid";
        } else {
            gene_field = "symbol";
        }


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
        //        console.log(tx_pattern_result);

        if (area == "exon") {
            // exon_count: expression of each exon
            try{
                var collection = db.collection('exon_RPKM_' + tumor);
                if (gene_field == "symbol") {
                    var areaData = yield collection.findOne({symbol: gene});
                } else {
                    var areaData = yield collection.findOne({entrezid: gene});
                }
//                delete areaData["_id"];
            } catch(err){
                console.log(err)
            }
            //        console.log(areaData);
        } else {
            // juc_count: junction count
            try {
                var collection = db.collection('juc_count_' + tumor);
                if (gene_field == "symbol") {
                    var areaData = yield collection.findOne({symbol: gene});
                } else {
                    var areaData = yield collection.findOne({entrezid: gene});
                }
//                delete areaData["_id"];
            } catch(err){
                console.log(err)
            }
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

        // tx_expression: expression information of transcriptional isoform
        try {
            var collection = db.collection('transcripts_expression_' + tumor);
            if (gene_field == "symbol") {
                var tx_expression_result = yield collection.findOne({symbol: gene});
            } else {
                var tx_expression_result = yield collection.findOne({entrezid: gene});
            }
            delete tx_expression_result["_id"];
        } catch(err){
            console.log(err)
        }
        //        console.log(tx_expression_result);


        // clinical
        try {
            var collection = db.collection("clinical_" + tumor);
            var clinical_result = yield collection.findOne({"cd": cd});
            var overall_survival_result = yield collection.findOne({"cd": "overall_survival"});
            delete clinical_result['_id'];
        } catch(err){
            console.log(err)
        }
        //        console.log(clinical_result);


        // output json object
        var outputJson = {
            areaData: areaData,
            gene_expression: gene_expression_result,
            tx_pattern: tx_pattern_result,
            tx_expression: tx_expression_result,
            clinical: clinical_result,
            os: overall_survival_result,
        } 
        //        console.log(JSON.stringify(outputJson));
        //        res.json(outputJson);

        // Ref. https://stackoverflow.com/questions/14778239/nodejs-send-data-in-gzip-using-zlib
        var buf = new Buffer(JSON.stringify(outputJson), "utf-8");
        zlib.gzip(buf, function (_, result) {  // The callback will give you the 
            res.writeHead(200, {
                'Content-Type': 'application/json', 
                'Access-Control-Allow-Origin':'*',
                'Content-Encoding': 'gzip'
            });
            res.end(result);                     // result, so just send it.
        });

        //        res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin':'*'});
        //        res.write(JSON.stringify(outputJson));
        //        res.end();

        // Db close
        db.close();
    };
    co(fn());
}).listen(8081, 'localhost');
console.log('Server running at http://localhost:8081/');

