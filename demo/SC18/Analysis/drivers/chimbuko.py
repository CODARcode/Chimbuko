"""
Run anomaly detection and output data for visualization
Authors: Gyorgy Matyasfalvi (gmatyasfalvi@bnl.gov)
Create: September, 2018
"""

import sys
import time
import os
import configparser
import json
import pickle
import numpy as np
np.set_printoptions(threshold=np.nan)
from collections import defaultdict
import parser
import event
import outlier
import visualizer


# Proces config file
config = configparser.ConfigParser()
config.read(sys.argv[1])
stopLoop = int(config['Debug']['StopLoop'])

# Initialize parser object, get function id function name map 
prs = parser.Parser(sys.argv[1])
funMap = prs.getFunMap()
eventTypeDict = prs.getEventType()
numEventTypes = len(eventTypeDict)
eventTypeList = [None] * numEventTypes 
assert(numEventTypes > 0), "No event types detected (Assertion)...\n"
for i in range(0,numEventTypes):
    eventTypeList[i] = eventTypeDict[i]

print("eventType:", eventTypeList, "\n")

# Initialize event object
evn = event.Event(funMap, eventTypeList, sys.argv[1])

# Initialize outlier object
otl = outlier.Outlier(sys.argv[1])

# Initialize visualizer object
maxDepth = int(config['Visualizer']['MaxFunDepth'])
viz = visualizer.Visualizer(sys.argv[1])
viz.sendReset()

# Dump function data
viz.sendFunMap(list(funMap.values()))
viz.sendEventType(eventTypeList)



# This is so that we can get something reasonable from the viz people
#print(funMap)
#fixFunOfInt = []
#foiid = [512, 513, 260]
#for i in foiid:
#    fixFunOfInt.append(funMap[i])
#outct = 0
#viz.sendFunOfInt(fixFunOfInt, outct)
# This is so that we can get something reasonable from the viz people  


# Stream events
ctFun = defaultdict(int)
ctCount = defaultdict(int)
ctComm = defaultdict(int)
anomFun = defaultdict(int)
stackOK = True
funDataOK = False
funTimeOK = False
countDataOK = False
commDataOK = False

ctrl = 1
outct = 0
eventId = np.uint64(0)
while ctrl >= 0:
    print("\nStream step: ", outct, "\n\n")
     
    # Stream function call data
    outlId = []
    funOfInt = []
    try:
        funStream = prs.getFunData()
        funDataOK = True
    except:
        funDataOK = False
        print("\nFrame has no function data...\n")

    if funDataOK:        
        evn.initFunData(funStream.shape[0])
                 
        for i in funStream:
            # Append eventId so we can backtrack which event in the trace was anomalous
            i = np.append(i,np.uint64(eventId))
            #print(i, "\n")
            if evn.addFun(i): # Store function call data in event object
                pass
            else:
                stackOK = False
                break        
            eventId += 1
            ctFun[i[4]] += 1
        if stackOK:
            pass
        else:
            print("\n\n\nCall stack violation at ", outct, " ", eventId, "... \n\n\n")
            break
 
        
        # Detect anomalies in function call data
        try:
            data = evn.getFunTime()
            funTimeOK = True
        except:
            funTimeOK = False
            print("\nFrame only contains open functions, no anomaly detection...\n\n")
        
        if funTimeOK:    
            for funId in data: 
                X = np.array(data[funId])
                numPoints = X.shape[0]
                otl.compOutlier(X, funId)
                funOutl = np.array(otl.getOutlier())        
                funOutlId = X[funOutl == -1][:,6]
                for i in range(0,len(funOutlId)):
                    outlId.append(str(funOutlId[i]))
                
                # Filter functions that are deep
                maxFunDepth = evn.getMaxFunDepth()
                if numPoints > np.sum(funOutl) and maxFunDepth[funId] < maxDepth:
                    funOfInt.append(str(funMap[funId]))
                if len(funOutlId) > 0:
                    anomFun[funId] += 1
                    #if funId in foiid:
                    #    print("Function id: ", funId, " has anomaly\n")          
        
        #print("anomaly detection passed\n")
        # Dump function of interest data
        #viz.sendFunOfInt(funOfInt, outct)
        
        # Dump anomaly data
        #viz.sendOutlIds(outlId, outct)
    

    # Stream counter data
    try:
        countStream = prs.getCountData()
        countDataOK = True
    except:
        countDataOK = False
        print("\nFrame has no counter data...\n")
        
    if countDataOK:
        evn.initCountData(countStream.shape[0])
        
        for i in countStream:
            i = np.append(i,np.uint64(eventId))
            if evn.addCount(i):
                pass
            else:
                stackOK = False
                break
            eventId += 1 
            ctCount[i[3]] += 1
       
     
     
    # Stream communication data
    try:
        commStream = prs.getCommData()
        commDataOK = True
    except:
        commDataOK = False
        print("\nFrame has no comm data...\n")
    
    if commDataOK:
        evn.initCommData(commStream.shape[0])

        for i in commStream:
            i = np.append(i,np.uint64(eventId))
            if evn.addComm(i):
                pass
            else:
                stackOK = False
                break
            eventId += 1 
            ctComm[i[3]] += 1
     

    # Dump trace data
    #viz.sendTraceData(evn.getFunData(), evn.getCountData(), evn.getCommData(), outct)
    viz.sendCombinedData(evn.getFunData(), evn.getCountData(), evn.getCommData(), funOfInt, outlId, outct)
    
    # Free memory
    evn.clearFunTime()
    evn.clearFunData()
    evn.clearCountData()
    evn.clearCommData()
    outlId.clear()
    funOfInt.clear()
    
    # Debug
    if stopLoop > -1:
        if outct >= stopLoop:
            break
    
    # Update outer loop counter   
    outct += 1 
    
    # Advance stream and check status
    prs.getStream()
    ctrl = prs.getStatus()
        
assert(evn.getFunStackSize() == 0), "\nFunction stack not empty... Possible call stack violation...\n"
print("Total number of advance operations: ", outct)
print("Total number of events: ", eventId, "\n\n")

# Generate Candidate functions
#maxFunDepth = evn.getMaxFunDepth()
#for i in anomFun:
#    if maxFunDepth[i] < 15 and ctFun[i] > 100:
#        print("Candidate function: ",i, " (", funMap[i], ")", " max tree depth: ", maxFunDepth[i], " # fun calls: ", ctFun[i])
