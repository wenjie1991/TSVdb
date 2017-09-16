
// global variation, used to query database.
let gene, data_type, tumor_type, clinical_type, gene_sort;
var start = true;  // If start a new plot, set it true.

// initiate a new graph
function new_plot() {
    nav_start("#nav_tumor");
    nav_start("#nav_gene");
    nav_start("#nav_region");
    nav_start("#nav_clinical");
    $(".cancel").hide();
    $(".nav_module_close").hide();
    start = true;
}
new_plot();  // initiate a new graph when loading webpage;

// draw the graph
function draw() {
//    var gene, data_type, tumor_type, clinical_type;
//    gene          = $("#query_gene").val();
//    data_type     = $("#query_data_type").val();
//    tumor_type    = $("#query_tumor_type").val();
//    clinical_type = $("#query_clinical_type").val();

    var url = "http://116.62.201.120/sv_db?gene=" + gene + "&tumor=" + tumor_type + "&cd=" + clinical_type + "&area=" + data_type + "&gene_sort=" + gene_sort;
//    var url = "/example_data/" + tumor_type + "_" + gene + "_" + clinical_type + "_" + data_type + ".json";

    // donwload data table link
    var url_download = "http://116.62.201.120/sv_datatable?gene=" + gene + "&tumor=" + tumor_type + "&cd=" + clinical_type + "&area=" + data_type + "&gene_sort=" + gene_sort;

    $("#myloading").css("display", 'flex');
    d3.json(url, function(error, data) {
        plot(data, data_type, url_download);
        $("#myloading").css("display", 'none');
    });
}

// download data link

// start configure wizard
function nav_start(obj) {
    var this_obj = $(obj);
    this_obj.addClass("nav_choosen");
    this_obj.children(".nav_module_display_when_choosen").show();
    this_obj.children(".nav_module_display_when_unchoosen").hide();
    this_obj.hide();
    $(".nav_choosen").css("z-index", 2);
    $(".mask").show();
    // The tumor nav should set to show when starting, others are setted by previous one.
    if (obj == "#nav_tumor") {
        this_obj.show();
    }
    return false;  // prevent pop up.
}

// header function
function nav_click() {
    var this_obj = $(this);
    this_obj.addClass("nav_choosen");
    this_obj.children(".nav_module_display_when_choosen").show();
    this_obj.children(".nav_module_display_when_unchoosen").hide();
    $(".nav_choosen").css("z-index", 2);
    $(".mask").show();
    return false;
}
$("document").ready(function(){
    $(".nav_module_option").click(nav_click);
});

// "x" notation and "Cancel buttom"
function close_nav_module() {
    $(".mask").hide();
    $(".nav_choosen").css("z-index", 0);
    $(".nav_choosen").children(".nav_module_display_when_choosen").hide();
    $(".nav_choosen").children(".nav_module_display_when_unchoosen").show();
//    $(".nav_choosen").find("input").val("");
    $(".nav_choosen").removeClass("nav_choosen");
    $(".invalide_gene").hide();
    return false;
}
$(".nav_module_close").click(close_nav_module);
$(".cancel").click(close_nav_module);


function nav_module_select() {
    if (!start) {   // keep mask when initiation
        $(".mask").hide();
    }
    return false;
}

// nav_module: Tutorial 
$("#tutorial").click(function() {
    window.open("./instruction.html", "_self")
});

// nave_module: Renew 
$("#nav_new").click(new_plot);


function nav_module_tumor_select() {
    var input_value = $(".nav_module_tumor_option").val();
    var nav_choosen = $("#nav_tumor.nav_choosen");
    nav_module_select();
    nav_choosen.css("z-index", 0);
    nav_choosen.removeClass("nav_choosen");
    nav_choosen.children(".nav_module_display_when_choosen").hide();
    nav_choosen.children(".nav_module_display_when_unchoosen").show();
    $("#nav_module_display_tumor").text(input_value);
    tumor_type = input_value;  // change the global variable

    $("#nav_gene.nav_choosen").show()  // make next dialog box apearing
    var url = "http://116.62.201.120/get_cd_list?tumor=" + tumor_type;
    d3.json(url, function(error, data) {
        var cd_list = data.cd_list;
        var options = "";
        if (!$.isArray(clinical_type, cd_list)) {
            clinical_type = "sampletype";
            $("#nav_module_display_clinical").text(clinical_type);
        };
        for (var i in cd_list) {
            if (cd_list[i] == "overall_survival") continue;
            options = options + '<option value="' + cd_list[i] + '">' + cd_list[i] + '</option>';
        }
        $(".nav_module_clinical_option").html(options);
        if (!start) {
            draw();
        }
    });

    return false;
}
$(".nav_module_tumor_select").click(nav_module_tumor_select);


function nav_module_gene_select() {
    var input_value = $("#gene_symbol").val();
    var nav_choosen = $("#nav_gene.nav_choosen");

    var url = "http://116.62.201.120/sv_checkname?gene=" + input_value + "&tumor=" + tumor_type;
//    url = "./example_data/" + input_value + "_" + tumor_type + ".json";
    d3.json(url, function(error, data) {
        if (data.gene) {
            $(".invalide_gene").hide();
            nav_module_select(this);
            nav_choosen.css("z-index", 0);
            nav_choosen.removeClass("nav_choosen");
            nav_choosen.children(".nav_module_display_when_choosen").hide();
            nav_choosen.children(".nav_module_display_when_unchoosen").show();
//            $("#gene_symbol").val("");

            $("#nav_module_display_gene").text(data.symbol);
            // if the input is a symbol or entrezid
//            var re = /^\d+$/;
//            if (re.test(input_value)) {
//                $("#nav_module_display_gene").text("Entrezid: " + input_value);
//            } else {
//                $("#nav_module_display_gene").text(input_value);
//            }

            gene = input_value;
            $("#gene_symbol_sort").val(input_value);
            $("#nav_region.nav_choosen").show()

            if (!start) {
                draw();
            }
        } else {
            $(".invalide_gene").show();
        }
    })
    return false;
}
$(".nav_module_gene_select").click(nav_module_gene_select);


function nav_module_region_select() {
    var input_value = $(this).children("img").attr("alt");
    var nav_choosen = $("#nav_region.nav_choosen");

    nav_module_select();
    nav_choosen.css("z-index", 0);
    nav_choosen.removeClass("nav_choosen");
    nav_choosen.children(".nav_module_display_when_choosen").hide();
    nav_choosen.children(".nav_module_display_when_unchoosen").show();
    $("#nav_module_display_region").text(input_value);
    data_type = input_value == "Exon" ? "exon" : "junction";
    $("#nav_clinical.nav_choosen").show()

    if (!start) {
        draw();
    }
    return false;
}
$(".nav_module_region_option").click(nav_module_region_select);


function nav_module_clinical_select() {
    var input_value_gene = $("#gene_symbol_sort").val();
    var input_value_clinical = $(".nav_module_clinical_option").val();

    var url = "http://116.62.201.120/sv_checkname?gene=" + input_value_gene + "&tumor=" + tumor_type;
//    url = "./example_data/" + input_value_gene + "_" + tumor_type + ".json";
    d3.json(url, function(error, data) {
        if (data.gene) {
            var nav_choosen = $("#nav_clinical.nav_choosen");
            gene_sort = data.symbol;
            $("#nav_region.nav_choosen").show()

            // end initation;
            start = false;  
            $(".cancel").show();
            $(".nav_module_close").show();

            nav_module_select();
            nav_choosen.css("z-index", 0);
            nav_choosen.removeClass("nav_choosen");
            nav_choosen.children(".nav_module_display_when_choosen").hide();
            nav_choosen.children(".nav_module_display_when_unchoosen").show();
            $("#nav_module_display_clinical").text(input_value_clinical);
            clinical_type = input_value_clinical.toLowerCase();  // change global variable

            draw(); 
        } else {
            $(".invalide_gene").show();
        }
    })
    return false;
}

$(".nav_module_clinical_select").click(nav_module_clinical_select);
//draw();

