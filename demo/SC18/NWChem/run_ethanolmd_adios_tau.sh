#!/bin/bash

export TAU_PROFILE=1
export TAU_TRACE=1

. /etc/profile

cd QA/tests/ethanol

sed -i 's/coord 0/coord 1/' ethanol_md.nw
sed -i 's/scoor 0/scoor 1/' ethanol_md.nw

mpirun -n 2 ../../../bin/LINUX64/nwchem ethanol_md.nw

bpls -l nwchem_xyz.bp

