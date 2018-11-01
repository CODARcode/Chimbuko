# Chimbuko Performance Visualization

Visualization for online performance analysis

the backend uses python3 flask

the frontend uses javascripts d3js

* start visualization server: python3 main.py

* start sending simulated streaming data: python3 parser.py

The parser.py is only for the demo use

For developer: 

The communication is based on http post:

send request to http://127.0.0.1:5000/events with data in the json header:

* set function list: requests.post(url, json={'type':'functions','value':[function_list]})

* set function of interest: requests.post(url, json={'type':'foi','value':foi})

* send event stream for visualization: requests.post(url, json={'type':'events','value':[a list of events]})

* send labels: requests.post(url, json={'type':'labels','value':[a list of labels]}) (labels only contain line ids of abnormal functions)

see the details in parser for sending events, foi, functions and labels
