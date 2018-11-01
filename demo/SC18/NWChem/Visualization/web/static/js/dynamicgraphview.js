class DynamicGraphView extends GraphView {
    constructor(data, svg) {
        super(data, svg, {
        }, {
            top: 0,
            right: 0,
            bottom: 0,
            left: visOptions.dynamic_lmargin
        });

        var me = this;
        var repelForce = d3.forceManyBody().strength(d=>visOptions.dynamicRepelCoef*this._radius(d.value)).distanceMax(100);

        var forceCollide = d3.forceCollide()
            .radius(d => me._radius(d.value))
            .iterations(1);
        me.simulation
            .force("collide", d3.forceCollide()
                .radius(d => me._radius(d.value))
                .iterations(1));
        me.simulation
            .force("charge", repelForce);


        me.nodeSelection = -1;
        me._setGraph({id:-1,nodes:[],edges:[]});
        me.drag.on("start", function(d) {
                if (!d3.event.active) me.simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on("drag", function(d) {
                d.fx = d3.event.x;
                d.fy = d3.event.y;
            })
            .on("end", function(d) {
                if (!d3.event.active) me.simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });
        me.draw();
        me._drawTreeId();
    }

    _showNode(node){
        return (node.r > 4*this.scale);
    }
    ticking(){
        var me = this;
        me.link.filter(function(d) {
                return d.source.level<me.maxLevel&&d.target.level<me.maxLevel;
            })
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", function(d){
                var dis = me._distance(d.target,d.source);
                return d.target.x - (d.target.x - d.source.x)/dis * d.target.r;
            })
            .attr("y2", function(d){
                var dis = me._distance(d.target,d.source);
                return d.target.y - (d.target.y - d.source.y)/dis * d.target.r;
            })            
            .attr("marker-end", "url(#arrowhead)")
            .attr('stroke', d => (d.source.id == me.nodeSelection)?'#fec44f':'#999')
            .attr("stroke-width",d => (me._showNode(d.target)&&me._showNode(d.source))?2:1)
            .attr('stroke-opacity', d => (me._showNode(d.target)&&me._showNode(d.source))?0.8:0.2);
        me.node
            .filter(function(d) { 
                return d.level < me.maxLevel;
            })
            .attr("cx", function(d){
                d.x = Math.max(d.r + me.margin.left, Math.min(me.size.width - me.margin.right - d.r, d.x));
                return d.x;
            })
            .attr("cy", function(d){
                d.y = Math.max(d.r, Math.min(me.size.height - d.r, d.y));
                return d.y;
            });
    }

    selected(){
        var me = this;
    	me._setGraph(me.data.getSelectedTree());
        me.linksvg.selectAll("line").remove();
        me.nodesvg.selectAll("circle").remove();  
        me.drawLegend(20);
    	me.draw();
        me._drawTreeId();        
    }

    _simulate(){
        var me = this;
        //this.simulation.force("radial", d3.forceRadial(d=>d.level*me.size.width/3,me.size.width/2, me.size.height/2));

        me.graph.nodes.forEach(function(d){
            d.fx = null;
            d.fy = null;
        });

        me.simulation
            .nodes(me.graph.nodes)
            .on("tick", function() {
                me.ticking();
            });

        me.simulation.force("link").links(me.graph.edges);
        me.simulation.alpha(0.3).restart();
    }

    drawLegend(ypos) {
        var me = this;
        me.svg.selectAll(".legend").remove();
        //console.log(this.vis.majorFunctions);
        var legend = me.svg.selectAll(".legend")
            .data(this.vis.majorFunctions)
            .enter()
            .append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) {
                return "translate(0," + (i * 18+ypos) + ")";
            });

        legend.append("rect")
            .attr("x", 0)
            .attr("width", 15)
            .attr("height", 9)
            .style("fill", d => me.color(d))

        legend.append("text")
            .attr("x", 20)
            .attr("y", 4)
            .attr("dy", ".35em")
            .style("text-anchor", "start")
            .text(function(d){
                var prefix = (d+"([").match(/.+?(?=[\[\(])/)[0];
                var displayName = prefix.match(/(.*::)*(.*)/)[2];
                return displayName; 
            });
            //.text(d => me.vis.functionMap[d]);
    }
}