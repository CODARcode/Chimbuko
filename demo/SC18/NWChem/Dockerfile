FROM ubuntu:latest

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y apt-utils build-essential vim wget curl gcc g++ gfortran mpich git cmake libopenblas-base libopenblas-dev perl python python-pip pkg-config lib32z1-dev libpthread-stubs0-dev dnsutils python3 python3-pip python3-tk
RUN pip install cffi numpy mpi4py
WORKDIR .
RUN mkdir Install
RUN mkdir Downloads
RUN mkdir Codar
RUN mkdir Downloads/EVPath
WORKDIR /Downloads/EVPath
RUN wget -q https://gtkorvo.github.io/korvo_bootstrap.pl
RUN perl ./korvo_bootstrap.pl development /Install/EVPath
RUN sed -i 's/korvogithub configure/%korvogithub configure/' korvo_build_config
RUN sed -i 's/korvogithub cmake/%korvogithub cmake/' korvo_build_config
RUN sed -i 's/% %korvogithub configure/korvogithub configure/' korvo_build_config
RUN sed -i 's/% %korvogithub cmake/korvogithub cmake/' korvo_build_config
RUN sed -i 's/CC=cc/CC=mpicc/' korvo_build_config
RUN sed -i 's/CXX=CC/CC=mpicxx/' korvo_build_config
RUN sed -i 's/-DCMAKE_C_COMPILER=cc/-DCMAKE_C_COMPILER=mpicc/' korvo_build_config
RUN sed -i 's/-DCMAKE_CXX_COMPILER=CC/-DCMAKE_CXX_COMPILER=mpicxx/' korvo_build_config
RUN perl ./korvo_build.pl
RUN echo "export PATH=/Install/EVPath/bin:\$PATH" >> /etc/profile
WORKDIR /Downloads
RUN wget http://personal.cac.rutgers.edu/TASSL/projects/data/downloads/dataspaces-1.7.2.tar.gz
RUN tar xzf dataspaces-1.7.2.tar.gz
WORKDIR /Downloads/dataspaces-1.7.2
RUN ./configure CC=mpicc FC=mpif90 CFLAGS=-fPIC FFLAGS=-fPIC cross_compiling=yes --enable-dart-tcp --prefix=/Install/dataspaces-1.7.2
RUN make -j2
RUN make install
RUN echo "export PATH=/Install/dataspaces-1.7.2/bin:\$PATH" >> /etc/profile
WORKDIR /Downloads
RUN wget http://dstats.net/download/http://www.mcs.anl.gov/~shdi/download/sz-2.0.2.0.tar.gz
RUN tar xzf sz-2.0.2.0.tar.gz
WORKDIR /Downloads/sz-2.0.2.0
ENV CFLAGS=-fPIC
ENV CXXFLAGS=-fPIC
RUN ./configure --prefix=/Install/sz-1.4.12.3
RUN make -j2
RUN make install
RUN echo "export LD_LIBRARY_PATH=/Install/sz-1.4.12.3/lib" >> /etc/profile
WORKDIR /Downloads
RUN wget https://github.com/lz4/lz4/archive/v1.8.3.tar.gz
RUN tar xzf v1.8.3.tar.gz
WORKDIR /Downloads/lz4-1.8.3
ENV CFLAGS=-fPIC
ENV CXXFLAGS=-fPIC
RUN make -j2 install PREFIX=/Install/lz4-1.8.3
RUN echo "export LD_LIBRARY_PATH=/Install/lz4-1.8.3/lib:\$LD_LIBRARY_PATH" >> /etc/profile
WORKDIR /Downloads
RUN git clone https://github.com/Blosc/c-blosc.git
WORKDIR /Downloads/c-blosc
RUN mkdir build
WORKDIR /Downloads/c-blosc/build
ENV CFLAGS=-fPIC
ENV CXXFLAGS=-fPIC
RUN cmake -DCMAKE_INSTALL_PREFIX=/Install/blosc-master ..
RUN cmake --build .
RUN cmake --build . --target install
RUN echo "export LD_LIBRARY_PATH=/Install/blosc-master/lib:\$LD_LIBRARY_PATH" >> /etc/profile
WORKDIR /Downloads
RUN wget https://www.sqlite.org/2017/sqlite-autoconf-3200100.tar.gz
RUN tar -xvf sqlite-autoconf-3200100.tar.gz
WORKDIR /Downloads/sqlite-autoconf-3200100
RUN CC=`which gcc` CXX=`which g++` ./configure --prefix=/Install/sqlite3
RUN make -j2 -k
RUN make -j2 install -k
RUN echo "export PATH=/Install/sqlite3/bin:\$PATH" >> /etc/profile
WORKDIR /Downloads
RUN wget http://icl.utk.edu/projects/papi/downloads/papi-5.6.0.tar.gz
RUN tar xzf papi-5.6.0.tar.gz
WORKDIR /Downloads/papi-5.6.0/src
RUN ./configure --prefix=/Install/papi-5.6.0
RUN make -j2
RUN make install
RUN echo "export PATH=/Install/papi-5.6.0/bin:\$PATH" >> /etc/profile
WORKDIR /Downloads
RUN wget http://tau.uoregon.edu/pdt_lite.tar.gz
RUN tar xzf pdt_lite.tar.gz
WORKDIR /Downloads/pdtoolkit-3.25
RUN CC=gcc CXX=g++ ./configure -GNU -prefix=/Install/pdtoolkit-3.25
RUN make -j2
RUN make install
RUN echo "export PATH=/Install/pdtoolkit-3.25/x86_64/bin:\$PATH" >> /etc/profile
WORKDIR /Downloads
RUN wget https://users.nccs.gov/~pnorbert/adios-1.13.1.tar.gz
RUN tar xzf adios-1.13.1.tar.gz
WORKDIR /Downloads/adios-1.13.1
RUN ./configure CC=mpicc CXX=mpicxx FC=mpif90 CFLAGS="-g -O2 -fPIC" CXXFLAGS="-g -O2 -fPIC" FCFLAGS="-g -O2 -fPIC" --disable-static --enable-shared --with-bzip2 --with-zlib --with-flexpath=/Install/EVPath --with-dataspaces=/Install/dataspaces-1.7.2 --with-lz4=/Install/lz4-1.8.3 --with-sz=/Install/sz-2.0.2.0 --with-blosc=/Install/blosc-master --prefix=/Install/adios-1.13.1
RUN make -j2
RUN make install
RUN echo "export PATH=/Install/adios-1.13.1/bin:\$PATH" >> /etc/profile
WORKDIR /Downloads
RUN git clone https://github.com/cdwdirect/sos_flow.git
WORKDIR /Downloads/sos_flow
RUN mkdir build
WORKDIR /Downloads/sos_flow/build
RUN cmake -DCMAKE_BUILD_TYPE=Debug -DCMAKE_INSTALL_PREFIX=/Install/sosflow -DSQLite3_DIR=/Install/sqlite3 -DEVPath_DIR=/Install/EVPath -DCMAKE_C_COMPILER=mpicc -DCMAKE_CXX_COMPILER=mpicxx -DSOS_CLOUD_SYNC_WITH_EVPATH=TRUE -DBUILD_SHARED_LIBS=FALSE -DSOS_ENABLE_PYTHON=TRUE ..
RUN make -j2
RUN make install
RUN echo "export PATH=/Install/sosflow/bin:\$PATH" >> /etc/profile
WORKDIR /Downloads
RUN wget http://www.nic.uoregon.edu/~khuck/tau2-2018-10-04.tar.gz
RUN tar xzf tau2-2018-10-04.tar.gz
RUN cp /usr/include/mpich/*.* /usr/include
WORKDIR /Downloads/tau2-2018-10-04
RUN ./configure -cc=gcc -c++=g++ -fortran=gfortran -mpi -pthread -bfd=download -unwind=download -pdt=/Install/pdtoolkit-3.25 -pdt_c++=g++ -prefix=/Install/tau2-2018-10-04 -sos=/Install/sosflow -adios=/Install/adios-1.13.1 -papi=/Install/papi-5.6.0
RUN echo "export PATH=/Install/tau2-2018-10-04/x86_64/bin:\$PATH" >> /etc/profile
RUN echo "export TAU_MAKEFILE=/Install/tau2-2018-10-04/x86_64/lib/Makefile.tau-papi-mpi-pthread-pdt-sos-adios" >> /etc/profile
RUN make install -j2
WORKDIR /Codar
RUN git clone https://github.com/hjjvandam/nwchem-1.git
WORKDIR /Codar/nwchem-1
RUN git checkout tau
COPY build_nwchem ./contrib/distro-tools
COPY makefile.h ./src/config
COPY md_main.F ./src/nwmd
COPY sp_init.F ./src/space
COPY select.tau /Codar/nwchem-1/.
RUN git clone https://github.com/khuck/sos_flow_experiments.git
RUN cp sos_flow_experiments/sos_scripts/Codar_nwchem_everything/*.* .

# install python3

# This has to be done as two separate commands.
RUN pip3 install --upgrade pip 
RUN pip3 install configparser numpy scipy sklearn runstats requests matplotlib flask virtualenv

ENV PATH=${PATH}:/Install/adios-1.13.1/bin
WORKDIR /Downloads/adios-1.13.1/wrappers/numpy
RUN . /etc/profile && make MPI=y python
RUN . /etc/profile && python setup.py install --prefix=/Install/adios-1.13.1
RUN . /etc/profile && pip3 install adios adios_mpi


# Copy current directory contents into the container
RUN mkdir -p /Chimbuko
#COPY PerformanceAnalysis/ /Chimbuko
#COPY Visualization/ /Chimbuko
#WORKDIR /Chimbuko

# Build NWChem

WORKDIR /Codar/nwchem-1
ENV USE_TAU="source"
ENV ARMCI_NETWORK=MPI-TS
ENV BLASOPT="-lopenblas `adios_config -l -f`"
ENV NWCHEM_MODULES=md
COPY sp_init.F ./src/space
RUN chmod +x ./contrib/distro-tools/build_nwchem
RUN . /etc/profile && ./contrib/distro-tools/build_nwchem 2>&1 | tee build_nwchem.log 
RUN cd QA && ./domknwchemrc
COPY run_ethanolmd_adios_tau.sh .
RUN chmod +x run_ethanolmd_adios_tau.sh

WORKDIR /Codar/nwchem-1
CMD ["./test.sh"]
