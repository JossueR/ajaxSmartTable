/*
    A simple jQuery Ajax Table plugin (http://github.com/kylefox/jquery-modal)
    Version 1.0
    Copyright © 2021 Jossué Rodriguez
    Licensed under the MIT license.

    https://github.com/JossueR/ajaxSmartTable.git
*/

(function ( $ ) {

    let defaults = {
        // These are the defaults.
        resultSet: [],
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
        filter_btn_text: "Search",
        filter_placeholder: "Search",
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

        filterAdapter: function(container_id, base_table, placeholder, btn_text, callback){
            let filter = $("<div />");
            filter.addClass("input-group ");

            let input = $("<input />");
            input.attr("type","text")
                .addClass("form-control")
                .attr("placeholder",placeholder)
                .on("keypress", function(e){

                    if(e.which === 13) {
                        callback(input);
                    }
                });

            let btn = $("<div />")
                .addClass("input-group-append")
                .html(
                    $("<button />")
                        .addClass("btn btn-primary")
                        .attr("type","button")
                        .html(btn_text)
                        .on("click", function(e){
                            e.preventDefault();
                            callback(input);
                        })
                );

            filter.html(input).append(btn);

            if(container_id === ""){
                base_table.before( filter );
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
            let lbl;

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
                params.cant_by_page = settings.paginate_cant_by_page;
            }

            if(settings.control_filter) {
                params.filter = filter_text;

            }

            return params;
        },
        onLoading:function(){},
        onLoadingEnd: function(){}
    };

    $.fn.ajaxSmartTable = function(options) {
        // This is the easiest way to have default options.

        let settings = $.extend(true, {}, defaults, options );

        return this.each(function(i, _element) {
            // Do something to each element here.
            let obj = new AjaxSmartTable($(_element)[0], settings);
            obj.init();


            //si no esta inicializado
                //crea headers
                //crea el body
                //crea el footer
        });
    };

    function AjaxSmartTable(element, settings){
        let obj = this;

        obj.settings = settings;
        obj.page=0;
        obj.filter_text="";
        obj.table = $(element);
        obj.pagination_builded = false;



        obj.init = function(){

            if(obj.settings.control_sort){
                obj.table.addClass("ajaxSmartTable-sort");
            }

            obj.buildFilter();


            this.loadRemoteData();
        };

        obj.loadRemoteData=function() {

            if(obj.settings.resultSet.length>0){

                let newResultSet = obj.localFilter(obj.settings.resultSet);
                obj.localSort(newResultSet);
                newResultSet = obj.localPaging(newResultSet);

                obj.onDataLoaded(newResultSet);
            }else{
                let params = this.settings.buildParams(this.settings, obj.page, obj.filter_text);

                obj.settings.onLoading();
                //busca datos en la url
                $.post(this.settings.url,params, obj.onDataLoaded,this.settings.data_format);
            }


        };

        obj.onDataLoaded=function (result) {

            let all_data = obj.settings.getDownloadData(result);
            let total = 0;
            if(obj.settings.resultSet.length>0){
                total = obj.settings.getTotals(obj.localFilter(obj.settings.resultSet));
            }else{
                total = obj.settings.getTotals(result);
            }


            if(all_data.length > 0){
                //carga el header
                obj.addHeader(all_data[0]);

                //carga el body
                obj.buildData(all_data);

                //Construye la paginación
                obj.destroyPagination();
                obj.buildPagination(total);
            }

            obj.settings.onLoadingEnd();

        };

        obj.addHeader = function(record){



            if(obj.settings.fields.length===0){

                for (let key in record) {

                    obj.settings.fields.push(key);
                }
            }

            if(obj.table.find("thead").length===0){
                let header = $("<thead />");

                record = obj.settings.fields;


                for (let i=0; i<record.length;i++) {
                    let key = record[i];
                    let field = $("<th />").html(obj.settings.showLabel(i,key,obj.settings.labels));

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
            let body = $("<tbody />");

            let arrayLength = data.length;
            for (let i = 0; i < arrayLength; i++) {
                let row = obj.buildRow(data[i]);

                body.append(row);
            }

            let last_body = obj.table.find("tbody");
            if(last_body.length>0){
                last_body.remove();
            }

            obj.table.append(body);
        };

        obj.buildRow = function(record){
            let row = obj.settings.rowFormat($("<tr />"),record);


            for (let i=0; i<obj.settings.fields.length;i++) {
                let key = obj.settings.fields[i];

                let field = obj.settings.cellFormat($("<td />"),record, key)
                field = field.html(obj.settings.showField(i,key,record));

                row.append(field)
            }

            return row;
        };

        obj.onReorder = function(e){
            let element = $(this);

            //busca el anterior seleccionado


            let selected_field = element.attr("aria-field");
            let actual_field = obj.settings.sort_field;



            if(actual_field === selected_field){

                if(obj.settings.sort_type === "asc"){
                    obj.settings.sort_type = "desc";
                }else{
                    obj.settings.sort_type = "asc";
                }
            }else{

                if(actual_field !== ""){
                    let last = obj.table.find("[aria-sort]");
                    last.removeAttr("aria-sort");
                }

                obj.settings.sort_type = "asc";
            }

            obj.settings.sort_field = selected_field;

            //agrega a selección
            element.attr("aria-sort", obj.settings.sort_type);

            //actualiza datos
            obj.page=0;
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
            //si esta habilitada la paginación y no esta construida
            if(obj.settings.control_paginate && !obj.pagination_builded){
                obj.settings.paginationAdapter(total,obj.page,obj.settings.paginate_cant_by_page,obj.settings.paginate_container,obj.table,obj.settings.paginate_max, obj.onPaginateClick);
                obj.pagination_builded = true;
            }
        };

        obj.destroyPagination=function(){
            if(obj.pagination_builded){

                if(obj.settings.paginate_container !== ""){
                    $("#" + obj.settings.paginate_container).empty()
                }else{
                    obj.table.next().remove();
                }

                obj.pagination_builded = false;


            }
        },

        obj.buildFilter=function(){
            //si esta habilitado el filtro
            if(obj.settings.control_filter){

                obj.settings.filterAdapter(obj.settings.filter_container,obj.table, obj.settings.filter_placeholder, obj.settings.filter_btn_text ,obj.onFilter);
            }
        };

        obj.onFilter= function(e){

            let element = $(e);


            obj.filter_text = element.val();
            obj.page=0;
            obj.loadRemoteData();
        };

        obj.localFilter=function(result){
            let records_filtered = [];

            for (let i = 0; i < result.length; i++) {
                let record = result[i];


                for (let key  in record) {

                    let ok = String(record[key]).indexOf(obj.filter_text);
                    if(ok !== -1){
                        records_filtered.push(record);
                        break;
                    }
                }

            }

            return records_filtered;
        }


        obj.localSort=function(result){

            if(obj.settings.control_sort){

                result.sort(function(a, b) {
                    let comparison = 0;

                    if (a[obj.settings.sort_field] > b[obj.settings.sort_field]) {
                        comparison = 1;
                    }
                    if (a[obj.settings.sort_field] < b[obj.settings.sort_field]) {
                        comparison = -1;
                    }

                    if(obj.settings.sort_type!=="asc"){
                        comparison = comparison * -1;
                    }

                    return comparison;
                });
            }
        }

        obj.localPaging=function(result){
            let pageSet = [];

            if(obj.settings.control_paginate){
                let start = obj.page * obj.settings.paginate_cant_by_page;
                let end = start + obj.settings.paginate_cant_by_page;


                for (let i = start; i < end && i < result.length; i++) {
                    pageSet.push(result[i]);
                }
            }else{
                pageSet = result;
            }


            return pageSet;
        }


    }

}( jQuery ));