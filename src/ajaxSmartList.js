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
        bindTagId:"data-sl-bind_id",
        url_data: "",
        url_template: "",
        params: {},
        data_format: 'json',

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
        onBind: function(record, view, bindTagId){
            for (let key in record) {
                view.find("["+bindTagId+"="+key+"]").html(record[key]);
            }
        },
        onLoading:function(){},
        onLoadingEnd: function(){}
    };

    $.fn.ajaxSmartList = function(options) {
        // This is the easiest way to have default options.

        let settings = $.extend(true, {}, defaults, options);

        return this.each(function (i, _element) {
            // Do something to each element here.
            let obj = new AjaxSmartList($(_element)[0], settings);
            obj.init();


        });

        function AjaxSmartList(element, settings) {
            let obj = this;

            obj.settings = settings;
            obj.page = 0;
            obj.filter_text = "";
            obj.container = $(element);
            obj.pagination_builded = false;
            obj.template = null;


            obj.init = function () {


                if (obj.settings.control_sort) {
                    obj.table.addClass("ajaxSmartTable-sort");
                }

                obj.buildFilter();

                obj.loadRemoteTemplate();

            }

            /**
             * Busca un template con el que se construirá cada dato
             */
            obj.loadRemoteTemplate = function () {
                let params = this.settings.buildParams(this.settings, obj.page, obj.filter_text);


                //busca datos en la url
                $.post(this.settings.url_template, params, function (result) {

                    obj.template = $($.parseHTML(result));
                    obj.loadRemoteData();

                });
            }

            obj.loadRemoteData = function () {

                if(obj.settings.resultSet.length>0){

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
                if(obj.settings.resultSet.length>0){
                    total = obj.settings.getTotals(obj.localFilter(obj.settings.resultSet));
                }else{
                    total = obj.settings.getTotals(result);
                }


                if(all_data.length > 0){


                    //carga el body
                    obj.buildData(all_data);

                    //Construye la paginación
                    obj.destroyPagination();
                    obj.buildPagination(total);
                }

                obj.settings.onLoadingEnd();

            };

            obj.buildData = function (data) {


                let arrayLength = data.length;
                obj.container.empty()
                for (let i = 0; i < arrayLength; i++) {
                    let view = obj.template.clone();

                    obj.settings.onBind(data[i], view, obj.settings.bindTagId);

                    obj.container.append(view);
                }


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
                if (obj.settings.control_paginate && !obj.pagination_builded) {
                    obj.settings.paginationAdapter(total, obj.page, obj.settings.paginate_cant_by_page, obj.settings.paginate_container, obj.table, obj.settings.paginate_max, obj.onPaginateClick);
                    obj.pagination_builded = true;
                }
            }

            obj.destroyPagination = function () {
                if (obj.pagination_builded) {

                    if (obj.settings.paginate_container !== "") {
                        $("#" + obj.settings.paginate_container).empty()
                    } else {
                        obj.table.next().remove();
                    }

                    obj.pagination_builded = false;


                }
            }

            obj.buildFilter = function () {
                //si esta habilitado el filtro
                if (obj.settings.control_filter) {

                    obj.settings.filterAdapter(obj.settings.filter_container, obj.table, obj.settings.filter_placeholder, obj.settings.filter_btn_text, obj.onFilter);
                }
            }

            obj.onFilter = function (e) {

                let element = $(e);


                obj.filter_text = element.val();
                obj.page = 0;
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