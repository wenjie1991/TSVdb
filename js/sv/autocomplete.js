$("#gene_symbol").autocomplete({
    source: "http://api.smallysun.com/autocomplete",
    select: function(event, ui) {
        $(this).value = ui.item.value;
    },
    minLength: 2
});

$("#gene_symbol_sort").autocomplete({
    source: "http://api.smallysun.com/autocomplete",
    select: function(event, ui) {
        $(this).value = ui.item.value;
    },
    minLength: 2
});
