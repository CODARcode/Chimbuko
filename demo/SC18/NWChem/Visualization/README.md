# Chimbuko Performance Visualization 

## Overview 

![Overview](./data/images/overview.png)

This is a visualization framework for online performance analysis. This framework mainly focuses on visualizing real-time anomalous behaviors in HPC environment so that some hidden patterns of anomaly that users might not have recognized can be effectively detected in online visual analytics manner. 

This framework provides four major information:

* Current function executions
* Call stack tree structures of a specific function
* Message communications of a particular function
* Timeline of a selected function execution
* Overall events flow and density by rank (to be added)

To visualize that information, the following four components are provided:

* Projection of executions in real time
* Call stack tree representation
* Timeline and message visualization
* Heat Map visualization for events flows (to be added)


## Software Dependency

This framework is a web application of which the back-end built with `Python3.x` and `Flask` and the front-end developed with `Javascript` and `D3.js`. 


## Installation

Please be advised that this framework is containerized as a single `docker` image so that there is no need to spend time on any issue with the software dependency.

### Using docker
The `docker` repo is currently private. The access information will be announced soon.

### Manual install
In order to manually install this framework, make sure that `Python3.x` and `pip3` are installed on your machine.

If they are already installed, `Numpy` and `Flask` can be installed by:

```bash
$ pip3 install Numpy
$ pip3 install Flask
```

Now, please clone the repository of this project to run the visualization framework by: 

```bash
$ git clone [TBA]
```


## Execution

Before starting a visualization server, a port number can be modified if needed. Please open `main.py`:

```python
port = 5000 # replace 5000 with your preference
```

Start visualization server:

```bash
$ python3 main.py
```

If the visualization server runs, by default, `localhost:5000` will work.

## Sending Requests

### Rest APIs Supported

The visualization server accepts `POST` method requests to `localhost:5000/events` with data in the `json` header. Please send following requests in the following order.

- Reset/initialize the server:

```json
{ 
    "type":"reset"
}
```

- Provide function names in order

```json
{ 
    "type":"functions", 
    "value": ["function", "names", "in", "string", "type"]
}
```

- Provide events types in order

```json
{ 
    "type":"event_types", 
    "value": ["event", "types", "in", "string", "type"]
}
```

- Provide trace information with the function of interest `foi` and anomaly functions `labels`:

```json
{ 
    "type":"info",
    "value":{
        "events": [],
        "foi": [], # a list of indices based on function names 
        "labels": [] # a list of lineid
    }
}
```

### Offline Simulation

Currently, `parserNWChem.py` can be used for an offline demo.

```bash
$ cd web
$ python3 parserNWChem.py
```


## Interface Description

### Projection of Function Executions
Trace events are visualized on a scatter plot in streaming fashion. If some events were detected as an anomaly, they will be highlighted by making the size bigger than normal executions. 

![Projection](./data/images/projection.png)

The various filtering is provided so that only anomaly data or particular functions can be observed easily.

![Projection](./data/images/filter.gif)

The more visual patterns can be recognized by adjusting the axis, for example, rank vs. execution time, entry time vs. exit time, etc.

![Projection](./data/images/projection_2.png)

![Projection](./data/images/projection_3.png)


### Selected Call Stack Tree 
For particular function execution, detailed call stack information will be shown by clicking the specific data point on the scatter plot.

![Projection](./data/images/tree.png)

### Timeline and Message Visualization
The detailed timeline and message communication of specific function will also be visualized. A particular interval can be focused by dragging the timeline.

![Projection](./data/images/timeline.png)

### Heat Map Visualization
To be added soon.
