var lammps_options = {
	'graphSizeCoef':36,
	'graphRepelCoef':-12,
    'valueCoef':1,
    'dynamicRepelCoef':-2,
    'dynamic_lmargin':0,
	'clusterk':20,
	'clustereps':2000,
	'colorThreshold':20,
	'invokeNum':362
};
var nwchem_options = {
	'graphSizeCoef':12,
	'graphRepelCoef':-12,
    'valueCoef':2,
    'dynamicRepelCoef':-2,
    'dynamic_lmargin':60,
	'clusterk':10,
	'clustereps':10,//250000,
	'colorThreshold':200,
	'invokeNum':320
};
var visOptions = lammps_options;

var video = false;
var topHeight = 600;
var bottomHeight = 320;
if(video){
    topHeight = 420;
    bottomHeight = 380;
    $('html, body').css('margin',0)
    $('html, body').css('height','100%')
    $('html, body').css('overflow','hidden')
}

d3.select('#toppanel').style('height',topHeight+"px")
d3.select('#overview').style('height',topHeight-1)
d3.select('#bottompanel').style('height',bottomHeight+"px");
d3.select('#treepanel').style('height',bottomHeight+"px");
d3.select('#treeview').style('height',bottomHeight-20);
d3.select('#temporalview').style('height',bottomHeight-30);

var showFunctionColor = new Set(['MPI_Comm_rank()','MPI_Comm_size()','MPI_Comm_group()','MPI_Recv() [THROTTLED]']);
var functionColors = {
    'Others':"#aec7e8",
    'MPI_Irecv()':"#c5b0d5",
    'MPI_Send()':"#ff7f0e",
    'MPI_Wait()':"#ffbb78",
    'void LAMMPS_NS::CommBrick::forward_comm_pair(LAMMPS_NS::Pair *) [{comm_brick.cpp} {881,1}-{913,1}]':"#98df8a",
    'void LAMMPS_NS::CommBrick::reverse_comm_pair(LAMMPS_NS::Pair *) [{comm_brick.cpp} {920,1}-{951,1}]':"#2ca02c",
    'void LAMMPS_NS::PairEAM::compute(int, int) [{pair_eam.cpp} {134,1}-{315,1}]':"#9467bd",
    'FLUSH':"#c49c94",
    'int LAMMPS_NS::PairEAM::pack_forward_comm(int, int *, double *, int, int *) [{pair_eam.cpp} {818,1}-{829,1}]':"#17becf",
    'int LAMMPS_NS::PairEAM::pack_reverse_comm(int, int, double *) [{pair_eam.cpp} {844,1}-{852,1}]':"#9edae5",
    'void LAMMPS_NS::Pair::ev_setup(int, int) [{pair.cpp} {753,1}-{814,1}]':"#d62728",
    'void LAMMPS_NS::Pair::ev_tally(int, int, int, int, double, double, double, double, double, double) [{pair.cpp} {841,1}-{935,1}]':"#f7b6d2",
    'void LAMMPS_NS::PairEAM::unpack_forward_comm(int, int, double *) [{pair_eam.cpp} {833,1}-{840,1}]':"#8c564b",
    'void LAMMPS_NS::PairEAM::unpack_reverse_comm(int, int *, double *) [{pair_eam.cpp} {856,1}-{865,1}]':"#ff9896",
    'void LAMMPS_NS::Memory::sfree(void *) [{memory.cpp} {90,1}-{98,1}]':"#bcbd22",
    'void *LAMMPS_NS::Memory::smalloc(LAMMPS_NS::bigint, const char *) [{memory.cpp} {35,1}-{59,1}]':"#dbdb8d",
    'void LAMMPS_NS::Pair::virial_fdotr_compute() [{pair.cpp} {1482,1}-{1530,1}]':"#1f77b4",
    "MD_NEWTON [{md_main.F} {1665,7}-{1983,9}]":"#9467bd",
    "MPI_Type_size()":"#bcbd22",
    "MPI_Comm_size()":"#6b6ecf",
    "MPI_Comm_rank()":"#f7b6d2",
    "MPI_Comm_group()":"#c49c94",
    "MPI_Group_translate_ranks()":"black",
    "MPI_Isend() [THROTTLED]":"#ff7f0e",
    "MPI_Group_free()":"#f7b6d2",
    "MPI_Test() [THROTTLED]":"black",
    "MPI_Get_count() [THROTTLED]":"#1f77b4",
    "MPI_Recv() [THROTTLED]":"#e7ba52",
    "MPI_Allreduce()":"black",
    "MD_FOLD [{md_main.F} {2080,7}-{2093,9}]":"black",
    "MPI_Barrier()":"black",
    "MPI_Group_size()":"black",
    "MD_FINIT [{md_main.F} {2094,7}-{2198,9}]":"#c5b0d5",
    "MD_FORCES [{md_main.F} {2199,7}-{2260,9}]":"#2ca02c",
    "MD_SHAKE [{md_main.F} {2026,7}-{2079,9}]":"#ffbb78",
    "MPI_Bcast()":"black",
    "MD_ZINIT [{md_main.F} {2310,7}-{2329,9}]":"black",
    "MPI_Group_rank()":"black",
    "MD_FCLASS [{md_main.F} {2330,7}-{2496,9}]":"#98df8a"
};