class ScatterView extends View {
    constructor(data, svg) {
        super(data, svg, {});
        var me = this;
        me.color = me.vis.anomalyColor;
        me.margin = {
            top: 0,
            right: 20,
            bottom: 20,
            left: 60
        };
        me.x = d3.scaleLinear().range([me.margin.left, me.size.width - me.margin.right]);
        me.y = d3.scaleLinear().range([me.margin.top + 5, me.size.height - me.margin.bottom]);

        me.selections = new Set();
        me.dot = {};
        this._drawBackground();
        me.xAxis = me.svg.append("g")
            .attr("class", "scatter x axis")    
            .attr("transform", "translate(0,"+(me.size.height - me.margin.bottom)+")")
        me.yAxis = me.svg.append("g")
            .attr("class", "scatter y axis")
            .attr("transform", "translate("+me.margin.left+",0)")

        me.axis = [0, 1];
        me.sbox_x = d3.select("#sbox_x");
        me.sbox_y = d3.select("#sbox_y");
        me.sval = d3.select("#srate_val");
        me.srate = d3.select("#srate").on("input", function(){
            me.sval.node().innerText = me.srate.node().value;
        });
        me.btn = d3.select("#apply")
            .on("click", function(d) {
                me.axis[0] = me.sbox_x.node().value-0;
                me.axis[1] = me.sbox_y.node().value-0;
                me.stream_update();
                me.data.setSamplingRate({
                    'data': 'sampling_rate',
                    'value': me.srate.node().value
                });
            });

        me.filter = {};
        me.legend_items = {};
        me.legend = d3.select("#scatter-legend");

        me.anomaly_only = false;
        me.cbox = d3.select("#scatter-cbox").on("click", function(d) {
            me.anomaly_only = me.cbox.node().checked;
            me.stream_update();
        });
        
        me.filter_cbox = d3.select("#scatter-legend-filter").on("click", function(d) {
            me.filter_all = me.filter_cbox.node().checked;
            if(!me.filter_all) {
                me.filter = {}
            }
            me.stream_update();
        });
        
        me.colorScale = d3.scaleOrdinal(d3.schemeCategory20c).domain(d3.range(0,19));
    }

    stream_update(){
        var me = this;
        me.legend_items = {}
        me.selections.clear();
        me._updateAxis();
        me.svg.selectAll("circle").remove();
        me.xAxis.selectAll("text.label").remove();
        me.yAxis.selectAll("text.label").remove();
        me.draw();        
        me._zoom();
        // me.transform = d3.zoomIdentity;
        //move some constructor here
    }

    draw(){
        this._drawAxis();
        this._drawDots();
        this._drawLegend()
        //this._drawPointLabel();
    }

    projectionChanged(){
        var me = this;
        me.transform = d3.zoomIdentity;    
        this.path.attr("d", "");
        me._updateAxis();

        this.dot
            .attr("cx", d => me.x(d.pos[me.axis[0]]))
            .attr("cy", d => me.y(d.pos[me.axis[1]]));
        this.textlabel
            .attr("x", d => me.x(d.pos[me.axis[0]]))
            .attr("y", d => me.y(d.pos[me.axis[1]]));
        if(this.data.projectionMethod==1){
            me.svg.selectAll('.dotName').remove();
        }else{
            this._drawPointLabel();
        }
    }

    rightClick(){
        d3.event.preventDefault();
        this.data.clearHight();
    }

    selected(){
    	this.dot
	    	.classed('selected',(d, i) => this.data.isSelected(i));
    }
    unselected(){
        this.path.attr("d", "");
    	this.dot.classed("selected", false);
    }
    apply_filter(item) {
        var me = this;
        me.filter[item] = !(me.filter[item]);
        me.stream_update();
    }

    _drawPointLabel() {
        var me = this;

        me.svg.selectAll('.dotName').remove();

        var dotName = me.svg.selectAll('.dotName')
        	.data(me.data.data);
        dotName.exit().remove();
    }

    _drawAxis(){
        var titles = {"entry":"Entry Time", 'value': 'Execution Time', 'comm ranks':"Rank#.Thread#", "exit": "Exit Time"}
        var me = this;

        var pos_x = [];
        var pos_y = [];
        if(me.data.scatterLayout[me.axis[0]] == 'comm ranks'){
            me.data.data.forEach(function(d){
                pos_x.push(d.pos[me.axis[0]]);
            });
        }
        if(me.data.scatterLayout[me.axis[1]] == 'comm ranks'){
            me.data.data.forEach(function(d){
                pos_y.push(d.pos[me.axis[1]]);
            });
        }        
        var set_x = Array.from(new Set(pos_x));
        var set_y = Array.from(new Set(pos_y));

        var xAxis;
        if(me.data.scatterLayout[me.axis[0]] == 'comm ranks'){
            xAxis = this.xAxis
            .call(d3.axisBottom(me.x)
                .tickValues(set_x));
        }else{
            xAxis = this.xAxis
            .call(d3.axisBottom(me.x).tickFormat(function(d){
                if(me.data.scatterLayout[me.axis[0]] == 'entry' || me.data.scatterLayout[me.axis[0]] == 'exit'){
                    return parseFloat(d/1000000).toFixed(1)+"s";
                }else if(me.data.scatterLayout[me.axis[0]] == 'value'){
                    return parseFloat(d/1000).toFixed(1)+"ms";
                }else{
                    return d;
                }
            }))
        }
        xAxis.append("text")
            .attr("class", "label")
            .attr("x", me.size.width)
            .attr("y", -12)
            .text(titles[me.data.scatterLayout[me.axis[0]]])
            .attr("text-anchor", "end")
            .attr("fill", "black");

        var yAxis;
        if(me.data.scatterLayout[me.axis[1]] == 'comm ranks'){
            yAxis = this.yAxis
            .call(d3.axisLeft(me.y)
                .tickValues(set_y));
        }else{
            yAxis = this.yAxis
            .call(d3.axisLeft(me.y)
                .tickFormat(function(d){
                    if(me.data.scatterLayout[me.axis[1]] == 'entry' || me.data.scatterLayout[me.axis[1]] == 'exit'){
                        return parseFloat(d/1000000).toFixed(1)+"s";
                    }else if(me.data.scatterLayout[me.axis[1]] == 'value'){
                        return parseFloat(d/1000).toFixed(1)+"ms";
                    }else{
                        return d;
                    }
                }))
        }
        yAxis.append("text")
            .attr("class", "label")
            .attr("x", 2)
            .attr("y", 12)
            .text(titles[me.data.scatterLayout[me.axis[1]]])
            .attr("text-anchor", "start")
            .attr("fill", "black");
    }

    _drawDots() {
        var me = this;

        // compute progname and funcname sets
        var progname = me.data.prog_names;
        var funcname = me.data.func_names;
        var set_progname = Array.from(new Set(progname));
        var set_funcname = Array.from(new Set(funcname));
        //console.log(set_progname);
        //console.log(set_funcname);

        // Add the scatterplot
        me.dot = me.svg.selectAll("dot")
            .data(me.data.data)
            .enter()
            .filter(function(d) { 
                var lkey = "prog#"+d.prog_name+"-"+d.func_name;
                if (!me.legend_items[lkey]) {
                    me.legend_items[lkey] = {}
                    me._fillColor(d, set_progname, set_funcname)
                }
                if (me.filter_all) {
                    me.filter[lkey] = true;
                } 
                if (me.anomaly_only) {
                    return !(me.filter[lkey]) && (d.anomaly_score<0);
                } else {
                    return !(me.filter[lkey])
                }
            })
                .append("circle")
                .attr("r", d => d.anomaly_score<0?5:4)
                .attr("cx", d => me.x(d.pos[me.axis[0]]))
                .attr("cy", d => me.y(d.pos[me.axis[1]]))
                .attr("fill", d => me._fillColor(d, set_progname, set_funcname))
                .attr("fill-opacity", d => me._fillOpacity(d))
                .attr("stroke", d => d.anomaly_score<0?"black":0);

        me.dot.on("click", function(d, i) {
            console.log("clicked "+i+"th tree, id:"+d['id']);
                me.data.clearHight();
                me.data.setSelections([d['id']]);
            })
            .append("title")
            .text(function(d, i) {
                return d.func_name+"-prog#"+d.prog_name+"-tree#"+d['id'];
            });
    }
    _fillColor(d, progname=[], funcname=[]){
        // five group, each with four lightness
        // if more than five functions, color repeats 
        // if more than four progs, lightness repeats
        var c = this.colorScale(funcname.indexOf(d.func_name)%5*4+d.prog_name%4);
        this.legend_items["prog#"+d.prog_name+"-"+d.func_name]['color'] = c;
        return c;

        //var h = 360/funcname.length;
        //var c = (100-30)/progname.length;
        //var l = 60; 

        //return d3.hcl(h*funcname.indexOf(d.func_name), 100-c*d.prog_name, l);
    }
    _clusterColor(d){
        return this.vis.clusterColor(d.cluster_label);
    }

    _fillOpacity(d){
        return 0.5; //d.anomaly_score>0?0.5:0.8;
    }

    changeColor(){
        this._resetDotLabel();
    }
    _resetDotLabel(){
        var me = this;

        if(me.vis.colorScheme == 0){
            this.dot
                .attr("fill", d => me._fillColor(d))
                .attr("fill-opacity", d => me._fillOpacity(d));
            this._drawPointLabel();//not t-sne
        }else{
            this.dot
                .attr("fill", d => me._clusterColor(d))
                .attr("fill-opacity", 0.5);
            me.svg.selectAll('.dotName').remove();
        }
    }
    _drawBackground(){
        var me = this;
        me.backgroud = me.svg.append('rect')
            .attr('x', me.x.range()[0])
            .attr('y', me.y.range()[0])
            .attr('width', me.x.range()[1] - me.x.range()[0])
            .attr('height', me.y.range()[1] - me.y.range()[0])
            .attr('stroke', '#000')
            .attr('stroke-width', 0)
            .style("fill", "white");
        me.backgroud.call(d3.zoom()
            .scaleExtent([1, 1000])
            .extent([[me.x.domain()[0],me.y.domain()[0]],[me.x.domain()[1],me.y.domain()[1]]])
            .on("zoom", function(){
                me._zoom();
            })
            );
        me.path = me.svg.append("path").attr("fill-opacity", 0.2);
    }

    _zoom(){
        var me = this;
        if (d3.event && d3.event.transform) {
            me.transform = d3.event.transform
        } 
        if (!me.transform){
            return
        } 
        var xrange = me.x.range();
        var yrange = me.y.range();
        var t = me.transform;
        if (t.applyX(xrange[0]) > xrange[0]){
            t.x =xrange[0] -xrange[0] * t.k;
        }else if(t.applyX(xrange[1]) < xrange[1]){
            t.x = xrange[1] - xrange[1] * t.k;
        }
        if (t.applyY(yrange[0]) > yrange[0]){
            t.y = yrange[0]-yrange[0] * t.k;
        }else if(t.applyY(yrange[1]) < yrange[1]){
            t.y = yrange[1] - yrange[1] * t.k;

        }
        me.xScale = t.rescaleX(me.x)
        me.yScale = t.rescaleY(me.y)
        this.dot
            .attr("cx", d => me.xScale(d.pos[me.axis[0]]))
            .attr("cy", d => me.yScale(d.pos[me.axis[1]]))
            .attr('fill-opacity', d => (me.xScale(d.pos[me.axis[0]])>xrange[1]||me.xScale(d.pos[me.axis[0]])<xrange[0])?0:me._fillOpacity(d))
            .attr('stroke-opacity', d => (me.xScale(d.pos[me.axis[0]])>xrange[1]||me.xScale(d.pos[me.axis[0]])<xrange[0])?0:me._fillOpacity(d));
        // this.textlabel
        //     .attr("x", d => new_xScale(d.pos.x))
        //     .attr("y", d => new_yScale(d.pos.y))
        //     .attr('opacity', d => (new_xScale(d.pos.x)>xrange[1]||new_xScale(d.pos.x)<xrange[0])?0:1);
        this.path.attr("transform", t);
    }

    _updateAxis(){
        var me = this;
        var xvalues = me.data.data.map(function(elt) {
            return elt.pos[me.axis[0]];
        });
        var yvalues = me.data.data.map(function(elt) {
            return elt.pos[me.axis[1]];
        });
        var ranges = {
            "xMax": Math.max.apply(null, xvalues),
            "xMin": Math.min.apply(null, xvalues),
            "yMax": Math.max.apply(null, yvalues),
            "yMin": Math.min.apply(null, yvalues),
        };
        ranges.xRange = ranges.xMax - ranges.xMin;
        ranges.yRange = ranges.yMax - ranges.yMin;

        // set the ranges
        me.x.domain([ranges.xMin - ranges.xRange / 15, ranges.xMax + ranges.xRange / 15]);
        me.y.domain([ranges.yMax + ranges.yRange / 50, ranges.yMin - ranges.yRange / 50]);
    }

    _drawLegend(ypos) {
        var me = this;
        me.legend.selectAll(".scatter-legend-item").remove();
        
        var names = Object.keys(me.legend_items)
        names.sort(function(x, y) {
            x = x.replace(/ *\prog#[0-9]-*\ */g, "");
            y = y.replace(/ *\prog#[0-9]-*\ */g, "");
            return d3.ascending(me.data.stat[y]['percent'], me.data.stat[x]['percent']);
        })
        var legend = me.legend.selectAll(".scatter-legend-item")
            .data(names)
            .enter()
            .append("div")
            .attr("class", "scatter-legend-item")
            .on("click", function(d) {
                d3.event.stopPropagation();
                if(me.filter_all) {
                    me.filter_all = undefined
                    me.filter_cbox.node().checked = false
                }
                me.apply_filter(d)
                this.style.color = me.filter[d]? "gray":"black"
            });
            
        legend.append("div")
            .attr("class", "scatter-legend-item-circle")
            .style("background", function(d){
                return me.legend_items[d]['color']
            });

        legend.append("text")
            .attr("class", "scatter-legend-item-text")
            .style("color", function(d) {
                if (me.filter_all) {
                    return "gray";
                } else {
                    return me.filter[d]?  "gray" : "black";
                }
            })
            .text(function(d){
                var prefix = (d+"([").match(/.+?(?=[\[\(])/)[0];
                var displayName = prefix.match(/(.*::)*(.*)/)[2];
                var pct = me.data.stat[d.replace(/ *\prog#[0-9]-*\ */g, "")]['percent'].toFixed(2) + " %"
                return displayName+": "+pct
            })
        me.filter_all = (me.filter_all === false)? undefined : me.filter_all;
    }
}