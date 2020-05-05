# Chimbuko anomaly detection for GPU applications

In order to interface with CUDA runtime profiling, the binary needs to be run under tau_exec (in addition to compiler profiling for the host functions). 

We run tau_exec with the following options
> -env -um -cupti

____
## How Tau provides information to Chimbuko

Tau provides 3 types of information on its ADIOS2 output stream or as a BPFile dump:
1. Timers: These are timestamps associated with function and communication events.
2. Counters: These are general numerical information that can be associated with functions, comms or other other environment variables that Tau monitors
3. Metadata: These are simple key/value pairs describing the system, the timers and counters

Chimbuko captures all of these data, but we are primarily concerned with function entry/exit events, from which it computes timing statistics and ultimately anomalies. Each function has an associated timer index, and timer data are passed in the form of an 'event_timestamps' array made up of blocks of 6 integers which correspond to the following event properties:
0. Program index (typically 0)
1. MPI rank
2. Thread index
3. Event index which maps as follows:  0:ENTRY 1:EXIT 2:SEND 3:RECV
4. Timer index (which maps to a function name as above)
5. Timestamp

The mapping of function index to a particular function are passed as metadata attributes with a name of the form "timer $id" where $id is the index, and a value corresponding to the function name.

When instrumenting a regular binary, all the "functions" are just regular functions, eg
> "timer 1"  ->   "main [{/Codar/heat2d/simulation/heatSimulation.cpp} {39,0}]"

apart from
> timer 0 -> ".TAU application"


____
## How Tau deals with GPUs

In general, a node can have multiple GPUs and multiple "streams" per GPU, the latter being the mechanism by which kernels can be overlapped on a GPU.

Tau obtains information about NVidia GPU executions using CUPTI; CUDA's performance tracking API.

In a similar way to which Tau passes information to Chimbuko, the CUPTI API passes events and counters to Tau. Tau considers each device/stream as a virtual "thread" to which events/counters are associated, much like a CPU core. Tau forwards the CUPTI events and counters to Chimbuko in an identical way to which it passes CPU events, only the "thread" to which an event/counter is associated is the virtual thread index.

In principle CUPTI can generate very detailed information about the running of a particular kernel, but at the cost of orders-of-magnitude slowdown in the execution. As we are interested in full system, at-scale running with minimal footprint, we are unable to utilize this aspect of CUPTI. Instead what Tau receives from CUPTI are a number of statistics about the kernel execution (GPU occupancy, memory usage, etc) and events corresponding to when a kernel started and finished executing.

NOTE: This means we do *not* have thread-level granularity on GPU kernel execution. The volume of information associated with a GPU device/stream is the same as if we had executed the kernels on a single CPU core. As a result, the much-feared explosion of information associated with GPU running is not an issue.


____
## Description of options an available data

### -cupti

This option enables CUPTI, allowing for the capturing of cuda API calls and kernel calls as well as other counter data.

Of primary interest are the mappings of virtual thread index to device. These are obtained from metadata entries of the following form:
> MetaData:0:9:CUDA Context {Elements:1 Type:string Value:"1" }

> MetaData:0:9:CUDA Device {Elements:1 Type:string Value:"0" }

MetaData entries always start with "MetaData:\<process\>:\<thread\>:". Here we see that virtual thread 9 is associated with CUDA context #1 , device #0. Presumably stream information will be likewise provided if multiple streams are used.

We also obtain metadata describing the GPUs, of the form:

> MetaData:0:0:GPU[0] Clock Rate {Elements:1 Type:string Value:"1627000" }

> MetaData:0:0:GPU[0] Compute Capability Major {Elements:1 Type:string Value:"7" }

> MetaData:0:0:GPU[0] Compute Capability Minor {Elements:1 Type:string Value:"0" }

> MetaData:0:0:GPU[0] L2 Cache Size {Elements:1 Type:string Value:"6291456" }

> MetaData:0:0:GPU[0] Max Threads per Block {Elements:1 Type:string Value:"1024" }

> MetaData:0:0:GPU[0] Max Threads per Multiprocessor {Elements:1 Type:string Value:"2048" }

> MetaData:0:0:GPU[0] Name {Elements:1 Type:string Value:"Quadro GV100" }

> MetaData:0:0:GPU[0] Number of Memcpy Engines {Elements:1 Type:string Value:"4" }

> MetaData:0:0:GPU[0] Number of Multiprocessors {Elements:1 Type:string Value:"80" }

> MetaData:0:0:GPU[0] Registers per Block {Elements:1 Type:string Value:"65536" }

> MetaData:0:0:GPU[0] Shared Memory per Block {Elements:1 Type:string Value:"49152" }

> MetaData:0:0:GPU[0] Total Constant Memory {Elements:1 Type:string Value:"34055454720" }

> MetaData:0:0:GPU[0] Total Global Memory {Elements:1 Type:string Value:"34055454720" }

> MetaData:0:0:GPU[0] Warp Size {Elements:1 Type:string Value:"32" }

from which we can deduce the properties of our device #0, a Quadro GV100.

Kernel executions appear associated with the specific virtual thread (9 here). The functions likewise appear as timers, e.g.

> timer 18 {Elements:1 Type:string Value:"the_kernel(long long)" }

And here is an example (exit0 event for timer 18, thread 9:

> (92 0 ):0 (92 1 ):0 (92 2 ):9 (92 3 ):1 (92 4 ):18 (92 5 ):1588718808525217

We also obtain timers associated with various CUDA API calls, e.g.

* cudaLaunchKernel
* cudaEventCreate
* cudaEventSynchronize
* cudaDeviceSynchronize
* cudaMallocManaged
* cudaFree
* Event Synchronize
* Context Synchronize

Finally we receive a number of counters associated with the following:

* Allocatable Blocks Per SM given Registers used (Blocks)
* Allocatable Blocks Per SM given Shared Memory usage (Blocks)
* GPU Occupancy (Warps)
* Block Size
* Shared Dynamic Memory (bytes)
* Shared Static Memory (bytes)
* Local Memory (bytes per thread)
* Local Registers (per thread)
* Allocatable Blocks per SM given Thread count (Blocks)

I believe these are associated with a given kernel.

____
### -um

This option enables tracking of unified memory events.

With this option we gain new counters:

* Unified Memory Bytes copied from Device to Host
* Unified Memory Bytes copied from Host to Device

and new timers:

* Unified Memory copy Host to Device
* Unified Memory copy Device to Host


____
### -env

This option enables collecting of some GPU "environment" variables as counters. These may be collected at a regular frequency and may not be tied to a particular kernel.
* Power Utilization (% mW)
* SM Frequency (MHz)
* Memory Frequency (MHz)
* GPU Temperature (C)
* Fan Speed (% max)




