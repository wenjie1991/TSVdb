// Download button
//https://stackoverflow.com/questions/2483919/how-to-save-svg-canvas-to-local-filesystem
function encode_as_img_and_link(){
    // Add some critical information
    $("svg").attr({ version: '1.1' , xmlns:"http://www.w3.org/2000/svg"});

    var svg = $(".chart_frame").html();
//    var b64 = Base64.encode(svg); // or use btoa if supported
    var b64 = btoa(svg); // or use btoa if supported

    // Works in recent Webkit(Chrome)
//    $("body").append($("<img src='data:image/svg+xml;base64,\n"+b64+"' alt='file.svg'/>"));

    // Works in Firefox 3.6 and Webit and possibly any browser which supports the data-uri
    $("body").append($("<a href-lang='image/svg+xml' href='data:image/svg+xml;base64,\n"+b64+"' title='file.svg'>Download</a>"));
}

function obj_length(obj){
    var i=0;
    for (var x in obj){
        if(obj.hasOwnProperty(x)){
            i++;
        }
    } 
    return i;
}

function prepare_canvas() {
    if ($('svg').length) {
        $('svg').remove();
    }
}

function plot(data, data_type, url_download) {
    prepare_canvas();

    var tx_pattern_data       = data.tx_pattern,
        areaValue_data        = data.areaData,
        clinical_data         = data.clinical,
        overall_survival_data = data.os,
        gene_expression_data  = data.gene_expression, // normalized RSEM
        tx_expression_data    = data.tx_expression;   // normalized RSEM
    var areaValue_data;  // the exon or junction count data used to draw the area graph

    // calculate the number of clinical data category
    var clinical_codes = {},
        clinical_codes_n = 0;
    for (var i in clinical_data.value) {
        clinical_codes[clinical_data.value[i]] = clinical_data.cdCode[clinical_data.value[i]];
    }
    for (var i in clinical_codes) {
        clinical_codes_n++;
    }

    // The smallest value of start and biggest value of end.
    var tx_start = Infinity, tx_end = 0, strand;


    for (var i in areaValue_data.exon) {
        strand = areaValue_data.exon[i].strand;
        break;
    }

    for (i in tx_pattern_data.tx) {
        if (tx_pattern_data.tx[i].start < tx_start) tx_start = tx_pattern_data.tx[i].start;
        if (tx_pattern_data.tx[i].end > tx_end) tx_end = tx_pattern_data.tx[i].end;
    }
    for (i in areaValue_data.exon) {
        if (areaValue_data.exon[i].start < tx_start) tx_start = areaValue_data.exon[i].start;
        if (areaValue_data.exon[i].end > tx_end) tx_end = areaValue_data.exon[i].end;
    }


    // Data size and element units size
    var n_right_row = areaValue_data.exon.length,
        right_row_height = 30,
        n_left_col = obj_length(tx_pattern_data.tx) + 1,
        left_col_width = 25;

    // Canvas size
    var height = (d3.max([n_right_row, 15]) + 3) *  right_row_height,
        margin = {'top': d3.max([clinical_codes_n + 1, 3]) * 20 + 30, 'bottom':50, 'left':50, 'right':50};


    // Left, middle and right size
    var left_frame = 
        {
            'width': (n_left_col + 2) * left_col_width, 
            'height':height, 'left':0
        },
        middle_frame = 
        {
            'width': 150, 
            'height':height, 
            'left':left_frame.width
        },
        right_frame = 
        {
            'width': d3.min([d3.max([obj_length(gene_expression_data.gene_expression) * 2, 700]), 1400]),
            'height':height,
            'left':middle_frame.left + middle_frame.width
        },
        top_frame = {
            'width': 600,
            'height': margin.top - 30,
            'left': right_frame.left,
            'top': -(margin.top - 30)
        };

    // Canvas size 
    var width = left_frame.width + middle_frame.width + right_frame.width,
        svg_height = height + margin.top + margin.bottom,
        svg_width = width + margin.left + margin.right;


    // Element size
    var right_row_frame = 
        {
            'width': right_frame.width - 50,
            'height': right_row_height,
            'left': 0,
            'top': right_row_height * 2.5
        },
        left_col_frame = 
        {
            'width': left_col_width,
            'height': height - 100,
            'top': 50,
            'left': left_col_width},
        left_line = 
        {
            'width': left_frame.width,
            'top': 60, 'height': 25
        } ,
        middle_line = 
        {
            'width': middle_frame.width
        };

    // Element
    var svg, chart, frame;  // charts
    var left, left_col_charts = [], left_row_charts = [], left_row_line_y = [];  // left
    var middle, middle_row_charts = [];  // middle 
    var right, right_row_charts = [], 
        right_row_charts_top1,  // clinical data
        right_row_charts_top2,  // gene expression
        right_row_y = []; // right
    

    // Charts
    svg = d3.select('.chart_frame').append('svg')
        .attr('height', svg_height)
        .attr('width', svg_width);

    chart = svg.append("g")
        .attr('class', 'chart')
        .attr('transform', 'translate(' + margin.left + "," + margin.top + ')');

    frame = chart.append('g').attr('class', 'frame');
    frame.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width)
        .attr('height', height);


    function generate_element(frame_par, class_name, debug) {
        var element = chart.append('g').attr('class', class_name)
            .attr('transform', 'translate(' + frame_par.left + ',0)');
        if (debug) {
            element.append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', frame_par.width)
                .attr('height', frame_par.height);
        }
        return element;
    }


    // left module
    left = generate_element(left_frame, 'frame left_frame', debug = true);
    for (var i=0; i<n_left_col; i++) {
        left_col_charts[i] = left.append('g').attr('class', 'frame')
            .attr('transform', 'translate(' + (left_col_frame.left + i * left_col_frame.width) + ',' + left_col_frame.top + ')');
        left_col_charts[i].append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', left_col_frame.width)
            .attr('height', left_col_frame.height);
    }

    // add download link
    $(".download_linker").after('<a href="' + url_download + '" download id="download" hidden></a>');

    left.append("text")
        .attr('transform', 'translate(' + '0,0' + ')')
        .attr("class", "download_link")
        .text("Download Data")
        .on("click", function() {
//            window.open(url_download);
            document.getElementById('download').click();
        });


    // left transcript pattern
    generate_transcript_pattern(
        parents          = left_col_charts,
        parent_frame_par = left_col_frame,
        parent_width     = left_col_width,
        tx_pattern_data  = tx_pattern_data,
        tx_start         = tx_start,
        tx_end           = tx_end
    );
    // left RNA seq exon value pattern
    left_row_line_y      = generate_exon_pattern(
        parents          = left_col_charts,
        parent_frame_par = left_col_frame,
        parent_width     = left_col_width,
        exon_count_data  = areaValue_data,
        tx_start         = tx_start,
        tx_end           = tx_end
    );
    left_row_line_y = left_row_line_y.map(function(y) { return y + left_col_frame.top });

    for (var i=0; i<n_right_row; i++) {
        var y = left_row_line_y[i];
        left_row_charts[i] = left.append('g').attr('class', 'middle_line_' + i)
            .append('line')
        // give 25px space for displaying TCGA exon or junction pattern
            .attr('x1', left_line.width - 25).attr('x2', left_line.width)
            .attr('y1', y).attr('y2', y);
    }

    // add transcription pattern scale line
    add_scale_line(
        left           = left,
        left_col_frame = left_col_frame,
        strand         = strand
    )

    // function used to find the isoform related to the junctions
    function mapping(start, end, exons) {
        // TODO need improve the effifiency
        for (var i=0; i<exons.length-1; i++) {
            if (exons[i].start <= start & exons[i].end >= start) 
                if (exons[i+1].start <= end & exons[i+1].end >= end)
                    return true;
        }
    }

    function map_tx(
        tx_data, //tx_pattern_data.tx
        start, 
        end
    ) {
        var txids = [];
        for (i in tx_data) {
            if (mapping(start, end, tx_data[i].exon)) {
                txids.push(i);
            }
        }
        return txids;
    }

    // right module
    right = generate_element(right_frame, 'frame right_frame', true);
    for (var i=0; i<n_right_row; i++) {
        var y = (right_row_frame.height * i + right_row_frame.top);
        right_row_y[i] = y;
        right_row_charts[i] = right.append('g').attr('class', "right_row_chart_" + i)
            .attr('transform', 'translate(' + right_row_frame.left + ',' + y +')')
        // mouseover hight light the area, middle line and exon/junction 
            .on('mouseover', function() {  
                var obj_class, obj_class_index,
                    middle_line_class, left_col_exon_class;

                obj_class = $(this).attr('class');
                $("." + obj_class + " g").addClass('right_row_hover_choosen');

                obj_class_index = obj_class.substr(16);
                var exon_location = areaValue_data.exon[obj_class_index];
                if (data_type != "exon") {
                    if (exon_location.strand == "+") {
                        var txids = map_tx(tx_pattern_data.tx, exon_location.start, exon_location.end);
                    } else {
                        var txids = map_tx(tx_pattern_data.tx, exon_location.end, exon_location.start);
                    }
                    for (var i=0; i<txids.length; i++) {
                        var dom = document.getElementById(txids[i]);
                        $(dom).addClass("tx_hover_choosen");
                    }
                }

                middle_line_class = ".middle_line_" + obj_class_index;
                $(middle_line_class).addClass('middle_line_hover_choosen');

                left_col_exon_class = ".RNASeq_exon_" + obj_class_index;
                $(left_col_exon_class).addClass('RNASeq_exon_hover_choosen');


            })
        // click fix the hightlight
            .on('click', function() {
                var obj_class, obj_class_index,
                    middle_line_class, left_col_exon_class;

                obj_class = $(this).attr('class');
                $("." + obj_class + " g").toggleClass('right_row_click_choosen');

                obj_class_index = obj_class.substr(16);

                var exon_location = areaValue_data.exon[obj_class_index];

                if (data_type != "exon") {
                    if (exon_location.strand == "+") {
                        var txids = map_tx(tx_pattern_data.tx, exon_location.start, exon_location.end);
                    } else {
                        var txids = map_tx(tx_pattern_data.tx, exon_location.end, exon_location.start);
                    }
                    for (var i=0; i<txids.length; i++) {
                        var dom = document.getElementById(txids[i]);
                        $(dom).toggleClass("tx_click_match");
                    }
                }

                middle_line_class = ".middle_line_" + obj_class_index;
                $(middle_line_class).toggleClass('middle_line_click_choosen');

                left_col_exon_class = ".RNASeq_exon_" + obj_class_index;
                $(left_col_exon_class).toggleClass('RNASeq_exon_click_choosen');

            })
            .on('mouseout', function() {
                var obj_class, obj_class_index,
                    middle_line_class, left_col_exon_class;

                obj_class = $(this).attr('class');
                $("." + obj_class + " g").removeClass('right_row_hover_choosen');

                obj_class_index = obj_class.substr(16);

                var exon_location = areaValue_data.exon[obj_class_index];

                if (data_type != "exon") {
                    $(".tx_hover_choosen").removeClass("tx_hover_choosen");
                }

                middle_line_class = ".middle_line_" + obj_class_index;
                $(middle_line_class).removeClass('middle_line_hover_choosen');

                left_col_exon_class = ".RNASeq_exon_" + obj_class_index;
                $(left_col_exon_class).removeClass('RNASeq_exon_hover_choosen');
            })
        // double click link to UCSC Genome Browser
            .on('dblclick', function() {
                var obj_class, obj_class_index, exon_location,
                    url;

                // the exon/junction index storages in the class name
                obj_class = $(this).attr('class');
                obj_class_index = obj_class.substr(16);

                exon_location = areaValue_data.exon[obj_class_index];

                url = "https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg19&position=" + exon_location.chr + ":" + (exon_location.start - 500) + "-" + (exon_location.end + 500) + "&highlight=hg19." + exon_location.chr + ":" + exon_location.start + "-" + exon_location.end + "#4d93c3";
                window.open(url);
            });

        right_row_charts[i].append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', right_row_frame.width)
            .attr('height', right_row_frame.height);

    }

    right_row_charts_top1 = right.append('g').attr('class', 'clinical_row')
        .attr('transform', 'translate(' + right_row_frame.left + ',' + (right_row_frame.height * 0) + ')');
    right_row_charts_top1.append('text')
        .attr('transform', 'translate(' + '-10,' +  (right_row_frame.height / 2 + 7) + ')')
        .text(clinical_data.cd)
        .attr('class', 'right_row_name' + " ");

    right_row_charts_top1.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', right_row_frame.width)
        .attr('height', right_row_frame.height);

    right_row_charts_top2 = right.append('g').attr('class', 'gene_expression_row')
        .attr('transform', 'translate(' + right_row_frame.left + ',' + (right_row_frame.height * 1) + ')');

    right_row_charts_top2.append('text')
        .attr('transform', 'translate(' + '-10,' +  (right_row_frame.height / 2 + 10) + ')')
        .text(gene_expression_data.symbol)
        .attr('class', 'right_row_name' + " ");

    right_row_charts_top2.append('rect')
        .attr('class', 'frame')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', right_row_frame.width)
        .attr('height', right_row_frame.height);

    generate_area_graph(
        right_frame           = right_frame,
        right_row_charts      = right_row_charts,
        right_row_frame       = right_row_frame,
        right_row_charts_top1 = right_row_charts_top1,
        right_row_charts_top2 = right_row_charts_top2,
        data                  = areaValue_data,
        tx_pattern_data       = tx_pattern_data,
        gene_expression_data  = gene_expression_data,
        tx_expression_data    = tx_expression_data,
        clinical              = clinical_data,
        overall_survival      = overall_survival_data,
        strand                = strand,
        data_type             = data_type
    );

    // middle module
    middle = generate_element(middle_frame, 'frame middle_frame', true);
    for (var i=0; i<n_right_row; i++) {
        middle_row_charts[i] = middle.append('g').attr('class', 'middle_line_' + i);
        middle_row_charts[i].append('line')
            .attr('x1', 0).attr('x2', middle_line.width)
            .attr('y1', left_row_line_y[i]).attr('y2', right_row_y[i] + right_row_frame.height / 2);
    }

    // top module (legend module) 
    function draw_legend(clinical_codes, data_type) {
        var top = generate_element(top_frame, 'frame top_frame', true);
        top.attr("transform", "translate(" + top_frame.left + "," + top_frame.top + ")");

        // clinical legends
        var top_clinical = top.append("g").attr("class", "legend_clinical")
            .attr("transform", "translate(350, 0)");
        top_clinical.append("rect").attr("width", 300).attr("height", top_frame.height);
        top_clinical.append("text")
            .attr("class", "legend_title")
            .attr("fill", "#1e4159")
            .attr("font-weight", "bold")
            .text(clinical_data.cd + ":");

        color_scale = d3.scale.category10();
        var y_shift = 10;
        for (var i in clinical_codes) {
            var g_i = top_clinical.append("g")
                .attr("transform", "translate(10, " + y_shift + ")")
                .attr("class", "legend");
            g_i.append("rect")
                .attr("width", 5)
                .attr("height", 15)
                .attr("fill", color_scale(i));
            g_i.append("text")
                .attr("transform", "translate(8, 12)")
                .text(clinical_codes[i])
                .attr("fill", "#1e4159");

            y_shift += 20;
        }


        // other legends
        var top_others = top.append("g").attr("class", "legend_others")
            .attr("transform", "translate(0, 0)");
        top_others.append("rect").attr("width", 280).attr("height", top_frame.height);
        top_others.append("text")
            .attr("class", "legend_title")
            .attr("fill", "#1e4159")
            .attr("font-weight", "bold")
            .text("Data & Annotation:");


        var other_legend_par = {
            "Transcription pattern": { x: 150, y: 10, fill: "#1e4159", opacity: 1 },
            "Gene expression": { x: 150, y: 30, fill: "#93c34d", opacity: 1 },
        };
        if (data_type == "exon") {
            other_legend_par.Exon = { x: 10, y: 10, fill: "#1e4159", opacity: 0.2 };
            other_legend_par["Exon usage"] = { x: 10, y: 30, fill: "#99c1dd", opacity: 1 }
        } else {
            other_legend_par.Junction = { x: 10, y: 10, fill: "#1e4159", opacity: 0.2 };
            other_legend_par["Junction usage"] = { x: 10, y: 30, fill: "#99c1dd", opacity: 1 }
        }

        for (var i in other_legend_par) {
            var g_i = top_others.append("g")
                .attr("transform", "translate(" + other_legend_par[i].x + "," +  other_legend_par[i].y + ")")
                .attr("class", "legend");
            g_i.append("rect")
                .attr("width", 5)
                .attr("height", 15)
                .attr("opacity", other_legend_par[i].opacity)
                .attr("fill", other_legend_par[i].fill);
            g_i.append("text")
                .attr("transform", "translate(8, 12)")
                .text(i)
                .attr("fill", "#1e4159");
        }
    }
    draw_legend(clinical_codes, data_type);
}

