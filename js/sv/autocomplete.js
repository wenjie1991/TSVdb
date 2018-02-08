$("#gene_symbol").autocomplete({
    source: "http://116.62.201.120/autocomplete",
    select: function(event, ui) {
        $(this).value = ui.item.value;
    },
    minLength: 2
});

$("#gene_symbol_sort").autocomplete({
    source: "http://116.62.201.120/autocomplete",
    select: function(event, ui) {
        $(this).value = ui.item.value;
    },
    minLength: 2
});
