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

function get_header(clinical_data_array, gene_sort, tx_expression, exon_count, junction_count) {
    // sampleID, clinical, os_time, os_event, gene_expression, isoform_expression, exion/junction_expression
    var header = ["sampleID"]
    for (var i = 0; i < clinical_data_array.length; i++) {
        if (clinical_data_array[i].cd == "overall_survival") continue;
        header.push("clinical_" + clinical_data_array[i].cd);
    }
    header = header.concat(["os_time", "os_event", "gene_" + gene_sort]);

    // isoform header
    for (i in tx_expression.tx_expression) {
        header.push("isoform_" + i);
    }

    // exon header
    for (i in exon_count.exon) {
        header.push("exon_" + exon_count.exon[i].chr + ":" + exon_count.exon[i].start + "-" + exon_count.exon[i].end);
    }

    // junction header
    for (i in junction_count.exon) {
        header.push("junction_" + junction_count.exon[i].chr + ":" + junction_count.exon[i].start + "-" + junction_count.exon[i].end);
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

function get_line(sampleID_i, clinical_json, os, gene_expression, tx_expression, exon_count, junction_count) {

    // sample id
    var line = [sampleID_i];

    // clinical variable
    line = line.concat(clinical_json[sampleID_i.substr(0, 15)]);

    // overall survival
    var os_i = os.value[sampleID_i.substr(0, 15)];
    if (os_i == undefined) {
        line.push("");
        line.push("");
    } else {
        line.push(os_i.time);
        line.push(os_i.event);
    }

    // gene expression
    line = push_valide(line, gene_expression.gene_expression[sampleID_i]);

    // isoform expression
    for (i in tx_expression.tx_expression) {
        line = push_valide(line, tx_expression.tx_expression[i][sampleID_i]);
    }

    // exon quantification or usage
    for (i in exon_count.value) {
        // usage
//        line = push_valide(line, exon_count.value[i][sampleID_i] / exon_count.value_mean[sampleID_i]);
        // quantification
        line = push_valide(line, exon_count.value[i][sampleID_i]);
    }

    // junction quantification or usage
    for (i in junction_count.value) {
        // usage
//        line = push_valide(line, junction_count.value[i][sampleID_i] / junction_count.value_mean[sampleID_i]);
        // quantification
        line = push_valide(line, junction_count.value[i][sampleID_i] / junction_count.value_mean[sampleID_i]);
    }
    
    return line.join("\t");
}

function prepare_table(
    gene_sort, 
    clinical_data_array,
    os,
    tx_expression,
    gene_expression,
    exon_count,
    junction_count
) {
    var sampleID = [], clinical_json = {};

    for (var i=0; i<clinical_data_array.length; i++) {
        if (clinical_data_array[i].cd == "overall_survival") continue;
        for (sampleID_long in clinical_data_array[i].value) {
            if (! (clinical_json[sampleID_long.substr(0, 15)] instanceof Array))
                clinical_json[sampleID_long.substr(0, 15)] = new Array();
            clinical_json[sampleID_long.substr(0, 15)].push(clinical_data_array[i].cdCode[clinical_data_array[i].value[sampleID_long]]);
        }
    }

    for (var i in gene_expression.gene_expression) {
        if (clinical_json[i.substr(0, 15)]) {
            sampleID.push(i);
        }
    }

    var csv = [];
    csv.push(get_header(clinical_data_array, gene_sort, tx_expression, exon_count, junction_count));

    for (i in sampleID) {
        csv.push(get_line(sampleID[i], clinical_json, os, gene_expression, tx_expression, exon_count, junction_count));
    }

    return csv.join("\n");
}


http.createServer(function(req, res) {
    function* fn() {
        var urlParsed = url.parse(req.url, true);
        var gene = urlParsed['query']["gene"];
        var tumor = urlParsed['query']["tumor"];
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

        try{
            var collection = db.collection('exon_count_' + tumor);
            if (gene_field == "symbol") {
                var exon_count = yield collection.findOne({symbol: gene});
            } else {
                var exon_count = yield collection.findOne({entrezid: gene});
            }
        } catch(err){
            console.log(err)
        }
        //        console.log(exon_count);

        // juc_count: junction count
        try {
            var collection = db.collection('juc_count_' + tumor);
            if (gene_field == "symbol") {
                var junction_count = yield collection.findOne({symbol: gene});
            } else {
                var junction_count = yield collection.findOne({entrezid: gene});
            }
            //                delete junction_count["_id"];
        } catch(err){
            console.log(err)
        }

        // gene_expression: expression information of genes
        try {
            var collection = db.collection('gene_expression_' + tumor);
            if (gene_sort_field == "symbol") {
                var gene_expression_result = yield collection.findOne({symbol: gene_sort});
            } else {
                var gene_expression_result = yield collection.findOne({entrezid: gene_sort});
            }
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
        } catch(err){
            console.log(err)
        }
        //        console.log(tx_expression_result);


        // clinical
        try {
            var collection = db.collection("clinical_" + tumor);
            var clinical_data_array = yield collection.find({}).toArray();
            var overall_survival = yield collection.findOne({"cd": "overall_survival"});
        } catch(err){
            console.log(err)
        }
        //        console.log(clinical_result);

        try {
            var csv = prepare_table(
                gene_sort       = gene_sort,
                clinical_data_array  = clinical_data_array,
                os              = overall_survival,
                tx_expression   = tx_expression_result,
                gene_expression = gene_expression_result,
                exon_count      = exon_count,
                junction_count  = junction_count
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
