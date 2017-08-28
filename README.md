# TSVdb
TCGA Splicing Variation Database

# Usage
TSVdb is an easy-to-use web tool for the integration and visualization of mRNA splicing variation, transcirptional isoform expression and clinical information from The Cancer Genome Atlas project (TCGA) RNASeq data.

# API
## Check gene input
http://localhost:8082?gene=`gene name or entrezid`&tumor=`tumor type`

## Query Json for plot
http://localhost:8081?gene=`gene name or entrezid`&tumor=`tumor type`&cd=`clinical information type`&area=`exon or junction`

## Download data table
http://localhost:8083?gene=`gene name or entrezid`&tumor=`tumor type`&cd=`clinical information type`&area=`exon or junction`

# Demo
## Setup
```
git clone git@github.com:wenjie1991/TSVdb.git
cd TSVdb
http-server -p 8080
chrome http://localhost:8080/index.html
chrome http://localhost:8080/instruction.html
chrome http://localhost:8080/plot.html
```

## Test (for plot_demo.html)
    In plot_demo.html: COAD -> 1 -> Exon -> SampleType
