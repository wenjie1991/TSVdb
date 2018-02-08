#!/usr/bin/env Rscript

#######################################
# Because the gene symbol list in each dataset is the same, 
# so abstract the gene symbol list in COAD datasets and build 
# the gene autocomplete file.

library(stringr)

tumor_type = "COAD"

## input file
gene_expression_file = str_c("../../data/original_data/", tumor_type, "/gdac.broadinstitute.org_", tumor_type, ".Merge_rnaseqv2__illuminahiseq_rnaseqv2__unc_edu__Level_3__RSEM_genes_normalized__data.Level_3.2016012800.0.0/", tumor_type, ".rnaseqv2__illuminahiseq_rnaseqv2__unc_edu__Level_3__RSEM_genes_normalized__data.data.txt")


library(org.Hs.eg.db)
entrezid_list = keys(org.Hs.eg.db)
e_data = fread(gene_expression_file)
colnames(e_data)[-1] = str_match(colnames(e_data)[-1], "TCGA\\-..\\-....\\-...")
gene_entrizid = e_data$`Hybridization REF` %>% str_split("\\|") %>% laply(function(x) { x[2] }) %>% extract(-1)
entrezid_list = intersect(entrezid_list, gene_entrizid)
symbol_list = suppressMessages(select(org.Hs.eg.db, entrezid_list, columns="SYMBOL")[["SYMBOL"]])
names(symbol_list) = entrezid_list

columns(org.Hs.eg.db)
output_tab = select(org.Hs.eg.db, entrezid_list, c("ALIAS", "GENENAME", "SYMBOL"), 'ENTREZID')
output_tab$display = with(output_tab, paste0(SYMBOL, " [", ENTREZID, "] ", GENENAME))

## test if all the symbol is in alias
symbol_unique = unique(output_tab$SYMBOL)
length(symbol_unique)
sum(symbol_unique %in% output_tab$ALIAS)  
## The result is all the symbol was in alias
## So We can use alias to match the gene symbol.

write_tsv(output_tab, "../../data/import_to_mongodb/gene_autocomplete_list.tsv")

library(jsonlite)
file.remove("../../data/import_to_mongodb/gene_autocomplete_list.json")
for (i in 1:nrow(output_tab)) {
    write(toJSON(as.list(output_tab[i, ]), auto_unbox=T), "../../data/import_to_mongodb/gene_autocomplete_list.json", append=T)
}


