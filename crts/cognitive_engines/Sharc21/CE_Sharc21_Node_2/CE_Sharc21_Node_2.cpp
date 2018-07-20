// The purpose of this engine is to test if a node will receive data from a PU network if the radios are set to the same frequencies. 
// The radios that are not a part of the PU network will have their transmitters turned off. Only the PU network radios will transmit data.

#include "extensible_cognitive_radio.hpp"
#include "CE_Sharc21_Node_2.hpp"

// constructor
CE_Sharc21_Node_2::CE_Sharc21_Node_2(int argc, char **argv, ExtensibleCognitiveRadio *_ECR) {

  // save the ECR pointer (this should not be removed)
  ECR = _ECR;
  
  // Turn off print metrics
  ECR->print_metrics_flag = false;
  
  // Initialize variables
  correct_frames = 0;
  frame_errors = 0;
  total_correct_bytes = 0;
  frame_counter = 0;
  total_bytes = 0;
  i = 1;
  timeout_counter = 0;
  error_percentage = 0;
  
  valid_payloads = 0;
  invalid_payloads = 0;
  
  total_valid_payloads = 0;
  total_invalid_payloads = 0;
  
  packet_counter = 0;
  valid_timeouts = 0;
  
  freq_changes = 0;
  
  valid_period_count = 0;
  
  // Create timers
  rate_timer = timer_create();
  wait_timer = timer_create();
  send_freq_timer = timer_create();
  timeout_timer = timer_create();
  listen_timer = timer_create();
  freq_change_timer = timer_create();

  // default Debug Message Level
  // 0: No output
  // 1: Output on TX/RX-related events
  // 2: Also output on UHD Buffer events
  debugLevel = 1; 

  // interpret command line options
  int o;
  while ((o = getopt(argc, argv, "d:")) != EOF) {
    switch (o) {
      case 'd':
        debugLevel = atoi(optarg);
        break;
    }
  }
}

// destructor
CE_Sharc21_Node_2::~CE_Sharc21_Node_2() {
  // Destroy timers
  timer_destroy(rate_timer);
  timer_destroy(wait_timer);
  timer_destroy(send_freq_timer);
  timer_destroy(timeout_timer);
  timer_destroy(listen_timer);
  timer_destroy(freq_change_timer);
}

// execute function
void CE_Sharc21_Node_2::execute() {
  
  if (!stop_tx) {
    
    // Stop Tx to check if somebody is already in the channel.
    ECR->stop_tx();
    //timer_tic(listen_timer);
    
    stop_tx = true;
    timer_tic(send_freq_timer);
    
    og_rx_freq = ECR->get_rx_freq();
    
    // Set Node 1's control info to default value.
    current_tx_control_info[0] = 'r';
		std::memset(&current_tx_control_info[1], 0, 5);
		ECR->set_tx_control_info(current_tx_control_info);
    
    prev_rx_control_char = 'r';
    
    node1_control_info_default_set = true;
    
  }
  
  if (!listened_to_channel && listen_timer_started) {
    if (timer_toc(listen_timer) >= listen_time_s && packet_counter < packet_threshold) {
      //printf("Channel is Clear!!\n");
      //printf("Packets Received:    %d\n\n", packet_counter);
      ECR->start_tx();
      listened_to_channel = true;
    } else if (timer_toc(listen_timer) >= listen_time_s && packet_counter >= packet_threshold) {
      //printf("Channel is NOT Clear!!\n");
      //printf("Packets Received:    %d\n\n", packet_counter);
      ECR->start_tx();
      SendIntentToChangeTheDangFreq(ECR);
      listened_to_channel = true;
    }
  }
  
  if (listening) {
    ListenToChannel(ECR);
  }
  
  if (freq_timer_started) {
    if (timer_toc(freq_change_timer) >= 1.0 && !go_to_default) {
      freq_timer_started = false;
      freq_changes = 0;
    } else if (timer_toc(freq_change_timer) >= 1.0 && go_to_default) {
      freq_timer_started = false;
      freq_changes = 0;
      GoToDefault(ECR);
    }
  }

  switch(ECR->CE_metrics.CE_event) {
    
    case ExtensibleCognitiveRadio::TIMEOUT:
      // handle timeout events
      if (debugLevel>0) {
        
        if (listened_to_channel) {           
          // Handle TIMEOUT event
          TimeoutCrap(ECR);
        }
        
      }
      
      break;
      
    case ExtensibleCognitiveRadio::PHY_FRAME_RECEIVED:
      // handle physical layer frame reception events
      if (debugLevel>0) {
        
        if (!listened_to_channel || listening) {
          packet_counter++;
        } else {
          
          frame_counter++;
        
          timeout_timer_started = false;    // Reset flag so that the timeout timer can restart at next TIMEOUT event.
          default_tx_freq_set = false;
               
          // Check validity of payload and control
          ValidCheck(ECR);

          // Check control information
          ControlInfoCrap(ECR);

          // Calcluate rates and other rate stuff
          RateCrap(ECR);
        }
              
      }
      
      break;
      
    case ExtensibleCognitiveRadio::TX_COMPLETE:
      // handle transmission complete events
      if (debugLevel>0) {
        printf("TX COMPLETE EVENT!\n");
        timer_tic(listen_timer);
        packet_counter = 0;
        listen_timer_started = true;
      }
      
      break;
      
    case ExtensibleCognitiveRadio::UHD_OVERFLOW:
      // handle UHD overflow events
      printf("UHD_OVERFLOW Event!\n");
      break;
      
    case ExtensibleCognitiveRadio::UHD_UNDERRUN:
      // handle UHD underrun events
      if (debugLevel>1) {
        printf("UHD_UNDERRUN Event!\n");
      }
      
      break;
      
    case ExtensibleCognitiveRadio::USRP_RX_SAMPS:
      // handle samples received from the USRP when simultaneously
      // running the receiver and performing additional sensing
      if (debugLevel>0) {
        printf("USRP_RX_SAMPS Event!\n");
      }
      
      break;
      
  }
}


// ****** Custom Functions ******

void CE_Sharc21_Node_2::CountErrors(ExtensibleCognitiveRadio *ECR) {
  
  // Count the number of frames with and without errors.
  if (ECR->CE_metrics.payload_valid) {   
    correct_frames++;
    correct_bytes_rcvd = ECR->CE_metrics.payload_len;
    total_correct_bytes += correct_bytes_rcvd;
  }
  else {
    frame_errors++;
  }
}


void CE_Sharc21_Node_2::CheckDataRate(ExtensibleCognitiveRadio *ECR, int frames_rcvd, int errors_rcvd, int correct_rcvd, int total_bytes_rcvd, int total_correct_bytes_rcvd, float time_passed) {
  
  /*float data_rate;
  float frame_error_rate;
  float correct_frame_rate;
  float bit_rate;
  float correct_bit_rate;
  int total_bits = total_bytes_rcvd * 8;
  int total_correct_bits = total_correct_bytes_rcvd * 8;
  //int mod_scheme = ECR->get_tx_modulation();
  
  data_rate = frames_rcvd / time_passed;
  frame_error_rate = errors_rcvd / time_passed;
  correct_frame_rate = correct_rcvd / time_passed;
  bit_rate = total_bits / time_passed;
  correct_bit_rate = total_correct_bits / time_passed;
  
  
  printf("Current Bit Rate:             %.3e\n", bit_rate);
  printf("Current Correct Bit Rate:     %.3e\n", correct_bit_rate);
  printf("Current Frame Rate:           %.3e\n", data_rate);
  printf("Current Error Rate:           %.3e\n", frame_error_rate);
  printf("Current Correct Frame Rate:   %.3e\n", correct_frame_rate);
  printf("Frames Received:              %i\n", frames_rcvd);
  printf("Total Frames Received:        %i\n", frame_counter);
  printf("Total Frame Errors:           %i\n", frame_errors);
  
  printf("Current Tx Frequency:         %.3e\n", ECR->get_tx_freq());
  printf("Current Rx Frequency:         %.3e\n\n", ECR->get_rx_freq());
  
  printf("Current FEC0:                 %d\n", ECR->get_tx_fec0());
  printf("Current FEC1:                 %d\n\n", ECR->get_tx_fec1());
  
  printf("Current Tx Gain:              %.2e\n\n", ECR->get_tx_gain_uhd());
  
  float new_rx_freq;
  std::memcpy(&new_rx_freq, &ECR->CE_metrics.control_info[1], sizeof new_rx_freq);
  
  printf("Control Info / Rx Freq:       %c %f\n\n", ECR->CE_metrics.control_info[0], new_rx_freq);
  
  printf("Valid Payloads Received for Current Period:   %d\n\n", num_valid_payloads_rcvd);

  printf("Current Valid Percentage:       %f\n", valid_payload_percentage);
  printf("Current Error Percentage:       %f\n\n", error_percentage);
  printf("***********************************\n\n");
  */
  // Check if there was a spike in errors during the time period. If the percentage is above 20%, change frequencies.
  // If % of valid payloads >= 95% for two consecutive periods, change FEC to increase rate. If % of valid payloads < 95%,
  // change FEC accordingly.
  if (error_percentage >= 0.2) {
    
    // Keep track of error percentages for each frequency
    error_rates[i] = error_percentage;
    listening = true;
    valid_period_count = 0;

  } else if (valid_payload_percentage >= 0.95 && (valid_period_count == 0 || valid_period_count == 2)) {
    valid_period_count++;
  } else if (valid_payload_percentage >= 0.95 && valid_period_count == 1) {
    valid_period_count++;

    if (ECR->get_tx_fec0() != LIQUID_FEC_RS_M8) {    
      ECR->set_tx_fec0(LIQUID_FEC_RS_M8);
    }

  } else if (valid_payload_percentage >= 0.95 && valid_period_count == 3) {
    valid_period_count++;
    ECR->set_tx_fec1(LIQUID_FEC_NONE);
  } else if (valid_payload_percentage < 0.95 && (valid_period_count == 1 || valid_period_count == 0)) {
    valid_period_count = 0;

    if (ECR->get_tx_fec0() == LIQUID_FEC_RS_M8) {
      
      float tx_gain_step = 2.0;
      
      // Tell Node 1 to reset its FEC0.
      unsigned char control_info[6] = {};
      control_info[0] = '0';
      //std::memset(&control_info[1], 0, 5);
      std::memcpy(&control_info[1], &tx_gain_step, sizeof tx_gain_step);
      ECR->set_tx_control_info(control_info);
      ECR->get_tx_control_info(current_tx_control_info);
      
      node1_control_info_default_set = false;
      fec0_change_sent = true;
      
    }

  } else if (valid_payload_percentage < 0.95 && (valid_period_count == 2 || valid_period_count == 3)) {
    valid_period_count = 0;
    
    // Tell Node 1 to reset its FEC0.
    unsigned char control_info[6] = {};
    control_info[0] = '0';
    std::memset(&control_info[1], 0, 5);
    ECR->set_tx_control_info(control_info);
    ECR->get_tx_control_info(current_tx_control_info);

    node1_control_info_default_set = false;
    fec0_change_sent = true;
    
    
  } else if (valid_payload_percentage < 0.95 && valid_period_count == 4) {
    valid_period_count = 0;
      
    // Tell Node 1 to reset its FEC0.
    unsigned char control_info[6] = {};
    control_info[0] = '1';
    std::memset(&control_info[1], 0, 5);
    ECR->set_tx_control_info(control_info);
    ECR->get_tx_control_info(current_tx_control_info);

    node1_control_info_default_set = false;
    fec1_change_sent = true;
    
    
  }
  
}


void CE_Sharc21_Node_2::ChangeTheDangFreq(ExtensibleCognitiveRadio *ECR) {
      
  // Then set tx freq to that specified by
  // packet received from other node
  float new_tx_freq;
  std::memcpy(&new_tx_freq, &ECR->CE_metrics.control_info[1], sizeof new_tx_freq);
  
  if (ECR->get_rx_freq() != ECR->get_tx_freq()) {
    ECR->set_tx_freq(new_tx_freq);
  }

  

  // Tell Node 1 to set stop sending the frequency change.
  current_tx_control_info[0] = 's';
  std::memset(&current_tx_control_info[1], 0, 5);
  ECR->set_tx_control_info(current_tx_control_info);
  
}


void CE_Sharc21_Node_2::ResetTheDangControlInfo(ExtensibleCognitiveRadio *ECR) {
  
  if (current_tx_control_info[0] != 'r') {
    // Reset Node 1's control info
    current_tx_control_info[0] = 'r';
    std::memset(&current_tx_control_info[1], 0, 5);
    ECR->set_tx_control_info(current_tx_control_info);
    node1_control_info_default_set = true;
    valid_timeouts = 0;
    rx_freq_changed = false;
    
    valid_period_count = 0;
    
    if (!fec0_reset && !fec1_reset) {
      ECR->set_tx_fec0(LIQUID_FEC_CONV_V27P56);
      ECR->set_tx_fec1(LIQUID_FEC_RS_M8);
    }
    
  }
  
}


void CE_Sharc21_Node_2::SendIntentToChangeTheDangFreq(ExtensibleCognitiveRadio *ECR) {
	
  float new_node1_tx_freq = rx_freqs[i];
			
	// Put current rx freq as control info of next packet
	unsigned char control_info[6] = {};
	control_info[0] = 'f';
	std::memcpy(&control_info[1], &new_node1_tx_freq, sizeof new_node1_tx_freq);
	ECR->set_tx_control_info(control_info);
	ECR->get_tx_control_info(current_tx_control_info);
  
  // Change Rx frequency after listening at start up.
  if (!listened_to_channel) {
    ECR->set_rx_freq(rx_freqs[i]);
  }
  
  node1_control_info_default_set = false;
	
}


void CE_Sharc21_Node_2::RateCrap(ExtensibleCognitiveRadio *ECR) {
  
  // ***** Rate Stuff *****
        
  // Get number of bytes in the received frame.
  frame_length_bytes = ECR->CE_metrics.payload_len;
  total_bytes += frame_length_bytes;

  CountErrors(ECR);

  // Start rate timer
  if (start_rate_timer) {
    timer_tic(rate_timer);
    rate_start_time = timer_toc(rate_timer);
    start_rate_timer = false;
  }

  // Get the number of bytes and frames received for two 2 second period (total 4 second period).
  if ((timer_toc(rate_timer) - rate_start_time) >= first_counter_time_s && !frame_flag) {
    first_frame_count = frame_counter;
    first_error_frame_count = frame_errors;
    first_correct_frame_count = correct_frames;
    first_byte_total = total_bytes;
    first_correct_byte_count = total_correct_bytes;
    first_valid_payload_count = total_valid_payloads;
    rate_check_time_1 = timer_toc(rate_timer);
    frame_flag++;
  } else if ((timer_toc(rate_timer) - rate_start_time) >= second_counter_time_s && frame_flag) {
    second_frame_count = frame_counter;
    second_error_frame_count = frame_errors;
    second_correct_frame_count = correct_frames;
    second_byte_total = total_bytes;
    second_correct_byte_count = total_correct_bytes;
    second_valid_payload_count = total_valid_payloads;
    rate_check_time_2 = timer_toc(rate_timer);
    frame_flag++;
  }

  // Calculate the frame and bit rate for a 2 second period.
  if (frame_flag == 2) {   
    
    rate_check_time = rate_check_time_2 - rate_check_time_1;
    num_frames_rcvd = second_frame_count - first_frame_count;
    num_errors_rcvd = second_error_frame_count - first_error_frame_count;
    num_valid_payloads_rcvd = second_valid_payload_count - first_valid_payload_count;

    // Calculate the frame error percentage.
    error_percentage = (float)num_errors_rcvd / (float)num_frames_rcvd;
    valid_payload_percentage = (float)num_valid_payloads_rcvd / (float)num_frames_rcvd;

    num_correct_frames_rcvd = second_correct_frame_count - first_correct_frame_count;
    num_correct_bytes_rcvd = second_correct_byte_count - first_correct_byte_count;
    bytes_rcvd = second_byte_total - first_byte_total;
    CheckDataRate(ECR, num_frames_rcvd, num_errors_rcvd, num_correct_frames_rcvd, bytes_rcvd, num_correct_bytes_rcvd, rate_check_time);

    timer_tic(rate_timer);
    frame_flag = 0;
      
  }
  
}


void CE_Sharc21_Node_2::ControlInfoCrap(ExtensibleCognitiveRadio *ECR) {
  
  // Control Info Check
        
  if ((char)ECR->CE_metrics.control_info[0] != prev_rx_control_char && !default_freqs_set && ECR->CE_metrics.control_valid) {

    // Change Tx frequency when 'f' is received in the first byte of control info. Sends 's' back to Node 1
    if (ECR->CE_metrics.control_valid && 'f' == (char)ECR->CE_metrics.control_info[0]) {        
      ChangeTheDangFreq(ECR); 
      node1_control_info_default_set = false;     // Node 1's control info is now 's'.
    }

    // Reset Node 1's info back to 'r'. Node 2 is still 's'.
    else if (ECR->CE_metrics.control_valid && 's' == (char)ECR->CE_metrics.control_info[0]) {
      if (!node1_control_info_default_set) {
        ResetTheDangControlInfo(ECR);
        node1_control_info_default_set = true;      // Node 1's info is now back to 'r'
        
        if (!fec0_change_sent && !fec1_change_sent) {
          i++;
        } else if (fec0_change_sent) {
          fec0_change_sent = false;
        } else if (fec1_change_sent) {
          fec1_change_sent = false;
        }
        
      }
    }

    // If receive an 'r', reset Node 1's info back to 'r'
    else if (ECR->CE_metrics.control_valid && 'r' == (char)ECR->CE_metrics.control_info[0] && 'f' != current_tx_control_info[0]) {
      if (!node1_control_info_default_set) {
        ResetTheDangControlInfo(ECR);
        node1_control_info_default_set = true;
        
        if (fec0_reset) {
          fec0_reset = false;
        } else if (fec1_reset) {
          fec1_reset = false;
        }
        
      }
    }      
  } 

  // Verify that the default control info has been set after changing to default frequencies.
  else if (default_freqs_set && 'r' == (char)ECR->CE_metrics.control_info[0]) {
    default_freqs_set = false;
  }
  
  else if (ECR->CE_metrics.control_valid && '0' == (char)ECR->CE_metrics.control_info[0]) {
    if (!fec0_reset) {
      ECR->set_tx_fec0(LIQUID_FEC_CONV_V27P56);
      
      // Get the new Tx gain step from Node 1
      float new_tx_gain_step;
      std::memcpy(&new_tx_gain_step, &ECR->CE_metrics.control_info[1], sizeof new_tx_gain_step);
      
      float current_tx_gain = ECR->get_tx_gain_uhd();      
      
      if ((current_tx_gain + new_tx_gain_step) < 20) {
        ECR->set_tx_gain_uhd(current_tx_gain + new_tx_gain_step);
      }
      
      // Tell Node 2 to set stop sending the FEC change.
      current_tx_control_info[0] = 's';
      std::memset(&current_tx_control_info[1], 0, 5);
      ECR->set_tx_control_info(current_tx_control_info);
      
      node1_control_info_default_set = false;
      fec0_reset = true;
    }
  }
  
  else if (ECR->CE_metrics.control_valid && '1' == (char)ECR->CE_metrics.control_info[0]) {
    if (!fec1_reset) {
      ECR->set_tx_fec1(LIQUID_FEC_RS_M8);
      
      // Tell Node 2 to set stop sending the FEC change.
      current_tx_control_info[0] = 's';
      std::memset(&current_tx_control_info[1], 0, 5);
      ECR->set_tx_control_info(current_tx_control_info);
      
      node1_control_info_default_set = false;
      fec1_reset = true;
    }
  }
  
  else if (ECR->CE_metrics.control_valid && 't' == (char)ECR->CE_metrics.control_info[0]) {
    
    float new_tx_gain_step;
    std::memcpy(&new_tx_gain_step, &ECR->CE_metrics.control_info[1], sizeof new_tx_gain_step);
    
      
    float current_tx_gain = ECR->get_tx_gain_uhd();
    
    if ((current_tx_gain + new_tx_gain_step) < 20) {
      ECR->set_tx_gain_uhd(current_tx_gain + new_tx_gain_step);
    } 
      
    
    // Tell Node 2 to set stop sending the Tx gain step.
    current_tx_control_info[0] = 's';
    std::memset(&current_tx_control_info[1], 0, 5);
    ECR->set_tx_control_info(current_tx_control_info);

    node1_control_info_default_set = false;
    
  }

  prev_rx_control_char = (char)ECR->CE_metrics.control_info[0];

  
}


void CE_Sharc21_Node_2::TimeoutCrap(ExtensibleCognitiveRadio *ECR) {
  
  // Keep count of timeout events. The purpose for this is if the radios are not receiving anything at
  // the start of the scenario.
  timeout_counter++;

  if (frame_counter != 0 || timeout_counter >= 5) {
    
    valid_timeouts++;
    
    if (valid_timeouts < 3 && !go_to_default) {
      
      float tx_gain_step = 2.0;
      
      // Tell Node 2 to increase Tx gain.
      unsigned char control_info[6] = {};
      control_info[0] = 't';
      std::memcpy(&control_info[1], &tx_gain_step, sizeof tx_gain_step);
      ECR->set_tx_control_info(control_info);
      ECR->get_tx_control_info(current_tx_control_info);
      
      node1_control_info_default_set = false;
      
    } else if (valid_timeouts == 3 && !go_to_default) {
      listening = true;
    } else {
      
      //printf("TIMEOUT!!!\n\n");
      
      if (!timeout_timer_started) {
        timer_tic(timeout_timer);
        timeout_timer_started = true;
      }  
      
      if (timer_toc(timeout_timer) >= timeout_time_s && !default_rx_freq_set) {
        GoToDefault(ECR);
        default_rx_freq_set = true;
      } else if (timer_toc(timeout_timer) >= 4 && !default_tx_freq_set) {
        ResetTheDangControlInfo(ECR);
        ECR->set_tx_freq(default_tx_freq);
        default_tx_freq_set = true;
      }  
      
    }
  }
  
}


void CE_Sharc21_Node_2::FindLowestEP(ExtensibleCognitiveRadio *ECR) {
  
  float min_error_percentage = 100;
  int min_error_index = 0;
  
  // Find the lowest error percentage
  for (j = 0; j <= 3; j++) {
    
    if (error_rates[j] < min_error_percentage) {
      min_error_percentage = error_rates[j];
      min_error_index = j;
    }
    
  }
  
  // Get the frequency with the lowest EP and send the frequency to other node.
  float new_node2_tx_freq = rx_freqs[min_error_index];
  
  // Put new Tx freq for Node 2 as control info of next packet
	unsigned char control_info[6] = {};
	control_info[0] = 'f';
	std::memcpy(&control_info[1], &new_node2_tx_freq, sizeof new_node2_tx_freq);
	ECR->set_tx_control_info(control_info);
	ECR->get_tx_control_info(current_tx_control_info);
  
  if (ECR->get_rx_freq() != ECR->get_tx_freq()) {
	  ECR->set_rx_freq(rx_freqs[min_error_index]);
  }
  
  i = min_error_index;
  
}


void CE_Sharc21_Node_2::ValidCheck(ExtensibleCognitiveRadio *ECR) {
  
  // Check validity of payload and keep count of how many valid/invalid received in a row.
  if (ECR->CE_metrics.payload_valid) {
    total_valid_payloads++;
    valid_payloads++;
    invalid_payloads = 0;
  } else {
    total_invalid_payloads++;
    invalid_payloads++;
    valid_payloads = 0;
  }  
  
}


void CE_Sharc21_Node_2::ListenToChannel(ExtensibleCognitiveRadio *ECR) {

  // Listen to channel after switching. If new channel is bad, keep switching
  // until a clear channel is found. Do not send the new frequency until a clear
  // channel is found.
  
  if (!rx_freq_changed) {
    
    if (i > 3) {
      i = 0;
    }
    
    ECR->set_rx_freq(rx_freqs[i]);
    
    if (!freq_timer_started) {
      timer_tic(freq_change_timer);
      freq_timer_started = true;
    }
    
    packet_counter = 0;
    
    freq_changes++;
    
    if (freq_changes > 4) {
      go_to_default = true;
    }
    
    timer_tic(listen_timer);
    rx_freq_changed = true;
  }
  
  // Check if channel is clear after listening for 0.2 seconds.
  if (timer_toc(listen_timer) >= listen_time_s && packet_counter < packet_threshold) {
    SendIntentToChangeTheDangFreq(ECR);
    listening = false;
    
  } else if (timer_toc(listen_timer) >= listen_time_s && packet_counter >= packet_threshold) {
    
    // Save packet count
    packet_counts[i] = packet_counter;
    
    rx_freq_changed = false;
    i++;
  }

}


void CE_Sharc21_Node_2::GoToDefault(ExtensibleCognitiveRadio *ECR) {

  // Send Node 1 the default Tx frequency.
  
	// Put default Rx freq as control info of next packet
	unsigned char control_info[6] = {};
	control_info[0] = 'f';
	std::memcpy(&control_info[1], &default_rx_freq, sizeof default_rx_freq);
	ECR->set_tx_control_info(control_info);
	ECR->get_tx_control_info(current_tx_control_info);
   
  ECR->set_rx_freq(default_rx_freq);
  
  valid_period_count = 0;
  ECR->set_tx_fec0(LIQUID_FEC_CONV_V27P56);
  ECR->set_tx_fec1(LIQUID_FEC_RS_M8);
  
  node1_control_info_default_set = false;
  go_to_default = false;
  listening = false;
  
  i = 0;

}


