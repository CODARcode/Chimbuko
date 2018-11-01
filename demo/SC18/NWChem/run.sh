#!/bin/bash

set -m

cd Visualization/

python3 main.py &

cd ../Analysis/drivers

bash run_chimbuko.sh chimbuko_tau-nwchem.cfg && bg



