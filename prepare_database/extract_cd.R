#!/usr/bin/env Rscript 

# extract_cd.R [tumor name(exp. COAD)]
args = commandArgs(trailingOnly = TRUE)

library(jsonlite)
library(stringr)
library(data.table)
library(magrittr)
library(plyr)


## input
gene_expression_file = str_c("../../original_data/", tumor_type, "/gdac.broadinstitute.org_", tumor_type, ".Merge_rnaseqv2__illuminahiseq_rnaseqv2__unc_edu__Level_3__RSEM_genes_normalized__data.Level_3.2016012800.0.0/", tumor_type, ".rnaseqv2__illuminahiseq_rnaseqv2__unc_edu__Level_3__RSEM_genes_normalized__data.data.txt")
print(gene_expression_file)
file.exists(gene_expression_file)
clinical_file = str_c("../../original_data/", tumor_type, "/gdac.broadinstitute.org_", tumor_type, ".Merge_Clinical.Level_1.2016012800.0.0/", tumor_type, ".merged_only_clinical_clin_format.txt")

## output
clinical_output = str_c("./json/clinical_", tumor_type, ".json")

#' Prepare
e_data = fread(gene_expression_file)
colnames(e_data)[-1] = str_match(colnames(e_data)[-1], "TCGA\\-..\\-....\\-...")


#' Clinical Data
library(stringr)
clinical = fread(clinical_file)
clinical_sampleID = clinical[V1 == "patient.bcr_patient_barcode", -1, with=F] %>% toupper %>% str_c("-01")

## sampleType
sampleType_cd_json = (function(){
    sampleID = colnames(e_data)[-1]
    sampleType = c("NORMAL", "TUMOR")[(str_sub(sampleID, 14, 15) < 10) + 1]
    sampleType = revalue(sampleType, c('NORMAL' = '0', 'TUMOR' = '1'))
    sampleType_cd = list()
    sampleType_cd = as.list(sampleType)
    names(sampleType_cd) = sampleID
    sampleType_cdCode = list("0" = "NORMAL" , "1" = "TUMOR")
    toJSON(list(cd = "sampletype", value = sampleType_cd, cdCode = sampleType_cdCode), auto_unbox = T)
})()

## stage
(function(){
    stage = clinical[V1 == "patient.stage_event.pathologic_stage", -1, with=F] %>% toupper
    #     table(stage)
    stage = revalue(stage, c(
            'STAGE I'    = '0' ,'STAGE IA'   = '0' ,'STAGE II'   = '1'
            ,'STAGE IIA'  = '1'
            ,'STAGE IIB'  = '1'
            ,'STAGE IIC'  = '1'
            ,'STAGE III'  = '2'
            ,'STAGE IIIA' = '2'
            ,'STAGE IIIB' = '2'
            ,'STAGE IIIC' = '2'
            ,'STAGE IV'   = '3'
            ,'STAGE IVA'  = '3'
            ,'STAGE IVB'  = '3'
            )) 
    stage[is.na(stage)] = "4"
    stage = as.list(stage)
    names(stage) = clinical_sampleID
    stage_cdCode = list(
        '0' = 'STAGE I'
        ,'1' = 'STAGE II'
        ,'2' = 'STAGE III'
        ,'3' = 'STAGE IV'
        ,'4' = 'UNDEFINED'
        )
    toJSON(list(cd = 'stage', value = stage, cdCode = stage_cdCode), auto_unbox = T)
})() -> stage_cd_json 

## gender
(function(){
    gender = clinical[V1 == "patient.gender", -1, with=F] %>% toupper
    table(gender)
    gender = revalue(gender, c(
            'FEMALE' = '0'
            , 'MALE' = '1'
            ))
    gender[is.na(gender)] = "2"
    gender = as.list(gender)
    names(gender) = clinical_sampleID
    gender_cdCode = list(
        '0' = 'FEMALE'
        , '1' = 'MALE'
        , '2' = 'UNDEFINED'
        )
    toJSON(list(cd = 'gender', value=gender, cdCode = gender_cdCode), auto_unbox=T)
})() -> gender_cd_json

## survival
(function() {
    time2death = clinical[V1 == 'patient.follow_ups.follow_up.days_to_death', -1, with=F] %>% toupper
    time2last = clinical[V1 == 'patient.follow_ups.follow_up.days_to_last_followup', -1, with=F] %>% toupper
    time = time2death
    time[is.na(time)] = time2last[is.na(time)]

    clinical_sampleID_sub = clinical_sampleID[!is.na(time)]
    event = c(0, 1)[is.na(time2death) + 1][!is.na(time)] # 0 survival; 1 death;
    time = time[!is.na(time)]              # survival days
    
    value = list()
    for (i in 1:length(clinical_sampleID_sub)) {
        value[[i]] = list(time = time[i], event = event[i])
    }
    names(value) = clinical_sampleID_sub


    toJSON(list(cd = 'overall_survival', value = value), auto_unbox=T)
})() -> overall_survival_json


write(str_c(sampleType_cd_json, stage_cd_json, gender_cd_json, overall_survival_json), clinical_output)


