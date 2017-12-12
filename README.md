# Chimbuko-0.1-Release-Dec.-2017

Introduction
=============
The Chimbuko framework captures, analyzes and visualizes performance metrics (see design documents in the documents direc tory) in the for complex
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
The Chimbuko-0.1 release aims at offline mode. The installation includes performance feature extraction package, performance visualization package, and data analysis package. These packages are included in Chimbuko as submodules. The installation script will install the dependencies. The release also include examples that users can use for self-guided exploration of the Chimbuko interfaces.

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
The heat transfer example has been prepared to demonstrate CODAR Savana capability in which users can compose and execute multiple applications in an orchestrated environment. The heat transfer example is publicly available in CoDAR's git repository: https://github.com/CODARcode/Example-Heat_Transfer, or as a tarball associated with the Savanna v0.5 release https://github.com/CODARcode/savanna/releases/tag/v0.5.



