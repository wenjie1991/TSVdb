function objLength(obj){
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

function plot(data, data_type) {
    prepare_canvas();

    var tx_pattern_data = data.tx_pattern,
        exon_RPKM_data = data.exon_RPKM,
        juc_count_data = data.juc_count,
        clinical_data = data.clinical,
        overall_survival_data = data.os,
        gene_expression_data = data.gene_expression,
        tx_expression_data = data.tx_expression;
    var areaValue_data;


    var tx_start = Infinity, tx_end = 0, strand;

    if (data_type == 'exon') {
        areaValue_data = exon_RPKM_data;
    } else if (data_type == 'junction') {
        areaValue_data = juc_count_data;
    }

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
        n_left_col = objLength(tx_pattern_data.tx) + 1,
        left_col_width = 25;

    // Canvas size
    var height = (d3.max([n_right_row, 15]) + 3) *  right_row_height,
        width = 1000,
        margin = {'top':50, 'bottom':50, 'left':50, 'right':50},
        svg_height = height + margin.top + margin.bottom,
        svg_width = width + margin.left + margin.right;

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
            'width': width - left_frame.width - middle_frame.width,
            'height':height,
            'left':middle_frame.left + middle_frame.width
        };

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
    var right, right_row_charts = [], right_row_charts_top1, right_row_charts_top2, right_row_y = []; // right

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
    left = generate_element(left_frame, 'frame left_frame', true);
    for (var i=0; i<n_left_col; i++) {
        left_col_charts[i] = left.append('g').attr('class', 'frame')
            .attr('transform', 'translate(' + (left_col_frame.left + i * left_col_frame.width) + ',' + left_col_frame.top + ')');
        left_col_charts[i].append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', left_col_frame.width)
            .attr('height', left_col_frame.height);
    }

    // left transcript pattern
    generate_transcript_pattern(
        parents          = left_col_charts,
        parent_frame_par = left_col_frame,
        parent_width     = left_col_width,
        tx_pattern_data  = tx_pattern_data,
        tx_start         = tx_start, tx_end = tx_end
    );
    // left RNA seq exon value pattern
    left_row_line_y      = generate_exon_pattern(
        parents          = left_col_charts,
        parent_frame_par = left_col_frame,
        parent_width     = left_col_width,
        exon_RPKM_data   = areaValue_data,
        tx_start         = tx_start,
        tx_end           = tx_end
    );
    left_row_line_y = left_row_line_y.map(function(y) { return y + left_col_frame.top });

    for (var i=0; i<n_right_row; i++) {
        var y = left_row_line_y[i];
        left_row_charts[i] = left.append('g').attr('class', 'middle_line_' + i)
            .append('line')
            .attr('x1', left_line.width - 25).attr('x2', left_line.width)
//            .attr('x1', 0).attr('x2', left_line.width)
            .attr('y1', y).attr('y2', y);
    }

    // add transcription pattern scale line
    add_scale_line(
        left           = left,
        left_col_frame = left_col_frame,
        strand         = strand
    )

    // right module
    right = generate_element(right_frame, 'frame right_frame', true);
    for (var i=0; i<n_right_row; i++) {
        var y = (right_row_frame.height * i + right_row_frame.top);
        right_row_y[i] = y;
        right_row_charts[i] = right.append('g').attr('class', "right_row_chart_" + i)
            .attr('transform', 'translate(' + right_row_frame.left + ',' + y +')')
            .on('mouseover', function() {
                var obj_class, obj_class_index,
                    middle_line_class, left_col_exon_class;

                obj_class = $(this).attr('class');
                $("." + obj_class + " g").addClass('right_row_hover_choosen');


                obj_class_index = obj_class.substr(16);

                middle_line_class = ".middle_line_" + obj_class_index;
                $(middle_line_class).addClass('middle_line_hover_choosen');

                left_col_exon_class = ".RNASeq_exon_" + obj_class_index;
                $(left_col_exon_class).addClass('RNASeq_exon_hover_choosen');

            })
            .on('click', function() {
                var obj_class, obj_class_index,
                    middle_line_class, left_col_exon_class;

                obj_class = $(this).attr('class');
                $("." + obj_class + " g").toggleClass('right_row_click_choosen');

                obj_class_index = obj_class.substr(16);

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

                middle_line_class = ".middle_line_" + obj_class_index;
                $(middle_line_class).removeClass('middle_line_hover_choosen');

                left_col_exon_class = ".RNASeq_exon_" + obj_class_index;
                $(left_col_exon_class).removeClass('RNASeq_exon_hover_choosen');
            })
            .on('dblclick', function() {
                var obj_class, obj_class_index, exon_location,
                    url;

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
    right_row_charts_top1.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', right_row_frame.width)
        .attr('height', right_row_frame.height);

    right_row_charts_top2 = right.append('g').attr('class', 'gene_expression_row')
        .attr('transform', 'translate(' + right_row_frame.left + ',' + (right_row_frame.height * 1) + ')');
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
    middle = generate_element(middle_frame, 'frame', true);
    for (var i=0; i<n_right_row; i++) {
        middle_row_charts[i] = middle.append('g').attr('class', 'middle_line_' + i);
        middle_row_charts[i].append('line')
//            .attr('x1', 0).attr('x2', middle_line.width)
            .attr('x1', 0).attr('x2', middle_line.width)
            .attr('y1', left_row_line_y[i]).attr('y2', right_row_y[i] + right_row_frame.height / 2);
    }
}
