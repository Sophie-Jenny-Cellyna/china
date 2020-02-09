"use strict"

//时间轴
function timeLine(datas){
    //处理时间轴数据
    var timestamp_arr = [];
    for(let i = 0; i < datas.length; i++){
        let data = datas[i];
        let t_date = data.t_date;   //时间
        timestamp_arr.push(new Date(t_date).getTime());
    }
    var timestamp_set = new Set(timestamp_arr);//去重
    timestamp_arr = Array.from(timestamp_set);//转化数组
    timestamp_arr.sort(function(a,b){
        return a - b;
    });//从小到打排序

    var time_data = [];
    for(let i = 0; i < timestamp_arr.length; i++){
        time_data.push(date2String(timestamp_arr[i]));
    }

    //时间轴开始
    var time_chart = echarts.init(document.getElementById('time'));
    var option = {
        dataZoom: [
            {
                show: true,
                // backgroundColor:"red",
                fillerColor:"#969696",    //选中范围的填充颜色。
                borderColor:"#969696", //边框颜色。
                realtime: true,
                start: 0,
                end: 100,
                left:"center",  //组件离容器左侧的距离,'left', 'center', 'right','20%'
                top:"middle"  //组件离容器上侧的距离,'top', 'middle', 'bottom','20%'
            }
        ],
        xAxis: [
            {
                show : false,
                data: time_data
            }
        ],
        yAxis: [
            {
                show : false,
            }
        ]
    };
    time_chart.setOption(option);

    //滑动时触发
    // time_chart.on( 'datazoom', function (params) {
    //     console.log(params);
    // });
    return [time_chart, time_data];
}



// push进去线路开始-结束地点-经纬度
function convertData(data, geoCoordMap) {
    var res = [];
    for (var i = 0; i < data.length; i++) {
        var dataItem = data[i];
        var fromCoord = geoCoordMap[dataItem[0].name];
        var toCoord = geoCoordMap[dataItem[1].name];
        if (fromCoord && toCoord) {
            res.push([{
                coord: fromCoord
            }, {
                coord: toCoord
            }]);
        }
    }
    return res;
};

/**
 * 
 *  遍历到其他城市的线路
 * @param {*} arr [['合肥', HFData]]
 * @param {*} geoCoordMap 
 * @param {*} HFData 
 */
function computingData(arr, geoCoordMap, HFData){
    var series = [];

    arr.forEach(function(item, i) {
        // 配置
        series.push({
            // 系列名称，用于tooltip的显示
            name: item[0],
            type: 'lines',
            zlevel: 1, // 用于 Canvas 分层，不同zlevel值的图形会放置在不同的 Canvas 中
            // effect出发到目的地 的白色尾巴线条
            // 线特效的配置
            effect: {
                show: true,
                period: 3, // 特效动画的时间，单位为 s
                trailLength: 0.1, // 特效尾迹的长度。取从 0 到 1 的值，数值越大尾迹越长
                color: '#46bee9', // 移动箭头颜色
                symbol: __constent__.planePath,
                symbolSize: 6 // 特效标记的大小
            },
            // lineStyle出发到目的地 的线条颜色
            lineStyle: {
                normal: {
                    color: __constent__.color[i],
                    width: 0,
                    curveness: 0.2 //幅度
                }
            },
            data: convertData(item[1], geoCoordMap) //开始到结束数据
        }, {
            //出发地信息
            name: item[0],
            type: 'lines',
            zlevel: 2,
            effect: {
                show: true,
                period: 3,
                trailLength: 0,
                symbol: __constent__.planePath,
                symbolSize: 6
            },
            lineStyle: {
                normal: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                        offset: 0,
                        color: '#FFFFA8' // 出发
                    }, {
                        offset: 1,
                        color: '#58B3CC ' // 结束 颜色
                    }], false),
                    width: 1.5,
                    opacity: 0.4,
                    curveness: 0.2
                }
            },
            data: convertData(item[1], geoCoordMap)
        }, {
            // 目的地信息
            name: item[0],
            type: 'effectScatter',
            coordinateSystem: 'geo',
            zlevel: 2,
            rippleEffect: {
                brushType: 'stroke'
            },
            hoverAnimation: true,
            label: {
                normal: {
                    show: true,
                    position: 'right',
                    formatter: '{b}'
                }
            },
            symbolSize: function(val) {
                return val[2];
            },
            itemStyle: {
                normal: {
                    color: __constent__.color[i]
                }
            },
            data: item[1].map(function(dataItem) {
                return {
                    name: dataItem[1].name,
                    value: geoCoordMap[dataItem[1].name] === undefined
                            ? 0
                            : geoCoordMap[dataItem[1].name].concat([dataItem[1].value])
                };
            })
        });
    });
    return series;
}

//查询坐标
function getHFData_ajax_arr(start_time, end_time, city, tb_no, wuhan_data){
    var new_data = [];  //筛选过后的数据数组
    var end = {};
    for(let i = 0; i < wuhan_data.length; i++){
        let data = wuhan_data[i];
        let t_date = data.t_date;   //时间
        let t_pos_start = data.t_pos_start; //地区
        let t_pos_end = data.t_pos_end;
        let t_no = data.t_no; //车次

        if(i === 0){
            if(end[city] === undefined){   //目的地
                end[city] = 1;
            }else{
                end[city] = 1;
            }
        }
        //判断时间是否在范围内
        if(
            new Date(t_date).getTime() < new Date(start_time).getTime()
            ||
            new Date(t_date).getTime() >  new Date(end_time).getTime()
        ){
            console.log(start_time, t_date, end_time);
            continue;
        }
        //地区
        if(t_pos_start.search(city) === -1){
            continue;
        }
        //车次
        if(tb_no.trim() !== ""){
            if(tb_no.toUpperCase() !== t_no){
                continue;
            }
        }
        if(end[t_pos_end] === undefined){   //目的地
            end[t_pos_end] = 1;
        }else{
            end[t_pos_end] += 1;
        }
        new_data.push(data);
        
    }   //for

    //得到geoCoordMap
    var ajax_arr = [];

    for(let e in end){
        if(__constent__.geoCoordMap[e] !== undefined){  //集合中有信息 则跳过
            continue;
        }
        let url = "http://api.map.baidu.com/geocoder/v2/?address="
                + e
                + "&output=json&ak="
                + __constent__.ak;

        let aj = $.ajax({
            url:url,
            type:'get',
            dataType:'jsonp',
            success:function(info){
                if(info.status !== 1){
                    __constent__.geoCoordMap[e] = [info.result.location.lng, info.result.location.lat];//保存
                }
            }
        });
        ajax_arr.push(aj);
    }
    return [ajax_arr, end, new_data];
    
}

//数据表
function table_datagrid(target, data){
    $(target).datagrid({
        fitColumns:true, 
        pagination:true, 
        data:data.slice(0,10), 
        // remoteSort:false,   //设置为本地排序
        columns:[[
            {field:'t_type',title:'交通类型',formatter:function(value,row,index){
                return __constent__.type[value.toString(10)];
            }, sortable:true, sorter : function(a,b){
                return  a - b;
            }},
            {field:'t_date',title:'时间', sortable:true, sorter : function(a,b){
                return  new Date(a).getTime() - new Date(b).getTime();
            }},//时间
            {field:'t_no',title:'车次/车牌/航班号/场所'},//车次
            {field:'t_no_sub',title:'车厢'},//车厢
            {field:'t_pos_start',title:'出发站', sortable:true, sorter : function(a,b){
                return b.localeCompare(a,"zh");
            }},//出发站
            {field:'t_pos_end',title:'到达站', sortable:true, sorter : function(a,b){
                return b.localeCompare(a,"zh");
            }},//到达站
            {field:'t_memo',title:'车次附加描述'},
            {field:'t_start',title:'开始时间', formatter:function(value,row,index){    
                var unixTimestamp = new Date(value);    
                return unixTimestamp.toLocaleString();    
            }},
            {field:'t_end',title:'结束时间', formatter:function(value,row,index){    
                var unixTimestamp = new Date(value);    
                return unixTimestamp.toLocaleString();    
            }},
            {field:'who',title:'线索人'},
            {field:'source',title:'信息来源', formatter:function(value,row,index){
                return "<a href='" + value + "' target='_blank'>查看信息</a>"
            }},
            {field:'created_at',title:'提交时间', sortable:true, sorter : function(a,b){
                return  new Date(a).getTime() - new Date(b).getTime();
            }}
        ]]
    });


    var pager = $(target).datagrid("getPager"); 
    pager.pagination({ 
        total:data.length, 
        onSelectPage:function (pageNo, pageSize) { 
            var start = (pageNo - 1) * pageSize; 
            var end = start + pageSize; 
            $(target).datagrid("loadData", data.slice(start, end)); 
            pager.pagination('refresh', { 
                total:data.length, 
                pageNumber:pageNo 
            }); 
        } 
    }); 
    
}

function date2String(timestamp){
    var date = new Date(timestamp);
    var year = date.getFullYear(); 
    var month =(date.getMonth() + 1).toString(); 
    var day = (date.getDate()).toString();  
    if (month.length == 1) { 
        month = "0" + month; 
    } 
    if (day.length == 1) { 
        day = "0" + day; 
    }
    return year + "-" + month + "-" + day;
}

function cakeData(ajax_arr_data2){
    var cake_method = [];
    var cake_data_set = {};
    for(let i = 0, arr_length = ajax_arr_data2.length; i < arr_length; i++){
        let t_type = ajax_arr_data2[i].t_type;
        let method = __constent__.type[t_type];
        if(cake_method.indexOf(method) === -1){
            cake_method.push(method);
        }
        if(cake_data_set[method] === undefined){
            cake_data_set[method] = 1;
        }else{
            cake_data_set[method] += 1;
        }

    }
    var cake_data = [];
    for(let method in cake_data_set){
        cake_data.push({name : method, value : cake_data_set[method]});
    }

    return [cake_method, cake_data];
}


//饼
function cakeChart(cake_method, cake_data, origin, ajax_arr_data2){
    var cake_chart = echarts.init(document.getElementById('cake'));
    var option = {
        title: {
            text: "从" + origin +"出发使用的交通工具占比",
            left: 'center'
        },
        legend: {
            orient: 'vertical',
            left: 'left',
            data: cake_method
        },
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b} : {c} ({d}%)'
        },
        series: [
            {
                name: "从" + origin +"出发",
                type: 'pie',
                selectedMode: 'single',
                radius: [0, '50%'],
                label: {
                    position: 'inner'
                },
                labelLine: {
                    show: false
                },
                data: cake_data
            }
        ]
    };
    cake_chart.setOption(option);
     // 处理点击事件并且跳转到相应的百度搜索页面
    cake_chart.on('click', function (params) {

        var method = params.name;
        for(var type in __constent__.type){
            if(__constent__.type[type] === method){
                break;
            }
        }
        var barChart_data = {};//组装数据
        for(let i = 0, arr_length = ajax_arr_data2.length; i < arr_length; i++){
            if(parseInt(type) !== ajax_arr_data2[i].t_type){
                continue;
            }
            let pos_end = ajax_arr_data2[i].t_pos_end;//目的地
            if(barChart_data[pos_end] === undefined){
                barChart_data[pos_end] = 1;
            }else{
                barChart_data[pos_end] += 1;
            }
            
        }
        /*
        //值排序 用于筛选前多少个
        var value_arr = [];
        Object.getOwnPropertyNames(barChart_data).forEach(function(key){
            value_arr.push(barChart_data[key]);
        });
        value_arr.sort(function(a, b){
            return b - a;   //从大到小排序
        });
        var v = value_arr[10];//结尾数据
        if(v !== undefined){    //不足
            var delete_key = [];
            for(let key in barChart_data){
                if(barChart_data[key] < v){
                    delete_key.push(key);
                }
            }
            for(let i = 0; i < delete_key.length; i++){
                delete barChart_data[delete_key[i]];
            }
        }
        */
        barChart(barChart_data, origin, method);
    });

}

function barChart(builderJson, origin, method){
    var bar_chart = echarts.init(document.getElementById('bar'));
      
    var option = {
        title: {
            text: "从" + origin + "使用" + method + "出行到达各地的人数",
            left: 'center'
        },
        xAxis: [{
            type: 'value',
            splitLine: {
                show: false
            }
        }],
        yAxis: [{
            type: 'category',
            data: Object.keys(builderJson),
            // axisLabel: {
            //     textStyle: {
            //         fontSize:'7'
            //     },
            //     interval: 0,
            //     rotate: 45//倾斜
            // },
            // splitLine: {
            //     show: false
            // }
            axisLabel: {
                inside: true,
                textStyle: {
                    color: '#000000'
                }
            },
            axisTick: {
                show: false
            },
            axisLine: {
                show: false
            },
            z: 10
            
        }],
        dataZoom: [
            {
                id: 'dataZoomY',
                type: 'inside',
                yAxisIndex: [0],
                filterMode: 'filter'
            }
        ],
        series: [
            { // For shadow
                type: 'bar',
                itemStyle: {
                    color: 'rgba(0,0,0,0.05)'
                },
                barGap: '-100%',
                barCategoryGap: '40%',
                // data: dataShadow,
                animation: false
            },{
            type: 'bar',
            label: {
                normal: {
                    position: 'right',
                    show: true
                }
            },
            data: Object.keys(builderJson).map(function (key) {
                return builderJson[key];
            })
        }]
    };
    bar_chart.setOption(option);

}
