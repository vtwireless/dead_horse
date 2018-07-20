/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
			var ipNetworkAddress = '192.168.1.';
			
			var transparams={f: '865000000', n: 256, b: '12000000', r:12, s: 1};
                        
                        function DisplayGameControls()
                          {
                          document.getElementById('speedButtonContainer2').style.display = 'inline-block';
                          document.getElementById('gameControllerNodeDiv').innerHTML = '';
                          document.getElementById('gameControllerNodeDiv').appendChild(GetSelectObjForControllableNodes());
                          $("#GameControllerCurrentNode").click(ChangeGameControllerNode); 
                          }
                        function HideGameControls()
                          {
                          document.getElementById('speedButtonContainer2').style.display = 'none';   
                          }
                          
                        
                        function DisplayViewerControls()
                          {
                          document.getElementById('speedButtonContainer').style.display = 'inline-block';   
                          }
                        function HideViewerControls()
                          {
                          document.getElementById('speedButtonContainer').style.display = 'none';   
                          }
                        
			var corStatus = (function () {
				//var socket;
				//var result;
				var m_nodes;
				var m_floors;
				var m_floorAlreadyClicked=false;
				//var m_fullscreen=false;

                // TODO: fix stupid hard coded IP address and port
                var url = 'http://128.173.221.40:8890/crts_status_xxx';
                console.log('Requesting: ' + url);
				function ajaxReq() {
					var req = $.ajax({
                        url: url,
						dataType: "jsonp",
						timeout: 35000
					});
                    console.log('Requested: ' + url);
					req.success(function (data) {
                        g_availableNodesIndexArray = []; 
						for (var i=0; i<m_nodes.length; i++) {
							if (data[i]==2) {
								document.getElementById(m_nodes[i]).setAttribute('diffuseColor', '0 1 0'); 
                                                                g_availableNodesIndexArray.push(i); 
							} 
							else if (data[i] == 1) 
							{
								document.getElementById(m_nodes[i]).setAttribute('diffuseColor', '0.4 0.4 0'); 
								
							}
							/*else if (data[i]==1) {
								//socket.emit('check_for_clients', i+11);
								//alert(i + 11);
								if(i == 38)
								{
									document.getElementById(m_nodes[i]).setAttribute('diffuseColor', '0.8 0.8 0'); 
								}
								else
								{
									document.getElementById(m_nodes[i]).setAttribute('diffuseColor', '0.4 0.4 0'); 
								}
								 
							}*/
						}
                        RefreshSelectNodeTable(); 
					});
					req.error(function (data, string1, string2) {
					
					});
				}
				var thisModule = {};
				thisModule.initialize = function (nodes, floors) {
					m_nodes=nodes;
					m_floors=floors;

					/* socket = io.connect('128.173.221.40:8888');
					socket.on('viewer_connected', function(data) {
					result = data;
					});
                    */
					ajaxReq();
					
					for (var i=0; i<m_nodes.length; i++) {	
						var parentNode = document.getElementById(m_nodes[i]).parentNode.parentNode;
						var nodeName;
						if(i<12) {
							nodeName="Node1-" + (i+1);
						} else if (i<24) {
							nodeName="Node2-" + (i-11);
						} else if (i<36) {
							nodeName="Node3-" + (i-23);
						} else {
							nodeName="Node4-" + (i-35);
						}
						var lastDigitsIP=Number(i)+11;
						parentNode.setAttribute('onmouseover', "oTooltip.show('<b>" + nodeName + "</b>" + "  |  Port: " + (Number(i)+7001) + "<br>Internal IP: " + ipNetworkAddress + lastDigitsIP + "', '" + m_nodes[i] + "');");
						parentNode.setAttribute('onmouseout', "oTooltip.hide('" + m_nodes[i] + "');");
						parentNode.setAttribute('onclick', "corStatus.showSpectrum(" + lastDigitsIP + ");");
					}
					
					for (var i=0; i<m_floors.length; i++) {	
						var parentNode = document.getElementById(m_floors[i]).parentNode.parentNode;
						parentNode.setAttribute('onmouseover', "corStatus.floorFocus(" + i + ");");
						parentNode.setAttribute('onmouseout', "corStatus.floorUnFocus(" + i + ");");
						parentNode.setAttribute('onclick', "corStatus.floorClick(" + i + ");");
					}
					document.getElementById('specGroup').setAttribute('onclick', "corStatus.showFloors();");
					document.getElementById('header').innerHTML='Floors visualization';
				}
				//onmouseover
				thisModule.floorFocus = function(floorNum) {
					document.getElementById(m_floors[floorNum]).setAttribute('emissiveColor', '0.1 0.1 0.1');
					document.getElementById(m_floors[floorNum]).setAttribute('transparency', '0');
					document.getElementById('x3dEl').style.cursor = 'pointer';
				}
				//onmouseout
				thisModule.floorUnFocus = function(floorNum) {
					document.getElementById(m_floors[floorNum]).setAttribute('emissiveColor', '0 0 0');
					document.getElementById(m_floors[floorNum]).setAttribute('transparency', '0.2');
					document.getElementById('x3dEl').style.cursor = 'default';		
				}
				thisModule.goFullscreen = function(){
					var element = document.body;
					//m_fullscreen=!m_fullscreen;
					//if (m_fullscreen) {
						if (element.requestFullScreen) {
							element.requestFullScreen();
						} else if (element.mozRequestFullScreen) {
							element.mozRequestFullScreen();
						} else if (element.webkitRequestFullScreen) {
							element.webkitRequestFullScreen();
						}
					/*} else {
						if (element.exitFullscreen) {
							element.exitFullscreen();
						} else if (element.mozCancelFullscreen) {
							element.mozCancelFullscreen();
						} else if (element.webkitExitFullscreen) {
							element.webkitExitFullscreen();
						}
					}*/
				}
				//click
				thisModule.floorClick = function(floorNum) {
					if(m_floorAlreadyClicked) {
						for (var i=0; i<m_floors.length; i++) {	
							if (i!=floorNum) {
								document.getElementById(m_floors[i]).parentNode.parentNode.parentNode.parentNode.setAttribute('render', 'true');
							}
						}
						m_floorAlreadyClicked=false;
					} else {
						for (var i=0; i<m_floors.length; i++) {	
							if (i!=floorNum) {
								document.getElementById(m_floors[i]).parentNode.parentNode.parentNode.parentNode.setAttribute('render', 'false');
							}
						}
						m_floorAlreadyClicked=true;
					}
				}
				thisModule.showSpectrum = function(lastDigitsIP) {
                                        ShowTheLaunchTutorialButton(); 
                                        DisplayViewerControls(); 
                                        var nodeIndex = (lastDigitsIP - 11); 
					var node = m_nodes[nodeIndex];
                                        g_tutorialLaunchNodeIndex = nodeIndex; 
                                        
					var nodeDiffuseColor = document.getElementById(node).getAttribute('diffuseColor');
					var time_slices = parseInt( document.getElementById("time-slices").innerHTML );
					
					if(nodeDiffuseColor == '0 1 0' || nodeDiffuseColor == '0.8 0.8 0')
					{
						document.getElementById('floorsGroup').setAttribute('render', 'false');
						document.getElementById('specGroup').setAttribute('render', 'true');
						document.getElementById('view_1').position = '0 13 25';
						
						var yScaleComp = document.getElementById("y-scale").innerHTML;
						document.getElementById("elevationGridVis").scale='1 '+yScaleComp+' 1';
						
						spectrum.initialize(lastDigitsIP, time_slices, 'specGrid', 'specGridColor', 'heatmapArea', thisModule.showFloors, thisModule.showStatus, transparams, 'metrics_table');
						
						$('#waterfall_dialog').dialog('option', 'title', 'Real-time spectrum sensing at node ' + ipNetworkAddress + lastDigitsIP);
						$('#graph_dialog').dialog('option', 'title', 'Real-time spectrum sensing at node ' + ipNetworkAddress + lastDigitsIP);
						
						document.getElementById('tick1-x').string=spectrum.lowBound_;
						document.getElementById('tick2-x').string=spectrum.lowBound_+spectrum.bandwidth_/2;
						document.getElementById('tick3-x').string=spectrum.lowBound_+spectrum.bandwidth_;
						
						document.getElementById('tick1-y').string=0;
						document.getElementById('tick2-y').string=spectrum.m_power/2;
						document.getElementById('tick3-y').string=spectrum.m_power;
						
						document.getElementById('tick1-z').string=0;
						document.getElementById('tick2-z').string=-time_slices/2;
						document.getElementById('tick3-z').string=-time_slices;
						
						document.getElementById('header').innerHTML='Real-time spectrum sensing at node ' + ipNetworkAddress + lastDigitsIP;
						
						if(document.getElementById('slow_conn_checkbox').checked)
						{
							document.getElementById('specGroup').setAttribute('render', 'false');
							document.getElementById('header').innerHTML='';
						}
						
                                                
                                                // -------------------------------------------------------------
                                                // Turn on UI interface controls
                                                // ------------------------------------------------------------
                                                //document.getElementById('speedButtonContainer').style.display = "inline-block";
                                                document.getElementById('tutorialButtonContainer').style.display = "inline-block"; 
					}
					else if(nodeDiffuseColor == '1 0 0')
					{
						alert("This node is not available. Please click on any of the green nodes");
					}
					else if(nodeDiffuseColor == '0.4 0.4 0')
					{
						alert("No USRP devices found on this node (or) this node's spectrum is only available to another node. Please try later or click on any of the green nodes");
					}
				}
				thisModule.showFloors = function(lastDigitsIP) {
                                        
					var prevHeader = document.getElementById('header').innerHTML;
					var ipAddress = prevHeader.split('.');
					var lastDigits = ipAddress[3];
					document.getElementById('floorsGroup').setAttribute('render', 'true');
					document.getElementById('view_1').position = '0 10 15';
					document.getElementById('specGroup').setAttribute('render', 'false');
					
					document.getElementById('header').innerHTML='Floors visualization';
				
					document.getElementById('metrics_table').innerHTML = "";
					document.getElementById('launch_crts_button').innerHTML = "Launch CRTS Demo";	
					spectrum.disconnect(lastDigits);
					$('#waterfall_dialog').dialog('option', 'title', 'Please select a node for real-time spectrum sensing');
					
                                        // -------------------------------------------------------------
                                        // Turn on UI interface controls
                                        // ------------------------------------------------------------
                                        CloseAllTutorialDialogs(); 
                                        HideTheLaunchTutorialButton(); 
                                        HideViewerControls(); 
                                        HideGameControls(); 
                                       
                                        $('#game_button > :first-child').attr( "src",  "myicons/GameControllerOff.png");
                                        $('#settings_button > :first-child').attr( "src",  "myicons/settings.png");
                                        document.getElementById("sliderHider").style.display = 'none'; 
                                        document.getElementById('settingsDiv').style.display = 'none'; 
                                        document.getElementById('tutorialButtonContainer').style.display = "none"; 
                                        gameon=false;
                                        settings=true;
                                        
				}
				thisModule.showStatus = function(htmlStr) {
					$('#statusBox').html(htmlStr);
					$('#statusBox').fadeIn(400).delay(3000).fadeOut(400);
				}
				thisModule.launchCRTS = function(lastDigitsIP) {
					
				}
				return thisModule;
			}());
			window.onload=function(){
                oTooltip.init();
				function jQueryStuff() {
					//var width = $(window).width()*0.25;
					$( "#waterfall_dialog" ).dialog({
						autoOpen: false,
						show: {
							effect: "blind",
							duration: 500
						},
						hide: {
							effect: "explode",
							duration: 1000
						},
						position: { my: "right top", at: "right top", of: window },
						width: $(window).width()*0.7-14,
						height: $(window).height()/2,
						resizeStop: function(event, ui) {
					        //alert("Width: " + $(this).innerWidth() + ", height: " + $(this).outerHeight());   
					        //spectrum.redrawHeatmap($(this).innerWidth(), $(this).innerHeight());     
					    }
					    //resize will go faster
					});
					
					$( "#waterfall_button" ).click(function() {
						$( "#waterfall_dialog" ).dialog( "open" );
						//spectrum.redrawHeatmap();
					});
					$( "#launch_crts_button").click(function() {
						// Get the parameters for CRTS
						var mod = document.getElementById("mod_ctrl").value;
						if(mod.length == 1) {
							mod = "0" + mod;
						}
						
						var crc = document.getElementById("crc_ctrl").value;
						
						var ifec = document.getElementById("ifec_ctrl").value;
						if(ifec.length == 1) {
							ifec = "0" + ifec;
						}
						
						var ofec = document.getElementById("ofec_ctrl").value;
						if(ofec.length == 1) {
							ofec = "0" + ofec;
						}
						
						var freq = Number(document.getElementById("freq_input").value)*1000000;
						
						var bandwidth = Number(document.getElementById("bandwidth_input").value)*1000000;
						
						var gain = $( "#slider-power" ).slider( "value" );
						gain = gain.toString();
						if(gain.length == 1)
						{
							gain = "0" + gain;
						}
						// Append the values of "Mod", "CRC", "IFEC", "OFEC", FREQ, and BANDWIDTH
						var parameters = {};
						parameters.mod = mod;
						parameters.crc = crc;
						parameters.ifec = ifec;
						parameters.ofec = ofec;;
						parameters.freq = freq;
						parameters.bandwidth = bandwidth;
						parameters.gain = gain;
						
						// Get the last two characters in the header
						var lastDigitsIP = document.getElementById('header').innerHTML.slice(-2);
						
						// Call spectrum.launchCRTS
						spectrum.launchCRTS(lastDigitsIP, parameters);
					});
					
					$( "#graph_dialog" ).dialog({
						autoOpen: false,
						show: {
							effect: "blind",
							duration: 500
						},
						hide: {
							effect: "explode",
							duration: 1000
						},
						position: { my: "right bottom", at: "right bottom-49", of: window },
						width: $(window).width()*0.7-14,
						height: $(window).height()/2-49,
						resizeStop: function(event, ui) {
					        //alert("Width: " + $(this).innerWidth() + ", height: " + $(this).outerHeight());   
					        //spectrum.redrawHeatmap($(this).innerWidth(), $(this).innerHeight());     
					    }
					    //resize will go faster
					});
					$('#graph_dialog').dialog({dialogClass:'semiTransparentWind'});
					
					
					$( "#graph_button" ).click(function() {
						$( "#graph_dialog" ).dialog( "open" );
						spectrum.fit();
						$('#transmit_button > :first-child').attr( "src",  "transmitPartialOn.gif");
						//spectrum.redrawHeatmap();
					});
					$( "#users_button" ).click(function() {
						spectrum.displayUsers();
					});
					$( "#rand_button" ).click(function() {
						spectrum.rand=!spectrum.rand;
						if (spectrum.rand) {
							$('#rand_button > :first-child').attr( "src",  "RandOn.gif");
						} else {
							$('#rand_button > :first-child').attr( "src",  "RandOff.gif");
						}
					});
					var gameon=false;
					$("#GC_CloseBtn").click(function() {
                                          $( "#sliderHider" ).toggle();
				          gameon=!gameon;  
                                          $('#game_button > :first-child').attr( "src",  "myicons/GameControllerOff.png");
                                        })
					$( "#game_button" ).click(function() {
						// $( "#transmit_button" ).toggle();
						$( "#sliderHider" ).toggle();
						// $( "#scoreArea" ).toggle();
						gameon=!gameon;
						if (gameon) {
							$('#game_button > :first-child').attr( "src",  "myicons/GameControllerOn.png");
                                                        var selectedNodeIndex = 0; // default to the first Node
                                                        var nodeId = GetNodeConfigIdValueFromNodeIndex(selectedNodeIndex);
                                                        g_gameController.currentNodeIndex = 0; 
                                                        g_gameController.currentNodeId = nodeId; 
                                                        var theNodeSelector = document.getElementById('GameControllerCurrentNode');
                                                        theNodeSelector.selectedIndex = 0; 
                                                        SetUIControlValuesFromNode(nodeId);
						} else {
							var time_slices = document.getElementById("time-slices").innerHTML;
							$('#game_button > :first-child').attr( "src",  "myicons/GameControllerOff.png");
							document.getElementById('tick1-x').string=spectrum.lowBound_;
							document.getElementById('tick2-x').string=spectrum.lowBound_+spectrum.bandwidth_/2;
							document.getElementById('tick3-x').string=spectrum.lowBound_+spectrum.bandwidth_;
							
							document.getElementById('tick1-y').string=0;
							document.getElementById('tick2-y').string=spectrum.m_power/2;
							document.getElementById('tick3-y').string=spectrum.m_power;
							
							document.getElementById('tick1-z').string=0;
							document.getElementById('tick2-z').string=-time_slices/2;
							document.getElementById('tick3-z').string=-time_slices;	
						}
					});
					var settings=true;
                                        $("#SVC_CloseBtn").click(function() {
                                          $( "#settingsDiv" ).toggle();
				          settings=!settings;  
                                          $('#settings_button > :first-child').attr( "src",  "myicons/settings.png");
                                        })
					$( "#settings_button" ).click(function() {
						$( "#settingsDiv" ).toggle();
						settings=!settings;
						if (settings) {
							$('#settings_button > :first-child').attr( "src",  "myicons/settings.png");
							//send to server
							transparams.f=Number(document.getElementById('f').value)*1000000;
							transparams.n=document.getElementById('n').value;
							transparams.b=Number(document.getElementById('b').value)*1000000;
							transparams.s=document.getElementById('s').value;
							transparams.r=document.getElementById('r').value;
							spectrum.updateParams(transparams);
							
							document.getElementById();
							
							var time_slices = parseInt(document.getElementById("time-slices").innerHTML);
							
							spectrum.updateTimeSlices(time_slices);
							document.getElementById('tick1-x').string=spectrum.lowBound_;
							document.getElementById('tick2-x').string=spectrum.lowBound_+spectrum.bandwidth_/2;
							document.getElementById('tick3-x').string=spectrum.lowBound_+spectrum.bandwidth_;
							
							document.getElementById('tick1-y').string=0;
							document.getElementById('tick2-y').string=spectrum.m_power/2;
							document.getElementById('tick3-y').string=spectrum.m_power;
							
							document.getElementById('tick1-z').string=0;
							document.getElementById('tick2-z').string=-time_slices/2;
							document.getElementById('tick3-z').string=-time_slices;
							
							var yScaleComp = document.getElementById("y-scale").innerHTML;
							document.getElementById("elevationGridVis").scale='1 '+yScaleComp+' 1';
						} else {
							$('#settings_button > :first-child').attr( "src",  "myicons/checkmark.png");
						}
					});
					
					$(document).keypress(function(e) {
						if(e.which == 13) {
							if(settings == false)
							{
								$( "#settings_button" ).click();
							}
							if($('#game_button > :first-child').attr( "src") == "myicons/GameOn.png")
							{
								$('#game_button > :first-child').attr( "src",  "myicons/GameControllerOff.png");
								$( "#game_button" ).click();
							}
						}
					});
					
					
					$( "#transmit_button" ).click(function() {
						spectrum.m_transmit=!spectrum.m_transmit;
						if (spectrum.m_transmit) {
							$('#transmit_button > :first-child').attr( "src",  "transmitOn.gif");
							var e = document.getElementById("mod_ctrl");
							var sel1 = e.options[e.selectedIndex].text;
							e = document.getElementById("crc_ctrl");
							var sel2 = e.options[e.selectedIndex].text;
							e = document.getElementById("ifec_ctrl");
							var sel3 = e.options[e.selectedIndex].text;
							e = document.getElementById("ofec_ctrl");
							var sel4 = e.options[e.selectedIndex].text;
							//alert(sel1 + ' ' + sel2 + ' ' + sel3 + ' ' + sel4 + ' ' + $( "#slider-delay" ).slider( "value" ) + ' ' + $( "#slider-packet" ).slider( "value" ) + ' ' + $( "#slider-power" ).slider( "value" ));
							//alert(spectrum.selectedCenter + ' ' + spectrum.selectedBandWidth);
							spectrum.setParamsCRTS({cfreq: Number(spectrum.selectedCenter) * 1000000,
								bfreq: Number(spectrum.selectedBandWidth) * 1000000,
								TXgain: $( "#slider-power" ).slider( "value" ),
								packet: $( "#slider-packet" ).slider( "value" ),
								delay: Number($( "#slider-delay" ).slider( "value" )) * 1000,
								mod: sel1,
								crc: sel2,
								ifec: sel3,
								ofec: sel4,
								nodeID: 25
							});
							document.getElementById('metrics_button').disabled=false;
						} else {
							$('#transmit_button > :first-child').attr( "src",  "transmitPartialOn.gif");
							spectrum.stopCTRS();
						}
					});
					$( "#metrics_dialog" ).dialog({
						autoOpen: false,
						show: {
							effect: "blind",
							duration: 500
						},
						hide: {
							effect: "explode",
							duration: 1000
						},
						position: { my: "center bottom", at: "center bottom-61", of: window },
						width: $(window).width()*0.3-14,
						height: $(window).height()/2-100,
						resizeStop: function(event, ui) {
					        //alert("Width: " + $(this).innerWidth() + ", height: " + $(this).outerHeight());   
					        //spectrum.redrawHeatmap($(this).innerWidth(), $(this).innerHeight());     
					    }
					    //resize will go faster
					});
//					$('#metrics_dialog').dialog({dialogClass:'semiTransparentWind'});

                                        // PERFORMANCE METRICS
					$( "#metrics_button" ).click(function() {
                                                var metricsDiv = document.getElementById('performanceMetricDiv');
                                                var currentDisplayMode = metricsDiv.style.display; 
                                                if (currentDisplayMode === 'block')
                                                  {
                                                  metricsDiv.style.display = 'none'; 
                                                  }
                                                else
                                                  {
  						  spectrum.getMetrics();
                                                  metricsDiv.style.display = 'block'; 
                                                  } 
					});
                                        $('#PM_CloseBtn').click(function() {
                                            var metricsDiv = document.getElementById('performanceMetricDiv');
                                            metricsDiv.style.display = 'none'; 
                                        });
					//slider
					$( "#slider-power" ).slider({
						orientation: "horizontal",
						range: "min",
						min: 0,
						max: 31,
						value: 20,
						slide: function( event, ui ) {
							$( "#amount-power" ).html( ui.value );
							spectrum.m_power=ui.value;
							var size=28.571+(ui.value)*0.5714;
							$('#icon-power').width(size).height(1.5*size);
						}
					});
					$( "#amount-power" ).val( $( "#slider-power" ).slider( "value" ) );
					$( "#slider-packet" ).slider({
						orientation: "horizontal",
						range: "min",
						min: 1,
						step: 1,
						max: 100,
						value: 25,
						slide: function( event, ui ) {
							$( "#amount-packet" ).html( ui.value );
							//spectrum.m_power=ui.value;
							var size=20+(ui.value)*0.2;
							$('#icon-packet').width(1.2*size).height(1.2*size);
						}
					});
					$( "#amount-packet" ).val( $( "#slider-packet" ).slider( "value" ) );
					$( "#slider-delay" ).slider({
						orientation: "horizontal",
						range: "min",
						min: 100,
						max: 2000,
						value: 1000,
						slide: function( event, ui ) {
							$( "#amount-delay" ).html( ui.value );
							spectrum.m_power=ui.value;
							var size=19+(ui.value)*0.01;
							$('#icon-delay').width(size).height(1.5*size);
						}
					});
					$( "#amount-delay" ).val( $( "#slider-delay" ).slider( "value" ) );
					
					
					$( "#slider-y-scale" ).slider({
						orientation: "horizontal",
						range: "min",
						min: 3,
						max: 15,
						value: 10,
						slide: function( event, ui ) {
							$( "#y-scale" ).html( ui.value/10 );
						}
					});
					
					$( "#y-scale" ).val( $( "#slider-y-scale" ).slider( "value" ) );
					
					
					$( "#slider-time-slices" ).slider({
						orientation: "horizontal",
						range: "min",
						min: 2,
						max: 25,
						value: 10,
						slide: function( event, ui ) {
							$( "#time-slices" ).html( ui.value );
						}
					});
					
					$( "#time-slices" ).val( $( "#slider-time-slices" ).slider( "value" ) );
//******************************************************************************************************
//spectrum.redrawHeatmap();
//******************************************************************************************************
					var width = $(window).width()*0.3;
				    var height = $(window).height()-49;
					$( "#help_dialog" ).dialog({
						autoOpen: false,
						show: {
							effect: "blind",
							duration: 500
						},
						hide: {
							effect: "explode",
							duration: 1000
						},
						position: { my: "left top", at: "left top", of: window },
						width: width,
						height: height
					});
					$('#help_dialog').dialog({dialogClass:'semiTransparentWind'});
					
					$( "#waterfall_dialog" ).dialog({
						autoOpen: false,
						show: {
							effect: "blind",
							duration: 500
						},
						hide: {
							effect: "explode",
							duration: 1000
						},
						position: { my: "right top", at: "right top", of: window },
						width: $(window).width()*0.7-14,
						height: $(window).height()/2,
						resizeStop: function(event, ui) {
					        //alert("Width: " + $(this).innerWidth() + ", height: " + $(this).outerHeight());   
					        //spectrum.redrawHeatmap($(this).innerWidth(), $(this).innerHeight());     
					    }
					    //resize will go faster
					});
					$( "#waterfall_button" ).click(function() {
						$( "#waterfall_dialog" ).dialog( "open" );
						//spectrum.redrawHeatmap();
					});
					$( "#help_button" ).click(function() {
						$( "#help_dialog" ).dialog( "open" );
					});
					
					
					$('#slow_conn_checkbox').change(function() {
						var floorsGroupRender = document.getElementById('floorsGroup').getAttribute('render');
						if(floorsGroupRender == "false")
						{
							if(this.checked)
							{
								document.getElementById('specGroup').setAttribute('render', 'false');
								document.getElementById('header').innerHTML='';
							}
							else
							{
								// Get the last digits in IP
								var lastDigitsIP = ($('#waterfall_dialog').dialog("option","title")).split(".");
								corStatus.showSpectrum(lastDigitsIP[3]);
								document.getElementById('header').innerHTML='Real-time spectrum sensing at node ' + ipNetworkAddress + lastDigitsIP;
							}
						}	
					});
					var coverLayer = $('<div>').appendTo("body").css({ "width" : "100%", "height" : "100%", "z-index" : "2", "background-color" : "rgba(0, 0, 0, 0.5)", "position" : "absolute" }).hide();
					$(".ui-dialog").on( "resizestart dragstart" , function( event, ui ) { 
					    coverLayer.show();
					    // here you can add some code that will pause webgl while user works with ui, so resizing and moving will be faster and smoother
					});
					$(".ui-dialog").on( "resizestop dragstop" , function( event, ui ) { 
					    coverLayer.hide();
					    // here you unpause webgl
					});
					function pulseIn(control) {
					    control.animate({
					        backgroundColor: "rgba(255,0,0,0.9)"
					    }, 1000, 'swing', function () {
					        pulseOut(control);
					    });
					}
					function pulseOut(control) {
					    control.animate({
					        backgroundColor: "rgba(50,50,50,0.5)"
					    }, 1000, 'swing', function () {
					            pulseIn(control);
					    });
					}
					var help_button='#help_button';
					$(help_button).each(function(){
					    pulseIn($(this));
					});
					setTimeout(function() {
					    	$(help_button).stop();
					    	$(help_button).css('background-color', 'rgba(50,50,50,0.5)');
					    }, 10000);
				};
				if (window.WebGLRenderingContext){
					var nodes=[];
					var floors=[];
					for (var i=0; i<48; i++) {
						nodes[i] = 'node' + (i+1) + 'color';
					}
					for (var i=0; i<4; i++) {
						floors[i] = 'floor' + (i+1) + 'mat';
					}
					corStatus.initialize(nodes, floors);
					//oTooltip.init();
					jQueryStuff();
				} else {
					document.write('<div id="x3dEl"><img height="100%" width="100%" src="noWebGL.jpg"></div>');
				}
			};
			


