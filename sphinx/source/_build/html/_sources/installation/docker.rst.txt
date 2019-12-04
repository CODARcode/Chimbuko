******
Docker 
******

We provide pre-built docker images for easy usages.

Structure
---------

.. figure:: img/docker_structure.png
   :align: center
   :alt: Anomaly detection module architecture

   Structure of available docker images

.. table:: Available docker images
   :align: center
   :widths: 30 70

   +---------------+----------------------------------------------+
   |Image name     |Description                                   |
   +===============+==============================================+
   |base           |Ubuntu 16.04 with basic developement tools    |
   +---------------+----------------------------------------------+
   |adios2         |ADIOS2_                                       |
   +---------------+----------------------------------------------+
   |tau2           |TAU2_                                         |
   +---------------+----------------------------------------------+
   |viz            |Chimbuko visualization module                 |
   +---------------+----------------------------------------------+
   |ad             |Chimbuko anomaly detection module             |
   +---------------+----------------------------------------------+
   |nwchem         |TAU instrumented NWChem_                      |
   +---------------+----------------------------------------------+
   |heat2d         |TAU instrumented heat2d_ simulation code      |
   +---------------+----------------------------------------------+
   |brusselator    |TAU instrumented brusselator_ simulation code |
   +---------------+----------------------------------------------+
   |run_[app name] |Chimbuko enabled application                  |
   +---------------+----------------------------------------------+

.. _ADIOS2: https://github.com/ornladios/ADIOS2
.. _TAU2: https://github.com/UO-OACISS/tau2
.. _NWChem: https://github.com/hjjvandam/nwchem-1/tree/pretauadio2
.. _heat2d: https://github.com/pnorbert/adiosvm/tree/master/Tutorial/heat2d/cpp
.. _brusselator: https://github.com/pnorbert/adiosvm/tree/master/Tutorial/brusselator/src

To download those available docker images,

.. code-block:: bash
   
   docker pull chimbuko/[Image name]:latest

Usages
------

Create TAU instrumented applications
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The first step to use **Chimbuko** is to instrument TAU on target applications.
For this, users can start from the pre-built TAU2 image. Here is an example to create 
an image of TAU instrumented heat2d simulation code.

.. code-block:: docker
   
   FROM chimbuko/tau2 AS heat2d-build

   # set PATH environment variable (as the target applications required)
   ENV PATH=${PATH}:/opt/tau2/x86_64/bin

   # set LD_LIBRARY_PATH variables (as the target applications required)
   ENV LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:/opt/libfabric/lib
   ENV LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:/opt/blosc/lib
   ENV LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:/opt/pdt/x86_64/lib
   ENV LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:/opt/papi/lib
   ENV LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:/opt/tau2/x86_64/lib
   ENV LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:/opt/adios2/lib
   ENV LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:/opt/SZ/lib

   # set TAU environment variable as needed
   ENV TAU_MAKEFILE=/opt/tau2/x86_64/lib/Makefile.tau-papi-mpi-pthread-pdt-adios2
   ENV TAU_OPTIONS="-optShared -optRevert -optVerbose -optCompInst"

   # copy applications 
   COPY /path/to/source /path/to/destination

   # compile/build the applications
   WORKDIR /path/to/destination
   RUN make heatSimulation

   # final image with ADIOS2 and TAU2
   FROM chimbuko/tau2
   COPY --from=heat2d-build /path/to/destination /path/to/destination
   WORKDIR /path/to/destination

To create a docker image,

.. code-block:: docker

   docker build -f /path/to/dockerfile -t [image name:tag] .


Create Chimbuko enabled applications
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

To create a **Chimbuko** enabled docker image for the target applications, 
users first need to create an executable bash script that runs the target applications
along with **Chimbuko**. Users can find examples of the scripts from here_ or download 
:download:`an example script for heat2d simulation code <files/run_heat2d_chimbuko.sh>`.

.. _here: https://github.com/CODARcode/PerformanceAnalysis

From the example script, users need to modify the application specific argument sections.
Note that the first six arguments are reserved for the **Chimbuko**.

.. code-block:: bash

   # chimbuko arguments
   ADIOS_MODE=${1:-SST}
   HAS_BPFILE=${2:-false}
   AD_SIGMA=${3:-6}
   AD_WINSZ=${4:-10}
   AD_INTERVAL=${5:-1000}
   BATCH_DIR=${6:-/test}

   # application specific arguments
   NMPIS=${7:-12}     # [required] number of processes 
   ARG1={$8:-arg1}    # application specific arguments
   ...
   APP_ROOT=/path/to/application
   APP_BIN=application binary name
   APP_CMD="${APP_ROOT}/${APP_BIN} $ARG1"

   ...
   # on application execution
   mpirun -n $NMPIS $APP_CMD
   ...

Once the executable script is ready, users can easily build **Chimbuko** enabled application image
using the pre-built Chimbuko docker images as the follows:

.. code-block:: docker

   # get **Chimbuko** from pre-built images
   FROM chimbuko/ad AS ad-module
   FROM chimbuko/viz AS viz-module

   # built from pre-built TAU instrumented application image
   FROM chimbuko/heat2d:latest

   # copy chimbuko modules
   RUN mkdir -p /opt/chimbuko
   COPY --from=ad-module /opt/chimbuko /opt/chimbuko
   COPY --from=viz-module /opt/chimbuko /opt/chimbuko

   # set LD_LIBRARY_PATH as needed to run the applications
   ENV LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:/opt/libfabric/lib
   ENV LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:/opt/blosc/lib
   ENV LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:/opt/tau2/x86_64/lib
   ENV LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:/opt/adios2/lib
   ENV LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:/opt/SZ/lib

   # copy an executable script to run the target applications with **Chimbuko**
   WORKDIR /
   COPY run_heat2d_chimbuko.sh /

   # set entrypoint and default command line arguments
   EXPOSE 5000
   ENTRYPOINT [ "./run_script.sh" ]
   # The first six arguments are reserved for **Chimbuko**.
   CMD [ "SST", "false", "12", "10", "1000", "/test", "application arguments"]

After that, users can run the image,

.. code-block:: bash
   
   docker run -p 5000:5000 -it [image name]:[tag] [arguments to run]

and, to see the performance analysis results, open a browser at 127.0.0.1:5000.

Userful docker commands
~~~~~~~~~~~~~~~~~~~~~~~

To list available docker images: 

.. code-block:: bash

   docker images

To list running docker images:

.. code-block:: bash

   docker ps


To stop a running docker image:

.. code-block:: bash

   # find docker ID
   docker ps
   # stop an image
   docker stop [docker ID]
