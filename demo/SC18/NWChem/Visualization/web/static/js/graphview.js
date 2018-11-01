class GraphView extends View {
    constructor(data, svg, size, margin) {
        super(data, svg, size);
        var me = this;
        this.color = d3.scaleOrdinal(d3.schemeCategory20).domain(d3.range(0,19)); //me.vis.functionColor;
        me.margin = margin;
        me.scale = 1;
        me.sizeCoef = visOptions.graphSizeCoef;
        me.repelCoef = visOptions.graphRepelCoef;
        var repelForce = d3.forceManyBody().strength(d=>me.repelCoef*this._radius(d.value)).distanceMax(100);
        me.simulation = d3.forceSimulation()
            .force("link", d3.forceLink().iterations(2).id(d => d.id))
            .force("charge", repelForce)
            .force("center", d3.forceCenter((me.size.width - me.margin.right + me.margin.left) / 2, me.size.height / 2))
            .stop()

        me.linksvg = me.svg.append("g")
            .attr("class", "links");
        me.nodesvg = me.svg.append("g")
            .attr("class", "nodes")
        me.drag = d3.drag();
        me.idRect = me.svg.append('rect');
        me.idText = me.svg.append("text")
            .attr("x", 2)
            .attr("y", 11);
        me.graph = null;
        me.maxLevel = 4;
        this.defs = me.svg.append("defs");
        this.defs.append("marker")
            .attr("id", "arrowhead")
            .attr("viewBox", "0 -3 6 6")
            .attr("refX", 6)
            .attr("refY", 0)
            .attr("markerWidth", 3)
            .attr("markerHeight", 3)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-3L6,0L0,3")
            .style("fill", "#999");
    }

    _radius(value){
        return Math.sqrt(value/visOptions.valueCoef) / this.sizeCoef + 1.5;
    }
    _distance(source, target){
        return Math.sqrt((target.x - source.x)*(target.x - source.x)+(target.y - source.y)*(target.y - source.y));
    }

    _setGraph(tree){
        var me = this;
        me.graph = tree;
        me.graphId = tree.id;
        me.graph.nodes.forEach(function(d) {
            d.value = Math.max(1, d.value);
            d.r = me._radius(d.value);
        });
    }

    _anomalyColor(){
        var score = this.vis.scoreScale(this.data.getScoreByIndex(this.graphId));
        return this.vis.anomalyColor(score);
    }

    _drawTreeId(){
        var me = this;
        if(me.graphId == -1){
            return;
        }
        var nameColor = me._anomalyColor();
        var l = d3.hsl(nameColor).l;
        me.idText.text("Prog#"+me.graph.prog_name+"-Rank#"+me.graph.node_index+"-Thread#"+me.graph.threads+"-Tree#"+me.graph.graph_index)
            .attr('fill', (l<0.7)?'white':'black');
        var bbox = me.idText.node().getBBox();
        me.idRect.attr('x',bbox.x-2)
            .attr('y',bbox.y)
            .attr('width',bbox.width+4)
            .attr('height',bbox.height)
            .attr('fill', nameColor);
    }

    _drawGraph(){
        var me = this;
        me.link = me.linksvg
            .selectAll("line")
            .data(me.graph.edges)
            .enter()
            .append("line")
            .attr("stroke-width", 1)
            .attr("stroke", "#999");
        var levelCount = []
        me.graph.nodes.forEach(function(d){
            while(levelCount.length<=d.level){
                levelCount.push(0);
            }
            levelCount[d.level]++;
        });
        me.maxLevel = levelCount.length;
        var nodeSum = 0;
        var nodeLimit = 20;
        for(var i = 0; i<levelCount.length; i++){
            nodeSum += levelCount[i];
            if(nodeSum>nodeLimit){
                me.maxLevel = i;
                break;
            }
        }
        console.log("max depth for the selected tree visualization: "+me.maxLevel);

        me.node = me.nodesvg
            .selectAll("circle")
            .data(me.graph.nodes)
            .enter()
            .append("circle")
            .filter(function(d) { 
                return d.level < me.maxLevel;
            })
            .attr("r", d => d.r/me.scale)
            .attr("fill", d => me.getColor(d.name))
            .attr('stroke', '#fff')
            .attr('stroke-width', '0.5px')
            .call(me.drag);
        me.node.append("title").text(d => d.name);
    }

    _simulate(){
        throw new Error('abstract method!');
    }

    draw() {
        this._drawGraph();
        this._simulate();
    }

}