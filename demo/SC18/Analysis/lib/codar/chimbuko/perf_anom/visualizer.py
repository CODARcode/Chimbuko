"""
Visualize outlier detection results 
Authors: Gyorgy Matyasfalvi (gmatyasfalvi@bnl.gov)
Create: September, 2018
"""

import os
import json
import configparser
import time
import requests as req
import matplotlib as mpl
import numpy as np
if os.environ.get('DISPLAY','') == '':
    print('No display found; using non-interactive Agg backend...\n')
    mpl.use('Agg')
import adios as ad


class Visualizer():
    def __init__(self, configFile):
        self.config = configparser.ConfigParser()
        self.config.read(configFile)
        self.vizMethod = self.config['Visualizer']['VizMethod']
        self.vizUrl = self.config['Visualizer']['VizUrl']
        self.vizPath = self.config['Visualizer']['VizPath']
        self.dumpFile = self.config['Visualizer']['DumpFile']
        self.traceHeader = {'data': 'trace'}
        self.funData = []
        self.countData = []
        self.commData = []
        self.anomalyData = []
        
        
    def sendCombinedData(self, funData, countData, commData, funOfInt, outlId, outct):
        if self.vizMethod == "online":
            # Send data to viz server
            dataList = []
            try:
                assert(type(funData) is np.ndarray)
                dataList += funData.tolist()
            except:
                print("\nNo function call data to visualize...\n")
            
            try:
                assert(type(countData) is np.ndarray)
                dataList += countData.tolist()
            except:
                print("\nNo counter data to visualize...\n")
            
            try:
                assert(type(commData) is np.ndarray)
                dataList += commData.tolist()
            except:
                print("\nNo communication data to visualize...\n")
            
            r = req.post(self.vizUrl, json={'type': 'info', 'value': {'events': dataList, 'foi': funOfInt, 'labels': outlId}})
            time.sleep(3)
            #if r.status_code != 201:
            #    raise ApiError('Trace post error:'.format(r.status_code))
            
        if self.vizMethod == "offline":
            # Dump data
            dataList = []
            try:
                assert(type(funData) is np.ndarray)
                dataList += funData.tolist()
            except:
                print("\nNo function call data to visualize...\n")
            
            try:
                assert(type(countData) is np.ndarray)
                dataList += countData.tolist()
            except:
                print("\nNo counter data to visualize...\n")
            
            try:
                assert(type(commData) is np.ndarray)
                dataList += commData.tolist()
            except:
                print("\nNo communication data to visualize...\n")
            
            traceDict={'type': 'info', 'value': {'events': dataList, 'foi': funOfInt, 'labels': outlId}}
            traceFileName = "trace." + str(outct) + ".json"
            with open(traceFileName, 'w') as outfile:
                json.dump(traceDict, outfile)
            outfile.close()
            # This line of code was added to check whether we ever encounter a non nan value in countData[i][7]
            #===================================================================
            # dataList = funData.tolist() + countData.tolist() + commData.tolist()
            # for i in range(0,countData.shape[0]):
            #     if str(countData[i][7]) != str('nan'):
            #         print(type(countData[i][7]))
            #         print(str(countData[i][7]))
            #         raise Exception("countData has non nan entry in column 7")
            #===================================================================
    
    def sendTraceData(self, funData, countData, commData, outct):
        if self.vizMethod == "online":
            # Send data to viz server
            dataList = funData.tolist() + countData.tolist() + commData.tolist()
            r = req.post(self.vizUrl, json={'type':'events', 'value': dataList})
            time.sleep(5)
            #if r.status_code != 201:
            #    raise ApiError('Trace post error:'.format(r.status_code))
        if self.vizMethod == "offline":
            # Dump data
            traceFileName = "trace." + str(outct) + ".json"
            with open(traceFileName, 'w') as outfile:
                json.dump(funData.tolist() + countData.tolist() + commData.tolist(), outfile)
            outfile.close()  
            
    def sendOutlIds(self, outlId, outct):
        if self.vizMethod == "online":
            # Send data to viz server
            r = req.post(self.vizUrl, json = {'type':'labels', 'value': outlId})
            time.sleep(1)
           # if r.status_code != 201:
           #     raise ApiError('Anomaly post error:'.format(r.status_code))
        if self.vizMethod == "offline":
            # Dump data
            print("anomaly ids: ", outlId)
            anomalyFileName = "anomaly." + str(outct) + ".json"
            with open(anomalyFileName, 'w') as outfile:
                json.dump(outlId, outfile)
            outfile.close()   
    
    def sendFunMap(self, funMap):
        if self.vizMethod == "online":
            # Send data to viz server
            r = req.post(self.vizUrl, json={'type':'functions', 'value': funMap})
            time.sleep(1)
           # if r.status_code != 201:
           #     raise ApiError('Function map post error:'.format(r.status_code))
        if self.vizMethod == "offline":
            # Dump data   
            with open("function.json", 'w') as outfile:
                json.dump(funMap, outfile)
            outfile.close()
    
    def sendFunOfInt(self, funOfInt, outct):
        if self.vizMethod == "online":
            r = req.post(self.vizUrl, json={'type':'foi', 'value':funOfInt})
            # if r.status_code != 201:
            #     raise ApiError('Function map post error:'.format(r.status_code))
        if self.vizMethod == "offline":
            # Dump data
            print("function of interest ids: ", funOfInt)
            funOfIntFileName = "foi." + str(outct) + ".json"
            with open(funOfIntFileName, 'w') as outfile:
                json.dump(funOfInt, outfile)
            outfile.close()
            
    def sendEventType(self, eventType):
        if self.vizMethod == "online":
            r = req.post(self.vizUrl, json={'type':'event_types', 'value':eventType})
            #if r.status_code != 201:
            #    raise ApiError('Function map post error:'.format(r.status_code))
        if self.vizMethod == "offline":
            with open("et.json", 'w') as outfile:
                json.dump(eventType, outfile)
            outfile.close()
            
    def sendReset(self):
        if self.vizMethod == "online":
            r = req.post(self.vizUrl, json={'type':'reset'})
            #if r.status_code != 201:
            #    raise ApiError('Function map post error:'.format(r.status_code))
        if self.vizMethod == "offline":
            resetDict ={'type':'reset'}
            with open("reset.json", 'w') as outfile:
                json.dump(resetDict, outfile)
            outfile.close()
    
    def addFunData(self, funData):
        self.funData.extend(funData.tolist())
        
    def addCountData(self, countData):
        self.countData.extend(countData.tolist())
        
    def addCommData(self, commData):
        self.commData.extend(commData.tolist())
        
    