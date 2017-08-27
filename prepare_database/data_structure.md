# gene
```
{
    "entrezid":Str,
    "symbol":Str,
//   TODO: add ensemblid
    "gene_expression":[
        {sampleID.1:expression_value.1},
        {sampleID.2:expression_value.2},
    ]
}
```

# transcription_pattern
```
{ "entrezid":Str, "symbol":Str,
    "tx":[
        ucsc_tx_id.1:{ "chr":Str, "start":Num, "end":Num, "strand":Str, 
            "exon":[
                { "chr":Str, "start":Num, "end":Num, "strand":Str, "rank":Num1 },
                { "chr":Str, "start":Num, "end":Num, "strand":Str, "rank":Num2 }
            ]
        }, 
        ucsc_tx_id.2:{ "chr":Str, "start":Num, "end":Num, "strand":Str, 
            "exon":[
                { "chr":Str, "start":Num, "end":Num, "strand":Str, "rank":Num1 },
                { "chr":Str, "start":Num, "end":Num, "strand":Str, "rank":Num2 }
            ]
        }, 
    ]
}
```


# exon_count 
```
{
    exon = [
        { "chr":Str, "start":Num, "end":Num, "strand":Str},
        { "chr":Str, "start":Num, "end":Num, "strand":Str},
    ],
    RPKM = [
        {sampleID:Num, sampleID:Num},
        {sampleID:Num, sampleID:Num},
    ]
}
```

# tx_expression 
```
{
    ucsc_tx_id.1:{sampleID:Num, sampleID:Num},
    ucsc_tx_id.2:{sampleID:Num, sampleID:Num},
}
```

# junction_count = 
```
[
    junc = [
        {"chr":Str, "start":Num, "end":Num, "strand":Str, "count":Num},
        {"chr":Str, "start":Num, "end":Num, "strand":Str, "count":Num}
    ],
    count = [
        {sampleID:Num, sampleID:Num},
        {sampleID:Num, sampleID:Num}
    ]
]
```

# clinical 
```
{
    sampleID:{sample_type:Str},
    sampleID:{sample_type:Str},
}
```
    

