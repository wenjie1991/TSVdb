//var parents = left_col_charts,
//    parent_frame_par = left_col_frame,
//    parent_width = left_col_width;

function generate_transcript_pattern(parents, parent_frame_par, parent_width, tx_pattern_data, tx_start, tx_end) {
    var tx_pattern_par, 
        exon_par,
        tx_scale_y;

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
    var j = 0;  // iterate parents
    for (i in tx_pattern_data.tx) {
        var y1, y2;
        y1 = tx_pattern_data.tx[i].start;
        y2 = tx_pattern_data.tx[i].end;
        var parent_i = parents[j];

        parent_i
            .attr("class", "tx_pattern_frame")
            .attr("txid", i)
            .on("mouseover", function(e) {

                //check if we have "e" or "window.event" and use them as "evt"
                var event = e || window.event    

                var tooltip = $(".tx_tooltip");
                tooltip.html($(this).attr("txid"));
                tooltip.css("left", (d3.event.clientX + 20) + "px");
                tooltip.css("top", d3.event.clientY + "px");
                tooltip.show();
            })
            .on("mouseout", function() {
                $(".tx_tooltip").hide();
            });


        var tx_pattern = parent_i.append('g')
            .attr('class', 'tx_pattern')
            .attr('transform', 'translate(' + tx_pattern_par.left + "," + tx_pattern_par.top + ")");
        
        // Add genome axis
        tx_pattern.append('line')
            .attr('x1', tx_pattern_par.width / 2).attr('x2', tx_pattern_par.width / 2)
            .attr('y1', tx_scale_y(y1)).attr('y2', tx_scale_y(y2));

        // Add exon rect
        tx_pattern.selectAll('rect')
            .data(tx_pattern_data.tx[i].exon)
            .enter()
          .append("rect")
            .attr('class', 'frame')
            .attr('x', 0)
            .attr('y', function(d, i){return tx_scale_y(d.start)})
            .attr('width', tx_pattern_par.width)
            .attr('height', function(d, i){return d3.max([tx_scale_y(d.end) - tx_scale_y(d.start), exon_par.min_height])});

        j++;
    }
}

