#ifndef _CE_RAMP_INTERFERER_UPDOWN
#define _CE_RAMP_INTERFERER_UPDOWN

#include "cognitive_engine.hpp"

class CE_Ramp_Interferer_UpDown : public CognitiveEngine {

private:
  float current_tx_gain;
  bool ramp_switch; 
  
public:
  CE_Ramp_Interferer_UpDown(int argc, char * argv[], ExtensibleCognitiveRadio *_ECR);
  ~CE_Ramp_Interferer_UpDown();
  virtual void execute();
};

#endif
