function round(num, digits) {
    return +(Math.round(num + "e+" + digits) + "e-" + digits);
}

var box_chart;

function boxplot(
    txid,
    rearranged_clinical,
    expression
) {
    var box_data = new Array();

    rearranged_clinical.value.map(function(d) {
        var person_expression = +expression[d[0]];
        person_expression = person_expression < 0.5 ? 0.5 : person_expression;
        box_data.push({x:d[1], y: Math.log2(person_expression)});
//        box_data.push({x:d[1], y: +expression[d[0]]});
    });



    $(".inner-wrapper").remove();


    box_chart = makeDistroChart({
        data: box_data,
        xName: 'x',
        yName: 'y',
        xCode: rearranged_clinical.cdCode,
        axisLabels: {xAxis: 'Years', yAxis: 'log2 RSEM value'},
        selector:".chart-wrapper",
        chartSize:{height:350, width:610},
        constrainExtremes:true});
    box_chart.renderBoxPlot();
    box_chart.renderDataPlots();
    box_chart.renderNotchBoxes({showNotchBox:false});
    box_chart.renderViolinPlot({showViolinPlot:false});
}

// figure type switcher
function show_box() {
    box_chart.boxPlots.show({reset:true});
    box_chart.violinPlots.hide();
	box_chart.notchBoxes.hide();
	box_chart.dataPlots.change({showPlot:false,showBeanLines:false})
}
function show_notchbox() {
    box_chart.notchBoxes.show({reset:true});
	box_chart.boxPlots.show({reset:true, showBox:false,showOutliers:true,boxWidth:20,scatterOutliers:true});
	box_chart.violinPlots.hide();
	box_chart.dataPlots.change({showPlot:false,showBeanLines:false})
}
function show_violin() {
    box_chart.violinPlots.show({reset:true, resolution:12});
	box_chart.boxPlots.show({reset:true, showWhiskers:false,showOutliers:false,boxWidth:10,lineWidth:15,colors:['#555']});
	box_chart.notchBoxes.hide();
	box_chart.dataPlots.change({showPlot:false,showBeanLines:false});
}
function show_bean() {
    box_chart.violinPlots.show({reset:true, width:100, resolution:12});
	box_chart.dataPlots.show({showBeanLines:true,beanWidth:15,showPlot:false,colors:['#555']});
	box_chart.boxPlots.hide();
	box_chart.notchBoxes.hide()
}
function show_beeswarm() {
    box_chart.dataPlots.show({showPlot:true, plotType:'beeswarm',showBeanLines:false, colors:null});
	box_chart.violinPlots.hide();
	box_chart.notchBoxes.hide();
	box_chart.boxPlots.hide();
}
function show_scatter() {
    box_chart.dataPlots.show({showPlot:true, plotType:40, showBeanLines:false,colors:null});
	box_chart.violinPlots.hide();
	box_chart.notchBoxes.hide();
	box_chart.boxPlots.hide();
}
function show_line() {
    if(box_chart.dataPlots.options.showLines){
        box_chart.dataPlots.change({showLines:false});
	} else {
        box_chart.dataPlots.change({showLines:['median','quartile1','quartile3']});
	}
}

function km_plot(
    overall_survival,
    expression,
    container_name
) {
    var km_data = [];
    for (i in expression) {
        var sampleID = i.substr(0, 15);
        var os = overall_survival.value[sampleID];
        if (os != null) {
            km_data.push(
                {
                    'os_time': overall_survival.value[sampleID].time,
                    'os_event': overall_survival.value[sampleID].event,
                    'group': +expression[i],
                    'sampleID': sampleID
                }
            );
        }
    }
    km_data = km_data.filter(function(d) { return d.sampleID.match(/01$/)});
    plot_km(container_name, km_data);
}

function display_tx(
    tx_expression_data,
    txid,
    rearranged_clinical,
    overall_survival
) {
    var trimed_txid = txid.replace(/\.\d+/, "");
    var expression = tx_expression_data.tx_expression[trimed_txid];
    $("#tx_km").hide();
    $("#tx_echart").show();

    boxplot(
        txid = txid,
        rearranged_clinical = rearranged_clinical,
        expression
    );
    km_plot(
        overall_survival = overall_survival,
        expression = expression,
        container_name = "#tx_km"
    );
}

function display_gene (
    gene_expression_data,
    txid,
    rearranged_clinical,
    overall_survival
) {
    var expression = gene_expression_data.gene_expression;
    $("#tx_km").hide();
    $("#tx_echart").show();

    boxplot(
        txid = txid,
        rearranged_clinical = rearranged_clinical,
        expression
    );
    km_plot(
        overall_survival = overall_survival,
        expression = expression,
        container_name = "#tx_km"
    );
}


// isoform expression
function close_tx_expression_module() {
    if ( $(".tx_expression").css('display') != 'none' ){
        $(".tx_expression").hide();
        $(".mask").hide();
        $(".mask").click()
        $(".tx_km_svg").remove();

        // prepare to display the tx expression next time
        $(".km_save_buttons").hide();
        $("#tx_echart").show();
        $(".chart-options").show();
        $(".tx_save_buttons").show();
    }
};
$(".tx_expression_close").click(close_tx_expression_module);
$(".mask").click(close_tx_expression_module);

function choose_boxplot() {
    $("#tx_km").hide();
    $(".km_save_buttons").hide();
    $("#tx_echart").show();
    $(".chart-options").show();
    $(".tx_save_buttons").show();
}
$("#tx_cd_boxplot").click(choose_boxplot);

function choose_km() {
    $("#tx_echart").hide();
    $(".tx_save_buttons").hide();
    $(".chart-options").hide();
    $("#tx_km").show();
    $(".km_save_buttons").show();
}
$("#tx_cd_km").click(choose_km);

// gene expression
