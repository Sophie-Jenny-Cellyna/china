"use strict"

$(function(){
    // 基于准备好的dom，初始化echarts实例
    var mapBoxEchart = echarts.init(document.getElementById('mapBox'));
    //时间
    $('#time').datebox({
        required:true,
        panelWidth:200,
        panelHeight:230,
        width : 200
        // style : "{border-radius: 0px}"
    });
    // $('#time').datebox('setValue', '2019-12-30');
    //组合框
    // $('#province').combobox({
    //     data: __constent__.province,
    //     panelWidth:200,
    //     panelHeight:230,
    //     width : 200,
    //     valueField:'id',
    //     textField:'text',
    //     onSelect : function(sel){
    //         var cities = __constent__.city[sel.text];
    //         var city_data = [];
    //         for(let i = 1; i <= cities.length; i++){
    //             let city_dict = {"id" : i, "text" : cities[i - 1]};
    //             city_data.push(city_dict)
    //         }
    //         $('#city').combobox({
    //             data: city_data,
    //             panelWidth:200,
    //             panelHeight:230,
    //             width : 200,
    //             valueField:'id',
    //             textField:'text',
    //         });
    //     }
    // });
    //地区
    $('#city').textbox({
        width : 200
    });
    //车次
    $('#tb').textbox({
        width : 200
    });

    $("#search").click(function(){
        
        var time = $('#time').datebox("getValue");
        var city = $('#city').textbox("getText");
        var tb_no = $('#tb').textbox("getValue");
        if(city === ""){
            alert("必须填写地区");
            return;
        }
        var ajax_arr_data = getHFData_ajax_arr(time, city, tb_no);
        
        var end = ajax_arr_data[1];

        // var HFData = [ // 数据中name的城市名称必须与geoCoordMap中城市名称一致, 不然关联不上，合肥到各地区的线路
        //     [{name: '合肥市'}, {name: '长春市',value: 66}],//value越大  圆的半径越大
        //     [{name: '合肥市'}, {name: '长沙市',value: 66}],
        //     [{name: '合肥市'}, {name: '合肥市',value: 118}]
        // ];

        $.when.apply($,ajax_arr_data[0]).done(function(){
            var HFData = [];
            for(let e in end){
               HFData.push([{name: city}, {name: e,value: end[e]}]);
            }
            // 数据
            var series = computingData([[city, HFData]], __constent__.geoCoordMap, HFData);
            // 使用制定的配置项和数据显示图表
            mapBoxEchart.setOption(__constent__.mapBoxOption(series));

            table_datagrid("#tt", ajax_arr_data[2]);
        });
        
    });

    // 使用制定的配置项和数据显示图表
    mapBoxEchart.setOption(__constent__.mapBoxOption(null));
    // echart图表自适应
    window.addEventListener("resize", function() {
        mapBoxEchart.resize();
    });
    mapBoxEchart.on('click', function (params) {
        console.log('这是地图点击事件~~~',params.region.name);
    });

    table_datagrid("#tt", __data__.data)

});


