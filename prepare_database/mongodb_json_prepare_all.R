#!/usr/bin/env Rscript 

############################################
# USAGE
# mongodb_json_prepare_all.R [tumor name(exp. COAD)]

args = commandArgs(trailingOnly = TRUE)


library(jsonlite)
library(stringr)
library(org.Hs.eg.db)
library(rtracklayer)
library(org.Hs.eg.db)
library(GenomicFeatures)
library(TxDb.Hsapiens.UCSC.hg19.knownGene)
library(BiocParallel)
library(data.table)
library(magrittr)
library(plyr)

txdb <- TxDb.Hsapiens.UCSC.hg19.knownGene
txdb_gene = genes(txdb)
txdb_exon = exonsBy(txdb, "tx")
txdb_tx = transcriptsBy(txdb, "gene")

tumor_type = args[1]
print(tumor_type)
dir.create(tumor_type)
dir.create(paste0(tumor_type, "/json"))
setwd(tumor_type)

## input
gene_expression_file = str_c("../../original_data/", tumor_type, "/gdac.broadinstitute.org_", tumor_type, ".Merge_rnaseqv2__illuminahiseq_rnaseqv2__unc_edu__Level_3__RSEM_genes_normalized__data.Level_3.2016012800.0.0/", tumor_type, ".rnaseqv2__illuminahiseq_rnaseqv2__unc_edu__Level_3__RSEM_genes_normalized__data.data.txt")
exon_expression_file = str_c("../../original_data/", tumor_type, "/gdac.broadinstitute.org_", tumor_type, ".Merge_rnaseqv2__illuminahiseq_rnaseqv2__unc_edu__Level_3__exon_quantification__data.Level_3.2016012800.0.0/", tumor_type, ".rnaseqv2__illuminahiseq_rnaseqv2__unc_edu__Level_3__exon_quantification__data.data.txt")
tx_expression_file = str_c("../../original_data/", tumor_type, "/gdac.broadinstitute.org_", tumor_type, ".Merge_rnaseqv2__illuminahiseq_rnaseqv2__unc_edu__Level_3__RSEM_isoforms_normalized__data.Level_3.2016012800.0.0/", tumor_type, ".rnaseqv2__illuminahiseq_rnaseqv2__unc_edu__Level_3__RSEM_isoforms_normalized__data.data.txt")
juc_expression_file = str_c("../../original_data/", tumor_type, "/gdac.broadinstitute.org_", tumor_type, ".Merge_rnaseqv2__illuminahiseq_rnaseqv2__unc_edu__Level_3__junction_quantification__data.Level_3.2016012800.0.0/", tumor_type, ".rnaseqv2__illuminahiseq_rnaseqv2__unc_edu__Level_3__junction_quantification__data.data.txt")
clinical_file = str_c("../../original_data/", tumor_type, "/gdac.broadinstitute.org_", tumor_type, ".Merge_Clinical.Level_1.2016012800.0.0/", tumor_type, ".merged_only_clinical_clin_format.txt")

## output
gene_expression_output = str_c("./json/gene_expression_", tumor_type, ".json")
exon_expression_output = str_c("./json/exon_count_", tumor_type, ".json")
transcripts_expression_output = str_c("./json/transcripts_expression_", tumor_type, ".json")
juc_expression_output = str_c("./json/juc_count_", tumor_type, ".json")
clinical_output = str_c("./json/clinical_", tumor_type, ".json")

#' Prepare
entrezid_list = keys(org.Hs.eg.db)
e_data = fread(gene_expression_file)
colnames(e_data)[-1] = str_match(colnames(e_data)[-1], "TCGA\\-..\\-....\\-...")
gene_entrizid = e_data$`Hybridization REF` %>% str_split("\\|") %>% laply(function(x) { x[2] }) %>% extract(-1)
entrezid_list = intersect(entrezid_list, gene_entrizid)
symbol_list = suppressMessages(select(org.Hs.eg.db, entrezid_list, columns="SYMBOL")[["SYMBOL"]])
names(symbol_list) = entrezid_list


# ' Gene 
get_gene_expression = function(entrezid) {
    entriz_query = paste0("\\|", entrezid, "$")
    symbol = symbol_list[entrezid]
    gene_e = e_data[grepl(entriz_query, `Hybridization REF`)]
    if (length(gene_e)) {
        toJSON(list(
                entrezid = entrezid
                , symbol = symbol
                , gene_expression = gene_e[, -1] %>% as.list), auto_unbox=T)
    } else {
        return(NULL)
    } 
}
gene_expression_jsons = mclapply(entrezid_list, get_gene_expression, mc.cores = 15) %>% unlist
write(str_c(gene_expression_jsons, collapse = ""), gene_expression_output)


#' Exon
exon_data = fread(exon_expression_file)

colname = exon_data[1, ]
# colname[1:5] %>% unlist
exon_rm_exonID = exon_data[, -1]
exon_count = data.frame(exon_rm_exonID[, seq(3, ncol(exon_rm_exonID), by = 3), with = F], check.names = F)
exon_count = exon_count[-1, ]
library(stringr)
colnames(exon_count) = str_match(colnames(exon_count), "TCGA\\-..\\-....\\-...")
exon_loci = as(exon_data[[1]][-1], "GRanges")

get_exon_count= function(entrezid) {
    tx_grl = txdb_tx[[entrezid]]
    if (length(tx_grl) == 0) {
        return(NULL)
    }
    hits = suppressWarnings(findOverlaps(exon_loci, tx_grl))
    if (length(hits) == 0) {
        return(NULL)
    } else {
        exon_loci_hits = exon_loci[unique(queryHits(hits))]
        exon_count_hits = exon_count[unique(queryHits(hits)), ] 
        exon_count_sum = colSums(data.matrix(exon_count_hits), na.rm=T) / nrow(exon_count_hits) 

        toJSON(list(
                entrezid = entrezid,
                symbol = symbol_list[entrezid],
                exon = data.frame(
                    chr = chrom(exon_loci_hits)
                    , start = start(exon_loci_hits)
                    , end = end(exon_loci_hits)
                    , strand = strand(exon_loci_hits)
                    )
                , value = exon_count_hits
                , value_mean = as.list(exon_count_sum)
                ), auto_unbox = T)
    }
}

exon_count_jsons = mclapply(entrezid_list, get_exon_count, mc.cores = 15) %>% unlist
# names(exon_count_jsons) = symbols
file.remove(exon_expression_output)
for (i in 1:length(exon_count_jsons)) {
    write(exon_count_jsons[i], exon_expression_output, append=T) 
}

#' Transcript
tx_data = fread(tx_expression_file)
tx_data = tx_data[-1] 
tx_data$`Hybridization REF` = sub("\\.\\d+", "", tx_data$`Hybridization REF`)
setkey(tx_data, `Hybridization REF`)

get_transcripts_expression = function(entrezid) {
    tx_grl = txdb_tx[[entrezid]]
    if (length(tx_grl) == 0) {
        return(NULL)
    }
    txnames = tx_grl$tx_name %>% sub("\\.\\d+", "", .)
    tx_dt = tx_data[txnames][, -1]
    rownames(tx_dt) = txnames
    colnames(tx_dt) = str_trunc(colnames(tx_dt), 16, ellipsis = "")

    tx_expression = list()
    for (i in 1:length(txnames)) {
        tx_expression[[i]] = tx_dt[i, ] %>% as.list
    }
    names(tx_expression) = txnames

    tx_list = list(
        symbol = symbol_list[entrezid] 
        , entrezid = entrezid
        , tx_expression = tx_expression
        )
    toJSON(tx_list, auto_unbox = T)
}

transcripts_expression_jsons = mclapply(entrezid_list, get_transcripts_expression, mc.cores = 15) %>% unlist

file.remove(transcripts_expression_output)
for (i in 1:length(transcripts_expression_jsons)) {
    write(transcripts_expression_jsons[i], transcripts_expression_output, append = T)
}


#' Junction
juc_data = fread(juc_expression_file)
juc_m = juc_data[-1, -1, with = F]

juc_loci = mclapply(juc_data[-1, 1, with=F] %>% unlist, function(x) {
    x_df = x %>% strsplit(',') %>% unlist %>% strsplit(":") %>% ldply()
    exon_start = x_df[1, 2]
    exon_end = x_df[2, 2]
    chr = x_df[1, 1]
    strand = x_df[1, 3]
    paste(chr, paste0(exon_start, "-",  exon_end), strand, sep = ":")
        }, mc.cores = 15) %>% unlist %>% as.character

juc_gr = as(juc_loci, "GRanges")



get_junction = function(entrezid) {
    gene_gr = txdb_tx[[entrezid]]
    if (length(gene_gr) == 0) {
        return(NULL)
    }
    gene_gr = range(gene_gr)
    hits = queryHits(suppressWarnings(findOverlaps(juc_gr, gene_gr)))
    if (length(hits) == 0) {
        return(NULL)
    }
    juc_gr_hits = juc_gr[hits]
    juc_m_sub = juc_m[hits, ]

    orders = order(start(juc_gr_hits) + end(juc_gr_hits))
    juc_gr_hits = juc_gr_hits[orders]
    juc_m_sub = juc_m_sub[orders, ]
    colnames(juc_m_sub) = str_trunc(colnames(juc_m_sub), 16, ellipsis = "")

    value_mean = colSums(data.matrix(juc_m_sub), na.rm = T) / nrow(juc_m_sub) 

    juc_list = list(
        entrezid = entrezid,
        symbol = symbol_list[entrezid],
        exon = data.frame(
            chr = chrom(juc_gr_hits)
            , start = start(juc_gr_hits)
            , end = end(juc_gr_hits)
            , strand = strand(juc_gr_hits)
            )
        , value = juc_m_sub
        , value_mean = as.list(value_mean)
        )
    toJSON(juc_list, auto_unbox = T)
}

juc_jsons = mclapply(entrezid_list, get_junction, mc.cores = 15) %>% unlist
file.remove(juc_expression_output)
for (i in 1:length(juc_jsons)) {
    write(juc_jsons[i], juc_expression_output, append = T)
}
