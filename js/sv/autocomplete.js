$("#gene_symbol").autocomplete({
    source: "http://www.tsvdb.com/autocomplete",
    select: function(event, ui) {
        $(this).value = ui.item.value;
    },
    minLength: 2
});

$("#gene_symbol_sort").autocomplete({
    source: "http://www.tsvdb.com/autocomplete",
    select: function(event, ui) {
        $(this).value = ui.item.value;
    },
    minLength: 2
});
