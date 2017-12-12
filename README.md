# Chimbuko-0.1-Release-Dec.-2017

Introduction
=============
The Chimbuko framework captures, analyzes and visualizes performance metrics for complex
scientific workflows and relates these metrics to the context of their execution on extreme-scale
machines. The purpose of Chimbuko is to enable empirical studies of performance analysis for
a software or a workflow during a development phase or in different computational environments.
Chimbuko enables the comparison of different runs at high and low levels of metric granularity.
Chimbuko aims at providing this capability in both offline and online (in-situ) modes. Because capturing
performance metrics can quickly escalate in volume and provenance can be highly verbose,
Chimbuko plan to include a data reduction module. The framework is intended to be used first in offline
mode so that a user can determine what metrics are of interest to their case, and then in online mode. The following figure shows the basic layout of the Chimbuko framework.

![Chimbuko Basic Layout](figures/chimbukolayout.png)

For more information about the design and working philosophy of Chimbuko, please refer to the documents in the directory https://github.com/CODARcode/Chimbuko-0.1-Release-Dec.-2017-/tree/master/documents .

What is Chimbuko-0.1?
=====================
Chimbuko-0.1 release aims at offline mode. The installation includes performance feature extraction, performance visualization, and data analysis. These packages are included in Chimbuko as submodules. The installation script will install the dependencies. The release also include examples that users can use for self-guided exploration of the interfaces.

Installation
=============

Performance Feature Extraction
==============================

https://github.com/CODARcode/Chimbuko-feature-extraction

Performance Visualization
=========================

https://github.com/CODARcode/PerformanceVisualization

Data Analysis
=============


LAMMP Example
=============


Heat Transfer Example
=====================


