#!/bin/bash

# --------------------------------------------------------
# Input arguments
# --------------------------------------------------------

# chimbuko arguments
# - ADIOS_MODE: [SST, BPFile]
# - HAS_BPFILE: true if BPFile is available 
#               (currently, it must be false for docker run)
# - AD_SIGMA: AD sigma value
#              (the larger value, the fewer anomalies or fewer false positives)
# - AD_WINSZ: AD time window size
#              (the larger window, the more informative calls stack view in viz)
# - AD_INTERVAL: AD time interval
#              (only for debugging purpose with BPFile adios mode)
# - BATCH_DIR: batch directory
ADIOS_MODE=${1:-SST}
HAS_BPFILE=${2:-false}
AD_SIGMA=${3:-6}
AD_WINSZ=${4:-10}
AD_INTERVAL=${5:-1000}
BATCH_DIR=${6:-/test}

# heat2d (simulation) arguments
# - NPX: number of processes in X dimension 
# - NPY: number of processes in Y dimension
# - NX: local array size in X dimension per processor
# - NY: local array size in Y dimension per processor
# - STEPS: the total number of steps to output
# - ITERS: one step consist of this many iterations
NPX=${7:-4}
NPY=${8:-3}
NX=${9:-1000}
NY=${10:-1000}
STEPS=${11:-100}
ITERS=${12:-1000}

NMPIS=$(( $NPX * $NPY ))

echo "============================"
echo "NMPIS: ${NMPIS} = ${NPY} x ${NPX}"
echo "NY x NX: ${NY} x ${NX}"
echo "STEPS: ${STEPS}"
echo "ITERS: ${ITERS}"
echo "ADIOS MODE: ${ADIOS_MODE}"
echo "HAS BPFile: ${HAS_BPFILE}"
echo "AD SIGMA: ${AD_SIGMA}"
echo "AD WINSZ: ${AD_WINSZ}"
echo "AD INTERVAL: ${AD_INTERVAL} msec"
echo "BATCH DIR: ${BATCH_DIR}"
echo "============================"
sleep 1

# NWChem environments
export HEAT2D_TOP=/Codar/heat2d

# Chimbuko environments
export AD_ROOT=/opt/chimbuko/ad
export VIZ_ROOT=/opt/chimbuko/viz

# TAU environments
export TAU_ROOT=/opt/tau2/x86_64
export TAU_MAKEFILE=$TAU_ROOT/lib/Makefile.tau-papi-mpi-pthread-pdt-adios2
export TAU_PLUGINS_PATH=$TAU_ROOT/lib/shared-papi-mpi-pthread-pdt-adios2
export TAU_PLUGINS=libTAU-adios2-trace-plugin.so

# Create work directory under the given batch directory
mkdir -p $BATCH_DIR
cd $BATCH_DIR
rm -rf DB executions logs
mkdir -p logs
mkdir -p DB
mkdir -p BP
mkdir -p executions
WORK_DIR=`pwd`

# TAU plug-in environments
BP_PREFIX=tau-metrics-heatSimulation
export TAU_ADIOS2_PERIODIC=1
export TAU_ADIOS2_PERIOD=1000000
export TAU_ADIOS2_SELECTION_FILE=$WORK_DIR/sos_filter.txt
export TAU_ADIOS2_ENGINE=$ADIOS_MODE
export TAU_ADIOS2_FILENAME=$WORK_DIR/BP/tau-metrics
#export TAU_VERBOSE=1

# visualization server
export SERVER_CONFIG="production"
export DATABASE_URL="sqlite:///${WORK_DIR}/DB/main.sqlite"
export ANOMALY_STATS_URL="sqlite:///${WORK_DIR}/DB/anomaly_stats.sqlite"
export ANOMALY_DATA_URL="sqlite:///${WORK_DIR}/DB/anomaly_data.sqlite"
export FUNC_STATS_URL="sqlite:///${WORK_DIR}/DB/func_stats.sqlite"
export EXECUTION_PATH=$WORK_DIR/executions

# copy binaries and data to WORK_DIR
cp $HEAT2D_TOP/heatSimulation .
cp -r $AD_ROOT .
cp -r $VIZ_ROOT .


echo ""
echo "=========================================="
echo "Launch Chimbuko visualization server"
echo "=========================================="
cd $WORK_DIR/viz

echo "run redis ..."
webserver/run-redis.sh &
sleep 30

echo "run celery ..."
# only for docker
export C_FORCE_ROOT=1
python3 manager.py celery --loglevel=info --concurrency=4 --logfile=${WORK_DIR}/logs/celery.log &
sleep 10

echo "create database @ ${DATABASE_URL}"
python3 manager.py createdb
sleep 10

echo "run webserver ..."
python3 manager.py runserver --host 0.0.0.0 --port 5000 \
    >"${WORK_DIR}/logs/webserver.log" 2>&1 &
sleep 10

echo ""
echo "=========================================="
echo "Launch Chimbuko parameter server"
echo "=========================================="
cd $WORK_DIR/ad
echo "run parameter server ..."
bin/app/pserver 2 "${WORK_DIR}/logs/parameters.log" $NMPIS "http://0.0.0.0:5000/api/anomalydata" &
ps_pid=$!
sleep 5

if [ "$ADIOS_MODE" == "SST" ]
then
    echo "Launch Application with anomaly detectors"
    cd $WORK_DIR/ad
    mpirun --allow-run-as-root -n $NMPIS bin/app/driver $ADIOS_MODE \
        $WORK_DIR/BP $BP_PREFIX "${WORK_DIR}/executions" "tcp://0.0.0.0:5559" ${AD_SIGMA} ${AD_WINSZ} 0 &
    sleep 5

    cd $WORK_DIR
    mpirun --allow-run-as-root -n $NMPIS ./heatSimulation sim.bp $NPX $NPY $NX $NY $STEPS $ITERS 
else
    echo "Use BP mode"
    if ! $HAS_BPFILE
    then
        echo "Run NWChem"
        cd $WORK_DIR
        mpirun --allow-run-as-root -n $NMPIS ./heatSimulation sim.bp $NPX $NPY $NX $NY $STEPS $ITERS
    fi
    echo "Run anomaly detectors"
    cd $WORK_DIR/ad
    mpirun --allow-run-as-root -n $NMPIS bin/app/driver $ADIOS_MODE $WORK_DIR/BP $BP_PREFIX \
        "${WORK_DIR}/executions" "tcp://0.0.0.0:5559" ${AD_SIGMA} ${AD_WINSZ} ${AD_INTERVAL}
fi

wait $ps_pid

# wait about 10 min. so that users can keep interacting with visualization. 
sleep 600
echo ""
echo "=========================================="
echo "Shutdown Chimbuko visualization server"
echo "=========================================="
cd $WORK_DIR/viz
curl -X GET http://0.0.0.0:5000/tasks/inspect
echo "shutdown webserver ..."
curl -X GET http://0.0.0.0:5000/stop
echo "shutdown celery workers ..."
pkill -9 -f 'celery worker'
echo "shutdown redis server ..."
webserver/shutdown-redis.sh

sleep 30
cd $WORK_DIR
echo "Bye~~!!"
