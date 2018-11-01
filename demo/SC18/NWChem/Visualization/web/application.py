import json
import time
from flask import send_file, Response, jsonify, request, redirect, url_for
from web import web_app
import random
import numpy as np
import csv
from threading import Lock

class Data(object):
    def __init__(self):
        self.events = {} # store the event list by the rank ID {0:[...],1:[...],2:[...] ...}
        self.executions = {} # the paired function executions from event list
        self.forest = [] # the forest of call stack tree, roots are foi
        self.pos = [] # the positions of the call stak tree in the scatter plot
        self.labels = [] # the passed labels of the lineid of functions
        self.forest_labels = [] # the learned label, for now I simulated
        self.prog = []; # the program names of the tree in scatter plot
        self.func_names = []; # the function name of interest in scatter plot
        self.func_dict = [] # all the names of the functions
        self.foi = [] # function of interest
        self.event_types = {} # set the indices indicating event types in the event list
        self.changed = False # if there are new data come in
        self.lineid2treeid = {} # indicates which line in events stream is which function
        # self.line_num = 0 # number of events from the very beggining of streaming
        self.initial_timestamp = -1;
        self.msgs = []; # debug only for messages
        self.func_idx = 0; # global function index for each entry function
        self.stacks = {}; # one stack for one program under the same rankId
        self.idx_holder = {
            "fidx": [],
            "tidx": 0
        };
        self.sampling_rate = 1;
        self.sampling_strategy = ["uniform"]
        self.layout = ["entry", "value", "comm ranks", "exit"] # feild no.1, 2, ..
        self.log = []
        self.lock = Lock()
        self.time_window = 3600000000 # one hour
        self.window_start = 0
        self.clean_count = 0
        self.stat = {}
        # entry - entry time
        # value - execution time
        # comm ranks
        # exit - exit time

    def set_functions(self, functions):# set function dictionary
        self.func_dict = functions

    def set_FOI(self, functions):
        with self.lock:
            self.foi = functions        
            self.changed = True

    def set_event_types(self, types):
        for i, e in enumerate(types):
            self.event_types[e] = i

    def set_labels(self, labels):
        # for label in labels:# self.labels indicates all the anoamaly lines
        #     if label in self.lineid2treeid:
        #         self.labels[self.lineid2treeid[label]] = -1# -1= anomaly and 1 = normal
        with self.lock:
            self.labels = labels
            print("received %d anomaly" % len(labels))
            self.changed = True

    def add_events(self, events):
        # convert events to json events
        with self.lock:
            count = 0
            prev = None
            for e in events:
                if self.initial_timestamp == -1: # the initial timestamp
                    self.initial_timestamp = int(e[11])
                    print("Initial time: ", self.initial_timestamp)
                self.window_start = max(0, int(e[11]) - self.time_window - self.initial_timestamp)
                obj = {'prog names': e[0],
                    'comm ranks': e[1],
                    'threads': e[2],
                    'event types': e[7] if(e[3]=='NA' or np.isnan(e[3])) else e[3],
                    'name': 'NA' if(e[4]=='NA' or np.isnan(e[4])) else self.func_dict[int(e[4])],# dictionary
                    'counters': e[5],
                    'counter value': e[6],
                    'Tag': e[8],
                    'partner': e[9],
                    'num bytes': e[10],
                    'timestamp': int(e[11]) - self.initial_timestamp, 
                    'lineid': e[12]}# here line id is start from the beggining of the stream
                count += 1
                #if obj['event types'] == self.event_types['RECV'] or obj['event types'] == self.event_types['SEND']:
                #     print(prev)
                #     print(obj)
                #     print('\n')
                if not obj['comm ranks'] in self.events:
                    self.events[obj['comm ranks']] = []
                    self.idx_holder[obj['comm ranks']] = 0 # initialize by ranks
                self.events[obj['comm ranks']].append(obj)
                prev = obj
                if obj['lineid'] in self.labels:
                    print(obj['lineid'], ": ", e)
                
                if obj['event types'] == self.event_types['ENTRY']:
                    fname = obj["name"]
                    if not fname in self.stat:
                        self.stat[fname] = {
                            'anomal': 0,
                            'normal': 0,
                            'percent': 0
                        }
                    s = self.stat[fname]
                    if str(int(obj["lineid"])) in self.labels:
                        obj['anomaly_score'] = -1
                        s['anomal'] = s['anomal'] + 1
                    else:
                        obj['anomaly_score'] = 1
                        s['normal'] = s['normal'] + 1
                    if s['normal']>0 or s['anomal']>0:
                        s['percent'] = (s['anomal']/(s['normal']+s['anomal']))*100
                
            self.changed = True

    def remove_old_data(self):
        # clean executions every time_window
        if self.window_start // self.time_window < self.clean_count:
            return
        self.clean_count += 1
        print("clean old executions before {}".format(self.window_start))
        remove_list = []
        for findex, exe in self.executions.items():
            if(exe['exit']<self.window_start):
                remove_list.append(findex)
        for findex in remove_list:
            del self.executions[findex]
        
        for i, t in enumerate(self.forest):
            if('nodes' in t and t['nodes'][0]['exit'] < self.window_start):
                self.forest[i] = {}

    def reset(self):
        # when new application launches, everything needs to reset
        with self.lock: 
            self.func_idx = 0
            self.clean_count = 0
            self.window_start = 0
            self.initial_timestamp = -1;
            self.idx_holder = {
                "fidx": [],
                "tidx": 0
            };
            self.stat = {};
            self.events.clear()
            self.executions.clear()
            self.forest.clear()
            self.lineid2treeid.clear()
            self.msgs.clear()
            self.forest.clear() 
            self.func_dict.clear()
            self.event_types.clear()
            self.stacks.clear()
            self.log.clear()
            self.changed = False

    def _events2executions(self):
        #print("event 2 executions...")
        # self.executions = {}
        # self.func_idx = 0
        for rankId, events in self.events.items():
            self._events2executionsByRank(rankId)
        #check who has messages
        # for f in self.msgs:
        #     ff = f
        #     while ff in self.executions and self.executions[ff]['parent'] != -1:
        #         if self.executions[ff]['parent'] in self.executions:
        #             print(self.executions[self.executions[ff]['parent']]['name'])
        #             ff = self.executions[ff]['parent']
        #         else:
        #             break
        # print("\n")

    def _events2executionsByRank(self, rankId):
        # convert event to execution entities
        #print("for rank: ", rankId)
        events = self.events[rankId]
        #function_index = len(self.executions)
        # stacks = {}; #one stack for one program under the same rankId
        # for i, obj in enumerate(events):
        for obj in events: 
            self.idx_holder[rankId] += 1
            # arrange event by programs first, then threads
            if not obj['comm ranks'] in self.stacks:
                self.stacks[obj['comm ranks']] = {}
                
            if not obj['prog names'] in self.stacks[obj['comm ranks']]:
                self.stacks[obj['comm ranks']][obj['prog names']] = {}
            
            if not obj['threads'] in self.stacks[obj['comm ranks']][obj['prog names']]:
                self.stacks[obj['comm ranks']][obj['prog names']][obj['threads']] = []

            stack = self.stacks[obj['comm ranks']][obj['prog names']][obj['threads']]

            # check event type
            if obj['event types'] == self.event_types['ENTRY']:#'entry'
                #push to stack
                func = {}
                func['prog names'] = obj['prog names']
                func['name'] = obj['name']
                func['comm ranks'] = obj['comm ranks']
                func['threads'] = obj['threads']
                func['lineid'] = obj['lineid']
                func['findex'] = self.func_idx #function_index
                func['anomaly_score'] = obj['anomaly_score']
                #print(func['name'], func['findex'])
                if len(stack) > 0:
                    func['parent'] = stack[-1]['findex']
                    stack[-1]['children'].append(self.func_idx) #(function_index)
                    #print("Children root", stack[-1]['name'], stack[-1]['entry'])
                else:
                    func['parent'] = -1
                func['children'] = []
                func['entry'] = obj['timestamp']
                self.func_idx += 1 #function_index+=1
                stack.append(func)
            elif obj['event types'] == self.event_types['EXIT']: #'exit'
                if len(stack) > 0 and obj['name']:
                    
                    stack[-1]['exit'] = obj['timestamp']
                    #self.executions.append(stack[-1])
                    self.executions[stack[-1]['findex']] = stack[-1]
                    self.idx_holder['fidx'].append(stack[-1]['findex'])
                    stack.pop()
                else: # mismatching
                    print("Exit before Entry", obj['comm ranks'], obj['prog names'], obj['threads'], obj['name'])
                    # print(obj)
                    # if len(stack) > 0:
                        # print("matching error "+str(i)+":"+str(rankId)+"/"+ obj['name']+"/stack: "+stack[-1]['name'])
                        # print([(e['name'], e['entry']) for e in stack])
                    # else:
                    #     print("matching error "+str(i)+":"+str(rankId)+"/"+ obj['name']+"/empty stack")
            elif obj['event types'] == self.event_types['RECV'] or obj['event types'] == self.event_types['SEND']:
                if len(stack) > 0:
                    #make sure the message is correct to append
                    if obj['name'] != 'NA' and obj['name'] != stack[-1]['name']:
                        print("message issue: "+obj['name']+":"+stack[-1]['name'])
                    #append to function
                    #assumption: execution never exits until message is received
                    if not 'messages' in stack[-1]:
                        stack[-1]['messages']=[]
                    stack[-1]['messages'].append({
                        "event-type": "send" if(obj['event types']==self.event_types['SEND']) else "receive",
                        "source-node-id": obj['comm ranks'] if(obj['event types']==self.event_types['SEND']) else obj['partner'],
                        "destination-node-id": obj['comm ranks'] if(obj['event types']==self.event_types['RECV']) else obj['partner'],
                        "thread-id": obj['threads'], #place holder
                        "message-size": obj['num bytes'],
                        "message-tag": obj['Tag'],
                        "time": obj['timestamp']
                    })
                    temp = stack[-1]
                    self.msgs.append(temp['findex'])
                else:
                    print("Send/Recv mismatched", obj['comm ranks'], obj['prog names'], obj['threads'], obj['name'])
        # events = []
        del self.events[rankId][:]

    def _exections2forest(self):
        # get tree based on foi
        # self.forest = []
        self.lineid2treeid = {}
        count = 0
        while len(self.idx_holder['fidx']) >0:
            fidx = self.idx_holder['fidx'].pop(0)
            if fidx in self.executions:
                execution = self.executions[fidx]    
                if execution['name'] in self.foi:
                    if execution["comm ranks"] == 0: #debug
                        count+=1
                    self.lineid2treeid[execution["lineid"]] = len(self.forest)
                    if not "messages" in execution:
                        execution["messages"] = []
                    this_tree = { 
                            "id": len(self.forest),
                            "prog_name": execution["prog names"],
                            "node_index": execution["comm ranks"],
                            "threads": execution["threads"],
                            "graph_index": len(self.forest),
                            "nodes": [{ # root of the tree
                                    "name": execution['name'], # self.foi,
                                    "id": 0,
                                    "comm ranks": execution["comm ranks"],
                                    "prog_name": execution["prog names"],
                                    "threads": execution["threads"],
                                    "findex": execution["findex"],
                                    "value": (execution["exit"] - execution["entry"]),
                                    "messages": execution["messages"],
                                    "entry": execution["entry"],
                                    "exit": execution["exit"],
                                }],
                            "edges": [],
                            "anomaly_score": execution['anomaly_score'] #-1 if str(int(execution["lineid"])) in self.labels else 1
                        }
                    
                    # if str(int(execution["lineid"])) in self.labels:
                        # print('lineid matched')
                    if (execution["exit"]-execution["entry"]) < 0:
                        print('negative run time detected.')
                        
                    queue = [(execution,0)]
                    while len(queue)>0:
                        node,ptid = queue[0]
                        queue.pop(0)
                        for child_id in node['children']:
                            if not child_id in self.executions:
                                print("child not in executions", node)
                            child_node = self.executions[child_id]
                            ctid = len(this_tree['nodes'])
                            if not "messages" in child_node:
                                child_node['messages'] = []
                            this_tree['nodes'].append({ # children of the tree
                                    'name':child_node['name'],
                                    "id": ctid,
                                    "comm ranks": execution["comm ranks"],
                                    "prog_name": execution["prog names"],
                                    "threads": execution["threads"],
                                    "findex": child_node["findex"],
                                    "value": (child_node["exit"] - child_node["entry"]),
                                    "messages": child_node["messages"],
                                    "entry": child_node["entry"],
                                    "exit": execution["exit"],
                                })
                            this_tree['edges'].append({'source': ptid,'target': ctid})
                            queue.append((child_node,ctid))
                    self.forest.append(this_tree)
        print("generate {} trees".format(len(self.forest)))

    def generate_forest(self):
        with self.lock:
            self._events2executions()
            self.remove_old_data()
            self._exections2forest()

            # the scatterplot positions of the forest
            self.pos = []
            self.prog = []
            self.func_names = []
            self.forest_labels = []
            self.tidx = []
            for i, t in enumerate(self.forest[self.idx_holder["tidx"]:], start=self.idx_holder["tidx"]):
                if t['anomaly_score'] == -1 or (i%(1000/(self.sampling_rate*1000))==0): 
                    self.idx_holder["tidx"] += 1
                    root = t['nodes'][0]
                    
                    ent = root[self.layout[0]]
                    val = root[self.layout[1]]
                    rnk_thd = root[self.layout[2]] + root['threads']*0.1
                    ext = root[self.layout[3]]

                    self.tidx.append(t["id"])
                    self.forest_labels.append(t["anomaly_score"])
                    self.prog.append(root['prog_name'])
                    self.func_names.append(root['name'])  
                    self.pos.append([
                        ent, val, rnk_thd, ext
                    ])
            self.changed = False

data = Data()

@web_app.route('/')
def home():
    return send_file("index.html")

@web_app.route('/tree', methods=['POST'])
def get_tree():
    if request.json['data'] == 'tree':
        tindex = request.json['value']
        print("select tree #{}".format(tindex))
        #print(data.forest[tindex])
        return jsonify(data.forest[tindex])

@web_app.route('/events', methods=['POST'])
def receive_events():
    if request.json['type'] == 'foi':
        data.set_FOI(request.json['value'])
    elif request.json['type'] == 'functions': #map index 0,1,2,3,4.. to function names
        data.set_functions(request.json['value'])
    elif request.json['type'] == 'labels':
        data.set_labels(request.json['value'])
    elif request.json['type'] == 'event_types':
        data.set_event_types(request.json['value'])
    elif request.json['type'] == 'events':
        data.add_events(request.json['value'])
    elif request.json['type'] == 'info':
        d = request.json['value']
        data.set_FOI(d['foi'])
        data.set_labels(d['labels'])
        data.add_events(d['events'])
    elif request.json['type'] == 'reset':
        data.reset()
    return jsonify({'received': len(data.forest)})

def _stream():
    while(not data.changed):
        time.sleep(1)
    data.generate_forest()
    #send back forest data
    yield """
        retry: 10000\ndata:{"pos":%s, "layout":%s, "labels":%s, "prog":%s, "func":%s, "tidx":%s, "stat":%s}\n\n
    """ % (json.dumps(data.pos), json.dumps(data.layout), json.dumps(data.forest_labels), json.dumps(data.prog), 
    json.dumps(data.func_names), json.dumps(data.tidx), json.dumps(data.stat) )

@web_app.route('/stream')
def stream():
    return Response(
        _stream(),
        mimetype='text/event-stream')

@web_app.route('/srate', methods=['POST'])
def set_sampling_rate():
    if request.json['data'] == 'sampling_rate':
        data.sampling_rate = float(request.json['value'])
        print("set sampling_rate #{}".format(data.sampling_rate))
        return jsonify({'srate': data.sampling_rate})

@web_app.route('/log', methods=['POST'])
def write_log():
    print('write_log')
    with open('exit-before-enter.csv', 'w') as output:
        wr = csv.writer(output, quoting=csv.QUOTE_ALL)
        wr.writerows(data.log)
    return jsonify({'write': True})

