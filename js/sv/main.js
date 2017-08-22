$("#tutorial").click(function() {
    window.open("/sv/index.html", "_self")
});

//d3.json("/sv/example_data/ACTB.json", function(error, data) {
var gene, data_type, tumor_type, clinical_type;
var start = true;

function new_plot() {
    nav_start("#nav_tumor");
    nav_start("#nav_gene");
    nav_start("#nav_region");
    nav_start("#nav_clinical");
    $(".cancel").hide();
    $(".nav_module_close").hide();
    start = true;
}
new_plot();

function draw() {
//    var gene, data_type, tumor_type, clinical_type;
//    gene          = $("#query_gene").val();
//    data_type     = $("#query_data_type").val();
//    tumor_type    = $("#query_tumor_type").val();
//    clinical_type = $("#query_clinical_type").val();
    url           = "/sv_db?gene=" + gene + "&tumor=" + tumor_type + "&cd=" + clinical_type;

    d3.json(url, function(error, data) {
        console.log(data);
        plot(data, data_type);
    });
}

// start configure wizard
function nav_start(obj) {
    var this_obj = $(obj);
    this_obj.addClass("nav_choosen nav_start");
    this_obj.children(".module_display_when_choosen").show();
    this_obj.children(".module_display_when_unchoosen").hide();
    this_obj.hide();
    $(".nav_choosen").css("z-index", 2);
    $(".mask").show();
    if (obj == "#nav_tumor") {
        this_obj.show();
    }
    return false;
}

// header function
function nav_click() {
    var this_obj = $(this);
    this_obj.addClass("nav_choosen");
    this_obj.children(".module_display_when_choosen").show();
    this_obj.children(".module_display_when_unchoosen").hide();
    $(".nav_choosen").css("z-index", 2);
    $(".mask").show();
    return false;
}
$("document").ready(function(){
    $(".nav_module_option").click(nav_click);
});

function close_nav_module() {
    $(".mask").hide();
    $(".nav_choosen").css("z-index", 0);
    $(".nav_choosen").children(".module_display_when_choosen").hide();
    $(".nav_choosen").children(".module_display_when_unchoosen").show();
    $(".nav_choosen").find("input").val("");
    $(".nav_choosen").removeClass("nav_choosen");
    return false;
}
$(".nav_module_close").click(close_nav_module);
$(".cancel").click(close_nav_module);

function nav_module_select() {
    if (!start) {
        $(".mask").hide();
    }
    return false;
}


$("#nav_new").click(new_plot);

function nav_module_tumor_select() {
    var input_value = $(".nav_module_tumor_option").val();
    var nav_choosen = $("#nav_tumor.nav_choosen");
    nav_module_select();
    nav_choosen.css("z-index", 0);
    nav_choosen.removeClass("nav_choosen");
    nav_choosen.removeClass("nav_start");
    nav_choosen.children(".module_display_when_choosen").hide();
    nav_choosen.children(".module_display_when_unchoosen").show();
    $("#nav_module_display_tumor").text(input_value);
    tumor_type = input_value;
    $("#nav_gene.nav_choosen").show()

    if (!start) {
        draw();
    }

    return false;
}
$(".nav_module_tumor_select").click(nav_module_tumor_select);


function nav_module_gene_select() {
    var input_value = $("#gene_symbol").val();
    var nav_choosen = $("#nav_gene.nav_choosen");

    url = "/sv_checkname?gene=" + input_value + "&tumor=" + tumor_type;
    d3.json(url, function(error, data) {
        if (data.gene) {
            $(".invalide_gene").hide();
            nav_module_select(this);
            nav_choosen.css("z-index", 0);
            nav_choosen.removeClass("nav_choosen");
            nav_choosen.removeClass("nav_start");
            nav_choosen.children(".module_display_when_choosen").hide();
            nav_choosen.children(".module_display_when_unchoosen").show();
            $("#gene_symbol").val("");

            var re = /^\d+$/;
            if (re.test(input_value)) {
                $("#nav_module_display_gene").text("Entrezid: " + input_value);
            } else {
                $("#nav_module_display_gene").text(input_value);
            }

            gene = input_value;
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
    nav_choosen.removeClass("nav_start");
    nav_choosen.children(".module_display_when_choosen").hide();
    nav_choosen.children(".module_display_when_unchoosen").show();
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

    start = false;
    $(".cancel").show();
    $(".nav_module_close").show();

    var input_value = $(".nav_module_clinical_option").val();
    var nav_choosen = $("#nav_clinical.nav_choosen");

    nav_module_select();
    nav_choosen.css("z-index", 0);
    nav_choosen.removeClass("nav_start");
    nav_choosen.removeClass("nav_choosen");
    nav_choosen.children(".module_display_when_choosen").hide();
    nav_choosen.children(".module_display_when_unchoosen").show();
    $("#nav_module_display_clinical").text(input_value);
    clinical_type = input_value.toLowerCase();

    draw();

    return false;
}
$(".nav_module_clinical_select").click(nav_module_clinical_select);

//draw();
