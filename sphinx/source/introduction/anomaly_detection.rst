*****************************
Anomaly Detection (AD) module
*****************************

The anomaly detection (AD) module consists of two components: **on-node anomaly detection (AD)** and 
**paramter server (PS)**.

.. figure:: img/ad.png
   :alt: Anomaly detection module architecture

   Anomaly detection (AD) module: on-node AD module and paramter server (PS). 

On-node AD Module
-----------------

The on-node anomaly detection (AD) module (per applications' process) takes streamed trace data.
Each AD parses the streamed trace data and maintains a function call stack along with 
any communication events (if available). Then, it determines anomalous function calls that have
extraordinary behaviors. If there are any anomalies within the current trace data, 
the AD module stores them in files or DB. This is where significant data reduction occurs 
because we only save the anomalies and a few nearby normal function calls of the anomalies. 

Statistical anomaly analysis
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

An anomaly function call is a function call that has a longer (or shorter) execution time than 
a upper (or a lower) threshold. 

.. math::
    threshold_{upper} = \mu_{i} + \alpha * \sigma_{i} \\
    threshold_{lower} = \mu_{i} - \alpha * \sigma_{i}

where :math:`\mu_{i}` and :math:`\sigma_{i}` are mean and standard deviation of execution time 
of a function :math:`i`, respectively, and :math:`\alpha` is a control parameter (the lesser value, 
the more anomalies or the more false positives). 

Advanced anomaly analysis
~~~~~~~~~~~~~~~~~~~~~~~~~
TBD


Parameter Server
----------------

The parameter server (PS) provides two services:

- Maintain global parameters to provide consistent and robust anomaly detection power over on-node AD modules
- Keep a global view of workflow-level performance trace analysis results and stream to visualization server


Scalable Parameter Server
~~~~~~~~~~~~~~~~~~~~~~~~~
TBD

Furthermore
-----------

More details can be found in `PerformanceAnalysis documentation <https://codarcode.github.io/PerformanceAnalysis/>`_.
