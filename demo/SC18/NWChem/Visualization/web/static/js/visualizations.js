class Visualizations {
    constructor(data) {
        var me = this;
        this.views = [];

        var allFunctions = functionColors;
        var allColors = [];

        this.category7 = ["#b3b3b3", "#8da0cb", "#66c2a5", "#fc8d62", "#e78ac3", "#a6d854", "#e5c494"];
        
        //color schemes
        this.functionMap = {};
        Object.keys(allFunctions).forEach(function(d) {
            var prefix = (d+"([").match(/.+?(?=[\[\(])/)[0];
            var dispalyName = prefix.match(/(.*::)*(.*)/)[2];
            me.functionMap[d]=dispalyName;
        });
        this.functionColor = d3.scaleOrdinal(Object.keys(allFunctions).map(d=>allFunctions[d])).domain(Object.keys(allFunctions));

        this.scoreScale = d3.scaleLinear().range([-1, -0.4, 0.4, 1]).domain([-1, 0, 0, 1]);
        this.anomalyColor = d3.scaleSequential(d3.interpolateRdBu).domain([-1.3, 1.3]);
        this.clusterColor = d3.scaleOrdinal(this.category7).domain([-1, 0, 1, 2, 3, 4, 5]);
        this.colorScheme = 0; //0 = anomaly, 1 = cluster
        this.scatterLegend = new View(data, d3.select("#scatterlegend"), {
            'width': 190,
            'height': 60
        })

    }

    init(data) {
        var me = this;
        this.scatterLegend.drawScatterLegend = function(type) {
            this.svg.selectAll("rect").remove();
            this.svg.selectAll("text").remove();
            if (type == 0) {
                var gradient = Array.from({
                    length: 21
                }, (x, i) => i / 10 - 1);
                this.svg.selectAll(".legend")
                    .data(gradient)
                    .enter()
                    .append('rect')
                    .attr('x', (d, i) => i * (this.size.width - 30) / (gradient.length - 1) + 5)
                    .attr('y', 10)
                    .attr('width', 10)
                    .attr('height', 20)
                    .attr('fill', d => (me.anomalyColor(d)));
                this.svg.selectAll(".legendText")
                    .data(gradient)
                    .enter()
                    .append('text')
                    .text(function(d) {
                        if (d == -1) {
                            return "min"
                        } else if (d == 1) {
                            return "max"
                        } else {
                            return "";
                        }
                    })
                    .attr('x', (d, i) => i * (this.size.width - 30) / (gradient.length - 1))
                    .attr('y', 40)
                    .attr('fill', "black");
            } else {
                this.svg.selectAll(".legend")
                    .data(me.clusterColor.domain())
                    .enter()
                    .append('rect')
                    .attr('x', (d, i) => (i % 3) * 55)
                    .attr('y', (d, i) => Math.floor(i / 3) * 18 + 10)
                    .attr('width', 20)
                    .attr('height', 12)
                    .attr('fill', d => (me.clusterColor(d)));
                this.svg.selectAll(".legendText")
                    .data(me.clusterColor.domain())
                    .enter()
                    .append('text')
                    .text(d => (d != -1) ? "#" + d : "none")
                    .attr('x', (d, i) => (i % 3) * 55 + 25)
                    .attr('y', (d, i) => Math.floor(i / 3) * 18 + 20)
                    .attr('fill', "black");
            }
        };
        this.scatterLegend.drawScatterLegend(0);
    }

    addView(view) {
        this.views.push(view);
    }

    deleteView(gid) {
        var index = this.indexOf(gid);
        if (index != -1) {
            this.views[index] = null;
            this.views.splice(index, 1);
        }
    }

    clearSubTrees() {
        for (let i = this.views.length - 1; i >= 0; i--) {
            if (this.views[i].viewType == 2) {
                this.views[i].svg.remove();
                this.views[i].svg = null;
                this.views[i] = null;
                this.views.splice(i, 1);
            }
        }
    }

    changeColor(type) {
        this.colorScheme = type;
        this.views.forEach(d => {
            d.changeColor(this.colorScheme)
        });
        this.scatterLegend.drawScatterLegend(type);
    }

    selected(data, options) {
        var vis = this.views;
        var graph = this.getSelectedTree();
        //console.log(graph);
        var me = this;
        var total = -graph.nodes[0].value;
        var legendMap = {};
        graph.nodes.forEach(function(d){
            total += d.value;
            if(d.name in legendMap){
                legendMap[d.name]+=d.value;
            }else{
                legendMap[d.name]=d.value;
            }
        });
        vis.majorFunctions = [];
        Object.keys(legendMap).forEach(function(key) {
            //if(legendMap[key]>total/visOptions.colorThreshold||showFunctionColor.has(key)){
            vis.majorFunctions.push(key);
            //}
        });
        //vis.majorFunctions.push("Others");
        vis.views.forEach(d => {
            d.selected() //draw all views
        });
    }
    unselected() {
        this.views.forEach(d => {
            d.unselected()
        });
    }

    stream_update(){
        this.views.forEach(d => {
            d.stream_update()
        });
    }
    projectionChanged() {
        this.views.forEach(d => {
            d.projectionChanged()
        });
    }

    indexOf(index) {
        var fid = -1;
        this.views.some(function(d, i) {
            if (d.viewType == 1 && d.graphId == index) {
                fid = i;
            }
            return fid != -1;
        })
        return fid;
    }
}