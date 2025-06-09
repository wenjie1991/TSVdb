//
//  Kaplan–Meier estimator and two‑sample Log‑Rank (Mantel–Cox) test in vanilla JavaScript
//  -------------------------------------------------------------------------------
//  ‑ Requires **no external dependencies**.
//  ‑ Works in Node ≥14 and modern browsers (ES2020).
//
//  ## Data format
//  Each observation is an object of the form:
//    {
//      time:   Number,   // follow‑up time (positive)
//      event:  Boolean   // true  → event occurred at `time`
//                        // false → right‑censored at `time`
//    }
//
//  Optionally add a `group` property if you store multiple groups in one array.
//
//  ## API
//  kmCurve(data : Observation[]) → CurvePoint[]
//  logRankTest(group1 : Observation[], group2 : Observation[]) → {chi2, df, p}
//
//  ## Example
//  ```js
//  import { kmCurve, logRankTest } from "./km_survival.js";
//
//  const grpA = [ {time:  6, event: true}, {time: 10, event: false}, /* … */ ];
//  const grpB = [ {time:  4, event: true}, {time: 14, event: true }, /* … */ ];
//
//  console.log(kmCurve(grpA));            // Kaplan–Meier points for A
//  console.log(logRankTest(grpA, grpB));  // { chi2: 3.84, df: 1, p: 0.050 }
//  ```
//
//  ## Notes
//  1. Variance in the log‑rank test uses the usual Greenwood approximation.
//  2. `chi2PValue` is implemented analytically for df = 1 (common case). For df > 1,
//     pull in a stats library such as jStat to obtain the tail probability.
//  3. No handling of left‑truncation or time‑varying covariates.
//  4. MIT License – do what you like, but no warranty is provided.
// // /

// ───────────────────────────────────────────────────────────────────────────────
// Kaplan–Meier estimator
// ───────────────────────────────────────────────────────────────────────────────


// Return Kaplan–Meier survival curve points.
// @param {Array<{time:number,event:boolean}>} data
// @returns {Array<{time:number,survival:number,atRisk:number,events:number,censored:number}>}

function kmCurve(data) {
  if (!Array.isArray(data) || data.length === 0) return [];

  // Clone & sort ascending by time
  const records = [...data].sort((a, b) => a.time - b.time);

  // Unique event times (ignore pure censor times)
  const eventTimes = [...new Set(records.filter(r => r.event).map(r => r.time))];

  let surv = 1;
  const curve = [];

  for (const t of eventTimes) {
    const atRisk   = records.filter(r => r.time >= t).length;
    const events   = records.filter(r => r.time === t && r.event).length;
    const censored = records.filter(r => r.time === t && !r.event).length;

    if (atRisk === 0) break; // Safety

    surv *= (1 - events / atRisk);

    curve.push({ time: t, survival: surv, atRisk, events, censored });
  }

  return curve;
}

// ───────────────────────────────────────────────────────────────────────────────
// Log‑Rank (Mantel–Cox) two‑sample test
// ───────────────────────────────────────────────────────────────────────────────


// Two‑sample log‑rank test comparing survival distributions.
// @param {Array<{time:number,event:boolean}>} g1
// @param {Array<{time:number,event:boolean}>} g2
// @returns {{chi2:number, df:1, p:number}}

function logRankTest(g1, g2) {
  if (!g1?.length || !g2?.length) throw new Error("Both groups must contain data");

  // All unique event times across both groups
  const times = [...new Set([...g1, ...g2].filter(r => r.event).map(r => r.time))].sort((a, b) => a - b);

  let OminusE = 0; // Σ(O₁ − E₁)
  let varSum  = 0; // ΣVar(O₁ − E₁)

  for (const t of times) {
    const n1 = countAtRisk(g1, t);
    const n2 = countAtRisk(g2, t);
    const n  = n1 + n2;

    const d1 = g1.filter(r => r.time === t && r.event).length;
    const d2 = g2.filter(r => r.time === t && r.event).length;
    const d  = d1 + d2;

    if (n <= 1 || d === 0) continue; // Skip if no subjects or no events

    const expected1 = d * (n1 / n);
    const variance1 = (n1 / n) * (1 - n1 / n) * (n - d) / (n - 1) * d; // Greenwood‑like

    OminusE += (d1 - expected1);
    varSum  += variance1;
  }

  const chi2 = (OminusE ** 2) / varSum;
  const p    = chi2PValue(chi2); // df = 1

  return { chi2, df: 1, p };
}

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────

function countAtRisk(group, t) {
  return group.filter(r => r.time >= t).length;
}

// --- p‑value for χ²₍₁₎ (uses error‑function relation) -------------------------

/** Approximate the upper‑tail p‑value P(χ² > stat) for df = 1 */
function chi2PValue(stat) {
  if (stat < 0 || !isFinite(stat)) return NaN;
  const z     = Math.sqrt(stat);
  const erfV  = erf(z / Math.SQRT2);
  return 1 - erfV; // upper tail
}

/** Error function (Abramowitz & Stegun 7.1.26) */
function erf(x) {
  const sign = (x >= 0) ? 1 : -1;
  x = Math.abs(x);

  // Coefficients
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const t = 1 / (1 + p * x);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

/* -------- 20-record example dataset -------- */

/** Group A (n = 10) */
// const grpA = [
//   { time:  2, event: true  },
//   { time:  3, event: false },
//   { time:  5, event: true  },
//   { time:  6, event: true  },
//   { time:  8, event: false },
//   { time:  9, event: true  },
//   { time: 11, event: false },
//   { time: 13, event: true  },
//   { time: 15, event: false },
//   { time: 18, event: true  }
// ];
//
// /** Group B (n = 10) */
// const grpB = [
//   { time:  1, event: true  },
//   { time:  4, event: true  },
//   { time:  5, event: false },
//   { time:  7, event: true  },
//   { time:  9, event: false },
//   { time: 10, event: true  },
//   { time: 12, event: false },
//   { time: 14, event: true  },
//   { time: 16, event: false },
//   { time: 20, event: true  }
// ];
//
// /* --- usage -------------------------------------------------- */
// console.log(kmCurve(grpA));
// console.log(kmCurve(grpB));
// console.log(logRankTest(grpA, grpB));

function plot_km (container_name, raw_data) {

    // Adaptered from: http://bl.ocks.org/nstrayer/4e613a109707f0487da87300097ca502;
    // 2017-09-01
    // The original code is under: https://opensource.org/licenses/GPL-3.0


    // raw_data:
    //   [{os_time:Num, os_event:Num(0=false, 1=true), group:Num, sampleID:Str}..]


    /////////////// Function roundTo ///////////////
    //Function javascript should really already have.
    Number.prototype.roundTo = function(digits){
        return +(Math.round(this + "e+" + digits)  + "e-" + digits);
    }


    //Data cleaning:
    var data = raw_data.map(function(d){
        var new_d = {}
        new_d.time = +d.os_time; //patient start
        new_d.event = d.os_event == "1" ? true : false;
        //        new_d.group = d.group >= 0.55 ? "high NI" : "low NI";
        new_d.group = d.group; //>= 0.55 ? "high NI" : "low NI";
        return new_d;
    })


    //charting code goes here.
    var chartWidth  = 690, // default width
        chartHeight = 450;

    var margin = {top: 0, right: 250, bottom: 50, left: 60},
        width  = chartWidth - margin.left - margin.right,
        height = chartHeight - margin.top - margin.bottom;

    // var svg = d3.select(this).append("svg") //leaving for when packaged up.
    var svg = d3.select(container_name).append("svg")
        .attr("class", "tx_km_svg")
        .attr("width", chartWidth )
        .attr("height", chartHeight)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var min_date = 0,
        max_date = d3.max(data, function(d) {return d.time}),
        min_group = d3.min(data, function(d) {return d.group}),
        max_group = d3.max(data, function(d) {return d.group});

    var x = d3.scale.linear()
        .range([0, width])
        .domain([min_date, max_date]);

    //y scale for the data chart on top
    var y = d3.scale.linear()
        .range([height/2 - 20, 0])
        .domain([0,data.length]);

    //y scale for the survival plot on bottom
    var y_surv = d3.scale.linear()
        .range([height, height/2 + 10])
        .domain([0,1]);

    //y scale for the group cutpoint
    var y_group = d3.scale.linear()
        .range([height, height / 2])
        .domain([min_group, max_group]);


    /////////////// Draw axis ////////////////////////////////////////
    // x axis
    svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.svg.axis().scale(x).orient("bottom"))
        .append("text")
        .attr("class", "axis-title")
        .attr("y", 20)
        .attr("x", width/2)
        .attr("dy", "1.3em")
        .style("text-anchor", "middle")
        .style("fill", "black")
        .style("font-size", "1.0em")
        .text("Time in Days");


    //draw bar above to seperate the two plots from eachother
    svg.append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", height/2)
        .attr("y2", height/2)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("opacity", 0.5);

    // draw left y axis
    svg.append("g")
        .attr("class", "axis axis--y axis_y_left")
        .call(d3.svg.axis() .scale(y_surv) .orient("left"))
        .append("text")
        .attr("class", "axis-title")
        .style("text-anchor", "middle")
        .attr("transform", "rotate(270)")
        .attr("x", - (height / 4 * 3))
        .attr("y", - 60)
        .attr("dy", "1.3em")
        .style("fill", "black")
        .style("font-size", "1.0em")
        .text("Overall Survival");


    /////////////////////
    //  Create legend  //
    /////////////////////
    
    var legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(" + (width + 20) + "," + margin.top  + ")");

    var titleAttributes = {
        "fill": "#636363",
        "text-anchor": "start",
        "font-size": "2em"
    }

    var legendAttributes = {
        "x": -5,
        "text-anchor": "start",
    }

    legend.append("text")
        .text("High group")
        .attr(legendAttributes)
        .attr({
            "y": "1em",
            "fill": "orangered",
        })
    legend.append("text")
        .text("test")
        .attr("class", "highNIDefination")
        .attr({
            "y": "2.25em",
            "dx": "0.25em"
        })
    legend.append("text")
        .text("test")
        .attr("class", "highNINumber")
        .attr({
            "y": "3.5em",
            "dx": "0.25em"
        })

    legend.append("text")
        .text("Low group")
        .attr(legendAttributes)
        .attr({
            "y": "5em",
            "fill": "steelblue",
        })

    legend.append("text")
        .text("test")
        .attr("class", "lowNIDefination")
        .attr({
            "y": "6.25em",
            "dx": "0.25em"
        })
    legend.append("text")
        .text("test")
        .attr("class", "lowNINumber")
        .attr({
            "y": "7.5em",
            "dx": "0.25em"
        })

    legend.append("text")
        .text("test")
        .attr("class", "kmTestPValue")
        .attr({
            "x": -5,
            "y": "10em"
        })


    function updateLegend(cutpoint, highGroupNum, lowGroupNum, km_pvalue) {

        d3.select(".highNIDefination").text("Expression > " + cutpoint);
        d3.select(".lowNIDefination").text("Expression ≤ " + cutpoint);

        d3.select(".highNINumber").text("n: " + highGroupNum);
        d3.select(".lowNINumber").text("n: " + lowGroupNum);

        d3.select(".kmTestPValue").text("Log-rank p: " + km_pvalue);
    }


    //////////////////////
    //  Group choosing  //
    //////////////////////
    var data_sorted = data.sort(function(a, b) { return a.group - b.group});
    var cutpoint = d3.max(data, function(d)  { return d.group}) / 2 + d3.min(data, function(d) { return d.group}) / 2;

    var line_group = svg.selectAll(".group")
        .data(data_sorted)
        .enter().append("line")
        .attr("class", "group")
        .attr("x1", width + 10)
        .attr("x2", width + 70)
        .attr("y1", function(d) { return y_group(d.group) })
        .attr("y2", function(d) { return y_group(d.group) })
        .attr("stroke", function(d) { return  d.group > cutpoint ? "orangered" : "steelblue" })
        .attr("stroke-width", 0.5)
        .transition().duration(500)
        .delay(function(d, i) { return(data.length - i) * 5;})

    svg.append("g")
        .attr("class", "axis axis--y axis_y_right")
        .call(d3.svg.axis().scale(y_group).orient("right"))
        .attr("transform", "translate(" + (width+70) + ", 10)")
        .append("text")
        .attr("class", "axis-title")
        .attr("y", height/2)
        .attr("x", 0)
        .attr("dy", "-1em")
        .style("text-anchor", "middle")
        .style("fill", "black")
        .style("font-size", "1.0em")
        .text("Expression (RSEM):");



    d3.selectAll(".axis path")
        .style({"fill":"none", "stroke":"black"})
    d3.selectAll(".axis line")
        .style({"fill":"none", "stroke":"black"})
    d3.selectAll(".axis text")
        .style("font-size", "1em")


    svg.append("g")
        .attr("class", "group")
        .attr("transform", "translate(" + width + ", 0)")

    function sortByTwoVar(data, cutpoint) {
        var km_data_high = data.filter(function(d) { return d.group > cutpoint});
        var km_data_low = data.filter(function(d) {return d.group <= cutpoint});
        km_data_high = km_data_high.sort(function(a, b) { return  a.time - b.time });
        km_data_low = km_data_low.sort(function(a, b) { return a.time - b.time});

        var km_test_res = logRankTest(km_data_high, km_data_low);
        console.log(km_test_res);

        updateLegend(
            cutpoint.roundTo(3), 
            km_data_high.length, km_data_low.length,
            km_test_res['p'].roundTo(3)
        );
        return km_data_low.concat(km_data_high);
    }
    data_sorted = sortByTwoVar(data, cutpoint);

    function update_group(newData, cutpoint) {

        svg.selectAll(".group")
            .data(newData)
            .attr({
                "y1": function(d) { return  y_group(d.group)},
                "y2": function(d) { return  y_group(d.group)},
                "stroke": function(d) { return d.group > cutpoint ? "orangered" : "steelblue"},
            })
            .transition().duration(500)

    }

    ////////////////////////////// Draw lifespan Lines //////////////////////////////

    var lines = svg.selectAll(".lifespan")
        .data(data_sorted)
        .enter().append("line")
        .attr("class", "lifespan")
        .attr({
            "x1": 0,
            "x2": function(d) { return  x(d.time) },
            "y1": function(d,i) { return y(i) },
            "y2": function(d,i) { return y(i)},
            "stroke": function(d) { return d.group > cutpoint ? "orangered" : "steelblue" },
            "stroke-width": 0.5,
        })
        .transition().duration(500)
    // TODO what's the delay mean?
        .delay(function(d, i) { return (data.length - i) * 5; })


    function update_lifespan(newData, cutpoint) {
        svg.selectAll(".lifespan")
            .data(newData)
            .transition()
            .attr({
                "x2": function(d) {return x(d.time)},
                "y1": function(d,i) {return y(i)},
                "y2": function(d,i) {return y(i)},
                "stroke": function(d) { return d.group > cutpoint ? "orangered" : "steelblue"},
            })
    }


    //////////////// Drawing the Survival Function //////////////


    var km_surv_high = KM_Curve(data_sorted.filter(function(d) {return d.group > cutpoint})),
        km_surv_low = KM_Curve(data_sorted.filter(function(d) {return d.group <= cutpoint}));

    km_surv_low.unshift({"t_i": min_date, "d_i": 0, "Y_i": 0, "s_t": 0, "S_t": 1});
    km_surv_high.unshift({"t_i": min_date, "d_i": 0, "Y_i": 0, "s_t": 0, "S_t": 1});

    var surv_func = svg.append("g")
        .attr("class", "survival_function");


    var line = d3.svg.line()
        .interpolate("step-after")
        .x(function(d) { return x(d.t_i) })
        .y(function(d) { return y_surv(d.S_t)});

    function new_survival(km_surv, class_name){

        surv_func.append("path")
            .datum(km_surv)
            .attr("class", class_name)
            .attr("d", line)


    };

    new_survival(km_surv_high, "line_high");
    new_survival(km_surv_low, "line_low");
    d3.select(".line_high")
        .style("fill", "none")
        .style("stroke", "orangered")
        .style("stroke-width", "2px")
    d3.select(".line_low")
        .style("fill", "none")
        .style("stroke", "steelblue")
        .style("stroke-width", "2px")



    function update_survival(newData, class_name){

        surv_func.select(class_name)
            .datum(newData)
            .transition().duration(500)
            .attr("d", line)


    }


    /////////////// A bar to drag to define the cutpoint. ///////////////
    drag_group_behavior = d3.behavior.drag()
        .on("drag", function(){
            var y_loc = d3.event.y;
            y_loc = y_loc < height / 2 ? height / 2 : y_loc,
                y_loc = y_loc > height ? height : y_loc,
                cutpoint = y_group.invert(y_loc);

            // move bar
            d3.select(".drag_group_line")
                .attr("y", y_loc);
//                .attr("transform", "translate(" + y_loc + "," + width + ")")
//                .select("text");

            d3.select(this)
                .attr("y", y_loc - 11);
        })
        .on("dragend", function(){
            svg.selectAll(".lifespan")
                .classed("dragging", false);

            var x_loc = +d3.select(".drag_screen").attr("x");
            x_loc += 15;
            var time_loc = x.invert(x_loc);

            // re-sort data
            data_sorted = sortByTwoVar(data, cutpoint);

            // update lifespan
            update_lifespan(newData = data_sorted, cutpoint = cutpoint);

            // update group
            update_group(newData = data_sorted, cutpoint = cutpoint);

            svg.selectAll(".lifespan")
                .attr("opacity",  function(d) { return d.time < time_loc ? 0.1: 1})
                .classed("ignored", function(d) {return  d.time < time_loc})
                .classed("dragging", true)

            //generate new KM curve data.
            km_data = data_sorted.filter(function(d) { return d.time >= time_loc});
            km_data_high = km_data.filter(function(d) { return d.group > cutpoint});
            km_data_low = km_data.filter(function(d) { return d.group < cutpoint});

            km_surv_high = KM_Curve(km_data_high);
            km_surv_low = KM_Curve(km_data_low);
            km_surv_high.unshift({"t_i": time_loc, "d_i": 0, "Y_i": 0, "s_t": 0, "S_t": 1});
            km_surv_low.unshift({"t_i": time_loc, "d_i": 0, "Y_i": 0, "s_t": 0, "S_t": 1});

            update_survival(km_surv_high, ".line_high");
            update_survival(km_surv_low, ".line_low");

        });

    //////////// a prompt box to get the cutpoint for group ////////////////
    input_group_cutpint = function() {
        var input_cutpoint = prompt("Please enter your cutpoint value:");
        if (isNaN(input_cutpoint) | input_cutpoint == null) {
            console.log(input_cutpoint);
            alert("Please input a number.");
        } else {
            // calculate grabber location
            var y_loc = y_group(input_cutpoint);
            y_loc = y_loc < height / 2 ? height / 2 : y_loc,
                y_loc = y_loc > height ? height : y_loc;

            // change the cutpoint
            cutpoint = y_group.invert(y_loc);

            // move bar
            d3.select(".drag_group_line")
                .attr("y", y_loc);
            d3.select(".drag_group_grabber")
                .attr("y", y_loc - 11);

            // get time cutpoint
            var x_loc = +d3.select(".drag_screen").attr("x");
            x_loc += 15;
            var time_loc = x.invert(x_loc);

            // re-sort data
            data_sorted = sortByTwoVar(data, cutpoint);

            // update lifespan
            update_lifespan(newData = data_sorted, cutpoint = cutpoint);

            // update group
            update_group(newData = data_sorted, cutpoint = cutpoint);

            svg.selectAll(".lifespan")
                .attr("opacity",  function(d) { return d.time < time_loc ? 0.1: 1})
                .classed("ignored", function(d) {return d.time < time_loc});

            //generate new KM curve data.
            km_data = data_sorted.filter(function(d) { return d.time >= time_loc});
            km_data_high = km_data.filter(function(d) { return d.group > cutpoint});
            km_data_low = km_data.filter(function(d) { return d.group < cutpoint});

            km_surv_high = KM_Curve(km_data_high);
            km_surv_low = KM_Curve(km_data_low);
            km_surv_high.unshift({"t_i": time_loc, "d_i": 0, "Y_i": 0, "s_t": 0, "S_t": 1});
            km_surv_low.unshift({"t_i": time_loc, "d_i": 0, "Y_i": 0, "s_t": 0, "S_t": 1});

            update_survival(km_surv_high, ".line_high");
            update_survival(km_surv_low, ".line_low");

        }
    }

    d3.select(".axis_y_right").on("click", input_group_cutpint);


    //////////// a prompt box to get the cutpoint for time ////////////////
    input_time_cutpint = function() {
        var input_cutpoint = prompt("Please enter your cutpoint value:");
        if (isNaN(input_cutpoint) | input_cutpoint == null) {
            console.log(input_cutpoint);
            alert("Please input a number.");
        } else {
            console.log(input_cutpoint);
            // calculate grabber location
            var x_loc = x(input_cutpoint);
            x_loc = x_loc < 0 ? 0 : x_loc,
                x_loc = x_loc > width ? width : x_loc;


            // change the cutpoint
            var time_loc = x.invert(x_loc);

            //move bar.
            d3.select(".drag_bar")
                .attr("transform", "translate(" + x_loc + ",0)")
                .select("text")
                .text("entry ≥ " + time_loc.roundTo(0) + " days");

            d3.select(".drag_screen")
                .attr("x",  x_loc - 15);

            svg.selectAll(".lifespan")
                .attr("opacity",  function(d) { return d.time < time_loc ? 0.1: 1})
                .classed("ignored", function(d) { return d.time < time_loc});


            //generate new KM curve data.
            //only include current individuals.
            km_data = data.filter(function(d) { return d.time >= time_loc});
            km_data_high = km_data.filter(function(d) { return d.group > cutpoint});
            km_data_low = km_data.filter(function(d) { return d.group <= cutpoint});

            var km_test_res = logRankTest(km_data_high, km_data_low);

            updateLegend(
                cutpoint.roundTo(3), 
                km_data_high.length, 
                km_data_low.length,
                km_test_res['p'].roundTo(3)
            );

            km_surv_high = KM_Curve(km_data_high, reSort = true);
            km_surv_low = KM_Curve(km_data_low, reSort = true);
            km_surv_high.unshift({"t_i": time_loc, "d_i": 0, "Y_i": 0, "s_t": 0, "S_t": 1});
            km_surv_low.unshift({"t_i": time_loc, "d_i": 0, "Y_i": 0, "s_t": 0, "S_t": 1});
            update_survival(km_surv_high, ".line_high");
            update_survival(km_surv_low, ".line_low");
        }
    }

    d3.select(".axis--x").on("click", input_time_cutpint);


    // make grabber bar
    var bar_group_y = (height / 4) * 3;
    svg.append("rect")
        .attr({
            x: width + 70,
            y: bar_group_y - 11,
            rx: 2, ry: 2,
            width: 15,
            height: 25,
            fill: "#636363",
            class: "drag_group_grabber"
        })
        .call(drag_group_behavior);

    var drag_group_bar = svg.append("g")
        .attr("class", "drag_group_bar")
        .style("pointer-events", "none")

    drag_group_bar.append("rect")
        .attr({
            x: width + 10,
            y: bar_group_y,
            width: 60,
            height: 2,
            fill: "black",
            opacity: 1,
            class: "drag_group_line"
        })


    //////////////  A bar to drag to filter the conditional entry time. //////////////
    drag_behavior = d3.behavior.drag()
        .on("drag", function(){
            var x_loc = d3.event.x;
            x_loc = x_loc < 0 ? 0 : x_loc,
                x_loc = x_loc > width ? width : x_loc,
                time_loc = x.invert(x_loc);

            //move bar.
            d3.select(".drag_bar")
                .attr("transform", "translate(" + x_loc + ",0)")
                .select("text")
                .text("entry ≥ " + time_loc.roundTo(0) + " days");

            d3.select(this)
                .attr("x",  x_loc - 15);

            svg.selectAll(".lifespan")
                .attr("opacity",  function(d) { return d.time < time_loc ? 0.1: 1})
                .classed("ignored", function(d) { return  d.time < time_loc})
                .classed("dragging", true)
        })
        .on("dragend", function(){
            svg.selectAll(".lifespan")
                .classed("dragging", false);

            //generate new KM curve data.
            //only include current individuals.
            km_data = data.filter(function(d) { return d.time >= time_loc});
            km_data_high = km_data.filter(function(d) { return d.group > cutpoint});
            km_data_low = km_data.filter(function(d) { return d.group <= cutpoint});

            var km_test_res = logRankTest(km_data_high, km_data_low);

            updateLegend(
                cutpoint.roundTo(3), 
                km_data_high.length, 
                km_data_low.length,
                km_test_res['p'].roundTo(3)
            );

            km_surv_high = KM_Curve(km_data_high, reSort = true);
            km_surv_low = KM_Curve(km_data_low, reSort = true);
            km_surv_high.unshift({"t_i": time_loc, "d_i": 0, "Y_i": 0, "s_t": 0, "S_t": 1});
            km_surv_low.unshift({"t_i": time_loc, "d_i": 0, "Y_i": 0, "s_t": 0, "S_t": 1});
            update_survival(km_surv_high, ".line_high");
            update_survival(km_surv_low, ".line_low");
        });


    //make grabber bar
    //grabber box to do the dragging.
    svg.append("rect")
        .attr({
            x: -15,
            y: height/2 - 25,
            rx: 2, ry:2,
            width: 15,
            height: 25,
            fill: "#636363",
            class: "drag_screen"
        })
        .call(drag_behavior);

    var drag_bar = svg.append("g")
        .attr("class", "drag_bar")
        .style("pointer-events", "none");

    drag_bar.append("rect")
        .attr({
            x: -1,
            width: 2,
            height: height,
            fill: "#636363",
            opacity: 0.5,
            class: "drag_screen"
        })

    drag_bar.append("text")
        .text("entry ≥ " + min_date.roundTo(2) + " days")
        .attr({
            "y": (height/2) - 3,
            "x": 3,
            "fill": "#636363",
            "text-anchor": "start"
        })

    ////////////// End drag bar //////////////


    ///////////////////////////// Generate a K-M non-parametric survival curve for data.

    function KM_Curve(data, reSort) {
        //Source http://stackoverflow.com/questions/11246758/how-to-get-unique-values-in-an-array
	if(reSort === undefined){
	    reSort = false;
	}
        if (reSort) {
            data = data.sort(function(a, b) { return a.time - b.time});
        }

        function contains(array, v) {
            for(var i = 0; i < array.length; i++) {
                if(array[i] === v) return true;
            }
            return false;
        };
        function unique(array) {
            var arr = [];
            for(var i = 0; i < array.length; i++) {
                if(!contains(arr, array[i])) {
                    arr.push(array[i]);
                }
            }
            return arr;
        }

        //get unique times of event.
        event_times = unique(data.filter(function(d) {return d.event}).map(function(d) {return d.time}));


        km_table = event_times.map(function(t_i) {
            //Number of events at t_i
            var d_i = data.filter(function(d) { return d.time == t_i && d.event}).length

            //number at risk in study, but havent had event yet.
            var Y_i = data.filter(function(d) { return d.time>= t_i}).length

            var s_t = 1 - (d_i/Y_i);

            // t_i: time point
            // d_i: number of event in t_i time point
            // Y_i: number at risk in study, but haven't had event yet.
            // s_t: survival probability
            return {"t_i": t_i, "d_i": d_i, "Y_i": Y_i, "s_t": s_t}
        })

        for (var [i, row] of km_table.entries()) {
            var t = row.t_i,
                s_t = row.s_t,
                last_S_t = i != 0 ? km_table[i-1].S_t : 1;
            // S_t: survival rate
            km_table[i].S_t = last_S_t * s_t;
        }

        // If there are no event, add the last followup time to be the end of the survival curve 
        // If the last event time happend earlier than the last followup time, 
        //    make the last followup time to be the end of the survival curve
        if (km_table.length > 0) {
            var km_table_last = km_table[km_table.length - 1];
            if (km_table_last.t_i < data[data.length - 1].time) {
                km_table_last = {"t_i": data[data.length - 1].time, "d_i": 0, "Y_i": 1, "s_t": 1, "S_t": km_table[km_table.length - 1].S_t};
            }
        } else {
            km_table_last = {"t_i": data[data.length - 1].time, "d_i": 0, "Y_i": 1, "s_t": 1, "S_t": 1};
        }
        
        km_table.push(km_table_last);

        return km_table;
    }
}
// add prefixed versions too.

