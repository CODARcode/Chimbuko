# Chimbuko anomaly detection for GPU applications

In order to interface with CUDA runtime profiling, the binary needs to be run under tau_exec (in addition to compiler profiling for the host functions). 

We run tau_exec with the following options
> -env -um -cupti -io -memory

____
With -env option of tau_exec, the following additional data are captured and output each step as "counters"
* Power Utilization (% mW)
* SM Frequency (MHz)
* GPU Occupancy (Warps)
* Block Size
* Shared Dynamic Memory (bytes)
* Shared Static Memory (bytes)
* Memory Frequency (MHz)
* GPU Temperature (C)
* Fan Speed (% max)
* Local Memory (bytes per thread)
* Local Registers (per thread)
* Allocatable Blocks per SM given Thread count (Blocks)
* Allocatable Blocks Per SM given Registers used (Blocks)
* Allocatable Blocks Per SM given Shared Memory usage (Blocks)

These counters are captured each time step and appear to be updated at some regular frequency. This requires further investigation; it possibly occurs for each kernel execution.

___
With -memory we gain additional counters:
* Heap Allocate
* Heap Memory Used (KB)
* Memory Frequency (MHz)
* Shared Dynamic Memory (bytes)
* Shared Static Memory (bytes)
* Local Memory (bytes per thread)
* Heap Free
* Decrease in Heap Memory (KB)
* Heap Memory Used (KB) at Exit
* Increase in Heap Memory (KB)
* Heap Memory Used (KB) at Entry

These don't appear to be associated with the GPU but we could track them for anomaly detection.



___
With -cupti -um

Function entry and exit as well as comms events are placed in the SST stream in the form of an 'event_timestamps' array made up of blocks of 6 integers which correspond to the following event properties:
0. Program index (typically 0)
1. MPI rank
2. Thread index
3. Event index which maps as follows:  0:ENTRY 1:EXIT 2:SEND 3:RECV
4. Function index
5. Timestamp

The mapping of function index to a particular function are passed as metadata attributes with a name of the form "timer $id" where $id is the index, and a value corresponding to the function name.

When instrumenting a regular binary, all the "functions" are just regular functions, eg
> "timer 1"  ->   "main [{/Codar/heat2d/simulation/heatSimulation.cpp} {39,0}]"

apart from
> timer 0 -> ".TAU application"


When instrumenting a GPU application new function mappings appear:
* cudaLaunchKernel
* cudaEventCreate
* cudaEventSynchronize
* cudaDeviceSynchronize
* cudaMallocManaged
* cudaFree

These are CUDA API calls.

* Event Synchronize
* Context Synchronize

The meaning of these has yet to be determined.

We also get regular function-like mappings that are likely related to the CUDA compiled GPU code, eg (for function add(int, float\*, float\*))


> timer 10 -> "__device_stub__Z3addiPfS_(int, float\*, float\*) [{/tmp/tmpxft_00000018_00000000-5_instr_main.cudafe1.stub.c} {13,0}]"

and a regular function which likely is associated with the host function wrapper code:

> timer 9 -> "add(int, float\*, float\*) [{/mnt/sst_view/instr_main.C} {12,0}]"

With these information we can expect to be able to:
* Time kernel execution
* Associate kernel executions with GPU "environment variables" such as GPU temperature
