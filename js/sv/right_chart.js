function sort_json_by_value(json){
    // ref. https://stackoverflow.com/questions/19032954/why-is-jsonobject-length-undefined
    var sorted_array = [], 
        sorted_json = [];

    // Push each JSON Object entry in array by [key, value]
    for(var i in json)
    {
        sorted_array.push([i, json[i]]);
    }

    // Run native sort function and returns sorted array.
    sorted_array = sorted_array.sort(function(a, b) {return a[1] - b[1]});
    for (var i in sorted_array) {
        sorted_json.push([sorted_array[i][0], sorted_array[i][1]]);
    }
    return sorted_json;
}

function generate_exon_pattern(
    parents,
    parent_frame_par,
    parent_width,
    exon_count_data,
    tx_start,
    tx_end
) {
    var y1, y2,
        parent_i = parents[parents.length - 1];
    var tx_pattern, tx_pattern_par, exon_par, tx_scale_y;
    var left_exon_y = [], left_exon_height = [], left_row_line_y = [];
    var output = {"left_row_line_y": []};

    
    tx_pattern_par = 
        {
            // height: (n_right_row + 2) *  right_row_height(30) 
            "height": parent_frame_par.height,  // remove top and bottom
            // width: 25
            "width":parent_width - 5, // remove the left and right pad
            "top": 0,
            "left": 5 / 2,
        };
    exon_par = 
        {
            "min_height": 2,
            "width": tx_pattern_par.parent_frame_par,
        };

    tx_scale_y = d3.scale.linear()
        .range([tx_pattern_par.top, tx_pattern_par.height + tx_pattern_par.top])
        .domain([tx_start, tx_end]);

    // genome line
    tx_pattern = parent_i.append('g')
        .attr('class', 'RNASeq_exon')
        .attr('transform', 'translate(' + tx_pattern_par.left + "," + tx_pattern_par.top + ")");

    // Add exon rect
    tx_pattern.selectAll('rect')
        .data(exon_count_data.exon)
        .enter()
        .append("rect")
        .attr('class', function(d, i) { return 'RNASeq_exon_' + i })
        .attr('x', 0)
        .attr('y', function(d, i){
            var y = tx_scale_y(d.start)
            left_exon_y.push(y);
            return y;
        })
        .attr('width', tx_pattern_par.width)
        .attr('height', function(d, i){
            var height = d3.max([tx_scale_y(d.end) - tx_scale_y(d.start), exon_par.min_height]);
            left_exon_height.push(height);
            return height;
        });

   

    for (var i in left_exon_y) {
        left_row_line_y.push(left_exon_y[i] + left_exon_height[i] / 2);
    }
    return left_row_line_y;
}

// TODO add scale value
function add_scale_line(
    left,
    left_col_frame,
    strand
) {
    var scale_line_left_margin = 17;
    var scale_line_start_y = left_col_frame.top;
    var scale_line_end_y = scale_line_start_y + 50; 
    var scale_line;

    scale_line = left.append('g')
        .attr('class', 'scale_line');

    scale_line.append('line')
        .attr('x1', scale_line_left_margin).attr('x2', scale_line_left_margin)
        .attr('y1', scale_line_start_y).attr('y2', scale_line_end_y);

    var arrow_start_x = scale_line_left_margin,
        arrow_start_y,
        arrow_end_x = arrow_start_x - 10,
        arrow_end_y;

    if (strand == "+") {
        arrow_start_y = scale_line_end_y;
        arrow_end_y = arrow_start_y - 10;
    } else if (strand == "-") {
        arrow_start_y = scale_line_start_y;
        arrow_end_y = arrow_start_y + 10;
    }

    scale_line.append('line')
        .attr('x1', arrow_start_x).attr('x2', arrow_end_x)
        .attr('y1', arrow_start_y).attr('y2', arrow_end_y);
}


function calculate_NI(areaValue, area_data) {
    // areaValue: a json object with key of sample id and value of expression
    var exon_NI = {};
    for (var i in areaValue) {
//        exon_NI[i] = Math.log2(areaValue[i] + 1) / Math.log2(gene_expression[i] + 1);
//        exon_NI[i] = (areaValue[i] + 1) / (gene_expression[i] + 1);
        exon_NI[i] = areaValue[i] / area_data.value_mean[i];
    }
    return exon_NI;
}

function get_sample_array_from_areaValue(data) {
    var sample_array = [];
    for (var i in data) {
        for (var j in data[i]) {
            sample_array.push(j);
        }
        break;
    }
    return sample_array;
}


function filter_clinical_by_sample(clinical, sample_array) {
    var new_clinical_clinical = {};
    var string_length;

    for (var i in clinical.value) {
        string_length = i.length;
        break;
    }

    for (var i in sample_array) {
        var sampleID = sample_array[i];
        var sampleID_truncated = sampleID.substr(0, string_length);
        if (clinical.value[sampleID_truncated]) {
            var value = clinical.value[sampleID.substr(0, string_length)];
            if (value) {
                new_clinical_clinical[sampleID] = value;
            }
        }
    }
    clinical['value'] = new_clinical_clinical;
    return clinical;
}

function rearrange_clinical(clinical, gene_expression_data) {
    var new_clinical_value = [];
    var new_expression_to_sort = {};
    for (i in gene_expression_data.gene_expression) {
        if (clinical.value[i]) {
            // * 10000000 used to sort clinical value first then by expression value
            new_expression_to_sort[i] = (+clinical.value[i]) * 10000000 + (+gene_expression_data.gene_expression[i]);
        }
    }
    sort_json_by_value(new_expression_to_sort).map(function(d) {
        new_clinical_value.push([d[0], clinical.value[d[0]]]);
    });
    clinical['value'] = new_clinical_value;
    return clinical;
}

function extract_rearranged_sampleID(clinical) {
    var rearranged_sampleID = [];
    for (var i in clinical.value) {
        rearranged_sampleID.push(clinical.value[i]);
    }
    return rearranged_sampleID;
}

function rearrange_areaValue(d, rearranged_sampleID) {
    var new_NI = [],
        sampleID, value;
    for (var i in rearranged_sampleID) {
        sampleID = rearranged_sampleID[i][0];  // [sampleID, valeu][0] ~~ sampleID
        value = d[sampleID]
        if (isNaN(value)) value = 0;
        new_NI.push([sampleID, value]);
    }
    return new_NI;
}

function quantile_areaValue(rearranged_areaValue_array, p) {
    var areaValue_array;
    areaValue_array = rearranged_areaValue_array.map(function(d) { return d[1] });
    var quantile_value = d3.quantile(areaValue_array.sort(), p);
    if (isNaN(quantile_value)) {
        return 0
    } else {
        return quantile_value;
    }
}

function clinical_graph(
    rearranged_clinical,
    right_frame,
    right_row_charts,
    right_row_frame,
    right_row_charts_top
) {
//    rearranged_clinical.value.unshift("null");
    var x_scale, y_scale,
        tip, 
        right_frame_elem, guide_line, guide_line_y0, guide_line_y1;

    x_scale = d3.scale.ordinal()
        .domain(d3.range(rearranged_clinical.value.length))
        .rangeBands([0, right_row_frame.width], 0);
    color_scale = d3.scale.category10();

    tip = d3.select("body").append("div")
        .attr("class", "clinical_tip")
        .style("opacity", 0);

    guide_line = d3.select(".right_frame").append("line")
        .attr("class", "guide_line")
        .style("opacity", 0)
        .attr("x1", 0).attr("x2", 0)
        .attr("y1", right_row_frame.top).attr("y2", right_frame.height);
    
    right_row_charts_top.append("g").selectAll("rect")
        .data(rearranged_clinical.value)
        .enter().append('rect')
        .attr('class', function(d, i) { return rearranged_clinical.cdCode[d[1]]})
        .attr('x', function(d, i) { return x_scale(i);  })
        .attr('y', 0)
        .attr('height', right_row_frame.height)
        .attr('width', x_scale.rangeBand() + 1)
        .attr('fill', function(d, i) { return color_scale(d[1]) })
        .attr('stroke', 'none')
        .on('mouseover', function() {
            var tip_content = $(this).attr('class');
            tip_content = "<text>" + tip_content + "</text>";
            tip.style("opacity", .9);
            tip.html(tip_content) 
                .style("left", (d3.event.pageX - 12) + "px")     
                .style("top", (d3.event.pageY - 40) + "px");    

            var guide_line_x = $(this).attr('x');
            guide_line.attr('x1', guide_line_x);
            guide_line.attr('x2', guide_line_x);
            guide_line.style("opacity", .5)
        })
        .on('mouseout', function() {
            tip.style("opacity", 0);
            guide_line.style("opacity", 0);
        });
}

function gene_expression_graph (
    rearranged_sampleID,
    right_frame,
    right_row_charts,
    right_row_frame,
    right_row_charts_top,
    gene_expression_data, 
    rearranged_clinical,
    overall_survival,
    tx_pattern_data
) {
    var x_scale, y_scale, 
        gene_expression_max = 0,
        right_frame_elem, guide_line, guide_line_y0, guide_line_y1;

    for (i in gene_expression_data.gene_expression) {
        if (gene_expression_data.gene_expression[i] > +gene_expression_max) {
            gene_expression_max = gene_expression_data.gene_expression[i];
        }
    }

    x_scale = d3.scale.linear()
        .domain([0, rearranged_sampleID.length])
        .range([0, right_row_frame.width]);

    y_scale = d3.scale.linear()
        .domain([0, gene_expression_max])
        .range([right_row_frame.height, 5]);

    var area = d3.svg.area()
        .x(function(d, i) { return x_scale(i) })
        .y0(right_row_frame.height)
        .y1(function(d, i) { return y_scale(gene_expression_data.gene_expression[d[0]]) })

    right_row_charts_top.append("g").attr("class", 'expression_area')
        .append('path')
        .attr('d', area(rearranged_sampleID));
    d3.select(".gene_expression_row")
        .on("click", function() {
            var url, tx;
            for (i in tx_pattern_data.tx) {
                tx = tx_pattern_data.tx[i];
                break;
            }
            url = "https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg19&position=" + tx.chr + ":" + tx.start + "-" + tx.end;

            $(".tx_ucsc_link").attr("href", url);
            $(".tx_ucsc_link").text(gene_expression_data.symbol + " UCSC Link");
            $(".mask").show();
            $(".tx_expression").css("z-index", 2);
            $(".tx_expression").show();
            display_gene(
                gene_expression_data  = gene_expression_data,
                txid                = gene_expression_data.symbol,
                rearranged_clinical = rearranged_clinical,
                overall_survival    = overall_survival
            )
        });
}


function generate_area_graph(
    right_frame,
    right_row_charts, 
    right_row_frame, 
    right_row_charts_top1, 
    right_row_charts_top2, 
    data,
    tx_pattern_data,
    gene_expression_data,
    tx_expression_data,
    clinical,
    overall_survival,
    strand,
    data_type
) {

    var n, 
        sample_array = [], 
        rearranged_clinical,
        rearranged_sampleID, 
        rearranged_data_value, data_value_ceiling, data_value_max;

    var y_scales = [], x_scale;

    if (data_type == 'exon') {
        var NI, exon_count_data = data;
        NI = exon_count_data.value.map(function(d) { 
            return calculate_NI(d, exon_count_data) 
        });

        // TODO remove inconsistant sample in server?
        sample_array = get_sample_array_from_areaValue(NI);  
        clinical = filter_clinical_by_sample(clinical, sample_array);
        rearranged_clinical = rearrange_clinical(clinical, gene_expression_data);

        rearranged_sampleID = extract_rearranged_sampleID(rearranged_clinical);
        rearranged_data_value = NI.map(function(d) {
            return rearrange_areaValue(d, rearranged_sampleID);
        })
        n = rearranged_data_value[0].length;
        data_value_ceiling = rearranged_data_value.map(function(d) {
            return quantile_areaValue(d, 0.95); 
        });
        data_value_max = rearranged_data_value.map(function(d) {
            return quantile_areaValue(d, 1); 
        });

        for (var i in rearranged_data_value) {
            y_scales[i] = d3.scale.linear()
            // Set the ceiling of display. 
            // If the celing NI less than 5% of mean exon expression, than use 0.05 as ceiling value.
                .domain([0, d3.max([data_value_ceiling[i], 0.05]), data_value_max[i]])
                .range([right_row_frame.height, 5, 5]);
        }

    } else if (data_type == 'junction') {
        var juc, juc_count_data = data;
        juc = juc_count_data.value;
        juc = juc_count_data.value.map(function(d) { 
            return calculate_NI(d, juc_count_data) 
        });

        sample_array = get_sample_array_from_areaValue(juc);
        clinical = filter_clinical_by_sample(clinical, sample_array);
        rearranged_clinical = rearrange_clinical(clinical, gene_expression_data);

        rearranged_sampleID = extract_rearranged_sampleID(rearranged_clinical);
        rearranged_data_value = juc.map(function(d) {
            return rearrange_areaValue(d, rearranged_sampleID);
        })
        n = rearranged_data_value[0].length;
        data_value_ceiling = rearranged_data_value.map(function(d) {
            return quantile_areaValue(d, 0.95); 
        });
        data_value_max = rearranged_data_value.map(function(d) {
            return quantile_areaValue(d, 1); 
        });

        for (var i in rearranged_data_value) {
            y_scales[i] = d3.scale.linear()
            // Set the ceiling of display. 
            // If the celing NI less than 5% of mean exon expression, than use 0.05 as ceiling value.
                .domain([0, d3.max([data_value_ceiling[i], 0.05]), data_value_max[i]])
                .range([right_row_frame.height, 5, 5]);
        }
    }

    
    x_scale = d3.scale.linear()
        .domain([0, rearranged_data_value[0].length])
        .range([0, right_row_frame.width]);

    for (var NI_i in rearranged_data_value) {
        var area = d3.svg.area()
            .x(function(d, i) { return x_scale(i); })
            .y0(right_row_frame.height)
            .y1(function(d, i) { return y_scales[NI_i](d[1]) });

        right_row_charts[NI_i].append('g').attr('class', 'area')
            .append('path')
            .attr('d', area(rearranged_data_value[NI_i]));
    }

    // clinical graph
    clinical_graph(
        rearranged_clinical  = rearranged_clinical,
        right_frame          = right_frame,
        right_row_charts     = right_row_charts,
        right_row_frame      = right_row_frame,
        right_row_charts_top = right_row_charts_top1
    );

    gene_expression_graph(
        rearranged_sampleID  = rearranged_sampleID,
        right_frame          = right_frame,
        right_row_charts     = right_row_charts,
        right_row_frame      = right_row_frame,
        right_row_charts_top = right_row_charts_top2,
        gene_expression_data = gene_expression_data,
        rearranged_clinical  = rearranged_clinical,
        overall_survival     = overall_survival,
        tx_pattern_data      = tx_pattern_data
    );

    $(".tx_pattern_frame").each(function(i, e) {
        $(e).click( function() {
            var txid = $(this).attr("txid");
            var url, tx;
            tx = tx_pattern_data.tx[txid];
            url = "https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg19&position=" + tx.chr + ":" + tx.start + "-" + tx.end + "&hgFind.matches=" + txid;
            $(".tx_ucsc_link").attr("href", url);
            $(".tx_ucsc_link").text(txid + " UCSC Link");
            $(".mask").show();
            $(".tx_expression").css("z-index", 2);
            $(".tx_expression").show();
            display_tx(
                tx_expression_data  = tx_expression_data,
                txid                = txid,
                rearranged_clinical = rearranged_clinical,
                overall_survival    = overall_survival
            )
        })
    })
}


