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

Software Dependencies
=====================
1. TAU
2- MongoDB

Installation
=============

Performance Feature Extraction
==============================

The TAU framework is used for performance feature extraction. Currently, TAU can be used for one application. Scientifc workflow consists of more than one applications. These applications interact with each others. In order to analyize the performance behavior of a scientific workflow, TAU framework was modified based on the BNL visualization and data anlysis teams's need. This includes coalesing different TAU profile and tracing data, converting data to JASON format and extracting performance summary of each component in a workflow.

Chimbuko feature_extraction2json.py is a python script that takes profile data for each component in a scientifc workflow and summarizes basic information at the workflow level and at the component level. The script is publicly available in CoDAR's git https://github.com/CODARcode/Chimbuko-feature-extraction. 

Performance Visualization
=========================

https://github.com/CODARcode/PerformanceVisualization

Data Analysis
=============


LAMMP Example
=============
## Description
This document describes the flow of generating TAU-based profile and trace data for the LAMMPS workflow example. Cheetah is used to generate scripts for automatically harness of experiments. The obtained profile and trace data could be further analyzed and visualized by using the Chimbuko framework.

## code ( in a zipped file )
1. ADIOS: https://github.com/ornladios/ADIOS.git
2. FLEXPATH: http ://www.cc.gatech.edu/systems/projects/EVPath/chaos_bootstrap.pl
3. LAMMPS example: https://github.com/CODARcode/Example-LAMMPS
4. Stage_write: https://github.com/CODARcode/Example-Heat_Transfer/tree/master/stage_write
5. TAU: http://tau.uoregon.edu/tau.tgz
6. PDT: http://tau.uoregon.edu/pdt.tar.gz
7. Cheetah: https://github.com/CODARcode/cheetah

## Installation
LAMMPS
1. cd EXAMPLE-LAMMPS/lammps/src
2. make yes-kspace yes-manybody yes-molecule yes-user-adios_staging
3. make mpi -j8 CC=tau_cxx.sh LINK=tau_cxx.sh
4. Stage_write
5. copy the folder of stage_write to EXAMPLE-LAMMPS
6. cd EXAMPLE-LAMMPS/stae_write
7. make the following changes in Makefile:
8. CC=tau_cxx.sh
9. FC=tau_f90.sh
10. ADIOS_CLIB=$(shell tau_cc.sh -tau:showlibs) $(shell adios_config -l)
11. make

## Configuration ( dependencies etc. )
1. FLEXPATH
2. wget http ://www.cc.gatech.edu/systems/projects/EVPath/chaos_bootstrap.pl
3. perl ./chaos_bootstrap.pl
4. perl ./chaos_build.pl
5. ADIOS
6. ./configure --with-flexpath=DIR
7. make
8. make install
9. TAU https://www.cs.uoregon.edu/research/tau/docs/newguide/bk02ch01.html#installing.tau
10 Cheetah git clone https://github.com/CODARcode/cheetah.git

## Running the tool
On Titan: ./cheetah.py -e lammps_stage_voro.py -a /Example-LAMMPS/swift-all  -m titan -o /campaigns/lammps
cd /campaigns/lammps
./run-all.sh

## Examples ( Validation/ Verification) using LAMMP/Heat Equations etc.
Two folders will be generated for each run in /campaigns/lammps/small-scale/run-xxx for LAMMPS and stage_write, respectively. In each generated tau folder, there are 3 files for each process per workflow component. For example, if a workflow launches 128 LAMMPS processes processes, there are 128 edf, 128 trc and 128 profile files for LAMMPS.

## Helpful tips to the users
TAU environment can be changed in cheetah/etc
TAU provides utilities for merging trace and profile files and convert them to json format

Heat Transfer Example
=====================
The heat transfer example has been prepared to demonstrate CODAR Savana capability in which users can compose and execute multiple applications in an orchestrated environment. The heat transfer example is publicly available in CoDAR's git repository: https://github.com/CODARcode/Example-Heat_Transfer, or as a tarball associated with the Savanna v0.5 release https://github.com/CODARcode/savanna/releases/tag/v0.5.



