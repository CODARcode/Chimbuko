class View {
    constructor(data, svg, size){
        var me = this;
        this.data = data;
        this.vis = this.data.views;
        this.svg = svg;
        this.size = size;
        if('width' in size){
            this.svg.attr("width", size.width)
                .attr("height", size.height);
        }else{
            this.size = {"width":parseFloat(this.svg.style('width')),"height":parseFloat(this.svg.style('height'))}
        }

        me.svg.on("contextmenu", function() {
        	me.rightClick();
        });
        me.color = null;
        me.viewType = 0;//0 = for visualization, 1 = for labeling, 2 = for supplementary
    }

    changeColor(){}

    selected(){}
    
    stream_update(){}
    
    unselected(){}
    
    projectionChanged(){}

    rightClick(){}

    draw(){
       throw new Error('abstract method!');
    }

    drawLabels(pos, size, drawText){
        var me = this;
        var labels = [1,-1];
        me.labelRect = me.svg.selectAll('labels')
            .data(labels).enter()
            .append('rect')
            .attr('x', (d, i) => (me.size.width - 4 - pos.x- (i+1)*size.width-i*size.margin))
            .attr('y', pos.y)
            .attr('rx',4)
            .attr('ry',4)
            .attr('width',size.width)
            .attr('height',size.height)
            .attr('fill', d => me.data.views.anomalyColor(d))
            .on('click',function(d, i){
               me.relabel(d);
            });
        if(drawText){
            me.svg.selectAll('labels')
                .data(labels).enter()
                .append('text')
                .attr('x',(d, i) => (me.size.width - pos.x- (i+1)*size.width-i*size.margin)-i*5+3)
                .attr('y',pos.y+size.height - 7)
                .text(d => (d==1)?'normal':'anomaly')
                .attr('fill','white');
        }
    }

    getColor(name){
        return (this.vis.majorFunctions.indexOf(name) > -1)?this.color(name):this.color("Others");
    }
}