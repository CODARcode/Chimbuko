import requests
import time
import json

vis_url = 'http://0.0.0.0:5000/events'
vis_data = "../data/StreamingNWChem/"

res = requests.post(vis_url, json={'type':'reset'})
print(res.json())

#----set function dictionary----
fun_names = []
with open(vis_data+"function.json", 'r') as f:
	fun_names = json.load(f)
requests.post(vis_url, json={'type':'functions', 'value':fun_names})

#----set event types, they are not fixed----
et = []
with open(vis_data+"et.json", 'r') as f:
	et = json.load(f)
requests.post(vis_url, json={'type':'event_types','value':et})


#----simulating update----
import glob

event_list = glob.glob(vis_data+"trace.*.json")
event_list.sort(key=lambda x: int(x.split('.')[-2]))

anomaly_list = glob.glob(vis_data+"anomaly.*.json")
anomaly_list.sort(key=lambda x: int(x.split('.')[-2]))

foi_list = glob.glob(vis_data+"foi.*.json")
foi_list.sort(key=lambda x: int(x.split('.')[-2]))

for i in range(len(event_list)):
	
	#----set function of interest----
	foi = []
	with open(foi_list[i], 'r') as f:
		foi = json.load(f)
	
	labels = []
	with open(anomaly_list[i], 'r') as f:
		labels = json.load(f)
	
	events = []
	with open(event_list[i], 'r') as f:
		events = json.load(f)

	res = requests.post(vis_url, json={'type':'info','value':{
		"events": events,
		"foi": foi,
		"labels": labels
	}})
	print(res.json())

# requests.post('http://127.0.0.1:5000/log', json={'type':'log'})

