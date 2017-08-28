#!/usr/bin/env perl6

my @tumor_types = "./tumor_type_list.txt".IO.lines.map({$_ unless $_ ~~ /^\#/ });
my Hash @gz_file_list;

## prepare link
for @tumor_types -> $tumor_type {
    my $link = "http://gdac.broadinstitute.org/runs/stddata__2016_01_28/data/{$tumor_type}/20160128/gdac.broadinstitute.org_{$tumor_type}.Merge_rnaseqv2__illuminahiseq_rnaseqv2__unc_edu__Level_3__RSEM_genes_normalized__data.Level_3.2016012800.0.0.tar.gz
    http://gdac.broadinstitute.org/runs/stddata__2016_01_28/data/{$tumor_type}/20160128/gdac.broadinstitute.org_{$tumor_type}.Merge_rnaseqv2__illuminahiseq_rnaseqv2__unc_edu__Level_3__RSEM_isoforms_normalized__data.Level_3.2016012800.0.0.tar.gz
    http://gdac.broadinstitute.org/runs/stddata__2016_01_28/data/{$tumor_type}/20160128/gdac.broadinstitute.org_{$tumor_type}.Merge_rnaseqv2__illuminahiseq_rnaseqv2__unc_edu__Level_3__exon_quantification__data.Level_3.2016012800.0.0.tar.gz
    http://gdac.broadinstitute.org/runs/stddata__2016_01_28/data/{$tumor_type}/20160128/gdac.broadinstitute.org_{$tumor_type}.Merge_rnaseqv2__illuminahiseq_rnaseqv2__unc_edu__Level_3__junction_quantification__data.Level_3.2016012800.0.0.tar.gz
    http://gdac.broadinstitute.org/runs/stddata__2016_01_28/data/{$tumor_type}/20160128/gdac.broadinstitute.org_{$tumor_type}.Merge_Clinical.Level_1.2016012800.0.0.tar.gz";
    my @link_file = $link.lines;
    @gz_file_list.append(@link_file.map({ link => $_, tumor_type => $tumor_type })>>.Hash);
}

my @md5_file_list = @gz_file_list.map({ {link =>  $_<link> ~ ".md5", tumor_type => $_<tumor_type>} })>>.Hash;

sub download_gz_file($link, $tumor_type) {
    unless $tumor_type.IO.d {
        shell "mkdir -p $tumor_type";
    }
    sleep 1;
    shell "cd $tumor_type; axel -an 10 $link";
}

sub download_md5_file($link, $tumor_type) {
    unless $tumor_type.IO.d {
        shell "mkdir -p $tumor_type";
    }
    sleep 1;
    shell "cd $tumor_type; wget $_";
}

@gz_file_list.race(degree => 3).map({
    download_gz_file($_<link>, $_<tumor_type>);
});


# check file integrity
#my $md5sum_check_result =  qqx[cd $tumor_type; md5sum -c --quiet *.md5 2>/dev/null > md5_check_result.txt];
