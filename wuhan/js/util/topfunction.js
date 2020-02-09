"use strict"

function lineData(data){
    var dateList = [];
    var confirmedList = [];
    var suspectedList = [];
    var curesList = [];
    var deathsList = [];

    for(let leng = data.length, i = leng - 1; i >= 0; i--){
        let date = data[i].date;//日期
        let confirmedNum = data[i].confirmedNum;//确诊人数
        let suspectedNum = data[i].suspectedNum;// 疑似
        let curesNum = data[i].curesNum;//治愈
        let deathsNum = data[i].deathsNum;//死亡
        dateList.push(date);
        confirmedList.push(confirmedNum);
        suspectedList.push(suspectedNum);
        curesList.push(curesNum);
        deathsList.push(deathsNum);
    }
    return [
        {
            data1 : confirmedList,
            data2 : suspectedList, 
            dateList : dateList,
            textList : ["全国确诊","疑似病例"],
            colorList : ["red", "yellow"]
        },
        {
            data1 : curesList,
            data2 : deathsList, 
            dateList : dateList,
            textList : ["治愈人数","死亡人数"],
            colorList : ["green", "black"]
        }
    ]
}

function drawLine(data, target, title){
    var line_chart = echarts.init(document.getElementById(target));
    var option = {
        title: {
            text: title,
            left: 'center',
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                label: {
                    backgroundColor: '#6a7985'
                }
            }
        },
        color : data.colorList,
        legend: {
            left: 'left',
            orient: 'vertical',
            data: data.textList
        },
        dataZoom: [
            {
                show: false,
                realtime: true,
                start: 0,
                end: 100
            },
            {
                type: 'inside',
                realtime: true,
                start: 0,
                end: 100
            }
        ],
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: data.dateList
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
                name: data.textList[0],
                type: 'line',
                lineStyle : {
                    normal :{
                        color : data.colorList[0]
                    }
                },
                data: data.data1
            },
            {
                name: data.textList[1],
                type: 'line',
                lineStyle : {
                    normal :{
                        color : data.colorList[1]
                    }
                },
                data: data.data2
            }
        ]
    };

    line_chart.setOption(option);

}

function hotMapData(list){
    var dataList = [];
    var nanhai = true;
    for(let i = 0, l = list.length; i < l; i++){
        let data = list[i];
        let sp_list = data.split(" ");
        let province = sp_list[0];  //省
        let diagnosed = parseInt(sp_list[2]); //确诊数
        dataList.push({
            name : province,
            value : diagnosed
        });
        if(province === "南海诸岛"){
            nanhai = false;
        }
    }
    if(nanhai){
        dataList.push({
            name : "南海诸岛",
            value : 0
        });
    }
    return dataList;
}

function hotMap(target, dataList){
    var hot_mapChart = echarts.init(document.getElementById(target));
    var option = {
        title: {
            text: "全国各省累计确诊病例分布图",
            left: 'center',
            textStyle : {
                fontSize : 25
            }
        },
        tooltip: {
                formatter:function(params,ticket, callback){
                    return params.seriesName+'<br />'+params.name+'：'+params.value
                }//数据格式化
            },
        visualMap: {
            left: 'left',
            top: 'bottom',
            inRange: {
                color: ['#FFD39B', '#B22222']//取值范围的颜色
            },
            type: 'piecewise',                  // 定义为分段型 visualMap
            splitNumber:5,                      //对于连续型数据，自动平均切分成几段。默认为5段
            pieces: [                           //自定义『分段式视觉映射组件（visualMapPiecewise）』的每一段的范围，以及每一段的文字，以及每一段的特别的样式
                {min: 10000},// 不指定 max，表示 max 为无限大（Infinity）。
                {min: 1000, max: 9999},
                {min: 500, max: 999},
                {min: 100, max: 499},
                {min: 10, max: 99},
                {max: 9} // 不指定 min，表示 min 为无限大（-Infinity）。
            ],
            // categories:['严重污染', '重度污染', '中度污染', '轻度污染', '良', '优'], 
            show:true//图注
        },
        geo: {
            map: 'china',
            roam: false,//不开启缩放和平移
            zoom:1.2,//视角缩放比例
            aspectScale: 1,
            label: {
                normal: {
                    show: true,
                    fontSize:'10',
                    color: 'rgba(0,0,0,0.7)'
                }
            },
            itemStyle: {
                normal:{
                    borderColor: 'rgba(0, 0, 0, 0.2)'
                },
                emphasis:{
                    areaColor: '#FFFFFF',//鼠标选择区域颜色
                    shadowOffsetX: 0,
                    shadowOffsetY: 0,
                    shadowBlur: 20,
                    borderWidth: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            }
        },
        series : [
            {
                name: '确认病例(人)',
                type: 'map',
                geoIndex: 0,
                data:dataList
            }
        ]
    };
    hot_mapChart.setOption(option);
}