var http = require('http');
var exec = require('child_process').exec;
var url = require('url');
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient,
    co = require('co');

var re = /^\d+$/;

http.createServer(function(req, res) {
    function* fn() {
        var urlParsed = url.parse(req.url, true);
        var gene = urlParsed['query']["gene"];
        var tumor = urlParsed['query']["tumor"];
        var cd = urlParsed['query']["cd"];


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

        // exon_RPKM: expression of each exon
        try{
            var collection = db.collection('exon_RPKM_' + tumor);
            if (gene_field == "symbol") {
                var exon_RPKM_result = yield collection.findOne({symbol: gene});
            } else {
                var exon_RPKM_result = yield collection.findOne({entrezid: gene});
            }
            delete exon_RPKM_result["_id"];
        } catch(err){
            console.log(err)
        }
//        console.log(exon_RPKM_result);

        // juc_count: junction count
        try {
            var collection = db.collection('juc_count_' + tumor);
            if (gene_field == "symbol") {
                var juc_count_result = yield collection.findOne({symbol: gene});
            } else {
                var juc_count_result = yield collection.findOne({entrezid: gene});
            }
            delete juc_count_result["_id"];
        } catch(err){
            console.log(err)
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
            juc_count: juc_count_result,
            exon_count: exon_RPKM_result,
            gene_expression: gene_expression_result,
            tx_pattern: tx_pattern_result,
            tx_expression: tx_expression_result,
            clinical: clinical_result,
            os: overall_survival_result,
        } 
//        console.log(JSON.stringify(outputJson));
//        res.json(outputJson);
        res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin':'*'});
        res.write(JSON.stringify(outputJson));
        res.end();

        // Db close
        db.close();
    };

    co(fn());

}).listen(8081, 'localhost');
console.log('Server running at http://localhost:8081/');
