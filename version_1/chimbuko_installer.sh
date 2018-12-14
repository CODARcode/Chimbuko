#!/bin/bash

rootDir=`pwd`

echo The script will install PDT, TAU, and MongoDB in ~/Chimbuko directory!


#------------------------ PDT INSTALLATION -------------------------

TAU_URL="http://tau.uoregon.edu/tau.tgz"
PDT_URL="http://tau.uoregon.edu/pdt.tgz"
TAU_SRC_DIR=$rootDIR/tau
PDT_SRC_DIR=$rootDIR/pdtoolkit

echo installing PDT
echo creating directory for PDT

#download PDT source 

curl -L $PDT_URL |tar zxf -
mv pdtoolkit* pdtoolkit


if [ ! "$PDT_SRC_DIR" ] ; then
        echo "FATAL: cannto download and extract PDT source."
        exit
fi

cd pdtoolkit

./configure
make
make install
export PATH=$PATH:$rootDir/pdtoolkit/ppc64/bin

#------------------------------ TAU INSTALLATION ---------------------------

cd $rootDir
# download TAU source

curl -L $TAU_URL | tar zxf -
mv tau* tau

if [ ! "$TAU_SRC_DIR" ] ; then
        echo "FATAL: cannot download and extract TAU source."
        exit
fi


cd tau

./configure -pdt=$rootDir/pdtoolkit

make
make install
export PATH=$PATH:$rootDir/tau/ppc64/bin

#-------------------------- MONGODB INSTALLATION-------------------------------

cd $rootDir
MONGODB_URL="https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-3.4.10.tgz"

curl -O $MONGODB_URL

tar -zxvf mongodb-linux-x86_64-3.4.10.tgz

mkdir -p mongodb
cp -R -n mongodb-linux-x86_64-3.4.10/ mongodb


export PATH=$rootDir/mongodb/bin:$PATH
