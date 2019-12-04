***********
From source
***********

Install AD module
-----------------

First, download (or clone) **Chimbuko** AD module.

.. code:: bash

   git clone https://github.com/CODARcode/PerformanceAnalysis.git


Ubuntu 16.04
~~~~~~~~~~~~

The AD module requires to have ADIOS2_, ZeroMQ_, and CURL_.
To install ADIOS2_ (MPI version), please check its website.
For ZeroMQ_ and CURL_, 

.. code:: bash

   apt-get install libzmq3-dev curl libcurl4-openssl-dev

Optionally, to build test cases, users need to install gtest.

.. code:: bash

   apt-get install libgtest-dev
   cd /usr/src/gtest
   cmake CMakelists.txt
   make
   cp *.a /usr/lib

Finally, to build the AD module

.. code:: bash

   cd /path/to/ad/module/dir
   make
   ./run_test.sh  # to run test cases

Note that users need to modify the :code:`Makefile` for the ADIOS2_ path.



Summit
~~~~~~

We provide :download:`an installation script<files/install_adios2.sh>` for ADIOS2_, 
if the latest version is not availale on Summit. 

To load required modules and build the AD module on Summit,

.. code:: bash

    cd /path/to/ad/module/dir
    source env.summit.sh
    make -f Makefile.summit

Note that users need to modify :code:`Makefile.summit` for the ADIOS2_ path.



Cori
~~~~

TBD

.. _ADIOS2: https://github.com/ornladios/ADIOS2
.. _ZeroMQ: https://zeromq.org/
.. _CURL: https://curl.haxx.se/



Install Viz module
------------------

First, download (or clone) **Chimbuko** visualization module that comes with 
backend server and the latest fronend bundled code. We encourage to use 
python virtual environment like Anaconda_.

.. code:: bash

   git clone https://github.com/CODARcode/ChimbukoVisualizationII
   cd ChimbukoVisualizationII
   # This will install Redis and run it.
   webserver/run-redis.sh
   # Kill Redis (Ctrl + X)
   # Then, install required python packages
   pip install -r requirements.txt

.. _Redis: https://redis.io/
.. _Anaconda: https://www.anaconda.com/