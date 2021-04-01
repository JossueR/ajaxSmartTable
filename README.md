# AjaxSmartTable plug-in for jQuery
AjaxSmartTable es un Plugin para jQuery que permite crear de manera rápida y simple tablas a partir de un api remoto para tablas JSON/AJAX

Provee una forma rápida de poder:
* Paginar
* Ordenar
* Filtrar
* Calcular campos
* Formatear filas
* Formatear columnas
cualquier fuente de datos por defecto JSON.

## Requisitos
* Jquery >= 1.9.1 
* bootstrap opcional (Por default construye los controles basados en bootstrap, pero permite modificar los adaptadores para permitir cualquier implementacion)
## Instalar
Solo clonar el repositorio y agregar las siguientes lineas en el html
```html
<link rel="stylesheet" href="src/ajaxSmartTable.css" />
<script src="src/ajaxSmartTable.js"></script>
```

## Demo
Se incluye un pequeño demo para probar el plugin.
El demo incluye un pequeño api en php, que provee datos en formato json

* Puede ver los ejemplos en el siguiente enlace: http://sysmyapp.com/ajaxsmarttable/

## Uso Básico
```js
$("#table_id").ajaxSmartTable({
    url:"api.php",
});
```

## Ejemplo con paginación
```js
$("#table_5").ajaxSmartTable({
    url:"api.php",
    control_paginate: true,
    paginate_cant_by_page: 20
});
```

## Ejemplo con campos ordenables
```js
$("#table_5").ajaxSmartTable({
    url:"api.php",
    paginate_container: "pagination4",
    control_sort: true
});
```


## Ejemplo con cambio de orden de los campos y campos calculados
```js
 $("#table_2").ajaxSmartTable({
    url:"api.php",
    control_paginate: true,
    paginate_cant_by_page: 20,
    paginate_container: "pagination2",
    fields:[
        "title","id","otro","mas"
    ],
    showField: function(i, field,record){
        //si el registro existe
        if (Object.prototype.hasOwnProperty.call(record, field)) {
            return record[field];
        }else{
            var data = "";
            switch (field){
                case "otro":
                    data = "<a href='#'>hola:" + record.id+"</a>";

                    break;

                default:
                    data = "xx";
            }

            return data;
        }
    }
});
```

## Ejemplo con formato de filas y columnas
```js
$("#table_3").ajaxSmartTable({
    url:"api.php",
    control_paginate: true,
    paginate_cant_by_page: 20,
    paginate_container: "pagination3",
    rowFormat: function(row_element, record){

        if(record.id===2){

            $(row_element).css("color","green");
        }
        return row_element;
    },
    cellFormat: function(cell_element, record, field){

        if(field==="id"){

            $(cell_element).addClass("ok");
        }
        return cell_element;
    },
});
```

## Ejemplo con control de filtro
```js
$("#table_6").ajaxSmartTable({
    url:"api.php",
    control_paginate: true,
    paginate_cant_by_page: 20,
    paginate_container: "pagination5",
    control_filter: true,
    filter_container: "filter_container"
});
```


## Ejemplo con combinando todo
```js
$("#table_7").ajaxSmartTable({
    url:"api.php",
    control_paginate: true,
    paginate_cant_by_page: 20,
    paginate_max: 3,
    paginate_container: "pagination7",
    control_filter: true,
    filter_container: "filter_container7",
    control_sort: true,
    fields:[
        "title","id","otro","mas"
    ],
    showField: function(i, field,record){
        //si el registro existe
        if (Object.prototype.hasOwnProperty.call(record, field)) {
            return record[field];
        }else{
            var data = "";
            switch (field){
                case "otro":
                    data = "<a href='#'>hola:" + record.id+"</a>";

                    break;

                default:
                    data = "xx";
            }

            return data;
        }
    },
    rowFormat: function(row_element, record){

        if(record.id===2){

            $(row_element).css("color","green");
        }
        return row_element;
    },
    cellFormat: function(cell_element, record, field){

        if(field==="id"){

            $(cell_element).addClass("ok");
        }
        return cell_element;
    },
});
```

## Configuración

```js
defaults = {
    url: "",                    //  Url de la funte de datos
    params: {},                 //  parametros por default enviados
    data_format: 'json',        //  formato de datos recibidos
    labels: [],                 //  arreglo de los titulos utilizados
    fields: [],                 //  arreglo de campos a mostrar
    control_sort: false,        //  Habilita el control de reordenar
    control_paginate: false,    //  Habilita el control de paginación
    paginate_container: "",     //  Id del elemneto donde se insetara la paginacion. Si no se establece, la agrega justo despues de la tabla
    paginate_cant_by_page: "30",//  cantidad de elementos por pagina
    paginate_max: 10,           //  cantidad maxima de paginas que construira
    control_filter: false,      //  Habilita el control filtro
    filter_container: "",       //  Id del elemento donde se insertara el control de filtro
    filter_btn_text: "Search",  //  Texto o html mostrado en el boton de filtrar
    filter_placeholder: "Search",// Placeholder mostrado en el text del filtro.
    
    //Esta funcion es llamada al momento de crear la paginacion. se reconstruye en cada ves que se descargan datos
    /***
     * 
     * @param total total de elementos  de la fuente de datos
     * @param page pagina actual
     * @param cant_by_page cantidad de elementos por pagina
     * @param container_id id del elemento donde se construira la paginacion
     * @param base_table referencia a la tabla
     * @param paginate_max cantidad maxima de paginas que se deben construir
     * @param callback funcion que debe ser llamada al momento de precionar en una pagina
     */
    paginationAdapter: function (total, page, cant_by_page, container_id, base_table, paginate_max, callback) {
        
    },

    /**
     * Construye el control de filtro
     * @param container_id id del elemento donde se construira la paginacion
     * @param base_table referencia a la tabla
     * @param placeholder
     * @param btn_text
     * @param callback funcion que debe ser llamada al momento de filtrar
     */
    filterAdapter: function (container_id, base_table, placeholder, btn_text, callback) {
        
    },

    /**
     * Se llama al momento de evaluar los datos descargados
     * puede que la funte de datos genere el siguiente formato:
     * raw_data = {data:[...], total:"1000"}
     * @param raw_data
     * @returns solo los datos que se utilizaran
     */
    getDownloadData: function (raw_data) {
        return raw_data.data;
    },

    /**
     * Se llama al momento de evaluar los datos descargados, para obtener la cantidad total de datos
     * @param raw_data
     * @returns { number}
     */
    getTotals: function (raw_data) {
        return raw_data.total;
    },

    /**
     * Se llama cada vesque se contruye un titulo
     * @param i número del titulo
     * @param key nombre del campo
     * @param all_labels arreglo con todos los campos
     * @returns texto o html del titulo 
     */
    showLabel: function (i, key, all_labels) {
        return key
    },

    /**
     * Se ejecuta al momento de mostrar un valor.
     * Permite modificar el texto del campo
     * @param i  número del campo
     * @param field nombre del campo
     * @param record registro completo con todos los campos
     * @returns texto o html del titulo
     */
    showField: function (i, field, record) {
        return record[field];
    },

    /**
     * Se ejecuta cuando esta contruyendo cada fila
     * @param row_element referencia al elemento html tr
     * @param record registro actual
     */
    rowFormat: function (row_element, record) {
       
    },

    /**
     * Se ejecuta cuando se esta construyendo cada celda
     * @param cell_element referencia al elemento html td
     * @param record registro actual
     * @param field nombre del campo actual
     */
    cellFormat: function (cell_element, record, field) {
       
    },

    /**
     * Se ejecuta cada ves que se va a enviar datos a la fuente de datos
     * Permite cambiar el nombre del los parametros a enviar, o agregar otros campos
     * @param settings referencia al objeto de configuracion actual
     * @param page pagina actual
     * @param filter_text texto en el cajon de filtro
     * @returns objeto que se enviara a la fuente de datos
     */
    buildParams: function (settings, page, filter_text) {
        return params;
    },

    /**
     * Se ejecuta justo antes de solicitar datos a la fuente de datos
     * Permite agregar algun comportamiento de carga
     */
    onLoading: function () {
    },

    /**
     * Se ejecuta luego de descargar los datos y trerminar de contgruir los datos descargados
     * Permite desactivar el comportamiento de carga
     */
    onLoadingEnd: function () {
    }
}
```