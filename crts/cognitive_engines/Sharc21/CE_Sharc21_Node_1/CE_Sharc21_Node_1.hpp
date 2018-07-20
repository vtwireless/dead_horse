#ifndef _CE_Sharc21_Node_1_
#define _CE_Sharc21_Node_1_

#include "cognitive_engine.hpp"


class CE_Sharc21_Node_1 : public CognitiveEngine {

private:
  
  // Custom Functions
  void CountErrors(ExtensibleCognitiveRadio *ECR);
  void CheckDataRate(ExtensibleCognitiveRadio *ECR, int, int, int, int, int, float);
  
  void ResetTheDangControlInfo(ExtensibleCognitiveRadio *ECR);
  void SendIntentToChangeTheDangFreq(ExtensibleCognitiveRadio *ECR);
  void ChangeTheDangFreq(ExtensibleCognitiveRadio *ECR);
  
  void RateCrap(ExtensibleCognitiveRadio *ECR);
  void ControlInfoCrap(ExtensibleCognitiveRadio *ECR);
  void TimeoutCrap(ExtensibleCognitiveRadio *ECR);
  
  void FindLowestEP(ExtensibleCognitiveRadio *ECR);
  void ValidCheck(ExtensibleCognitiveRadio *ECR);
  
  void ListenToChannel(ExtensibleCognitiveRadio *ECR);
  void GoToDefault(ExtensibleCognitiveRadio *ECR);

  // internal members used by this CE
  int debugLevel;
  
  float error_percentage;
  float valid_payload_percentage;
  
  // Thresholds
  int packet_threshold = 20;
  
  // Control Info
  unsigned char current_tx_control_info[6];
  unsigned char prev_rx_control_char;
  
  // Counters
  int correct_frames;
  int frame_errors;
  int frame_counter;
  int first_frame_count;
  int first_error_frame_count;
  int first_correct_frame_count;
  int second_frame_count;
  int second_error_frame_count;
  int second_correct_frame_count;
  int num_frames_rcvd;
  int num_errors_rcvd;
  int num_correct_frames_rcvd;
  
  int correct_bytes_rcvd;
  int total_correct_bytes;
  int frame_length_bytes;
  int total_bytes;
  int first_byte_total;
  int first_correct_byte_count;
  int second_byte_total;
  int second_correct_byte_count;
  int num_correct_bytes_rcvd;
  int bytes_rcvd;
  
  int timeout_counter;
  
  int valid_payloads, invalid_payloads;
  int valid_control_count, invalid_control_count;
  
  int total_valid_payloads, total_invalid_payloads;
  
  int packet_counter;
  int valid_timeouts;
  
  int freq_changes;
  
  int first_valid_payload_count;
  int second_valid_payload_count;
  int num_valid_payloads_rcvd;
  int valid_period_count;
  
  // Timers
  timer rate_timer;
  timer wait_timer;
  timer send_freq_timer;
  timer timeout_timer;
  timer listen_timer;
  timer freq_change_timer;
  
  // Flags
  bool start_rate_timer = true;
  int frame_flag = 0;
  bool stop_tx = false;
  bool tx_stopped = false;
  bool tx_scanned = false;
  bool rx_scanned = false;
  bool freqs_scanned = false;
  bool node2_control_info_default_set = false;        // True if Node 2's control info has been set to default.
  bool node1_control_info_default_set = false;  // True if Node 1's control info has been set to default.
  bool timeout_timer_started = false;
  bool default_freqs_set = false;
  bool intent_sent = false;
  bool fec_change1 = false;
  
  bool listened_to_channel = false;
  bool rx_freq_changed = false;
  bool listening = false;
  bool listen_timer_started = false;
  bool freq_timer_started = false;
  bool go_to_default = false;
  bool default_tx_freq_set = false;
  bool default_rx_freq_set = false;
  
  bool fec0_change_sent = false;
  bool fec1_change_sent = false;
  bool fec0_reset = false;
  bool fec1_reset = false;
  
  // Time Periods
  float rate_start_time;
  float first_counter_time_s = 1.0;
  float second_counter_time_s = 2.0;
  float rate_check_time_1;
  float rate_check_time_2;
  float rate_check_time;
  float wait_time_ms = 10.0;
  float send_freq_time_s = 5.0;
  float timeout_time_s = 2.0;
  float listen_time_s = 0.2;
  
  // Frequencies
  const float rx_freqs[4] = {858e6, 859e6, 856e6, 858.5e6};   // Node 1 Rx frequencies
  
  //const float rx_freqs[4] = {852e6, 851e6, 853e6, 852.5e6}; // from Node 2
  //const float tx_freqs[4] = {790e6, 826e6, 876e6, 777e6};   // Node 1 Tx frequencies
   const float tx_freqs[4] = {852e6, 851e6, 853e6, 852.5e6};   // Node 1 Tx frequencies // changed by xavier
  
  const float default_rx_freq = 858e6;
  const float default_tx_freq = 852e6;
  
  float og_rx_freq;
  
  // Index Variables
  int i, j;
  
  // Arrays
  float error_rates[4] = {};
  int packet_counts[4] = {};

public:
  CE_Sharc21_Node_1(int argc, char **argv, ExtensibleCognitiveRadio *_ECR);
  ~CE_Sharc21_Node_1();
  virtual void execute();
};

#endif
