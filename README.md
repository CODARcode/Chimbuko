# Chimbuko

## Introduction

The Chimbuko framework captures, analyzes and visualizes performance metrics for complex scientific workflows and relates these metrics to the context of their execution on extreme-scale
machines. The purpose of Chimbuko is to enable empirical studies of performance analysis for
a software or a workflow during a development phase or in different computational environments.
Chimbuko enables the comparison of different runs at high and low levels of metric granularity.
Chimbuko provides this capability in both offline and online (in-situ) modes. Because capturing
performance metrics can quickly escalate in volume and provenance can be highly verbose,
Chimbuko plans to include a data reduction module. The framework is intended to be used first in offline
mode so that a user can determine what metrics are of interest to their case, and then in online mode. 

The following figure shows the basic layout of the Chimbuko framework. 

![Chimbuko Basic Layout](figures/chimbuko_overview.png)

* The [ADIOS framework ](https://www.olcf.ornl.gov/center-projects/adios/) orchestrates workflow and provides data streaming. 
* The [TAU tool](https://www.cs.uoregon.edu/research/tau/home.php) provides performance metrics for instrumented components 1 and 2. The tool extracts provenance metadata and trace data. 
* Trace data is dynamically analyzed to detect anomalies
* Selected metadata and trace data is stored ( e.g. time window for which trace event interesting)

For more information about the design and working philosophy of Chimbuko, please see the [documents directory](https://github.com/CODARcode/Chimbuko/tree/master/documents). 

## Documentation

Please find [details from here](https://codarcode.github.io/Chimbuko/).

## Releases

The current release include support for online mode. For  software requirements and installation, check [Chimbuko Data Analysis](https://github.com/CODARcode/PerformanceAnalysis) and [Chimbuko Visualization](https://github.com/CODARcode/ChimbukoVisualization).


### [Chimbuko Data Analysis](https://github.com/CODARcode/PerformanceAnalysis)

This library provides C/C++ APIs to process [TAU](http://tau.uoregon.edu) performance profile and traces.

### [Chimbuko Visualization](https://github.com/CODARcode/ChimbukoVisualization)

This is a visualization framework for online performance analysis. This framework mainly focuses on visualizing real-time anomalous behaviors in a High Performance Computing application so that any patterns of anomalies that users might not have recognized can be effectively detected through online visual analytics.

