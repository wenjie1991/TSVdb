library(jsonlite)
library(stringr)
library(data.table)
library(plyr)
library(magrittr)

#' Transcription pattern
library(rtracklayer)
library(org.Hs.eg.db)
library(GenomicFeatures)
library(TxDb.Hsapiens.UCSC.hg19.knownGene)
txdb <- TxDb.Hsapiens.UCSC.hg19.knownGene
txdb_gene = genes(txdb)
txdb_exon = exonsBy(txdb, "tx")
txdb_tx = transcriptsBy(txdb, "gene")

entrezid_list = keys(org.Hs.eg.db)
symbol_list = suppressMessages(select(org.Hs.eg.db, entrezid_list, columns="SYMBOL")[["SYMBOL"]])
names(symbol_list) = entrezid_list
txid_list = keys(txdb, "TXID")
names(txid_list) = keys(txdb, "TXNAME")

get_tx_pattern = function(entrezid) {
    print(entrezid)
    tx_grl = txdb_tx[[entrezid]]
    if (length(tx_grl) == 0) {
        return(NULL)
    }
    txnames = tx_grl$tx_name
    tx = list()
    for (i in 1:length(txnames)) {
        tx_gr = tx_grl[i]
        exon_gr = suppressMessages(txdb_exon[[txid_list[txnames[i]]]])
        tx[[i]] = list(
            chr = as.character(chrom(tx_gr))
            , start = start(tx_gr)
            , end = end(tx_gr)
            , strand = as.character(strand(tx_gr))
            , exon = data.frame(
                chr = as.character(chrom(exon_gr))
                , start = start(exon_gr)
                , end = end(exon_gr)
                , strand = as.character(strand(exon_gr))
                , rank = exon_gr$exon_rank
                )
            )
    }
    names(tx) = txnames
    toJSON(list( entrezid = entrezid , symbol = symbol_list[entrezid] , tx = tx), auto_unbox = T)
}

tx_pattern_jsons = mclapply(entrezid_list, get_tx_pattern, mc.cores = 15) %>% unlist
# names(tx_pattern_jsons) = symbols

write(str_c(tx_pattern_jsons, collapse=""), "tx_pattern.json")
