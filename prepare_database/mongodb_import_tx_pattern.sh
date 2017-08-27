#!/bin/bash 

tumor_type={{tumor_type}}

mongoimport --drop --db sv --collection tx_pattern           --file tx_pattern.json
