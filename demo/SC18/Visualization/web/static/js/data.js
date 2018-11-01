class Data {
    constructor(main) {
        //data
        this.data = [];
        this.selectedIds = [1];
        this.streaming();
        this.idx_offset = 0;//how many has poped out

        this.scoreThreshold = 0;
        this.clusterLoaded = false;
        //vis
        this.views = new Visualizations(this);
        this.views.init(this);
        this.views.addView(new DynamicGraphView(this, d3.select("#treeview")));
        this.views.addView(new TemporalView(this, d3.select("#temporalview")));
        this.views.addView(new ScatterView(this, d3.select("#overview")));

        this.k = visOptions.clusterk;
        this.eps = visOptions.clustereps;
        this.outlier_fraction = 0.02;
        this.projectionMethod = 0;
        this.scatterLayout = [];
        this.stat = [];
    }

    streaming(){
        var me = this;
        var sse = new EventSource('/stream');
        sse.onmessage = function (message) {
            var _json = jQuery.parseJSON(message.data);  
            //console.log(_json['pos'].length); //+" "+_json['percent'])
            me.stat = _json['stat']
            me.scatterLayout = _json['layout'];
            var latest_time = -1;
            _json['pos'].forEach(function(d, i) { //load data to front end (scatter plot view)
                latest_time = Math.max(latest_time, d[3]);// according to server, 3 is exit time
                me.data.push({
                    "id": _json['tidx'][i],
                    "weight": 1,
                    "pos": d,
                    "anomaly_score": _json['labels'][i],
                    "prog_name": _json['prog'][i],
                    "func_name": _json['func'][i],
                    "cluster_label": -1,
                    "tree": null
                });
            });
            var time_window = 60000000;//1 min
            //pop data
            while(me.data.length>0&&latest_time-time_window>me.data[0]['pos'][3]){//#
                me.data.shift();
            }
            me.idx_offset = me.data.length==0?0:me.data[0]['id'];
            console.log("refresh scatter plot, remove points exit before "+(latest_time-time_window)+", num of points: "+me.data.length);

            me.views.stream_update();
            if (_json["percent"] >= 1.0) {
                sse.close();
                sse = null;
                console.log("sse closed");            
            }
        };
    }

    fetchWithCallback(data, callback, options) {
        fetch('/tree', {
                method: "POST",
                body: JSON.stringify(data),
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "same-origin"

            }).then(response => response.json()
                .then(json => {
                    if (response.ok) {
                        callback(json, options);
                        return json
                    } else {
                        return Promise.reject(json)
                    }
                })
            )
            .catch(error => console.log(error));
    }

    _getTree(callback, options) {
        var me = this;
        var index = options.id-me.idx_offset;
        if (me.data[index].tree) {
            callback(me.data[index].tree, options);
        } else {
            options.callback = callback;
            me.fetchWithCallback({
                'data': 'tree',
                'value': options.id
            }, me._saveTree.bind(me), options);
        }
    }

    _saveTree(json, options) {
        var me = this;
        var index = options.id-me.idx_offset;
        var callback = options.callback;

        var tree = me.data[index];
        tree.tree = json;
        tree.tree.id = options.id;
        tree.tree.nodes[0].level = 0;
        tree.tree.edges.forEach(function(d){
            tree.tree.nodes[d.target].level = tree.tree.nodes[d.source].level + 1;
        });
        //add a subtree list        
        callback(tree.tree, options);
    }
    setSelections(indices) {
        var me = this;
        this.selectedIds = indices;// now use the first, will update to the center
        if(this.selectedIds.length>0){
            me._getTree(me.views.selected.bind(me), {'id':me.selectedIds[0]});
        }
    }

    clearHight() {
        this.views.unselected();
    }

    getSelectedTree() {// now use the first, will update to the center
        return this.data[this.selectedIds[0]-this.idx_offset].tree;
    }

    isSelected(index) {
        return this.selectedIds.indexOf(index+this.idx_offset) != -1;
    }

    getScoreByIndex(index) {
        index-=this.idx_offset;
        return (this.data[index].relabel == 0) ? (this.data[index].anomaly_score) : this.data[index].relabel;
    }

    setSamplingRate(rate) {
        fetch('/srate', {
            method: "POST",
            body: JSON.stringify(rate),
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin"
        }).then(response => response.json()
            .then(json => {
                if (response.ok) {
                    return json
                } else {
                    return Promise.reject(json)
                }
            })
        )
        .catch(error => console.log(error));
    }
}