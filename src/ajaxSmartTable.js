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
        getDownloadData: function(raw_data){

            return raw_data.data;
        },
        getTotals: function(raw_data){
            return raw_data.totals;
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
                return "...";
            }
        },
        rowFormat: function(row_element, record){
            return row_element;
        },
        cellFormat: function(cell_element, record, field){
            return cell_element;
        },
        buildParams: function (instance){
            var params = instance.params;

            if(instance.control_sort){
                params.sort_field = instance.sort_field;
                params.sort_type = instance.sort_type
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

        obj.table = $(element);



        obj.init = function(){

            if(obj.settings.control_sort){
                obj.table.addClass("ajaxSmartTable-sort");
            }


            this.loadRemoteData();
        };

        obj.loadRemoteData=function() {
            //TODO loading class
            var params = this.settings.buildParams(this.settings);

            //busca datos en la url
            $.post(this.settings.url,params, function (result) {

                var all_data = obj.settings.getDownloadData(result);

                if(all_data.length > 0){
                    //carga el header
                    obj.addHeader(all_data[0]);

                    //carga el body
                    obj.buildData(all_data);
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





    }

}( jQuery ));