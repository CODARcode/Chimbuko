# coding: utf-8
# Date: Monday, September 18, 2017
# Authors: Alok Singh, Shinjae Yoo
# Description: This function generates 2_grams by reasoning about a stack trace from JSON file

# imports
import ijson
import json
import datetime
import sys
import re 
from pprint import pprint
from collections import deque
import pandas as pd 
import pickle
import numpy as np
from sklearn.neighbors import LocalOutlierFactor
from slugify import slugify
from sklearn import preprocessing
#

def extract_entry_exit(filename):
    eventTypes = ['entry_exit']#, 'send_receive', 'counter'] # three groups
    #nodeID = ['0', '1', '2', '3', '4']
    retList = []
    with open(filename) as json_file:
        objects = ijson.items(json_file, 'trace events.item')
        entries = (o for o in objects if (o['event-type'] == 'entry' or o['event-type'] == 'exit') and 'node-id' in o)
        c = 0
        for entry in entries:
            if c % 10000 == 0:
                print(c, entry)
            c += 1
            retList.append(entry)
        print('=================================Total:', c, '======================================')
    #with open(out_fn, "w") as outfile: json.dump(retList)
    return retList

def refine_fn (func_name):
    return re.sub(r'\s?C?\s*\[.*\]\s*$', '', func_name).replace(" ", "")

# call stack
def generate_n_grams_ct(data, jid, k = 2, file_name=None):
    #
    #print('Reading file %s' % file_name)
   
    n_grams = []
    d = deque()
    
    list_list = []
    
    last_time = float(data[-1]['time'])
    node_id   = data[1]['node-id']
    thread_id = data[1]['thread-id']

    for i in range(0,len(data)):
        if(i%1000 == 0):
            print(i)
        if(data[i]['event-type'] == 'entry'):
            d.append(data[i])
        else: #exit
            pdata = d.pop() #pop the entry of this node
            if(len(d)>0):
                kl = [ refine_fn(d[-nk]['name']) for nk in range(min(len(d), k), 1, -1)]
                kl.append(refine_fn(data[i]['name']))
                list_list.append([":".join(kl), 
                    float(pdata["time"])/last_time, 
                    float(data[i]["time"]) - float(pdata["time"]), 
                    node_id, 
                    thread_id, jid])
                #n_grams.append(":".join(kl))

    print('len of data = %d', i)
    df = pd.DataFrame(list_list,columns = ['kl','time_by_lasttime','time_diff','node_id','thread_id', 'job_id'])
    if(file_name is not None):
        with open(file_name,'wb') as handle:
            pickle.dump(df, handle, protocol=pickle.HIGHEST_PROTOCOL)

    return df


def perform_localOutlierFactor(df, n_neighbors=10, contamination=0.001, features = ['time_by_lasttime','time_diff'], params={"algorithm":"auto", "leaf_size":30, "metric" : "minkowski", "metric_params":None, "p" : 2, "n_jobs" : -1}):
    
    clf = LocalOutlierFactor(n_neighbors=n_neighbors, # broader estimation 
                             algorithm=params['algorithm'], leaf_size=params['leaf_size'], metric = params['metric'], p=params['p'], metric_params=params['metric_params'], contamination=contamination, n_jobs=params['n_jobs'])
    
    y_pred = clf.fit_predict(df[features])
    
    return y_pred ==-1 

def detect_anomaly(trace_fn_lst, 
                   jid_lst, 
                   out_fn_prefix = "results",
                   call_depth=3, 
                   n_neighbors=10, 
                   n_func_call=5,
                   n_anomalies=5, 
                   normalize="y", # x, y, or both" at the moment
                   adv_params={"algorithm":"auto", 
                               "leaf_size":30, 
                               "metric" : "minkowski", 
                               "metric_params":None, 
                               "p" : 2, 
                               "n_jobs" : -1}):

    assert(len(trace_fn_lst) == len(jid_lst))
    df_lst = []
    for i in range(len(trace_fn_lst)):
        print("Processing :" + trace_fn_lst[i])
        ee_lst = extract_entry_exit(trace_fn_lst[i])
        ldf = generate_n_grams_ct(ee_lst, jid_lst[i], k=call_depth)
        df_lst.append(ldf)
    df = pd.concat(df_lst)

    sf = df.kl.value_counts()
    sf = sf.nlargest(n_func_call);
    freq = pd.DataFrame({'n_gram':sf.index, 'numberofcalls':sf.values})
    fdf_lst = []
    for ngram in sf.index:
        ldf = df[df['kl'] == ngram].copy()
        ldfn = ldf.copy()
        if normalize is None:
            pass
        elif normalize == "y" or  normalize is "both":
            y = 'time_diff'
            max_y = ldfn[y].max()
            min_y = ldfn[y].min()
            ldfn[y] = (ldf[y] - min_y) / (max_y - min_y)
        elif normalize == "x":
            pass # it is already done
        else:
            raise Exception("Undefined normalization method")
            
        aidx = perform_localOutlierFactor(ldfn, n_neighbors=n_neighbors, contamination=float(n_anomalies / sf[ngram]), params=adv_params)
        ldf.loc[:,'class']= pd.Series(aidx*1, index=ldf.index)
        fdf_lst.append(ldf)
        ldf.to_csv("{}-{}.csv".format(out_fn_prefix, slugify(ngram)))
    fdf = pd.concat(fdf_lst)
    fdf.to_csv(out_fn_prefix + ".csv")
    return fdf

# end of file
