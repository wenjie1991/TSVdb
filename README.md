# Bug Reporting & Suggestion
Please feel free to open an issue or sent an email to sunwjie@gmail.com.

# TSVdb
TCGA Splicing Variation Database
![](https://raw.githubusercontent.com/wenjie1991/TSVdb/master/amination.gif)

# Usage
TSVdb is an easy-to-use web tool for the integration and visualization of mRNA splicing variation, transcriptional isoform expression and clinical information from The Cancer Genome Atlas project (TCGA) RNASeq data.

# Frequently asked question
> I have a specific isoform in mind. How can I locate it in the results?</summary>
    
In the databse, we use UCSC transcriptome isoform id system. 
When you use your mouse hover the isoforms listed on the left of the output, you can see the id.
If you want to know more about it, you can search it in UCSC genome browser by clicking the isoform, then and isoform id in a pop up window.
Now, you will be brought to the UCSC genome browser and has the selected isoform highlighted.
In the UCSC genome browser, you can load the ENSEMBL/NCBI transcriptome annotation, and identify the corresponding isoform in other database. 
    
![Jan-16-2024 17-04-32](https://github.com/wenjie1991/TSVdb/assets/6602710/944f799e-47cc-4cdb-859f-71d72d22768d)

> How to convert UCSC id used in the database to ENSEMBL id

You can find the NCBI id in UCSC Genome Browser corresponding to UCSC id:
![2020-01-16 17-38-15 2020-01-16 17_39_09](https://user-images.githubusercontent.com/6602710/72544195-2de5d980-3887-11ea-986b-46066f47af76.gif)

> When downloading the data from TSVdb, what are the units of the exon usage and isoform value?

The units of downloaded **exon** data are **RPKM** values (Reads Per Kilobase of exon model per Million mapped reads).
For **isoforms**, it is **RSEM**. 
