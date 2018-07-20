#ifndef _SC_CORNET_
#define _SC_CORNET_

#include "scenario_controller.hpp"
#include "CORNET_3D.hpp"

class SC_CORNET : public ScenarioController {

private:
  // internal members used by this CE
  int TCP_CORNET_Tutorial;
  
  //store previous values so we don't make unnecessary updates to the radios
  int old_mod;
  int old_crc;
  int old_fec0;
  int old_fec1;
  double old_freq;
  double old_bandwidth;
  double old_gain;

public:
  SC_CORNET(int argc, char **argv);
  ~SC_CORNET();
  virtual void execute();
  virtual void initialize_node_fb();
};

#endif
