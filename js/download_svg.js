function submit_download_form(container, output_format)
{
    // put the svg into a hidden node
    $("#" + container + " svg").clone().appendTo("#hidden_node");

    // remove download link
    $("#hidden_node .download_link").remove()

    // add style
    if (container === "main_chart") {
        d3.selectAll("#hidden_node .frame")
            .style("fill", "none");
        d3.selectAll("#hidden_node .area path")
            .style("stroke", "#4d93c3")
            .style("stroke-width", "1pt")
            .style("fill", "#99c1dd");
        d3.selectAll("#hidden_node .expression_area path")
            .style("stroke", "#c37d4d")
            .style("stroke-width", "1pt")
            .style("fill", "#93c34d");
        d3.selectAll("#hidden_node .frame line")
            .style("stroke", "#4d93c3")
            .style("stroke-width", "1pt");
        d3.selectAll("#hidden_node .download_link")
            .style("fill", "#1e4159")
            .style("opacity", "0.7")
            .style("font-weight", "bold")
            .style("cursor", "pointer")
            .style("text-decoration", "underline");
        d3.selectAll("#hidden_node .tx_pattern rect")
            .style("stroke", "#1e4159")
            .style("fill", "#1e4159");
        d3.selectAll("#hidden_node .scale_line line")
            .style("stroke", "#c34d58")
            .style("stroke-width", "2pt");
        d3.selectAll("#hidden_node .RNASeq_exon rect")
            .style("fill", "#1e4159")
            .style("stroke", "none")
            .style("fill-opacity", 0.2);
        d3.selectAll("#hidden_node .right_row_name")
            .style("fill", "#1e4159")
            .style("opacity", 0.7)
            .style("font-weight", "bold")
            .style("text-anchor", "end");
        d3.selectAll("#hidden_node .middle_line_click_choosen line")
            .style("stroke", "#c34d58")
            .style("stroke-width", "2px");
        d3.selectAll("#hidden_node rect.RNASeq_exon_click_choosen")
            .style("stroke", "#c34d58")
            .style("fill", "#c34d58")
            .style("fill-opacity", 0.7);
        d3.selectAll("#hidden_node .right_row_click_choosen path")
            .style("stroke-width", "2px");
    } else if (container === "tx_echart") {
        d3.selectAll("#hidden_node text")
            .style("font-family", "sans-serif")
            .style("font-size", "13px");
        d3.selectAll("#hidden_node .axis path")
            .style("fill", "none")
            .style("stroke", "#888")
            .style("stroke-width", "2px")
            .style("shape-rendering", "crispEdges");
        d3.selectAll("#hidden_node .axis line")
            .style("fill", "none")
            .style("stroke", "#888")
            .style("stroke-width", "2px")
            .style("shape-rendering", "crispEdges");
        d3.selectAll("#hidden_node .y.axis .tick line")
            .style("stroke", "lightgrey")
            .style("opacity", "0.6")
            .style("stroke-dasharray", "2,1")
            .style("stroke-width", "1")
            .style("shape-rendering", "crispEdges");
        d3.selectAll("#hidden_node .x.axis .domain")
            .style("display", "none");
        d3.selectAll("#hidden_node .box-plot .box")
            .style("fill-opacity", "0.4")
            .style("stroke-width", "2");
        d3.selectAll("#hidden_node .box-plot line")
            .style("stroke-width", "2px");
        d3.selectAll("#hidden_node .box-plot circle")
            .style("fill", "white")
            .style("stroke", "black");
        d3.selectAll("#hidden_node .box-plot .median")
            .style("stroke", "black");
        d3.selectAll("#hidden_node .box-plot circle.median")
            .style("fill", "white!important");
        d3.selectAll("#hidden_node .box-plot .mean")
            .style("stroke", "white")
            .style("stroke-dasharray", "2,1")
            .style("stroke-width", "1px");
        d3.selectAll("#hidden_node .violin-plot .area")
            .style("shape-rendering", "geometricPrecision")
            .style("opacity", "0.4");
        d3.selectAll("#hidden_node .violin-plot .line")
            .style("fill", "none")
            .style("stroke-width", "2px")
            .style("shape-rendering", "geometricPrecision");
        d3.selectAll("#hidden_node .notch-plot .notch")
            .style("fill-opacity", "0.4")
            .style("stroke-width", "2");
        d3.selectAll("#hidden_node .points-plot .point")
            .style("stroke", "black")
            .style("stroke-width", "1px");
        d3.selectAll("#hidden_node .metrics-lines")
            .style("stroke-width", "4px");
        d3.selectAll("#hidden_node .chart-options")
            .style("min-width", "200px")
            .style("font-size", "13px")
            .style("font-family", "sans-serif");
        d3.selectAll("#hidden_node .chart-options button")
            .style("margin", "3px")
            .style("padding", "3px")
            .style("font-size", "12px");
    } else if (container === "tx_km") {
    }

    // extract the svg image in hidden node
    tmp = document.getElementById("hidden_node");
	svg = tmp.getElementsByTagName("svg")[0];

	// Extract the data as SVG text string
	var svg_xml = (new XMLSerializer).serializeToString(svg);

    $("#hidden_node svg").remove();

	// Submit the <FORM> to the server.
	// The result will be an attachment file to download.
	var form = document.getElementById("svgform");
	form['output_format'].value = output_format;
	form['data'].value = svg_xml ;
	form.submit();
}

/*
    One-time initialization
*/
$(document).ready(function() {
	// Attached actions to the buttons
	$("#main_save_as_svg").click(function() { submit_download_form("main_chart", "svg"); });
	$("#main_save_as_pdf").click(function() { submit_download_form("main_chart", "pdf"); });
	$("#main_save_as_png").click(function() { submit_download_form("main_chart", "png"); });

    $("#tx_save_as_svg").click(function() { submit_download_form("tx_echart", "svg"); });
    $("#tx_save_as_pdf").click(function() { submit_download_form("tx_echart", "pdf"); });
    $("#tx_save_as_png").click(function() { submit_download_form("tx_echart", "png"); });

    $("#km_save_as_svg").click(function() { submit_download_form("tx_km", "svg"); });
    $("#km_save_as_pdf").click(function() { submit_download_form("tx_km", "pdf"); });
    $("#km_save_as_png").click(function() { submit_download_form("tx_km", "png"); });
});


