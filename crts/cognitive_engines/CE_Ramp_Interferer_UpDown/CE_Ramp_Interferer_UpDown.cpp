#include "extensible_cognitive_radio.hpp"
#include "CE_Ramp_Interferer_UpDown.hpp"

CE_Ramp_Interferer_UpDown::CE_Ramp_Interferer_UpDown(int argc, char * argv[], ExtensibleCognitiveRadio *_ECR) { 

ECR = _ECR;
ramp_switch = false;
ECR->set_tx_gain_uhd(0.0); }

CE_Ramp_Interferer_UpDown::~CE_Ramp_Interferer_UpDown() {}

void CE_Ramp_Interferer_UpDown::execute() {
  
current_tx_gain = ECR->get_tx_gain_uhd();


  if(ramp_switch == false){
	current_tx_gain = current_tx_gain + 0.5;                 
    ECR->set_tx_gain_uhd(current_tx_gain);
  }
  if(current_tx_gain >= 25){
	ramp_switch = true;
  }
  if(ramp_switch == true){
	current_tx_gain = current_tx_gain - 0.5;                 
    ECR->set_tx_gain_uhd(current_tx_gain);
	}
  if(current_tx_gain <=0.5){
	ramp_switch = false;
  }
	
  //ECR->set_tx_gain_uhd(0.0);  

  printf("Setting transmit gain to %f\n", current_tx_gain);

 // ECR->set_tx_gain_uhd(tx_gain);
}
