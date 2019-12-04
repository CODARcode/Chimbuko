#!/bin/bash

module load gcc/8.1.1
module load cmake/3.13.4
module load zlib/1.2.11
module load bzip2/1.0.6
module load zeromq/4.2.5


CODAR_ROOT=`pwd`
install_fabric=false
install_sz=false
install_cblosc=false
install_adios2=true

if [ ! -d "$CODAR_ROOT/downloads/adiosvm"  ]
then
   echo "Download adiosvm ..."
   cd downloads
   git clone https://github.com/pnorbert/adiosvm.git
   cd ..
   echo "Downloaded adiosvm!"
fi

if $install_fabric
then
   echo "Install libfabric for SST engine ..."
   rm -rf ./downloads/libfabric-1.7.0
   rm -rf ./sw/libfabric-1.7.0
   cd downloads
   wget https://github.com/ofiwg/libfabric/releases/download/v1.7.0/libfabric-1.7.0.tar.gz
   tar xvfz libfabric-1.7.0.tar.gz
   cd libfabric-1.7.0
   ./configure --prefix=$CODAR_ROOT/sw/libfabric-1.7.0 \
		--disable-verbs \
		--disable-mlx
   make
   make install
   cd ..
   rm -f libfabric-1.7.0.tar.gz
   cd ..
   echo "Installed libfabric!"
fi
export LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:$CODAR_ROOT/sw/libfabric-1.7.0/lib

if $install_sz
then
   echo "Install sz ..."
   rm -rf ./downloads/sz-1.4.13.0
   rm -rf ./sw/sz-1.4.13.0
   cd downloads
   cp ./adiosvm/adiospackages/sz-1.4.13.0.tar.gz .
   tar zxf sz-1.4.13.0.tar.gz
   cd sz-1.4.13.0
   ./configure --prefix=$CODAR_ROOT/sw/sz-1.4.13.0 \
		--with-pic \
		--disable-shared \
		--disable-fortran \
		--disable-maintainer-mode
   make
   make install
   cd ..
   rm sz-1.4.13.0.tar.gz
   cd ..
   echo "Installed sz!"
fi

if $install_cblosc
then
   echo "Install c-blosc ..."
   rm -rf ./downloads/c-blosc
   rm -rf ./sw/blosc
   cd downloads
   git clone https://github.com/Blosc/c-blosc.git
   cd c-blosc
   mkdir build
   cd build
   cmake -DCMAKE_INSTALL_PREFIX=$CODAR_ROOT/sw/blosc -DBUILD_TESTS=OFF ..
   make
   make install
   cd $CODAR_ROOT
   echo "Installed c-blosc!"
fi
export LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:$CODAR_ROOT/sw/blosc/lib

if $install_adios2
then
   echo "Install adios2 ..."
   rm -rf ./downloads/ADIOS2
   rm -rf ./sw/adios2
   cd downloads
   git clone https://github.com/ornladios/ADIOS2.git
   cd ADIOS2
   mkdir build
   cd build
   cmake -DCMAKE_INSTALL_PREFIX=$CODAR_ROOT/sw/adios2 \
         -DCMAKE_C_COMPILER=/sw/summit/gcc/8.1.1/bin/gcc \
         -DCMAKE_CXX_COMPILER=/sw/summit/gcc/8.1.1/bin/g++ \
         -DCMAKE_FORTRAN_COMPILER=/sw/summit/gcc/8.1.1/bin/gfortran \
         -DCMAKE_CXX_FLAGS=-pthread \
         -DADIOS2_USE_MPI=ON \
         -DADIOS2_USE_HDF5=OFF \
         -DADIOS2_USE_ZeroMQ=ON \
         -DADIOS2_USE_Fortran=ON \
         -DADIOS2_USE_Python=OFF \
         -DADIOS2_USE_SST=ON \
         -DADIOS2_USE_BZip2=ON \
         -DADIOS2_USE_ZFP=OFF \
         -DADIOS2_USE_DataMan=ON \
         -DADIOS2_USE_Profiling=OFF \
         -DBUILD_SHARED_LIBS=ON \
         -DLIBFABRIC_ROOT=$CODAR_ROOT/sw/libfabric-1.7.0 \
         -DSZ_ROOT=$CODAR_ROOT=$CODAR_ROOT/sw/sz-1.4.13.0 \
         -DADIOS2_BUILD_TESTING=ON \
         -DCMAKE_BUILD_TYPE=RelWithDebInfo \
         -DMPIEXEC_MAX_NUMPROCS=4 \
         ..
   make -j 4
   ctest
   make install
   cd $CODAR_ROOT
   echo "Installed adios2!"
fi
export LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:$CODAR_ROOT/sw/adios2/lib
export PATH=${PATH}:$CODAR_ROOT/sw/adios2/bin

echo $LD_LIBRARY_PATH
echo $PATH









