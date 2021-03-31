<?php

function build_sorter($clave, $asc) {
    return function ($a, $b) use ($clave, $asc) {
        if($asc){
            return strnatcmp($a[$clave], $b[$clave]);
        }else{
            return strnatcmp( $b[$clave], $a[$clave]);
        }

    };
}

$data = file_get_contents("data.json");
$data = json_decode($data, true);

$page = (isset($_REQUEST["page"]))? $_REQUEST["page"] : null;
$filter = (isset($_REQUEST["filter"]))? $_REQUEST["filter"] : null;
$sort_field = (isset($_REQUEST["sort_field"]) && $_REQUEST["sort_field"] != "")? $_REQUEST["sort_field"] : null;
$sort_type = (isset($_REQUEST["sort_type"]))? $_REQUEST["sort_type"] : null;
$cant_by_page = 15;



if(!is_null($sort_field)){

    if($sort_type == "asc"){
        $t = true;

    }else{
        $t=false;
    }
    usort($data, build_sorter($sort_field, $t));
}

    $send_data = array();

    if(is_null($page)){
        $page = 0;
        $cant_by_page = count($data);
    }




    $start= $page * $cant_by_page;

    for($i= $start; $i < $start + $cant_by_page; $i++){
        $record = $data[$i];



        if($filter != null){
            $apply = false;
            foreach ($record as $field){

                if(strpos($field,$filter) !== false){
                    $apply = true;
                    break;
                }

            }
        }else{
            $apply = true;
        }

        if($apply){
            $send_data[] =  $record;
        }

    }



header('Cache-Control: no-cache, must-revalidate');
header('Content-type: application/json');
echo json_encode(array(
    "data"=>$send_data,
    "total"=>count($data)
));