"use strict"

$(function(){
    $.get(__constent__.num_data_url, function(datas){
        var data = datas.data;
        var update_time = data.date; //更新时间
        var diagnosed = data.diagnosed; //确诊人数
        var suspect = data.suspect;//疑似病例人数
        var death = data.death;//死亡人数
        var cured = data.cured;//治愈人数
        var serious = data.serious;//重症人数
        var list = data.list;//全国数据列表
        var history = data.history;//每日历史数据
        $("#update_time").html("数据更新时间：" + update_time);
        var dataMap = lineData(history);
        drawLine(dataMap[0], "line1", "全国累计确诊/疑似趋势(人)");
        drawLine(dataMap[1], "line2", "全国累计治愈/死亡趋势(人)");
        var d = hotMapData(list);
        hotMap("hotMap", d);

    });

    $.get(__constent__.data_url, function(wuhan_data){
        // 基于准备好的dom，初始化echarts实例
        var mapBoxEchart = echarts.init(document.getElementById('mapBox'));
        var result_arr = timeLine(wuhan_data.data);
        var time_chart = result_arr[0];
        var time_data = result_arr[1];
        $('#city').textbox({
            width : 200,
            prompt : "必填。如:武汉",
            type : "text",
            value : "武汉"
        });
        //车次
        $('#tb').textbox({
            width : 200
        });
        $("#search").click(function(){
            var zoom = time_chart.getOption().dataZoom;
            var start_time_id = zoom[0].startValue;
            var end_time_id = zoom[0].endValue;
            var start_time = time_data[start_time_id];
            var end_time = time_data[end_time_id];
        
            var city = $('#city').textbox("getText");
            // var tb_no = $('#tb').textbox("getValue");
            var tb_no = "";
            if(city === ""){
                alert("必须填写地区");
                return;
            }

            var ajax_arr_data = getHFData_ajax_arr(start_time, end_time, city, tb_no, wuhan_data.data);
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
            var cake_data = cakeData(ajax_arr_data[2]);
            cakeChart(cake_data[0], cake_data[1], city, ajax_arr_data[2]);
            // barChart();
    
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
    
        table_datagrid("#tt", wuhan_data.data);
    });

});


