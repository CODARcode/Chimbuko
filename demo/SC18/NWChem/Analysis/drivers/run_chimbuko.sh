#!/bin/bash

#cd /Chimbuko/drivers/

pwd

#cd drivers/

export PYTHONPATH=../lib/codar/chimbuko/perf_anom:$PATH:$PYTHONPATH

ARG1="$1"

python3 chimbuko.py $ARG1