class TemporalView extends View {
	constructor(data, svg){
		super(data, svg, {});
        var me = this;

        me.graph = null;
        me.timelines = [];
        me.graphId = -1;
        me.margin = {
            start: 20,
            top: 40,
            right: 5,
            bottom: 20,
            left: 55
        };
        me.n_node = 16
        me.x = d3.scaleLinear().range([me.margin.left, me.size.width - me.margin.right]).domain([0,1]);
        me.contextX = d3.scaleLinear().range(me.x.range()).domain([0,1]);
        me.nodeY = d3.scaleOrdinal().domain(Array.from({length: me.n_node}, (x,i) => i));
        me.levelY = d3.scaleLinear();
        me.graph = null;
        me.messages = [];
        me._setGraph({id:-1,nodes:[],edges:[]});

        this.color = d3.scaleOrdinal(d3.schemeCategory20).domain(d3.range(0,19)); //me.vis.functionColor;

        me.traceYSize = (me.size.height-me.margin.top - -me.margin.bottom)/2;
        me.tracesvg = me.svg.append("g")
            .attr("class", "traces")
        me.contextsvgs = me.svg.append("g")
            .attr("class", "lines");
        me.nodesvg = me.svg.append("g")
            .attr("class", "nodes");
        me.messagesvg = me.svg.append("g")
            .attr("class", "messages");
        me.nodetextsvg = me.svg.append("g")
            .attr("class", "nodetext");
        me.xAxis = me.svg.append("g")
            .attr("class", "x axis")    
            .attr("transform", "translate(0,"+this.margin.top+")")
            .style("dominant-baseline", "central");
        me.context = svg.append("g")
            .attr("class", "context axis--x")
            .attr("transform", "translate(0,"+this.margin.start+")");

        this.brushX = d3.brushX()
            .extent([[me.x.range()[0], -me.margin.start], [me.x.range()[1], 0]])
            .on("brush end", function(){
                me._brushed();    
            });
        this.bruchSelection = me.context.append("g")
            .attr("class", "brush")
            .call(this.brushX)

        var defs = me.svg.append("defs");
        defs.append("marker")
            .attr("id", "messageArrow")
            .attr("viewBox", "0 -4 8 8")
            .attr("refX", 8)
            .attr("refY", 0)
            .attr("markerWidth", 4)
            .attr("markerHeight", 4)
            .attr("orient", "auto")
            .append("path")
                .attr("d", "M0,-4L8,0L0,4");
        defs.append("marker")
            .attr("id", "axisArrow")
            .attr("viewBox", "0 -8 16 16")
            .attr("refX", 8)
            .attr("refY", -1)
            .attr("markerWidth", 8)
            .attr("markerHeight", 8)
            .attr("orient", 1)
            .append("path")
                .attr("d", "M0,-5L16,0L0,5");
	}

    _resetAxis(maxLevel){
        var me = this; 
        //set y axis
        var timelines = me.timelines;
        var nodeHeight = (me.size.height - me.margin.top - me.margin.bottom - me.traceYSize)/(timelines.length);
        var contextYStart = me.margin.top+me.traceYSize;
        var nodeYDomain = timelines;
        nodeYDomain.unshift(me.graph.node_index);
        var nodeYRange = Array.from({length: timelines.length}, (x,i) => i*nodeHeight+contextYStart+15);
        nodeYRange.unshift(me.margin.top);
        me.nodeY.domain(nodeYDomain).range(nodeYRange);
        var marginBetween = 10;
        me.levelY.range([me.margin.top+marginBetween,Math.min(contextYStart-marginBetween,me.margin.top+marginBetween+(maxLevel+1)*25)]).domain([0, maxLevel+1]);
        
        // set x axis
        var startvalues = me.graph.nodes.map(function(elt) {
            return elt.entry;
        });
        var endvalues = me.graph.nodes.map(function(elt) {
            return elt.entry + elt.value;
        });

        me.ranges = {
            "max": Math.max.apply(null, endvalues),
            "min": Math.min.apply(null, startvalues),
        };
        me.ranges.range = me.ranges.max - me.ranges.min;
        me.x.domain([me.ranges.min, me.ranges.max]);
        me.contextX.domain([me.ranges.min, me.ranges.max]);
    }

    _resetSVGs(maxLevel){
        var me = this;        
        //this.nodesvg.selectAll("line").remove();
        this.nodetextsvg.selectAll("text").remove();
        this.contextsvgs.selectAll("line").remove();

        this.tracesvg.selectAll("rect").remove();
        this.tracesvg.selectAll("text").remove();

        this.traces = this.tracesvg
            .selectAll("rect")
            .data(this.graph.nodes).enter().append("rect");
        this.tracetexts = this.tracesvg
            .selectAll("text")
            .data(this.graph.nodes).enter().append("text");

        this.tracesvg.append("g").append("rect")
            .attr("x", me.margin.left)
            .attr("y", me.levelY(0) - 5)
            .attr("height", me.levelY(maxLevel) + 25 - me.levelY(0) + 10)
            .attr("width", me.size.width - me.margin.right- me.margin.left)
            .attr("fill", "none")
            .attr("stroke-width",1)
            .attr("stroke","#444")
            .attr("stroke-opacity",0.2);

        this.messagesvg.remove();
        this.messagesvg = this.svg.append("g")
            .attr("class", "messages");
        this.lines = this.messagesvg
            .selectAll("line")
            .data(this.messages).enter()
            .append("line");
    }

    _setGraph(tree){//add set context
        var me = this;
        me.graph = tree;
        me.graphId = tree.id;
        var contextNode = new Set();

        if(me.graph.nodes.length == 0){
            return;
        }
        me.messages = [];        
        var maxLevel = 0;
        me.graph.nodes.forEach(function(d){            
            maxLevel = Math.max(d.level, maxLevel);
            d.messages.forEach(function(m){
                m.level = d.level;
                me.messages.push(m);
                contextNode.add(m['source-node-id']);
                contextNode.add(m['destination-node-id']);
            });            
        })
        contextNode.delete(me.graph['node_index']);
        me.timelines = Array.from(contextNode)
        this._resetAxis(maxLevel);
        this._resetSVGs(maxLevel);
    }
    _brushed() {
        var me = this;
        var s = d3.event.selection || me.contextX.range();
        me.x.domain(s.map(me.contextX.invert, me.contextX));
        if(me.traces){
            me._drawXAxis();
            this._drawTimeseries();
        }
    }

    selected(){
        this._setGraph(this.data.getSelectedTree());
        this.draw();
    }

    draw(){
        this._drawXAxis()
        this._drawNodes();
        this._drawTimeseries();
        this._drawContextAxis();        
    }
    _drawContextAxis(){
        var me = this;
        this.context
            .call(d3.axisTop(this.contextX).ticks(8).tickFormat(d=>d/1000+'ms'));
        this.bruchSelection.call(this.brushX.move, null)
    }
    _drawXAxis(){
        this.xAxis.selectAll("text.label").remove();
        this.xAxis
            .call(d3.axisTop(this.x).ticks(5).tickSizeOuter(0).tickFormat(d=>d/1000+'ms'))
            .append("text")
            .attr("class", "label")
            .attr("x", this.size.width)
            .attr("y", -6)
            .style("text-anchor", "end")
            .text("Time")
            .attr("fill", "black");
        this.xAxis.select("path").attr("marker-end", "url(#axisArrow)");
    }

    _drawNodes(){
        var me = this;
        var nodeYDomain = me.timelines.map(d => d);

        me.contextsvgs.selectAll("line")
            .data(nodeYDomain)
            .enter()
            .append('line')
            .attr('x1',me.x.range()[0])
            .attr('y1',d => me.nodeY(d))
            .attr('x2',me.x.range()[1])
            .attr('y2',d => me.nodeY(d))
            .attr("fill", 'black')
            .attr("stroke", 'black')
            .attr("stroke-dasharray","5, 5")

        nodeYDomain.unshift(me.graph.node_index);
        
        me.nodetextsvg.selectAll("text")
            .data(nodeYDomain)
            .enter()
            .append('text')
            .attr('x', 5)
            .attr('y', d => me.nodeY(d)+12)
            .attr("fill", 'black')
            .text(d => "Rank#"+d);
    }


	_drawTimeseries(){
        var me = this;

        me.traces
            .attr("x", d => Math.max(me.x(d.entry), me.x.range()[0]))
            .attr("y", d => me.levelY(d.level))
            .attr("height", d => (me.levelY(1) - me.levelY(0)))
            .attr("width", function(d){
                if(me.x(d.entry)>=me.x.range()[1]||me.x(d.entry + d.value)<=me.x.range()[0]){
                    return 0;
                }else{
                    var start = Math.max(me.x(d.entry), me.x.range()[0]);
                    var end = Math.min(me.x(d.entry + d.value), me.x.range()[1]);
                    return end - start;
                }
            })
            .attr("fill", d => (me.x(d.entry)>=me.x.range()[1]||me.x(d.entry + d.value)<=me.x.range()[0])?"none":me.getColor(d.name));
        /*me.traces.on("click", function(d, i) {
            d3.select(this).classed("selected", true);
        });*/

        me.traces.append("title").text(d => d.name);

        me.tracetexts
            .attr("x", d => Math.max(me.x(d.entry), me.x.range()[0])+2)
            .attr("y", d => me.levelY(d.level)+15)
            .text(function(d){
                var prefix = (d.name+"([").match(/.+?(?=[\[\(])/)[0];
                var displayName = prefix.match(/(.*::)*(.*)/)[2];
                return displayName; 
            })//(d=>this.vis.functionMap[d.name])
            .attr("fill", function(d){     
                if(me.x(d.entry)>=me.x.range()[1]||me.x(d.entry + d.value)<=me.x.range()[0]){
                    return "none";
                }else if(me.x(d.entry + d.value) - me.x(d.entry)<50){
                    return "none";
                }else{
                    var l = d3.hsl(me.getColor(d.name)).l;
                    return (l<0.7)?'white':'black';
                }   
            });

        me.lines
            .attr('x1', d => me.x(d.time))
            .attr('y1', d => (d['source-node-id']==me.graph.node_index)?(me.levelY(d.level)+me.levelY(1)-me.levelY(0)):me.nodeY(d['source-node-id']))
            .attr('x2', d => me.x(d.time))
            .attr('y2', d => (d['destination-node-id']==me.graph.node_index)?(me.levelY(d.level)+me.levelY(1)-me.levelY(0)):me.nodeY(d['destination-node-id']))//add arrow to show from/to
            .attr("marker-end",d => (me.x(d.time)>me.x.range()[0]&&me.x(d.time)<me.x.range()[1])?"url(#messageArrow)":"")
            .attr("stroke-width", 1)
            .attr("stroke", "black")
            .attr('stroke-opacity',d => (me.x(d.time)>me.x.range()[0]&&me.x(d.time)<me.x.range()[1])?0.5:0);
	}

}