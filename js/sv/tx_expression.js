function round(num, digits) {
    return +(Math.round(num + "e+" + digits) + "e-" + digits);
}

function boxplot(
    txid, 
    rearranged_clinical,
    expression
) {
    var tx_echart = echarts.init(document.getElementById('tx_echart'));
    var box_data = [];
    var x_label = [];

    for (i in rearranged_clinical.cdCode) {
        box_data[i] = [];
        x_label.push(rearranged_clinical.cdCode[i]);
    }

    rearranged_clinical.value.map(function(d) {
        box_data[d[1]].push(expression[d[0]]);
    });

    var data = echarts.dataTool.prepareBoxplotData(box_data);

    var option = {
        title: [
            {
                text: txid + ' expression',
                left: 'center',
            },
            {
                text: 'upper: Q3 + 1.5 * IRQ \nlower: Q1 - 1.5 * IRQ',
                borderColor: '#999',
                borderWidth: 1,
                textStyle: {
                    fontSize: 14
                },
                left: '10%',
                top: '90%'
            }
        ],
        tooltip: {
            trigger: 'item',
            axisPointer: {
                type: 'shadow'
            }
        },
        grid: {
            left: '10%',
            right: '10%',
            bottom: '15%'
        },
        xAxis: {
            type: 'category',
            data: x_label,
            boundaryGap: true,
            nameGap: 30,
            splitArea: {
                show: false
            },
            axisLabel: {
                formatter: '{value}'
            },
            splitLine: {
                show: false
            }
        },
        yAxis: {
            type: 'value',
            name: 'Expression',
            splitArea: {
                show: true
            }
        },
        series: [
            {
                name: 'boxplot',
                type: 'boxplot',
                data: data.boxData,
                tooltip: {
                    formatter: function (param) {
                        return [
                            '' + param.name + ': ',
                            'upper: '  + round(param.data[5], 2),
                            'Q3: '     + round(param.data[4], 2),
                            'median: ' + round(param.data[3], 2),
                            'Q1: '     + round(param.data[2], 2),
                            'lower: '  + round(param.data[1], 2)
                        ].join('<br/>')
                    }
                }
            },
            {
                name: 'outlier',
                type: 'scatter',
                data: data.outliers
            }
        ]
    };
    tx_echart.setOption(option);
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
    km_data = km_data.filter((d) => d.sampleID.match(/01$/));
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
    $(".tx_expression").hide();
    $(".mask").hide();
    $(".tx_km_svg").remove();
};
$(".tx_expression_close").click(close_tx_expression_module);

function choose_boxplot() {
    $("#tx_km").hide();
    $("#tx_echart").show();
}

$("#tx_cd_boxplot").click(choose_boxplot);
function choose_km() {
    $("#tx_echart").hide();
    $("#tx_km").show();
}
$("#tx_cd_km").click(choose_km);

// gene expression
