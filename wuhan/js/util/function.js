"use strict"
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
                    value: geoCoordMap[dataItem[1].name].concat([dataItem[1].value])
                };
            })
        });
    });
    return series;
}

//查询坐标
function getHFData_ajax_arr(time, city, tb_no){
    var new_data = [];
    var end = {};
    for(let i = 0; i < __data__.data.length; i++){
        let data = __data__.data[i];
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
        //时间
        if(time !== ""){
            if(new Date(time).getTime() !== new Date(t_date).getTime()){
                continue;
            }
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
                __constent__.geoCoordMap[e] = [info.result.location.lng, info.result.location.lat];//保存
            }
        });
        ajax_arr.push(aj);
    }
    return [ajax_arr, end, new_data];
    
}

function table_datagrid(target, data){
    $(target).datagrid({
        data: data,
        fitColumns : true,
        striped : true,
        remoteSort: false,
        // pagination : true,//分页
        // pageNumber:1,
		// pageSize:20,//默认一页显示10个数据
        columns:[[
            {field:'t_type',title:'交通类型',formatter:function(value,row,index){
                switch(value) {
                    case 1:
                       return "飞机";
                    case 2:
                        return "火车";
                    case 4:
                        return "长途客车/大巴";
                    case 5:
                        return "火车";
                    case 6:
                        return "出租车";
                    case 8:
                        return "其它公共场所";
                    default:
                        return value;
               }
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
}