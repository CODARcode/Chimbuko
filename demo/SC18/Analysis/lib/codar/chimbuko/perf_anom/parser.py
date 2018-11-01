"""
Parses files (currently .bp)
Authors: Gyorgy Matyasfalvi (gmatyasfalvi@bnl.gov)
Create: August, 2018
"""

import adios as ad
import configparser
from collections import defaultdict

class Parser():
    
    def __init__(self, configFile):
      self.config = configparser.ConfigParser()
      self.config.read(configFile)
      self.fileType = self.config['Parser']['FileType']
      self.inputFile = self.config['Parser']['InputFile'] # input file path
      self.parseMode = self.config['Parser']['ParseMode']
      self.stream = None
      self.status = None
      self.bpAttrib = None
      self.bpNumAttrib = None
      self.numFun = 0
      self.funMap = defaultdict(int)
      self.eventType = defaultdict(int)
      
      if self.fileType == "bp":
          ad.read_init("BP", parameters="verbose=3") # initialize adios streaming mode
          if self.parseMode == "stream":
            self.stream = ad.file(self.inputFile, "BP", is_stream=True, timeout_sec=10.0)
            self.bpAttrib = self.stream.attr
            self.bpNumAttrib = self.stream.nattrs    
            for iter in self.bpAttrib: # extract funciton names and ids
                if iter.startswith('timer'):
                    self.numFun = self.numFun + 1
                    self.funMap[int(iter.split()[1])] = str(self.bpAttrib[iter].value.decode("utf-8")) # if iter is a string "timer 123" separate timer and 123 and assign 123 as integer key to function map and the function name which is stored in self.bpAttrib[iter].value as a value  
                if iter.startswith('event_type'):
                    self.eventType[int(iter.split()[1])] = str(self.bpAttrib[iter].value.decode("utf-8"))  
                    
    
            print("\nAdios stream ready... \n\n")
            # Debug
            #===================================================================
            # print("Num attributes: ", self.bpNumAttrib, "\n")
            # print("Attribute names: \n", self.bpAttrib, "\n\n\n")
            # print("Num functions: ", self.numFun, "\n")
            # print("Function map: \n", self.funMap, "\n\n\n" )
            #===================================================================
      else:
          raise Exception("\nInput file format not supported...\n")
                        
            
    def getStream(self):
        strm = self.stream
        self.status = self.stream.advance()
        return strm
    
    def getFunData(self): # get function call data from adios
        assert("event_timestamps" in self.stream.vars), "Frame has no function call data (Assertion)..."
        var = self.stream.var["event_timestamps"]
        numSteps = var.nsteps
        return var.read(nsteps=numSteps)
    
    def getCountData(self): # get counter data from adios
        assert("counter_values" in self.stream.vars), "Frame has no counter data (Assertion)..."
        var = self.stream.var["counter_values"]
        num_steps = var.nsteps
        return var.read(nsteps=num_steps)

    def getCommData(self): # get comm data from adios
        assert("comm_timestamps" in self.stream.vars), "Frame has no communication data (Assertion)..."
        var = self.stream.var["comm_timestamps"]
        num_steps = var.nsteps
        return var.read(nsteps=num_steps)
    
    
    def getStatus(self):
        return self.status
    
    
    def getBpAttrib(self):
        return self.bpAttrib
    
    
    def getBpNumAttrib(self):
        return self.bpNumAttrib
    
    
    def getNumFun(self):
        return self.numFun
    
    
    def getFunMap(self):
        return self.funMap
    
    
    def getEventType(self):
        return self.eventType
        
    
    