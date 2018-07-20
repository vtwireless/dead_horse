#include <math.h>
#include <stdio.h>
#include <liquid/liquid.h>
#include <limits.h>
#include <net/if.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include "SC_CORNET_Display.hpp"


// constructor
SC_CORNET_Display::SC_CORNET_Display(int argc, char** argv) {
  // Create TCP client to CORNET3D
  TCP_CORNET_Display = socket(AF_INET, SOCK_STREAM, 0);
  if (TCP_CORNET_Display < 0) {
    printf("ERROR: Receiver Failed to Create Client Socket\n");
    exit(EXIT_FAILURE);
  }
  // Parameters for connecting to server
  struct sockaddr_in addr;
  memset(&addr, 0, sizeof(addr));
  addr.sin_family = AF_INET;
  // "192.168.1.103" is the IP address of kermit behind the firewall
  addr.sin_addr.s_addr = inet_addr("192.168.1.103");
  addr.sin_port = htons(4445/*port number*/);

  // Establish network connection with CORNET-3D backend
  int connect_status = 1;
  std::cout << "Waiting for connection from CORNET3D" << std::endl;
  while(connect_status != 0)
  {
      connect_status = connect(TCP_CORNET_Display, (struct sockaddr *)&addr,
              sizeof(addr));
      if(connect_status != 0)
      {
          sleep(1);
      }

  }
  if (connect_status) {
      printf("Failed to Connect to server.\n");
      exit(EXIT_FAILURE);
  }


  old_mod = 40;
  old_crc = 6;
  old_fec0 = 12;
  old_fec1 = 1;
  old_freq = 770e6;
  old_bandwidth = 1e6;
  old_gain = 20.0;
}

// destructor
SC_CORNET_Display::~SC_CORNET_Display() 
{
    delete old_frequencies;
    delete old_bandwidths;
}
// setup feedback enables for each node
void SC_CORNET_Display::initialize_node_fb() {
    old_frequencies = new double[sp.num_nodes];
    old_bandwidths = new double[sp.num_nodes];
    // Tell cornet3d backend how many nodes to expect
    send(TCP_CORNET_Display, &sp.num_nodes, sizeof(sp.num_nodes), 0);
    //Create and send node_stucts with node information to cornet3d backend
    for(int i = 0; i < sp.num_nodes; i++)
    {
        node_struct ns;
        ns.node = i;
        ns.frequency = np[i].tx_freq;
        old_frequencies[i] = ns.frequency;
        ns.bandwidth = np[i].tx_rate;
        old_bandwidths[i] = ns.bandwidth;
        strcpy(ns.team_name, np[i].team_name);
        if(np[i].node_type == COGNITIVE_RADIO)
            ns.role = 0;
        else
            ns.role = 1;
        printf("sending node %u\n", i);
        printf("size: %lu\n", sizeof(ns));
        send(TCP_CORNET_Display, (char*)&ns, sizeof(ns), 0);
        printf("team: %s\n", np[i].team_name);
    }
    // enable all feedback types
    int fb_enables = INT_MAX;
    for(int i=1; i<=sp.num_nodes; i++)
        set_node_parameter(i, CRTS_FB_EN, (void*) &fb_enables);

    //Set up statistics logging
    double rx_stats_period = 3.0; //3 second window to average statistics over
    double rx_stats_report_rate = 1.0; //Report statistics once per second
    for(int i=1; i<=sp.num_nodes; i++)
    {
        set_node_parameter(i, CRTS_RX_STATS, (void*) &rx_stats_period);
        set_node_parameter(i, CRTS_RX_STATS_FB, (void*) &rx_stats_report_rate);
    }
}

// execute function
void SC_CORNET_Display::execute() {
    //Only send feedback to CORNET3D when feedback is received from a node,
    //not when execute is called due to a timeout
    if(sc_event == FEEDBACK)
    {
        struct
        {
            int type;
            int node;
            float frequency; // or throughput
            float bandwidth; // or PER
            float totalThroughput;
            float totalPER;
            float totalBits;
        } fs;

        fs.totalThroughput = 0.0F;
        fs.totalPER = 0.0F;
        fs.totalBits = 0.0F;

        switch (fb.fb_type) 
        {
          //When frequency or bandwidth changes, send a message to the cornet backend 
          //so it can update the scoreboard display
          case CRTS_TX_FREQ:
              // Set the type to 1 for scoreboard updates
              fs.type = 1; // as defined in CORNET_3D_Webserver.py
              fs.node = fb.node;
              fs.frequency = *(double*)fb.arg;
              fs.bandwidth = old_bandwidths[fb.node];
              old_frequencies[fb.node] = fs.frequency;
              send(TCP_CORNET_Display, (char*)&fs, sizeof(fs), 0);
              printf("Node %i has updated it's transmit frequency to %.1e\n", fb.node, *(double*)fb.arg);
              break;
          case CRTS_TX_RATE:
              // Set the type to 1 for scoreboard updates
              fs.type = 1;  // as defined in CORNET_3D_Webserver.py
              fs.node = fb.node;
              fs.bandwidth = *(double*)fb.arg;
              fs.frequency = old_frequencies[fb.node];
              old_bandwidths[fb.node] = fs.bandwidth;
              send(TCP_CORNET_Display, (char*)&fs, sizeof(fs), 0);
              printf("Node %i has updated it's transmit rate to %.3e\n", fb.node, *(double*)fb.arg);
              break;
          // This scenario controller is configured to report link statistics 
          // once per seconds. When reports are received, send the throughput
          // to the cornet backend so it can update the display
          case CRTS_RX_STATS:
              {
                static float counter = 0;
                counter += 1;
                struct ExtensibleCognitiveRadio::rx_statistics rx_stats = 
                    *(struct ExtensibleCognitiveRadio::rx_statistics*) fb.arg;
                // Set the type to 2 for statistics updates
                fs.type = 2;  // as defined in CORNET_3D_Webserver.py
                fs.node = fb.node;
                // Use the frequency field for now to send the throughput value
                // TODO: Create a new struct type for sending throughput
                fs.frequency = rx_stats.throughput;
                fs.bandwidth = rx_stats.per;
                // TODO: next two values are bogus for testing
                fs.totalThroughput = rx_stats.totalThroughput;
                fs.totalPER = rx_stats.totalPER;
                fs.totalBits = rx_stats.totalBits;

                send(TCP_CORNET_Display, (char*)&fs, sizeof(fs), 0);
                printf("node: %u, throughput: %f per: %f\n", fb.node, rx_stats.throughput, rx_stats.per);
                break;
             }
          default:
                {
                    struct { int type; int node;  float crts_type; float dummy; } data;

                    data.type = 3; // as defined in CORNET_3D_Webserver.py
                    data.node = fb.node;
                    data.crts_type = (float) fb.fb_type;
                    data.dummy = 0;
                    send(TCP_CORNET_Display, (char*)&data, sizeof(data), 0);
                break;
                }
                
        }
    }

// From here down does the same thing as in SC_CORNET_Tutorial

    // forward commands from CORNET 3D webserver game controls to nodes
    fd_set fds;
    struct timeval timeout;
    timeout.tv_sec = 0;
    timeout.tv_usec = 100;
    FD_ZERO(&fds);
    FD_SET(TCP_CORNET_Display, &fds);
    crts_signal_params params;
    if(select(TCP_CORNET_Display+1, &fds, NULL, NULL, &timeout)) 
    {
        int rlen = recv(TCP_CORNET_Display, &params, sizeof(params), 0);
        if(rlen > 0)
        {
            
            printf("params.node: %u\n", params.node);
            printf("params.mod: %u\n", params.mod);
            printf("params.crc: %u\n", params.crc);
            printf("params.fec0: %u\n", params.fec0);
            printf("params.fec1: %u\n", params.fec1);
            printf("params.freq: %f\n", params.freq);
            printf("params.bandwidth: %f\n", params.bandwidth);
            printf("params.gain: %f\n", params.gain);
            
            //CORNET3D backend sends a 9 when client disconnects
            //Call killall crts_controller with in turn shuts down all nodes
            if(params.type == 9)
            {
                printf("calling killall\n");
                system("killall crts_controller");
                exit(1);
            }

            if(params.mod >= 0 && params.mod != old_mod)
            {
                set_node_parameter(params.node, CRTS_TX_MOD, &params.mod);  
                old_mod = params.mod;
            }

            if(params.crc >= 0 && params.crc != old_crc)
            {
                set_node_parameter(params.node, CRTS_TX_CRC, &params.crc);
                old_crc = params.crc;
            }

            if(params.fec0 >= 0 && params.fec0 != old_fec0)
            {
                set_node_parameter(params.node, CRTS_TX_FEC0, &params.fec0);
                old_fec0 = params.fec0;
            }   

            if(params.fec1 >= 0 && params.fec1 != old_fec1)
            {
                set_node_parameter(params.node, CRTS_TX_FEC1, &params.fec1);
                old_fec1 = params.fec1;
            }

            if(params.freq >= 0 && params.freq != old_freq)
            {
                set_node_parameter(params.node, CRTS_TX_FREQ, &params.freq);
                set_node_parameter(params.node == 1 ? 2 : 1, CRTS_RX_FREQ, &params.freq);
                old_freq = params.freq;
            }

            if(params.bandwidth >= 0 && params.bandwidth != old_bandwidth)
            {
                set_node_parameter(params.node, CRTS_TX_RATE, &params.bandwidth);
                set_node_parameter(params.node == 1 ? 2 : 1, CRTS_RX_RATE, &params.bandwidth);
                old_bandwidth = params.bandwidth;
            }

            if(params.gain >= 0 && params.gain != old_gain)
            {
                set_node_parameter(params.node, CRTS_TX_GAIN, &params.gain);
                old_gain = params.gain;
            }
        }
    }

}




