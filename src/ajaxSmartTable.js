/**
 *
 * @param options
 */



(function ( $ ) {

    var defaults = {
        // These are the defaults.
        url: "",
        params: {},
        data_format: 'json',
        labels: [],
        fields:[],
        control_sort:false,
        sort_field:"",
        sort_type:"",
        control_paginate:false,
        paginate_container: "",
        paginate_cant_by_page: "30",
        paginate_max: 10,
        control_filter:false,
        filter_container: "",
        paginationAdapter: function(total, page, cant_by_page, container_id, base_table, paginate_max, callback){
            let ul = $("<ul />").addClass("pagination");

            let total_pages = Math.ceil(total / cant_by_page);

            let page_start = 0;
            let page_end = total_pages;

            if(total_pages > paginate_max){
                let cant_before_and_after = Math.floor(paginate_max / 2);

                if(page > cant_before_and_after){
                    page_start = page - cant_before_and_after;

                }
                page_end = page_start + paginate_max;


                if(page_end > total_pages){
                    page_end = total_pages;
                }
            }

            for(let p=page_start; p<page_end; p++){
                let page_element = $("<li />").addClass("page-item");

                if(p===page){
                    page_element.addClass("active");
                }
                let page_link =  $("<a />")
                    .addClass("page-link")
                    .attr("href", "#")
                    .html(p+1)
                    .data("page",p)
                    .on("click", callback);

                page_element.append(page_link);

                ul.append(page_element);
            }

            if(container_id === ""){
                base_table.after( ul );
            }else{
                $("#" +container_id).html(ul);
            }
        },

        filterAdapter: function(container_id, base_table, callback){
            let filter = $("<div />");
            filter.addClass("input-group input-group-sm");

            let input = $("<input />");
            input.attr("type","text")
                .addClass("form-control")
                .attr("placeholder","Search")
                .on("keypress", function(e){

                    if(e.which === 13) {
                        callback(input);
                    }
                });

            let btn = $("<div />")
                .addClass("input-group-append")
                .html(
                    $("<button />")
                        .addClass("btn btn-default")
                        .attr("type","submit")
                        .html("Search")
                        .on("click", function(e){
                            e.preventDefault();
                            callback(input);
                        })
                );

            filter.html(input).append(btn);

            if(container_id === ""){
                base_table.after( filter );
            }else{
                $("#" +container_id).html(filter);
            }
        },
        getDownloadData: function(raw_data){

            return raw_data.data;
        },
        getTotals: function(raw_data){
            return raw_data.total;
        },
        showLabel: function(i, key, all_labels){
            var lbl = "";

            if(all_labels.length > 0 && all_labels.length > i){

                lbl = all_labels[i];
            }else{
                lbl = key;
            }

            return lbl;
        },
        showField: function(i, field,record){
            //si el registro existe
            if (Object.prototype.hasOwnProperty.call(record, field)) {
                return record[field];
            }else{
                return field;
            }
        },
        rowFormat: function(row_element, record){
            return row_element;
        },
        cellFormat: function(cell_element, record, field){
            return cell_element;
        },
        buildParams: function (settings, page, filter_text){
            let params = settings.params;

            if(settings.control_sort){
                params.sort_field = settings.sort_field;
                params.sort_type = settings.sort_type
            }


            if(settings.control_paginate) {
                params.page = page;

            }

            if(settings.control_filter) {
                params.filter = filter_text;

            }

            return params;
        }
    };

    $.fn.ajaxSmartTable = function(options) {
        // This is the easiest way to have default options.

        var settings = $.extend(true, {}, defaults, options );

        return this.each(function(i, _element) {
            // Do something to each element here.
            var obj = new AjaxSmartTable($(_element)[0], settings);
            obj.init();


            //si no esta inicializado
                //crea headers
                //crea el body
                //crea el footer
        });
    };

    function AjaxSmartTable(element, settings){
        var obj = this;

        obj.settings = settings;
        obj.page=0;
        obj.filter_text="";
        obj.table = $(element);



        obj.init = function(){

            if(obj.settings.control_sort){
                obj.table.addClass("ajaxSmartTable-sort");
            }

            obj.buildFilter();


            this.loadRemoteData();
        };

        obj.loadRemoteData=function() {
            //TODO loading class
            var params = this.settings.buildParams(this.settings, obj.page, obj.filter_text);

            //busca datos en la url
            $.post(this.settings.url,params, function (result) {

                let all_data = obj.settings.getDownloadData(result);

                let total = obj.settings.getTotals(result);

                if(all_data.length > 0){
                    //carga el header
                    obj.addHeader(all_data[0]);

                    //carga el body
                    obj.buildData(all_data);

                    //Construye la paginacion
                    obj.buildPagination(total);
                }

            },this.settings.data_format);
        };

        obj.addHeader = function(record){



            if(obj.settings.fields.length==0){

                for (var key in record) {

                    obj.settings.fields.push(key);
                }
            }

            if(obj.table.find("thead").length==0){
                var header = $("<thead />");

                record = obj.settings.fields;


                for (var i=0; i<record.length;i++) {
                    var key = record[i];
                    var field = $("<th />").html(obj.settings.showLabel(i,key,obj.settings.labels));

                    //si esta habilitado el reordenado
                    if(obj.settings.control_sort){
                        field.on("click", obj.onReorder);
                        field.attr("aria-field", key);
                    }

                    header.append(field);
                }

                this.table.append(header);
            }



        };

        obj.buildData = function(data){
            var body = $("<tbody />");

            var arrayLength = data.length;
            for (var i = 0; i < arrayLength; i++) {
                var row = obj.buildRow(data[i]);

                body.append(row);
            }

            var last_body = obj.table.find("tbody");
            if(last_body.length>0){
                last_body.remove();
            }

            obj.table.append(body);
        };

        obj.buildRow = function(record){
            var row = obj.settings.rowFormat($("<tr />"),record);


            for (var i=0; i<obj.settings.fields.length;i++) {
                var key = obj.settings.fields[i];

                var field = obj.settings.cellFormat($("<td />"),record, key)
                field = field.html(obj.settings.showField(i,key,record));

                row.append(field)
            }

            return row;
        };

        obj.onReorder = function(e){
            var element = $(this);

            //busca el anteriore seleccionado


            var selected_field = element.attr("aria-field");
            var actual_field = obj.settings.sort_field;



            if(actual_field == selected_field){

                if(obj.settings.sort_type == "asc"){
                    obj.settings.sort_type = "desc";
                }else{
                    obj.settings.sort_type = "asc";
                }
            }else{

                if(actual_field != ""){
                    var last = obj.table.find("[aria-sort]");
                    last.removeAttr("aria-sort");
                }

                obj.settings.sort_type = "asc";
            }

            obj.settings.sort_field = selected_field;

            //agrega a seleccion
            element.attr("aria-sort", obj.settings.sort_type);

            //actualiza datos
            obj.loadRemoteData();
        };

        obj.onPaginateClick = function(e){
            e.preventDefault();
            let element = $(this);

            obj.page = element.data("page");

            //quita activo
            element.closest('ul').find(".active").removeClass("active");

            //marca activo
            element.closest('li').addClass("active");

            obj.loadRemoteData();
        };


        obj.buildPagination=function(total){
            //si esta habilitada la paginacion
            if(obj.settings.control_paginate){
                obj.settings.paginationAdapter(total,obj.page,obj.settings.paginate_cant_by_page,obj.settings.paginate_container,obj.table,obj.settings.paginate_max, obj.onPaginateClick);
            }
        };

        obj.buildFilter=function(){
            //si esta habilitado el filtro
            if(obj.settings.control_filter){
                //TODO
                obj.settings.filterAdapter(obj.settings.filter_container,obj.table,obj.onFilter);
            }
        };

        obj.onFilter= function(e){

            let element = $(e);


            obj.filter_text = element.val();
            obj.loadRemoteData();
        };


    }

}( jQuery ));