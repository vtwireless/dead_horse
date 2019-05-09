/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var g_tutorials = [];

function GetTutorialConfig()
  {
      g_tutorials =
        [
          {tutorialName: "Tutorial1",
           tutorialShortDesc: "This demo tutorial allows the user to modify transmission frequency of the radios and observe the effect of interference.", 
           tutorialDescArray: ["This is a simple CRTS Demo.<br> Use the game controls to modify the signal."],            
           tutorialId: 'tutorial_0',
           nodes: [ 
                    {nodeId: 'node1',
                     role: 'transceiver',
                     controllable:  true},
                    {nodeId: 'node2',
                     role: 'transceiver',
                     controllable:  false}
                  ],
           scenarioFile: "Tutorial1.cfg", 
           gameControls: [g_cornetControls.FREQ,
                          g_cornetControls.MOD,
                          g_cornetControls.BW,
			              g_cornetControls.GAIN]           
           
           },

          {tutorialName: "Tutorial2",
           tutorialShortDesc: "This demo tutorial allows the user to modify signal characteristics to see how they affect signal quality.",
           tutorialDescArray: ["This is a simple CRTS Demo.<br> Use the game controls to modify the signal."],
           tutorialId: 'tutorial_1',
           nodes: [
                    {nodeId: 'node1',
                     role: 'transceiver',
                     controllable: true},
                  ],
           scenarioFile: "Tutorial2.cfg",
           gameControls: [g_cornetControls.MOD,
                          g_cornetControls.FREQ,
                          g_cornetControls.BW,
			              g_cornetControls.GAIN]
           
          },
		  
          {tutorialName: "Tutorial3",
           tutorialShortDesc: "This demo tutorial allows the user to modify signal characteristics to see how they affect signal quality.",
           tutorialDescArray: ["This is a simple CRTS Demo.<br> Use the game controls to modify the signal."],
           tutorialId: 'tutorial_2',
           nodes: [
                    {nodeId: 'node1',
                     role: 'transceiver',
                     controllable: true},
                    {nodeId: 'node2',
                     role: 'transceiver',
                     controllable: true},
                    {nodeId: 'node3',
                     role: 'transceiver',
                     controllable: true},
                    {nodeId: 'node4',
                     role: 'transceiver',
                     controllable: true}					 
                  ],
           scenarioFile: "Tutorial3.cfg",
           gameControls: [g_cornetControls.MOD,
                          g_cornetControls.FREQ,
                          g_cornetControls.BW,
			  g_cornetControls.GAIN]
           
          }		  


        ];
   }

