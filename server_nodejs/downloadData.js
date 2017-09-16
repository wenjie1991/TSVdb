var http = require('http');
var exec = require('child_process').exec;
var url = require('url');
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient,
    co = require('co');
var zlib = require('zlib');

var re = /^\d+$/;

// API:
// ?tumor=COAD&gene=GAPDH&cd=sampletype&area=exon

function get_header(cd, gene_sort, tx_expression, areaData) {
    // sampleID, clinical, os_time, os_event, gene_expression, isoform_expression, exion/junction_expression
    var header = ["sampleID", cd, "os_time", "os_event", gene_sort];
    for (i in tx_expression.tx_expression) {
        header.push(i);
    }
    for (i in areaData.exon) {
        header.push(areaData.exon[i].chr + ":" + areaData.exon[i].start + "-" + areaData.exon[i].end);
    }
    return header.join("\t");
}

function push_valide(x, y) {
    if (y != undefined) {
        x.push(y);
    } else {
        x.push("");
    }
    return x;
}

function get_line(sampleID_i, clinical_json, os, gene_expression, tx_expression, areaData) {

    var line = [sampleID_i];

    line.push(clinical_json[sampleID_i]);
    var os_i = os.value[sampleID_i.substr(0, 15)];
    if (os_i == undefined) {
        line.push("");
        line.push("");
    } else {
        line.push(os_i.time);
        line.push(os_i.event);
    }


    line = push_valide(line, gene_expression.gene_expression[sampleID_i]);

    for (i in tx_expression.tx_expression) {
        line = push_valide(line, tx_expression.tx_expression[i][sampleID_i]);
    }

    for (i in areaData.value) {
        line = push_valide(line, areaData.value[i][sampleID_i] / areaData.value_mean[sampleID_i]);
    }

    return line.join("\t");
}

function prepare_table(
    cd,
    gene_sort, 
    clinical,
    os,
    tx_expression,
    gene_expression,
    areaData
) {
    var sampleID = [], clinical_json = {};
    for (i in clinical.value) {
        clinical_json[i] = clinical.cdCode[clinical.value[i][0]];
    }
    for (var i in gene_expression.gene_expression) {
        console.log(i.substr(0, 15));
        if (clinical_json[i.substr(0, 15)]) {
            sampleID.push(i);
        }
    }

    var csv = [];
    csv.push(get_header(cd, gene_sort, tx_expression, areaData));

    for (i in sampleID) {
        csv.push(get_line(sampleID[i], clinical_json, os, gene_expression, tx_expression, areaData));
    }

    return csv.join("\n");
}


http.createServer(function(req, res) {
    function* fn() {
        var urlParsed = url.parse(req.url, true);
        var gene = urlParsed['query']["gene"];
        var tumor = urlParsed['query']["tumor"];
        var cd = urlParsed['query']["cd"];
        var area = urlParsed['query']["area"];
        var gene_sort = urlParsed['query']['gene_sort'];

        var db = yield MongoClient.connect('mongodb://localhost:27017/sv');

        var gene_field;
        if (re.test(gene)) {
            gene_field = "entrezid";
        } else {
            gene_field = "symbol";
        }

        var gene_sort_field;
        if (re.test(gene_sort)) {
            gene_sort_field = "entrezid";
        } else {
            gene_sort_field = "symbol";
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
                var collection = db.collection('exon_count_' + tumor);
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
            if (gene_sort_field == "symbol") {
                var gene_expression_result = yield collection.findOne({symbol: gene_sort});
            } else {
                var gene_expression_result = yield collection.findOne({entrezid: gene_sort});
            }
            //            delete gene_expression_result["_id"];
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
            //            delete tx_expression_result["_id"];
        } catch(err){
            console.log(err)
        }
        //        console.log(tx_expression_result);


        // clinical
        try {
            var collection = db.collection("clinical_" + tumor);
            var clinical_result = yield collection.findOne({"cd": cd});
            var overall_survival_result = yield collection.findOne({"cd": "overall_survival"});
            //            delete clinical_result['_id'];
        } catch(err){
            console.log(err)
        }
        //        console.log(clinical_result);

        try {
            var csv = prepare_table(
                cd              = cd,
                gene_sort       = gene_sort,
                clinical        = clinical_result,
                os              = overall_survival_result,
                tx_expression   = tx_expression_result,
                gene_expression = gene_expression_result,
                areaData        = areaData
            ) 
        } catch(err) {
            console.log(err)
        }

        // Ref. https://stackoverflow.com/questions/14778239/nodejs-send-data-in-gzip-using-zlib
        var buf = new Buffer(csv, "utf-8");
        zlib.gzip(buf, function (_, result) {  // The callback will give you the 
            res.writeHead(200, {
                'Content-Type': 'text/plain', 
                'Access-Control-Allow-Origin':'*',
                'Content-Encoding': 'gzip'
            });
            res.end(result);                     // result, so just send it.
        });

        // Db close
        db.close();
    };
    co(fn());
}).listen(8083, 'localhost');
console.log('Server running at http://localhost:8083/');
