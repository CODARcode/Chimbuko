#!/bin/bash

set -m

. /etc/profile

export PYTHONPATH=/Chimbuko/PerformanceAnalysis/lib/codar/chimbuko/perf_anom:/Install/adios-1.13.1/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

cd Visualization/

python3 main.py &

cd ../PerformanceAnalysis/drivers

bash run_chimbuko.sh chimbuko_tau-nwchem.cfg && bg



