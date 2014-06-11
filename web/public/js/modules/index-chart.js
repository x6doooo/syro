define(function(require, exports, module) {

    var initConfig = function(name){
        return {
            chart: {
                backgroundColor: null,
                //zoomType: 'x',
                borderWidth: 0,
                spacing: [0, 0, 0, 0],
                showAxes: false
            },
            title: {
                //text: name,
                text: '',
                //floating: true,
                style: {
                    color: '#999',
                    fontSize: '12px'
                }
            },
            subtitle: {
                text: ''
            },
            credits: {
                text: ''
            },
            xAxis: {
                labels: {
                    enabled: false
                },
                gridLineWidth: 0,
                tickWidth: 0,
                type: 'datetime'//,
                //minRange: 14 * 24 * 3600000 // fourteen days
            },
            yAxis: {
                labels: {
                    enabled: false
                },
                gridLineWidth: 0,
                title: {
                    text: ''
                }
            },
            legend: {
                enabled: false
            },
            plotOptions: {
                area: {
                    fillColor: {
                        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1},
                        stops: [
                            //[0, Highcharts.getOptions().colors[0]],
                            //[1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                            [0, '#00baff'],
                            [1, Highcharts.Color('#00baff').setOpacity(0).get('rgba')]
                        ]
                    },
                    marker: {
                        radius: 0
                    },
                    lineWidth: 1,
                    states: {
                        hover: {
                            lineWidth: 1
                        }
                    },
                    threshold: null
                }
            },
            tooltip: {
                //enabled: false
            },
            series: [{
                id: 's0',
                type: 'area',
                name: name,
                data: (function() {
                    var data = [];
                    var time = Date.now();
                    for (var i = -100; i <= 0; i++) {
                        data.push({
                            x: time + i * 1000,
                            y: null
                        });
                    }
                    return data;
                })()
            }]
        }
    };

    module.exports = initConfig;

});
