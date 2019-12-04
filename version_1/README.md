# Chimbuko Version_v1.0

The release Chimbuko-v1.0 is for offline mode. The installation includes performance feature extraction package, performance visualization package, and data analysis package. These packages are included in the release as submodules. The installation script will install the dependencies for the main components.

# Download


git clone https://github.com/CODARcode/Chimbuko/releases/tag/v1.0



Software Dependencies
---------------------
The following  tools are needed for Chimbuko.

#### TAU #####
If your application is using ADIOS, you need to build TAU with ADIOS.

* Build ADIOS 1.12 as usual (source available at https://github.com/ornladios/ADIOS)

* Configure and build TAU 2.26.2 (or highier) as usual. Add the flag -adios=/path/to/adios/installation at the configure step (source available at http://tau.uoregon.edu/tau.tgz) if you want to capture the adios events through TAU.

* Add /path/to/tau/$arch/bin to your PATH/path environment variable (where “/path/to/tau” is your TAU installation location)

* Set the TAU_MAKEFILE to the Makefile that matches your TAU configuration, located in /path/to/tau/$arch/lib/Makefile.tau-*

#### MongoDB ####
* You need to install MongoDB (https://docs.mongodb.com/v3.4/installation) on your machine for the visualization offline data management.

#### NodeJS ####
* You need to install NodeJS (https://www.npmjs.com/package/anaconda/tutorial) on your machine for the visualization back end.

Installation
-------------


#### Installing Main Software Dependencies ####
```
$cd ./Chimbuko
$./chimbuko_installer.sh
```
#### Installing Dependencies for Data Analysis ####
All you have to do is executing 
```
'scripts/install-dependency.sh' and you need pip3 preinstalled:
```
To run tests:
```
make
make test
```

Performance Feature Aggregation
------------------------------

The TAU framework is used for feature extraction. Currently, TAU can be used for one application. However, scientifc workflows consist of more than one applications. These applications interact with each others. In order to analyize the performance behavior of scientific workflows, TAU framework's scripts were modified based on the BNL visualization and data anlysis teams' needs and feedback. This includes coalesing different TAU profiling and tracing data, converting performance data to JASON format, and extracting performance summary for each component in a workflow.

Chimbuko's `feature_extraction2json.py` is a python script that takes profile data for each component in a scientifc workflow and summarizes basic information at the workflow level and at the component level. The script is publically available in CODAR's git https://github.com/CODARcode/Chimbuko-feature-extraction. 

Performance Data Analysis
-------------------------
The data analysis framework of Chimbuko is based on the TAU instrumentation which collects traces and profiles for workflow executions. The framework detects performance anomalies for scientific workflows and applications using learning algorithms. The source code is publically available in CODAR's git https://github.com/CODARcode/PerformanceAnalysis.

This library provides a Python API to process TAU performance profile and traces. At the moment it supports the following functionality:
* Extract function call entry and exsit event filtering from TAU trace
* Generate call stack with the depth `k`, the duration of call, job_id, node_id, and thread_id
* Detect anomalies 

Performance Visualization
-------------------------

The visualization framework of Chimbuko is based on the TAU instrumentation which collects traces and profiles for workflow executions. This framework provides the visualization of these input which helps a user to understand the overall performance. 

We visualize five major types of performance information:
* trace function call events in execution time
* trace messages send/receive events among nodes/cores
* file transfer events among nodes/cores
* profile with different metrics
* outlier visualization (test phase)

We provide four levels of details for trace visualization:

* overview level -- showing general event heatmap
* trace call group level -- showing aggregated function call events based on call groups.
* trace detail level -- showing real function execution in a selected range of time for selected node/core.
* node detail level -- showing an alternative cascaded view of the selected trace function execution.

Our current release is for offline workflow examples. However, the front end that contains majority of functionalities is independent and well prepared for online access. The back end storage MongoDB can be replaced when the online data acess API is ready.

We compose both *LAMMPS* and *NWCHEM* applications as our use case. The source code of visualization part is publically available in CODAR's git https://github.com/CODARcode/PerformanceVisualization.

Examples
---------

### LAMMPS Example ###

The LAMMPS workflow example is avaiable at https://github.com/CODARcode/Example-LAMMPS.
Cheetah is used to generate scripts for automatically harness of experiments. The obtained profile and trace data could be  analyzed and visualized using Chimbuko. Example-LAMMPS.pdf, in the documents directory, gives detail on configuring and running LAMMPS using TAU on Titan.


### Heat Transfer Example ###

The heat transfer example has been prepared to demonstrate CODAR Savana capability in which users can compose and execute multiple applications in an orchestrated environment. The heat transfer example is publicly available in CoDAR's git repository: https://github.com/CODARcode/Example-Heat_Transfer, or as a tarball associated with the Savanna v0.5 release https://github.com/CODARcode/savanna/releases/tag/v0.5. A short tutorial for running the heat tranfer example with Chimbuko for feature extraction is available at https://github.com/CODARcode/Chimbuko-feature-extraction.

### Performance Data Analysis Example ###

The following example code demonstrate the basic usage of performance anomaly detection steps:
from codar.chimbuku.perf_anom import n_gram
```
ee_lst = n_gram.extract_entry_exit('test/data/reduced-trace.json')
```
'ee_lst' contains entry and exit event of TAU trace files. To generate n_gram statistics (with call stack depth 'k'), the following will generate pandas.DataFrame:
```
df = n_gram.generate_n_grams_ct(ee_lst, 1, k=3, file_name = 'n_gram.df')
```
where '1' is job_id and 'k=3' is for how many call depth to maintain. Note that here call depth to maintain is from the leaf node, not from root node. 'file_name' is for output pandas.DataFrame file, which is good for per trace processing.
Given df, the following detect performance anomaly using LOF(Local Outlier Factor) algorithm where 'ANALYZ:ANA_TASK:UTIL_PRINT' is call stack and k=10 neighborhood node examples is used and find 5 anomaly out of 4400 calls:
```
an_lst = n_gram.perform_localOutlierFactor(df[df['kl'] == 'ANALYZ:ANA_TASK:UTIL_PRINT'], 10, float(5/4400))
```
Anomaly instances can be selected by simply doing the following:
```
df[an_lst]
```
We can merge multiple n_gram statistics for multiple trace files as follow:
```python
import pandas as pd
import glob

df_lst = []
for file in glob.glob("*.df"):
    print("Processing :" + file)

    with open(file, 'rb') as handle:
        ldf = pd.read_pickle(handle)
        df_lst.append(ldf)
df = pd.concat(df_lst)
```
Another option to process all these steps is using one function:

```python
from codar.chimbuku.perf_anom import n_gram
trace_fn_lst = ["data/reduced-trace.json", "data/reduced-trace2.json"]
jid_lst = [1, 2]
df = n_gram.detect_anomaly(trace_fn_lst, jid_lst, out_fn_prefix="results", call_depth=3, n_neighbors=10, n_func_call=5, n_anomalies=5)
```
This will generate final aggreated anomaly detected DataFrame with classified anomaly labels. You have less freedom to test but it is for the convenience. 'n_neighbors' is the number of neighborhood to estimate density, 'n_func_call' is about how many function call n_gram to process (top k frequent function call n_gram will be processed), and n_anomalies is about how many anomalies want to see.

### Performance Visualization Example ###

We use a composition of LAMMPS and NWCHEM examples to illustrate the main functionalities of performance visualization. It includes overview, trace view, node view, profile view and anomaly view. We saved the snapshots of each routine (https://github.com/CODARcode/PerformanceVisualization/tree/master/snapshots). For a detailed explanation, please check here: https://github.com/CODARcode/PerformanceVisualization#interface-description
