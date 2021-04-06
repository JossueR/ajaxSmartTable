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
        use_local_data:false,
        resultSet: [],
        bindTagId:"data-sl-bind_id",
        url_data: "",
        url_template: "",
        params: {},
        data_format: 'json',

        control_paginate:false,
        paginate_container: "",
        paginate_cant_by_page: "30",
        paginate_max: 10,
        use_more:false,
        modeAdapter:function(){
            let more = $("<a />");
            more.html("More")
                .attr("href","#")
                .addClass("asl-more col-12 mb-4");

            return more;
        },
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
        onBind: function(record, view, bindTagId, x, total){
            for (let key in record) {
                view.find("["+bindTagId+"="+key+"]").html(record[key]);
            }
        },
        onFinish: function(view){

        },
        onLoading:function(){},
        onLoadingEnd: function(){}
    };

    function ExceptionAjaxSmartList(mensaje) {
        this.mensaje = mensaje;
        this.nombre = "ExceptionAjaxSmartList";
        this.toString = function() {
            return this.nombre + ": " + this.mensaje
        };
    }

    $.fn.ajaxSmartList = function(options) {
        // This is the easiest way to have default options.

        let settings = $.extend(true, {}, defaults, options);

        return this.each(function (i, _element) {


            let obj = $(_element).data('AjaxSmartList');

            if(obj){
                obj.refresh();
            }else{
                obj = new AjaxSmartList($(_element)[0], settings);
                $(_element).data('AjaxSmartList', obj);
                obj.init();
            }

        });

        function AjaxSmartList(element, settings) {
            let obj = this;

            obj.settings = settings;
            obj.page = 0;
            obj.filter_text = "";
            obj.container = $(element);
            obj.pagination_builded = false;
            obj.template = null;
            obj.more_element = null;

            obj.refresh = function(){
                obj.loadRemoteTemplate();
                obj.loadRemoteData();
            };


            obj.init = function () {


                if (obj.settings.control_sort) {
                    obj.container.addClass("ajaxSmartTable-sort");
                }

                if(obj.settings.use_more){
                    obj.settings.control_paginate=true;
                }

                obj.buildFilter();

                obj.loadRemoteTemplate();

            }

            /**
             * Busca un template con el que se construirá cada dato
             */
            obj.loadRemoteTemplate = function () {



                //busca datos en la url
                $.post(this.settings.url_template, {}, function (result) {

                    obj.template = $($.parseHTML(result));
                    obj.loadRemoteData();

                });
            }

            obj.loadRemoteData = function () {

                if(obj.settings.use_local_data){

                    let newResultSet = obj.localFilter(obj.settings.resultSet);
                    obj.localSort(newResultSet);
                    newResultSet = obj.localPaging(newResultSet);

                    obj.onDataLoaded(newResultSet);
                }else{
                    let params = this.settings.buildParams(this.settings, obj.page, obj.filter_text);

                    obj.settings.onLoading();
                    //busca datos en la url
                    $.post(this.settings.url_data, params, obj.onDataLoaded, this.settings.data_format);
                }


            }

            obj.onDataLoaded=function (result) {

                let all_data = obj.settings.getDownloadData(result);


                let total = 0;
                if(obj.settings.use_local_data){
                    total = obj.settings.getTotals(obj.localFilter(obj.settings.resultSet));
                }else{
                    total = obj.settings.getTotals(result);
                }

                if(!Array.isArray(all_data)){
                    throw new ExceptionAjaxSmartList("getDownloadData no retorno un arreglo de datos");
                }

                if(typeof total != 'number'){
                    throw new ExceptionAjaxSmartList("getTotals no retorno cantidad de registros");
                }


                if(all_data.length > 0){


                    //carga el body
                    obj.buildData(all_data);

                    //Construye la paginación
                    obj.destroyPagination();
                    obj.buildPagination(total);
                }else{
                    if(obj.settings.use_more){
                        if( obj.more_element != null){
                            obj.more_element.remove();
                        }
                    }
                }

                obj.settings.onLoadingEnd();

            };

            obj.buildData = function (data) {

                if(obj.settings.use_more ){
                    if( obj.more_element != null){
                        obj.more_element.remove();
                    }
                }else{
                    obj.container.empty();
                }

                let arrayLength = data.length;

                for (let i = 0; i < arrayLength; i++) {
                    let view = obj.template.clone();

                    obj.settings.onBind(data[i], view, obj.settings.bindTagId, i, arrayLength);

                    obj.container.append(view);
                }

                if(obj.settings.use_more){
                    obj.more_element = obj.settings.modeAdapter();
                    obj.more_element.on("click",function (e){
                        e.preventDefault();
                        obj.page++;
                        obj.loadRemoteData();
                    });
                    obj.container.append(obj.more_element);
                }

                obj.settings.onFinish(obj.container);
            }

            obj.onPaginateClick = function (e) {
                e.preventDefault();
                let element = $(this);

                obj.page = element.data("page");

                //quita activo
                element.closest('ul').find(".active").removeClass("active");

                //marca activo
                element.closest('li').addClass("active");

                obj.loadRemoteData();
            }

            obj.buildPagination = function (total) {
                //si esta habilitada la paginación y no esta construida
                if (obj.settings.control_paginate && !obj.pagination_builded && !obj.settings.use_more) {
                    obj.settings.paginationAdapter(total, obj.page, obj.settings.paginate_cant_by_page, obj.settings.paginate_container, obj.container, obj.settings.paginate_max, obj.onPaginateClick);
                    obj.pagination_builded = true;
                }
            }

            obj.destroyPagination = function () {
                if (obj.pagination_builded) {

                    if (obj.settings.paginate_container !== "") {
                        $("#" + obj.settings.paginate_container).empty()
                    } else {
                        obj.container.next().remove();
                    }

                    obj.pagination_builded = false;


                }
            }

            obj.buildFilter = function () {
                //si esta habilitado el filtro
                if (obj.settings.control_filter) {

                    obj.settings.filterAdapter(obj.settings.filter_container, obj.container, obj.settings.filter_placeholder, obj.settings.filter_btn_text, obj.onFilter);
                }
            }

            obj.onFilter = function (e) {

                let element = $(e);


                obj.filter_text = element.val();
                obj.page = 0;
                if(obj.settings.use_more){
                    obj.container.empty();
                }
                obj.loadRemoteData();
            }

            obj.localFilter = function (result) {
                let records_filtered = [];

                for (let i = 0; i < result.length; i++) {
                    let record = result[i];


                    for (let key in record) {

                        let ok = String(record[key]).indexOf(obj.filter_text);
                        if (ok !== -1) {
                            records_filtered.push(record);
                            break;
                        }
                    }

                }

                return records_filtered;
            }


            obj.localSort = function (result) {

                if (obj.settings.control_sort) {

                    result.sort(function (a, b) {
                        let comparison = 0;

                        if (a[obj.settings.sort_field] > b[obj.settings.sort_field]) {
                            comparison = 1;
                        }
                        if (a[obj.settings.sort_field] < b[obj.settings.sort_field]) {
                            comparison = -1;
                        }

                        if (obj.settings.sort_type !== "asc") {
                            comparison = comparison * -1;
                        }

                        return comparison;
                    });
                }
            }

            obj.localPaging = function (result) {
                let pageSet = [];

                if (obj.settings.control_paginate) {
                    let start = obj.page * obj.settings.paginate_cant_by_page;
                    let end = start + obj.settings.paginate_cant_by_page;


                    for (let i = start; i < end && i < result.length; i++) {
                        pageSet.push(result[i]);
                    }
                } else {
                    pageSet = result;
                }


                return pageSet;
            }


        }
    }
}( jQuery ));