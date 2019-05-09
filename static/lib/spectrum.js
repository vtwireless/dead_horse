function isNumeric(n)
  {
  return !isNaN(parseFloat(n)) && isFinite(n);
  }
  
function numberWithCommas(x)
  {
  var parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
  }

var spectrum = (function () {
	var m_specrumTimeSlices;
	var m_colorTimeSlices;
	var m_arrSpecrumTimeSlices;
	var m_grid;
	var m_slices;
	var m_width;
	var m_count;
	var m_gridID;
	var m_gridColorID;
	var treadmill=true;
	var m_heatmapDivID;
	var m_IPID;
	var empty;
	var m_maxval=4;
	var m_canvasID="cvs";
	var graphData = [400, 800, 300, 400, 600, 900, 500, 900, 100];
	var graphLabels = [1, 2, 3, 4, 5, 6, 7, 8, 9];
	var m_showfloors;
	var fineGrain=true;
	var m_showStatus;
	var m_overlay;
	var leftGraphMargin=70;
	var rightGraphMargin=30;
	var thisModule = {};
	thisModule.m_transmit=false;
	thisModule.m_power=50;
	var scoreDiv='scoreDiv';
	var scoreTotal=0;
	var scaleFactor=0.09;
	var scaleOffset=3;
	var socket;
	//var crtsSocket;
	//in MHZ
	var centerF_=865;
	thisModule.bandwidth_=12;
	thisModule.lowBound_=centerF_-thisModule.bandwidth_/2;
	thisModule.selectedCenter=0;
	thisModule.selectedBandWidth=0;
	var lowBound_ = centerF_-thisModule.bandwidth_/2;
	var highBound_=centerF_+thisModule.bandwidth_/2;
	
	var period;
	var r;
        var trans_x = [];
        trans_x.push({translation:0 , bandwidth:0});
        var diffue_color = ['green','blue','red','teal','lightsalmon','orange'];// for coloring the boxes
//        var diffue_color = ['','','','','',''];// for coloring the boxes
        var spectrum_data;
		/* accepts parameters
	 * h  Object = {h:x, s:y, v:z}
	 * OR 
	 * h, s, v
	*/

	function processResponse(data) {
            //alert(data[2]);
		var data = data.map(function(x) { return 10*Math.log10(x)*scaleFactor + scaleOffset; });// why we are mapping the data here?
                spectrum_data = data;
	//to avoid displaying negative data values as height and color	
            for (var i=0; i<data.length; i++) {
                   // if (data[i] < 0){data[i]= 0;}
                }
		
		//Random Data
		if (thisModule.rand){
			data=[];
			for(var i=0; i<50; i++) {
				data.push(3*Math.random());
			}
			 console.log(data); // 20190212
		} else {
			if(data.length<2){
				m_showfloors();
				m_showStatus('<span style="color:red;">Spectral data not available.  Please try a different node or turn on random mode.</span>');
				return;
			}
		}

		

		//Graph
		graphLabels=[];
		var nticks=10;
		for(var i=0; i<=nticks; i++) {
			graphLabels.push(Math.round((thisModule.lowBound_+(i)*thisModule.bandwidth_/(nticks))*1000000)/1000000);
		}
		
		makeGraph(m_canvasID, data, graphLabels);



		if (treadmill) {
			m_grid=document.getElementById(m_gridID);

			var colorGrid=document.getElementById(m_gridColorID);
			//alert(colorGrid.id);
			if (m_count==0){
				m_width=data.length;
				m_specrumTimeSlices=[];
				m_colorTimeSlices=[];
				m_arrSpecrumTimeSlices=[];
				empty = Array.apply(null, new Array(m_width)).map(Number.prototype.valueOf,0);
				//var emptyColor = Array.apply(null, new Array(m_width)).map(Number.prototype.valueOf,1);
				//m_specrumTimeSlices.push(data.join(" "));
				m_specrumTimeSlices.push(data.join(" "));
				m_colorTimeSlices.push(dataToColor(data).join(" "));
				m_arrSpecrumTimeSlices.push(data);
				
				
				for(var i=0; i<(m_slices); i++) {
					m_specrumTimeSlices.push(empty.join(" "));
					m_colorTimeSlices.push(dataToColor(empty).join(" "));
					m_arrSpecrumTimeSlices.push(empty);
				}
				
				m_count=1;
			} else {
				for(var i=0;i<2;i++){
					m_specrumTimeSlices.pop();
					m_colorTimeSlices.pop();
					m_arrSpecrumTimeSlices.pop();
				}
				if(data.length>m_width){
					data=data.slice(0,m_width);
				}
				if(data.length<m_width){
					data.push(empty.slice(0, (m_width-data.length)));
				}
				
				/*
				if(data.indexOf(null)<-1){
					alert(data.indexOf(null));
				}*/
				m_specrumTimeSlices.unshift(data.join(" "));
				m_colorTimeSlices.unshift(dataToColor(data).join(" "));
				m_arrSpecrumTimeSlices.unshift(data);
			}
			empty = Array.apply(null, new Array(m_width)).map(Number.prototype.valueOf,0);
			m_specrumTimeSlices[m_slices] = empty.join(" ");
			m_colorTimeSlices[m_slices] = dataToColor(empty).join(" ");
			m_arrSpecrumTimeSlices[m_slices] = empty;
			//2D d3.js heatmap
			thisModule.redrawHeatmap();

			var gridStr = m_specrumTimeSlices.join(" ");
			var colorStr = m_colorTimeSlices.join(" ");

			colorGrid.color = colorStr;
			m_grid.setAttribute("xDimension", m_width);
			m_grid.setAttribute("zDimension", m_slices+1);
			m_grid.setAttribute("xspacing", 20.25/(m_width-1));
			m_grid.setAttribute("zspacing", 6.81/(m_slices-1));
			m_grid.setAttribute("height", gridStr);
			
			//alert(colorStr.split(' ').length + ' ' + gridStr.split(' ').length);
			
			//reload
			var container = m_grid.parentNode;
			var content = container.innerHTML;
			container.innerHTML = content;
			
		}else{
			//data.push(0);
			//data.unshift(0);
			m_width=data.length;
			m_grid=document.getElementById(m_gridID);

			var colorGrid=document.getElementById(m_gridColorID);
			//alert(colorGrid.id);
			if (m_count==0){
				m_specrumTimeSlices=[];
				m_colorTimeSlices=[];
				m_arrSpecrumTimeSlices=[];
				var empty = Array.apply(null, new Array(m_width)).map(Number.prototype.valueOf,0);
				//var emptyColor = Array.apply(null, new Array(m_width)).map(Number.prototype.valueOf,1);
				//m_specrumTimeSlices.push(data.join(" "));
				m_specrumTimeSlices.push(data.join(" "));
				m_colorTimeSlices.push(dataToColor(data).join(" "));
				m_arrSpecrumTimeSlices.push(data);
				for(var i=0; i<(m_slices); i++) {
					m_specrumTimeSlices.push(empty.join(" "));
					m_colorTimeSlices.push(dataToColor(empty).join(" "));
					m_arrSpecrumTimeSlices.push(empty);
				}

			} else {
				m_specrumTimeSlices[m_count]=data.join(" ");
				m_colorTimeSlices[m_count]=dataToColor(data).join(" ");
				m_arrSpecrumTimeSlices[m_count]=data;
			}

			var gridStr = m_specrumTimeSlices.join(" ");
			var colorStr = m_colorTimeSlices.join(" ");

			colorGrid.color = colorStr;
			m_grid.setAttribute("xDimension", m_width);
			m_grid.setAttribute("zDimension", m_slices);
			m_grid.setAttribute("xspacing", 20.25/(m_width-1));
			m_grid.setAttribute("zspacing", 6.81/(m_slices-1));
			m_grid.setAttribute("height", gridStr);
						
			//alert(colorStr.split(' ').length + ' ' + gridStr.split(' ').length);
			
			//reload
			var container = m_grid.parentNode;
			var content = container.innerHTML;
			container.innerHTML = content;
			
			//2D d3.js heatmap
			thisModule.redrawHeatmap();

			m_count++;
			if(m_count==m_slices){
				m_count=0;
			}
		}
	}

	function fitToContainer(canvas){
	  // Make it visually fill the positioned parent
	  canvas.style.width ='100%';
	  canvas.style.height='100%';
	  // ...then set the internal size to match
	  canvas.width  = canvas.offsetWidth;
	  canvas.height = canvas.offsetHeight;
	}

	function makeGraph(m_canvasID, graphData, graphLabels) {
		var canvas = document.getElementById(m_canvasID);
		fitToContainer(canvas);
		//fitToContainer(document.getElementById('layer2'));
	    /*
	    function getMousePos(canvas, evt) {
	        var rect = canvas.getBoundingClientRect();
	        return {
	          x: evt.clientX - rect.left,
	          y: evt.clientY - rect.top
	        };
	    }

	    //tooltip
		canvas.addEventListener('mousemove', function(evt) {
			var mousePos = getMousePos(canvas, evt);
	        var message = 'Mouse position: ' + mousePos.x + ',' + mousePos.y;
	        canvas.title = message;
		}, false);

*/

		var ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.globalAlpha = 0.5;
		ctx.fillStyle = "#C0C0C0";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		var line = new RGraph.Line(m_canvasID, graphData);
		line.Set('chart.labels', graphLabels);
		line.Set('chart.text.size', 11);
		line.Set('chart.colors', ['red']);
		line.Set('chart.linewidth', 3);
		//line.Set('chart.spline', !RGraph.isOld());
		//line.Set('chart.scale.decimals', 2);
		//line.Set('chart.background.barcolor2', 'rgba(0,0,0,0.4)');
		line.Set('chart.background.barcolor1', 'rgba(0,0,0,0.3)');
		//line.Set('chart.filled', true);
		//line.Set('chart.fillstyle', 'rgba(0,0,0,0.5)');
		//line.Set('chart.shadow', true);
		line.Set('chart.hmargin', 0);
		line.Set('chart.gutter.left', leftGraphMargin);
		line.Set('chart.gutter.right', rightGraphMargin);
		line.Set('chart.title.yaxis.pos', 0.2);
		line.Set('chart.title.xaxis', "Frequency, MHz");
		line.Set('chart.gutter.bottom', 50);
		line.Set('xaxispos', 'center');
		line.Set('chart.title.yaxis', "Energy (Uncalibrated)");
		//line.Set('numyticks', 2);
		line.Draw();
	}
	
	function HSVtoRGB(h, s, v) {
	    var r, g, b, i, f, p, q, t;
	    if (h && s === undefined && v === undefined) {
	        s = h.s, v = h.v, h = h.h;
	    }
	    i = Math.floor(h * 6);
	    f = h * 6 - i;
	    //p = 0;
            p = v * (1 - s);
	    //q = (1 - f);
            q = v * (1 - f * s);
	    //t = (1 - (1 - f));
            t = v * (1 - (1 - f) * s);
	    switch (i % 6) {
	        case 0: r = v, g = t, b = p; break;
	        case 1: r = q, g = v, b = p; break;
	        case 2: r = p, g = v, b = t; break;
	        case 3: r = p, g = q, b = v; break;
	        case 4: r = t, g = p, b = v; break;
	        case 5: r = v, g = p, b = q; break;
	    }
            
	    //return (1-(r+g+b)/3) + ' ' + (1-(r+g+b)/3)+ ' ' + (1-(r+g+b)/3);
            return r + ' ' + g + ' ' + b;
	}

	function checkIfZeroes(data)
	{
		for (var i=0; i<data.length; i++) {
			if(data[i]!=0)
				return false;
		}
		return true;
	}


		function dataToColor(data){
		var colorArray=[];
			for (var i=0; i<data.length; i++) {
			var c=(240-(data[i]*240/m_maxval))/360;
			if (c<0){
				c=0;
			} else if (c>(2/3)){
				c=(2/3);
			}
			
			var low=m_overlay.selLow;
			var high=m_overlay.selHigh;
			
			low=Math.ceil(low*data.length);
			high=Math.floor(high*data.length);
						
			if(i>=low && i<=high) {
				colorArray.push(HSVtoRGB(5/6, 1, 1));
			} else {
				colorArray.push(HSVtoRGB(c, 1, 1));
			}
			
		}
		return colorArray;
	}
        /*
	

	function dataToColor(data){
		var colorArray=[];
                 for (var i=0; i<data.length; i++) 
                {colorArray.push(data[i]/2+' '+data[i]/2+ ' '+data[i]/2);}
		return colorArray;
	}
	*/
	
	thisModule.rand=false;
	
	thisModule.redrawHeatmap = function  () {
		var width = $('#'+m_heatmapDivID).width();
		    height = $('#'+m_heatmapDivID).height();

		var data=m_arrSpecrumTimeSlices;
		(function(heatmap) {
		  var dx = heatmap[0].length,
		      dy = heatmap.length;

		  // Fix the aspect ratio.
		  // var ka = dy / dx, kb = height / width;
		  // if (ka < kb) height = width * ka;
		  // else width = height / ka;

		  var x = d3.scale.linear()
		      .domain([0*lowBound_, highBound_])
		      .range([0, width]);

		  var y = d3.scale.linear()
		      .domain([0, dy])
		      .range([height, 0]);

		  var color = d3.scale.linear()
		      .domain([0, m_maxval/4, 2*m_maxval/4, 3*m_maxval/4, 4*m_maxval/4])
		      .range(["blue", 'cyan', "green", 'yellow', "red"]);

		  var xAxis = d3.svg.axis()
		      .scale(x)
		      .orient("top")
		      .ticks(width/100);
/*
		  var yAxis = d3.svg.axis()
		      .scale(y)
		      .orient("right")
		      .ticks(height/50);
*/
		  var heatmapArea=document.getElementById(m_heatmapDivID);
		  heatmapArea.innerHTML='';
		  d3.select(heatmapArea).append("canvas")
		      .attr("width", dx)
		      .attr("height", dy)
		      //.attr('id', 'heatCanv')
		      .style("width", width + "px")
		      .style("height", height + "px")
		      .call(drawImage);
		  /*
		  var mycanv = document.getElementById('heatCanv');
		  alert(mycanv.id);
		  mycanv.addEventListener('mousemove', function(evt) {
	        alert('xxx');
	      }, false);*/

		  var svg = d3.select(heatmapArea).append("svg")
		      .attr("width", width)
		      .attr("height", height);

		  svg.append("g")
		      .attr("class", "x axis")
		      .attr("transform", "translate(0," + height + ")")
		      .call(xAxis)
		      .call(removeZero);
		  /*    
		  svg.append("g")
		      .attr("class", "y axis")
		      .call(yAxis)
		      .call(removeZero);
			*/




		//add Legend
		if (width>400 && height>200){
		var svgWidth = width,
svgHeight = height,
x1 = width-250,
barWidth = 200,
y1 = height-90,
barHeight = 50,
numberHues = 10;
var idGradient = "legendGradient";
 
var svgForLegendStuff = d3.select(heatmapArea).append("svg")
.attr("width", svgWidth)
.attr("height", svgHeight);
 
//create the empty gradient that we're going to populate later
svgForLegendStuff.append("g")
.append("defs")
.append("linearGradient")
.attr("id",idGradient)
.attr("x1","0%")
.attr("x2","100%")
.attr("y1","0%")
.attr("y2","0%"); // x1=0, x2=100%, y1=y2 results in a horizontal gradient
// it would have been vertical if x1=x2, y1=0, y2=100%
// See
// http://www.w3.org/TR/SVG/pservers.html#LinearGradients
// for more details and fancier things you can do
//create the bar for the legend to go into
// the "fill" attribute hooks the gradient up to this rect
svgForLegendStuff.append("rect")
.attr("fill","url(#" + idGradient + ")")
.attr("x",x1)
.attr("y",y1)
.attr("width",barWidth)
.attr("height",barHeight)
.attr("rx",20) //rounded corners, of course!
.attr("ry",20)
.attr("stroke-width",2)
.attr("stroke",'white');
 
//add text on either side of the bar
 
var textY = y1 + barHeight/2 + 15;
svgForLegendStuff.append("text")
.attr("class","legendText")
.attr("text-anchor", "middle")
.attr("x",x1 - 10)
.attr("y",textY-5)
.attr("dy",0)
.text("0");
 
svgForLegendStuff.append("text")
.attr("class","legendText")
.attr("text-anchor", "left")
.attr("x",x1 + barWidth + 5)
.attr("y",textY-5)
.attr("dy",0)
.text(numberHues);


svgForLegendStuff.append("text")
.attr("class","legendText")
.attr("text-anchor", "left")
.attr("x",(width-barWidth)/2)
.attr("y",height-30)
.attr("dy",0)
.text("Frequency, MHz");
 
 
//we go from a somewhat transparent blue/green (hue = 160º, opacity = 0.3) to a fully opaque reddish (hue = 0º, opacity = 1)
var hueStart = 240, hueEnd = 0;
var opacityStart = 1, opacityEnd = 1.0;
var theHue, rgbString, opacity,p;
 
var deltaPercent = 1/(numberHues-1);
var deltaHue = (hueEnd - hueStart)/(numberHues - 1);
var deltaOpacity = (opacityEnd - opacityStart)/(numberHues - 1);
 
//kind of out of order, but set up the data here
var theData = [];
for (var i=0;i < numberHues;i++) {
theHue = hueStart + deltaHue*i;
//the second parameter, set to 1 here, is the saturation
// the third parameter is "lightness"
rgbString = d3.hsl(theHue,1,0.6).toString();
opacity = opacityStart + deltaOpacity*i;
p = 0 + deltaPercent*i;
//onsole.log("i, values: " + i + ", " + rgbString + ", " + opacity + ", " + p);
theData.push({"rgb":rgbString, "opacity":opacity, "percent":p});
}
 
//now the d3 magic (imo) ...
var stops = d3.select('#' + idGradient).selectAll('stop')
.data(theData);
stops.enter().append('stop');
stops.attr('offset',function(d) {
return d.percent;
})
.attr('stop-color',function(d) {
return d.rgb;
})
.attr('stop-opacity',function(d) {
return d.opacity;
});

}


		  // Compute the pixel colors; scaled by CSS.
		  function drawImage(canvas) {
		    var context = canvas.node().getContext("2d"),
		        image = context.createImageData(dx, dy);

		    for (var y = 0, p = -1; y < dy; ++y) {
		      for (var x = 0; x < dx; ++x) {
		        var c = d3.rgb(color(heatmap[y][x]));
		        image.data[++p] = c.r;
		        image.data[++p] = c.g;
		        image.data[++p] = c.b;
		        image.data[++p] = 255;
		      }
		    }

		    context.putImageData(image, 0, 0);
		  }

		  function removeZero(axis) {
		    axis.selectAll("g").filter(function(d) { return !d; }).remove();
		  }
		})(data);
	}

	

	thisModule.initialize = function (lastDigitsIP, nTimeSlices, gridID, gridColorID, heatmapDivID, show_floors, showStatus, transParams, crtsMetricsId) {
		m_IPID=lastDigitsIP;
		m_slices=nTimeSlices;
		m_gridID=gridID;
		m_gridColorID=gridColorID;
		m_heatmapDivID=heatmapDivID;
		m_count=0;
		m_showfloors=show_floors;
		m_showStatus=showStatus;
              m_teamNames = {}; // key is node that is passed in in 'crtsMetrics'
		m_overlay=selOverlay(document.getElementById('layer2'), leftGraphMargin, rightGraphMargin);
		
		//fitToContainer(document.getElementById('layer2'));

		//WebSockets
		socket = io.connect('');
		thisModule.connected = true;
		prevTime = 0;
		period = (800/transParams.r);
		socket.on('time', function(data) {
                    
			if(thisModule.connected && new Date().getTime() - prevTime >= period) {
try {		

		processResponse(JSON.parse(data));
				prevTime = new Date().getTime();

}
catch(e){//nothing
}
			}
        	});
		
        	socket.on('users_rsp', function(data) {
			console.log(data.toString());  // 20190212
            		alert(data.toString());
        	});
		socket.on('error', function(error) { console.error(error) });
       		var initParams={};
        	initParams.transParams=transParams;
        	initParams.nodeID=m_IPID;
    		socket.emit ('nodeID', initParams);
    		thisModule.connected=true;
    		convertToMHz(transParams);
    		console.log(JSON.stringify(transParams));  // 20190212
                
                // ==============================================================
		socket.on('updatePerMetric', function(data) {
			if(thisModule.connected) {
                            var dataValue = 'unknown';
                            if (isNumeric(data))
                              {
                              var floatData = parseFloat(data);
                              if (floatData < 0.0000)
                                {
                                floatData = 0.0;
                                }
                              dataValue = floatData.toFixed(5);
                              }
		            document.getElementById('pmDataPER').innerHTML = dataValue; 
			}
		});
                socket.on('updateThroughputMetric', function(data) {
			if(thisModule.connected) {
                            var dataValue = 'unknown';
                            if (isNumeric(data))
                              {
                              var floatData = parseFloat(data);
                              if (floatData < 0.0000)
                                {
                                floatData = 0.0;
                                }
                              dataValue = floatData.toPrecision(7);
                              dataValue = numberWithCommas(dataValue);
                              }
		            document.getElementById('pmDataT').innerHTML = dataValue; 
                        }
		});
                // ===============================================================
                
		socket.on('frequencyUpdate', function(data) {
			console.log(JSON.stringify(data));
		});
		socket.on('bandwidthUpdate', function(data) {
			console.log(JSON.stringify(data));
		});
                var nodes_teams = [];
                var teams_names = []; 
                var trans_y = [];// translation in y direction
                var unit = 0
               
		socket.on('initial_params', function(data) {
			console.log(JSON.stringify(data));
                        
                        nodes_teams = data;
                        //var x3d = $("<X3D/>", {width : "600px", height : "600px"});
                        //var scene = $("<Scene/>");
                        //scene unit
                        unit = 20/thisModule.bandwidth_;// mapping the spectrum units to the x3d units
                         
                        
                        var transform ='';// hold the x3d scene transform
                        //
                        // assigning each team a separate row 
                        teams_names.push(data[0].team_name); 
                        trans_y[0] = -0.5;//alert(teams_names[0]);
                        for (var i =1; i<data.length; ++i)   // based on Ayat's code
                            {
                            var exist = 1;
                            for (var n =0; n < teams_names.length; ++n){
//                            for (var n =1; n < teams_names.length; ++n){ //20190209
                                if (teams_names[n] != data[i].team_name)
                                    {exist = 0;}
                                else
                                    {exist = 1;}
                                };
                            if(exist == 0)
                                {teams_names.push(data[i].team_name);
                                 trans_y.push((trans_y[trans_y.length - 1] - 1)); 
                                }
                                
                            }

                        // TODO: This code totally sucks:  We need the
                        // team names elsewhere.
                        for(var i=0; i<teams_names.length; ++i)
                           m_teamNames[(i).toString()] = teams_names[i]; // 20190209
                           // m_teamNames[(i+1).toString()] = teams_names[i];

                        //
                        trans_x = [];
                        for (var i =0; i<data.length; ++i){
                            
                           // nodes_roles [i] = data[i].role;
                            var f_diff = (data[i].frequency/1000000) - thisModule.lowBound_;//(centerF_ - (thisModule.bandwidth_ /2)) ;// to adjust the x position of the box
                            //alert(f_diff);
                            //var fx = f_diff - 9.5; // 10.5 is the x position of the center frequency lable in the x3d scene
                            var translation = f_diff * unit;
                            
                            trans_x.push({translation: translation, bandwidth:data[i].bandwidth/1000000});
                            var new_size = JSON.stringify(data[i].bandwidth/1000000)+',0.5';
                            //for(var j =0; j<teams_names.length; ++j){ alert(teams_names[j]+" "+j);}
                            for(var j =0; j<teams_names.length; ++j){
                                if (data[i].team_name == teams_names[j])
                                    {
                                        var dif_color = diffue_color[j];
                                        var  translation_y = trans_y[j];
                                    }
                                }
                            
                            //if (data[i].role == "radio")
                                transform = transform + "<Transform id ='box_transform_"+ i +"'DEF='node_usr-label' containerField='children' translation='" + translation +" " + translation_y +" 8'>"+
                                    "<Shape DEF='node_usr_s' containerField='children'>"+
                                    "<Appearance containerField='appearance'>"+
                                    "<Material id='usr_color_"+i+"' diffuseColor='"+dif_color+"'></material></Appearance>"+ 
                                    "<box id='node_usr_bar_"+i+"' size='"+new_size+"' ></box></Shape></transform>"+
                                    "<transform id ='txt_transform_"+ i +"'DEF='node_usr-label' containerField='children' translation='" + translation +" " + (translation_y) +" 8'><Shape containerField='children'>"+
                                    "<Appearance containerField='appearance'><Material  diffuseColor='1 1 1' emissiveColor= '1 1 1'></material></Appearance>"+
                                    "<Text DEF='GeoText1' containerField='geometry' id='node_usr_"+i+"' string="+JSON.stringify(data[i].team_name)+"maxExtent='100'>"+
                                    "<FontStyle containerField='fontStyle' family='SERIF' style='PLAIN' justify="+'"BEGIN" "BEGIN"'+" size='0.4' spacing='1'></Fontstyle></Text></Shape></Transform>";
                           /* else{transform = transform + "<Transform id ='box_transform_"+ i +"'DEF='node_usr-label' containerField='children' translation='" + translation +" " + translation_y + " 8'>"+
                                    "<Shape DEF='node_usr_s' containerField='children'>"+
                                    "<Appearance containerField='appearance'>"+
                                    "<Material id='usr_color_"+i+"' diffuseColor='"+diffue_color[2]+"'></material></Appearance>"+ 
                                    "<box id='node_usr_bar_"+i+"' size='"+new_size+"' ></box></Shape></transform>"+
                                    "<transform id ='txt_transform_"+ i +"'DEF='node_usr-label' containerField='children' translation='" + translation +" " + trans_y +" 8'><Shape containerField='children'>"+
                                    "<Appearance containerField='appearance'><Material  diffuseColor='1 1 1'></material></Appearance>"+
                                    "<Text DEF='GeoText1' containerField='geometry' id='node_usr_"+i+"' string="+JSON.stringify(data[i].team_name)+"maxExtent='100'>"+
                                    "<FontStyle containerField='fontStyle' family='SERIF' style='PLAIN' justify="+'"BEGIN" "BEGIN"'+" size='0.4' spacing='1'></Fontstyle></Text></Shape></Transform>";}*/
                            
                        //alert(transform);
                            /*var usr_box ='node_usr_bar_'+(i);
                            document.getElementById(usr_box).size = new_size;// set user bar width to the current bandwidth
                            document.getElementById('usr_color_'+(i)).diffuseColor = diffue_color[0];*/
                        //alert(dif_color+" "+data[i].team_name+" "+data[i].frequency/1000000);
                        }
                        //team_data.push(data.join(" "));
                        //document.getElementById('node_usr').string = JSON.stringify(data);
                        
                        
                        //alert(new_size);
                        
                        // to hide the boxes
                        document.getElementById("node_users").innerHTML = transform;
                        document.getElementById('specGroup').setAttribute('render', 'true');
		});
                //var new_json ='';
                var obj='';
                var data_json = '[{"bandwidth": 1000000, "frequency": 865000000, "node": 0}]';
                var textFile = null;
                     function makeTextFile (text) {
                        var data = new Blob([text], {type: 'text/plain'});

                        // If we are replacing a previously generated file we need to
                        // manually revoke the object URL to avoid memory leaks.
                        if (textFile !== null) {
                          window.URL.revokeObjectURL(textFile);
                        }

                        textFile = window.URL.createObjectURL(data);

                        // returns a URL you can use as a href
                        return( textFile);
                      };
                      
                   
		socket.on('spectrumUpdate', function(data) {
			 console.log(JSON.stringify(data)); // 20190212
                        //data_json = '"['+JSON.stringify(data)+']"';
                        obj = JSON.parse(data_json);
                        obj.push(data);
                        data_json= JSON.stringify(obj);
                        //alert(data_json);
                       //data_json.push(JSON.stringify(data));
                        
                        //alert(data_json);
//                        data.node = data.node -1; // 20190209
 console.log("data:  ");  // 20190209
 console.log(JSON.stringify(data));  // 20190209
                                                
                        //for (var i =0; i<data.length; ++i){
                            unit = 20/thisModule.bandwidth_;
                            var f_diff = (data.frequency/1000000) - thisModule.lowBound_;//(centerF_ - (thisModule.bandwidth_ /2));// to adjust the x position of the box
                            var translation = f_diff * unit;
                                                      
                            for (var i =0; i< nodes_teams.length; ++i){
                                if(data.node == nodes_teams[i].node)
                                    {
                                        var index = teams_names.indexOf(nodes_teams[i].team_name);
                                        var translationUpdateY = trans_y[index];
                                        trans_x[data.node].translation=translation; 
                                        trans_x[data.node].bandwidth=data.bandwidth/1000000;
                                        
                                    }
                            }
                           // alert(f_diff+ " "+data.node);
                            // to hide the boxes
                            var transform_id = "box_transform_"+(data.node);    
                            document.getElementById(transform_id).translation = JSON.stringify(translation)+" "+ JSON.stringify(translationUpdateY) + " 8";
                            
                            document.getElementById("txt_transform_"+(data.node)).translation = JSON.stringify(translation) +" "+ JSON.stringify(translationUpdateY) + " 8";
                            //console.log(JSON.stringify(document.getElementById(transform_id).translation)+" "+JSON.stringify(document.getElementById("txt_transform_"+(data.node)).translation));
                            //else{
                            //document.getElementById(transform_id).translation = JSON.stringify(translation) + ' -2.5 8';
                           // document.getElementById("txt_transform_"+(data.node)).translation = JSON.stringify(translation) + ' -3.5 8';}
                            var new_size = JSON.stringify(data.bandwidth/1000000)+',0.5';
                            var usr_box ='node_usr_bar_'+(data.node);
                            document.getElementById(usr_box).size = new_size;// set user bar width to the current bandwidth// to hide the boxes
                            
                            //console.log(centerF_+" "+data.frequency/1000000+" "+translation+" "+unit);
                            //alert(document.getElementById(transform_id).translation);
                            //document.getElementById('usr_color_'+(i)).diffuseColor = diffue_color[i];
                        //}
                        //team_data.push(data.join(" "));
                        //document.getElementById('node_usr').string = JSON.stringify(data);
                        
                        
                        //alert(new_size);
                        
                    
		});
                
                //alert(makeTextFile(data_json));
                        
                var index_4 = 0,index_1 = 0, index_2 = 0, index_3 = 0, index_A = 0, index_B = 0, throughput_arr_4 = [], throughput_arr_1 = [],throughput_arr_2 = [],throughput_arr_3 = [],throughput_arr_A = [],throughput_arr_B = [];
                       // throughput_arr_A.push({value: 0, index: 0 });     throughput_arr_B.push({value: 0, index: 0 });
                       var A_score =0; var B_score =0;
            /*var throughput_dialog_div = document.createElement('div');
                            throughput_dialog_div.id 		= "throughput_dialog";
                            throughput_dialog_div.class 	= "window_div";
                            throughput_dialog_div.title	= "Throughtput";
                            throughput_dialog_div.style	= "margin-top:2px;padding:0px";
                            document.getElementsByTagName('body')[0].appendChild(throughput_dialog_div);*/
                            
                            $( "#container" ).dialog({
                            position: [5,5],
                            resizable: true,
                            autoOpen: false,
                            width: 650,
                            height: 675,
                            title:"Nodes Throughtput"
                            });
                            $( "#Teams_container" ).dialog({
                            position: [655,5],
                            resizable: true,
                            autoOpen: false,
                            width: 820,
                            height: 375,//675,
                            title:"Nodes Throughput"
                            });
                socket.on('throughputUpdate', function(data) {
//			console.log(JSON.stringify(data)); // xavier commented out
                        //alert(JSON.stringify(data));
                        document.getElementById("left").innerHTML = "";
                        document.getElementById("leftb").innerHTML = "";
                        document.getElementById("right").innerHTML = "";
                        document.getElementById("rightb").innerHTML = "";
                        document.getElementById("leftt").innerHTML = "";
                        //document.getElementById("rightt").innerHTML = "";
                        //document.getElementById("leftb_team").innerHTML = "";
                        //document.getElementById("rightb_team").innerHTML = "";
                        
                        if(data.node == 1){throughput_arr_1.push({ node: data.node, value: data.throughput, index: index_1 }); ++index_1;};
                        if(data.node == 2){throughput_arr_2.push({ node: data.node, value: data.throughput, index: index_2 }); ++index_2;};
                        if(data.node == 3){throughput_arr_3.push({ node: data.node, value: data.throughput, index: index_3 }); ++index_3;};
                        if(data.node == 4){throughput_arr_4.push({ node: data.node, value: data.throughput, index: index_4 }); ++index_4;};
                        throughput_arr_A = [];throughput_arr_B = [];  
                        
                        for(var i = 1; i < Math.min(index_2,index_1); i++){
                            
                           throughput_arr_A.push({value:throughput_arr_2[i].value + throughput_arr_1[i].value, index: i }); //throughput_arr_A[i-1].value +
                         A_score +=  throughput_arr_2[i].value + throughput_arr_1[i].value; 
                        //console.log("A "+" "+i+" "+throughput_arr_A[i].value);
                        }
                        for(var i = 1; i < Math.min(index_4,index_3); i++){
                           throughput_arr_B.push({value:throughput_arr_4[i].value + throughput_arr_3[i].value, index: i });// throughput_arr_B[i-1] 
                           //console.log("B "+throughput_arr_B[i].value);
                        }
                     
                        //if (index_0 >= 0){
                            
                        //for(var i = 0; i<index_3; ++i){    
                        //console.log(throughput_arr_3[i].node+" "+throughput_arr_3[i].value);}
                        /*var bodyheight, bodywidth;
                        function body_sizer() {
                                bodyheight = $(window).height();
                                bodywidth = $(window).width();
                                $("#leftt").height(bodyheight/2);
                                $("#leftt").width(bodywidth-50/2);
                                $("#rightt").height(bodyheight/2);
                                $("#rightt").width(bodywidth-50/2);}
                        $("#Teams_container").ready(function() {
                            body_sizer();
                            $(window).resize(body_sizer);
                        });*/
                    window.addEventListener('resize', resizeCanvas, false);
                    resizeCanvas();
                    function resizeCanvas() {
                            $("#container").innerWidth=window.innerWidth;
                            $("#container").innerHight=window.innerHight;
                            
                            $("#containera").innerWidth=window.innerWidth;
                            $("#containera").innerHight=window.innerHight/2;
                            
                            $("#containerb").innerWidth=window.innerWidth;
                            $("#containerb").innerHight=window.innerHight/2;
                            document.getElementById("left").style.width ="'"+ ($("#container").innerWidth()-50/2 )+ "px'";
                            document.getElementById("left").style.height = "'"+ ($("#container").innerHeight()/2) + "px'";
                            document.getElementById("leftb").style.width ="'"+ ($("#container").innerWidth()-50/2 )+ "px'";
                            document.getElementById("leftb").style.height = "'"+ ($("#container").innerHeight()/2) + "px'";
                            document.getElementById("right").style.width ="'"+ ($("#container").innerWidth()-50/2 )+ "px'";
                            document.getElementById("right").style.height = "'"+ ($("#container").innerHeight()/2) + "px'";
                            document.getElementById("rightb").style.width ="'"+ ($("#container").innerWidth()-50/2 )+ "px'";
                            document.getElementById("rightb").style.height = "'"+ ($("#container").innerHeight()/2) + "px'";
                        }
                        
                         var margin = {top: 20, right: 20, bottom: 30, left: 70},
                            width = $("#Teams_container").innerWidth()/1.1 - margin.left - margin.right, //$("#container").innerWidth()/2 - margin.left - margin.right,
                            height = 300  - margin.top - margin.bottom;

                                               
                        var x1 = d3.scale.linear()
                                .range([0, width]);
                        var y1 = d3.scale.linear()
                                .range([height, 0]);
                        x1.domain(d3.extent(throughput_arr_1, function(d) { return d.index; }));
                        y1.domain([0,10]);//(d3.extent(throughput_arr_1, function(d) { return (d.value/1000); }));
                        
                        var x2 = d3.scale.linear()
                                .range([0, width]);
                        var y2 = d3.scale.linear()
                                .range([height, 0]);
                        x2.domain(d3.extent(throughput_arr_2, function(d) { return d.index; }));
                        y2.domain([0,200]);//(d3.extent(throughput_arr_2, function(d) { return (d.value/1000); }));
                        
                        var x3 = d3.scale.linear()
                                .range([0, width]);
                        var y3 = d3.scale.linear()
                                .range([height, 0]);
                        x3.domain(d3.extent(throughput_arr_3, function(d) { return d.index; }));
                        y3.domain([0,1300]);//d3.extent(throughput_arr_3, function(d) { return (d.value/1000); }));
                        
                        var x4 = d3.scale.linear()
                                .range([0, width]);
                        var y4 = d3.scale.linear()
                                .range([height, 0]);
                        x4.domain(d3.extent(throughput_arr_4, function(d) { return d.index; }));
                        y4.domain([0,2400]);//(d3.extent(throughput_arr_0, function(d) { return (d.value/1000); }));
                        
                        var xA = d3.scale.linear()
                                .range([0, width]);
                        var yA = d3.scale.linear()
                                .range([height, 0]);
                        xA.domain(d3.extent(throughput_arr_A, function(d) { return d.index; }));
// tutorial throughput display
                        yA.domain([0,4000]);//d3.extent(throughput_arr_3, function(d) { return (d.value/1000); }));
                        
                        var xB = d3.scale.linear()
                                .range([0, width]);
                        var yB = d3.scale.linear()
                                .range([height, 0]);
                        xB.domain(d3.extent(throughput_arr_B, function(d) { return d.index; }));
                        yB.domain([0,4600]);//d3.extent(throughput_arr_3, function(d) { return (d.value/1000); }));

                        var xAxis1 = d3.svg.axis()
                                .scale(x1)
                                .orient("bottom");
                        var yAxis1 = d3.svg.axis()
                                .scale(y1)
                                .orient("left") ;
                        var xAxis2 = d3.svg.axis()
                                .scale(x2)
                                .orient("bottom");
                        var yAxis2 = d3.svg.axis()
                                .scale(y2)
                                .orient("left") ;
                        var xAxis3 = d3.svg.axis()
                                .scale(x3)
                                .orient("bottom");
                        var yAxis3 = d3.svg.axis()
                                .scale(y3)
                                .orient("left") ;
                        var xAxis4 = d3.svg.axis()
                                .scale(x4)
                                .orient("bottom");
                        var yAxis4 = d3.svg.axis()
                                .scale(y4)
                                .orient("left") ;
                        var xAxisA = d3.svg.axis()
                                .scale(xA)
                                .orient("bottom");
                        var yAxisA = d3.svg.axis()
                                .scale(yA)
                                .orient("left") ;
                        var xAxisB = d3.svg.axis()
                                .scale(xB)
                                .orient("bottom");
                        var yAxisB = d3.svg.axis()
                                .scale(yB)
                                .orient("left") ;
                        
                           
                        var line1 = d3.svg.line()
                                         
                                 .x(function(d) { return x1(d.index); })
                                 .y(function(d) { return y1(d.value /1000); });
                         var line2 = d3.svg.line()

                                 .x(function(d) { return x2(d.index); })
                                 .y(function(d) { return y2(d.value /1000); });
                         var line3 = d3.svg.line()
                                         
                                         .x(function(d) { return x3(d.index); })
                                         .y(function(d) { return y3(d.value /1000); });
                         var line4 = d3.svg.line()

                                 .x(function(d) { return x4(d.index); })
                                 .y(function(d) { return y4(d.value /1000); });
                         var lineA = d3.svg.line()
                                         
                                         .x(function(d) { return xA(d.index); })
                                         .y(function(d) { return yA(d.value /1000); });
                         var lineB = d3.svg.line()
                                         
                                         .x(function(d) { return xB(d.index); })
                                         .y(function(d) { return yB(d.value /1000); });


               var svg1 = d3.select("#left")
                            
                            .append("svg")
                            .attr("width", width + margin.left + margin.right)
                            .attr("height", height + margin.top + margin.bottom)
                            .append("g")
                            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                svg1.append("path")
                  //.datum(data)
                      .attr("class", "line")
                      .style("stroke", "yellow")
                      .attr("d", line1(throughput_arr_1));
                svg1.append("g")
                      .attr("class", "x axis")
                      .attr("transform", "translate(0," + height + ")")
                      .call(xAxis1);
                svg1.append("g")
                      .attr("class", "y axis")
                      .call(yAxis1)
                   .append("text")
                      .attr("transform", "rotate(-90)")
                      .attr("y", 0 - margin.left)
                      .attr("x",0 - (height / 2))
                      .attr("dy", "0.7em")
                      .style("text-anchor", "middle")
                      .text("node_1_Throughput(kbps)");
          
                var svg2 = d3.select("#right")
                .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                svg2.append("path")
                      .attr("class", "line")
                      .style("stroke", "cyan")
                      .attr("d", line2(throughput_arr_2));
                svg2.append("g")
                      .attr("class", "x axis")
                      .attr("transform", "translate(0," + height + ")")
                      .call(xAxis2);
                svg2.append("g")
                      .attr("class", "y axis")
                      .call(yAxis2)
                    .append("text")
                      .attr("transform", "rotate(-90)")
                      .attr("y", 0 - margin.left)
                      .attr("x",0 - (height / 2))
                      .attr("dy", "0.7em")
                      .style("text-anchor", "middle")
                      .text("node_2_Throughput(kbps)");
               if(throughput_arr_3.length > 0)
              {       
               var svg3 = d3.select("#leftb")
                .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                svg3.append("path")
                      .attr("class", "line")
                      .style("stroke", "brown")
                      .attr("d", line3(throughput_arr_3));
                svg3.append("g")
                      .attr("class", "x axis")
                      .attr("transform", "translate(0," + height + ")")
                      .call(xAxis3);
                svg3.append("g")
                      .attr("class", "y axis")
                      .call(yAxis3)
                    .append("text")
                      .attr("transform", "rotate(-90)")
                      .attr("y", 0 - margin.left)
                      .attr("x",0 - (height / 2))
                      .attr("dy", "0.7em")
                      .style("text-anchor", "middle")
                      .text("node_3_Throughput(kbps)");
              }
                  if(throughput_arr_4.length > 0)
              {
              var svg4 = d3.select("#rightb")
                .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                svg4.append("path")
                      .attr("class", "line")
                      .style("stroke", "black")
                      .attr("d", line4(throughput_arr_4));
                svg4.append("g")
                      .attr("class", "x axis")
                      .attr("transform", "translate(0," + height + ")")
                      .call(xAxis4);
                svg4.append("g")
                      .attr("class", "y axis")
                      .call(yAxis4)
                    .append("text")
                      .attr("transform", "rotate(-90)")
                      .attr("y", 0 - margin.left)
                      .attr("x",0 - (height / 2))
                      .attr("dy", "0.7em")
                      .style("text-anchor", "middle")
                      .text("node_4_Throughput(kbps)");
              }
              
              var svgA = d3.select("#leftt")
                .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                svgA.append("path")
                      .attr("class", "line")
                      .style("stroke", "blue")
                      .attr("d", lineA(throughput_arr_A));
              
                svgA.append("g")
                      .attr("class", "x axis")
                      .attr("transform", "translate(0," + height + ")")
                      .call(xAxisA);
                svgA.append("g")
                      .attr("class", "y axis")
                      .call(yAxisA)
                    .append("text")
                      .attr("transform", "rotate(-90)")
                      .attr("y", 0 - margin.left)
                      .attr("x",0 - (height / 2))
                      .attr("dy", "0.7em")
                      .style("text-anchor", "middle")
                      .text("Total Throughput(kbps)");
/*              var svgB = d3.select("#rightt")
                .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                svgB.append("path")
                      .attr("class", "line")
                      .style("stroke", "green")
                      .attr("d", lineB(throughput_arr_B));
                svgB.append("g")
                      .attr("class", "x axis")
                      .attr("transform", "translate(0," + height + ")")
                      .call(xAxisB);
                svgB.append("g")
                      .attr("class", "y axis")
                      .call(yAxisB)
                    .append("text")
                      .attr("transform", "rotate(-90)")
                      .attr("y", 0 - margin.left)
                      .attr("x",0 - (height / 2))
                      .attr("dy", "0.7em")
                      .style("text-anchor", "middle")
                      .text("Team B Throughput(kbps)");
              var svgA = d3.select("#leftb_team")
                .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                svgA.append("path")
                      .attr("class", "line")
                      .style("stroke", "blue")
                      .attr("d", lineA(throughput_arr_A));
              svgA.append("path")
                      .attr("class", "line")
                      .style("stroke", "green")
                      .attr("d", lineB(throughput_arr_B));
                svgA.append("g")
                      .attr("class", "x axis")
                      .attr("transform", "translate(0," + height + ")")
                      .call(xAxisA);
                svgA.append("g")
                      .attr("class", "y axis")
                      .call(yAxisA)
                    .append("text")
                      .attr("transform", "rotate(-90)")
                      .attr("y", 0 - margin.left)
                      .attr("x",0 - (height / 2))
                      .attr("dy", "0.7em")
                      .style("text-anchor", "middle")
                      .text("Team A & B Throughput(kbps)");
*/
                  // document.getElementById("rightb_team").write(" Team A score is:"+A_score+" Team B score is:"+B_score);
//                  console.log(" Team A score is:"+A_score+" Team B score is:"+B_score); //xavier commented out
                    if(document.getElementById('launch_Throughput_graphs').checked) {    
                    //$("#container").dialog("open");
                    $("#Teams_container").dialog("open"); 
                    }
                  //<input type="checkbox" id="show_score" name="Show_Score" value="Score_graphs" style="width:20px; height:20px; vertical-align:middle;">
                
                    
		});
               
		
		socket.on('crtsLaunchResponse', function(data) {
			if(data.toString() == "OK") {
				document.getElementById('launch_crts_button').innerHTML = "Update CRTS settings";
			}
			else {
				alert(data.toString());
			}
		});
	}
        thisModule.launchScoreboard = function()
          {
	  var lastDigitsIP = document.getElementById('header').innerHTML.slice(-2);
          socket.emit('launchScoreboard', lastDigitsIP);   
          }
	
        thisModule.launchTutorial = function(lastDigitsIP, parameters) {
		var crtsParams={};
		crtsParams.nodeID = parseInt(lastDigitsIP);
		crtsParams.params = parameters;
		socket.emit('launchTutorial', crtsParams);
		
		// Get the response from the server
		socket.on('crtsMetrics', function(data) {

            
			console.log('CRTS METRICS: node ' + data.node + '\n' +
                '     throughput: ' + data.throughput + '\n' +
                '            per: ' + data.per + '\n' +
                'totalThroughput: ' + data.totalThroughput + '\n' +
                '       totalPER: ' + data.totalPER + '\n');
            

 //           var node = data.node.toString() - 1;  //20190209
           var node = data.node.toString();

            if(data.node === undefined ||
                data.totalThroughput === undefined ||
                data.totalPER === undefined ||
                data.totalBits === undefined) {
                alert("Bad 'crtsMetrics' recieved");
                return;
            }

            function create4NumberDisplays() {

                function createNumberDisplay(name, label) {

                    var divSection = document.createElement('div');
                    divSection.className = "PM_Row";
                    var div = document.createElement('div');
                    div.className = "PM_Label";
                    div.innerHTML = label;
                    divSection.appendChild(div);
                    div = document.createElement('div');
                    div.className = "PM_Data";
                    div.innerHTML = data[name].toString();
                    div.id = node + '_' + name;
                    divSection.appendChild(div);
                    return divSection;
                }

                var divOuter = document.createElement('div');
                divOuter.className = "PM_border";
                var title = document.createElement('div');
                title.className = "PM_title";
//                title.innerHTML = "Received on Node " + node + ' - ' + m_teamNames[node];
                 title.innerHTML = "Received on " + m_teamNames[node];
                divOuter.appendChild(title);
                //divOuter.appendChild(createNumberDisplay('throughput', 'Short Term - Throughput (bps)'));
                //divOuter.appendChild(createNumberDisplay('per', 'Short Term - Packet Error Rate'));
                divOuter.appendChild(createNumberDisplay('totalThroughput', 'Scenanio Average - Throughput (bps)'));
                divOuter.appendChild(createNumberDisplay('per', 'Scenanio Average - Packet Error Rate'));
//                divOuter.appendChild(createNumberDisplay('totalPER', 'Scenanio Average - Packet Error Rate'));  //20190209
                divOuter.appendChild(createNumberDisplay('totalBits', 'Scenanio Total (bits)'));
                document.getElementById("performanceMetricDiv").appendChild(divOuter);
            }

            // If this it the first time with this node create a number
            // display widget with document.createElement() and such.
            var d = document.getElementById(node + '_' + 'totalThroughput');
            if(d === null) create4NumberDisplays();

            function setValue(name, n) {
                document.getElementById(node + '_' + name).innerHTML = data[name].toFixed(n).toString();
            }

            //setValue('throughput', 1);
            setValue('per', 3);
            setValue('totalThroughput', 1);
//            setValue('totalPER', 3);
            setValue('totalBits', 0);
		});
	}

	thisModule.launchCRTS = function(lastDigitsIP, parameters) {
		var crtsParams={};
		crtsParams.nodeID = parseInt(lastDigitsIP);
		//crtsParams.txNodeID = parseInt(document.getElementById('tx_node_crts_options').value)%7000 + 10;
		//crtsParams.rxNodeID = parseInt(document.getElementById('rx_node_crts_options').value)%7000 + 10;
		//Temporary hard coding for demo
		crtsParams.txNodeID = 47;
		crtsParams.rxNodeID = 48;
		crtsParams.params = parameters;
		
		socket.emit('launchCRTS', crtsParams);
	}
	
	thisModule.fit = function () {
		fitToContainer(document.getElementById('layer2'));
	}
	thisModule.connected=false;

	thisModule.disconnect = function (lastDigitsIP) {
		socket.emit ('closeSSH', lastDigitsIP);
		m_specrumTimeSlices = [];
		m_colorTimeSlices = [];
		m_arrSpecrumTimeSlices = [];
		
		m_grid=document.getElementById(m_gridID);
		m_grid.innerHTML = '<color id="specGridColor" color="0 0 0 0 0 0 0 0 0 0 0 0"></color>';
		m_grid.height="0.0 0.0 0.0 0.0";
		m_grid.solid="false";
		m_grid.xdimension = "2";
		m_grid.zdimension = "2";
		m_grid.xspacing = "20.25";
		m_grid.zspacing = "6.81";
		
		document.getElementById(m_heatmapDivID).innerHTML = '';
		thisModule.connected=false;
	}

	function convertToMHz(transParams){
		centerF_=transParams.f/1000000;
		thisModule.bandwidth_=transParams.b/1000000;
		thisModule.lowBound_=centerF_-thisModule.bandwidth_/2;
		highBound_=centerF_+thisModule.bandwidth_/2;
	}

	thisModule.updateParams =  function(transParams) {
		if (thisModule.connected) {
			thisModule.connected = true;
		    var initParams={};
            initParams.transParams=transParams;
            initParams.nodeID=m_IPID;
			m_count=0;
			console.log("UPDATED PARAMS");
			period = 800/transParams.r;
			socket.emit('nodeID', initParams);
		}
		console.log(JSON.stringify(transParams));
		convertToMHz(transParams);
	}
	
	thisModule.updateTimeSlices = function(time_slices) {
		m_slices = time_slices;
	}

	thisModule.displayUsers =  function(transParams) {
		socket.emit ('users_req');
	}

	thisModule.setParamsCRTS = function (paramsCRTS) {
		socket.emit('getSettingsCRTS', paramsCRTS);
	}

	thisModule.stopCTRS = function () {
		socket.emit('stopCRTS');
	}


	var firstMetrics;
	thisModule.getMetrics =  function(transParams) {
		socket.on('receiveMetrics', function(data) {
			var array=data.split(';');
			array.shift();
			array.pop();
			for (var i=0;i<array.length;i++) {
				array[i]=parseFloat(array[i]);
			}
			if (firstMetrics){
				firstMetrics=false;
				maxes=array.slice(0);
				mins=array.slice(0);
				maxes[0]='--';
				mins[0]='--';
				maxes[1]='--';
				mins[1]='--';
				maxes[2]='--';
				mins[2]='--';
			}
			fiveFrames.push(array);
			if (fiveFrames.length>5){
				fiveFrames.shift();
			}
			
			scoreTotal+=2*array[2]-1;
			document.getElementById(scoreDiv).innerHTML=scoreTotal;

            document.getElementById('metrics_table').innerHTML=makeTable(array);
        });
		socket.emit ('getMetrics', {nodeID: '25'});
		firstMetrics=true;
		fiveFrames=[];
	}

	var maxes=['--','--','--','--','--','--','--','--','--'];
	var mins=['--','--','--','--','--','--','--','--','--'];
	var avgs=['--','--','--','--','--','--','--','--','--'];
	var targets=['--','<span class="check"></span>','<span class="check"></span>','-35','0','0','0','0','0'];
	var fiveFrames;

	function makeTable(data){
		var tstr='<tr><th></th>';
		var headings=['Frame #','Valid Header','Valid Payload','EVM, dB','RSSI', 'PER', 'Payload Byte Errors','BER: Last Packet', 'Payload Bit Errors'];
		for (var i=0;i<headings.length;i++) {
			tstr+='<th>'+headings[i]+'</th>';
		}
		tstr+='</tr>';

		updateMaxMinAvg(data);
		data=addCheckmarks(data);
		//mins2=addCheckmarks(mins);
		//maxes2=addCheckmarks(maxes);

		tstr+=addRow('Current', data);
		tstr+=addRow('5 Frame Average', avgs);
		tstr+=addRow('Maximum', maxes);
		tstr+=addRow('Minimum', mins);
		tstr+=addRow('Target', targets);

		tstr+='</table>';
		return tstr;
	}

	function updateMaxMinAvg(data){
		for(var i=3;i<data.length;i++){
			if(mins[i]>data[i]){
				mins[i]=data[i];
			}
			if(maxes[i]<data[i]){
				maxes[i]=data[i];
			}
		}

		for(var j=3;j<avgs.length;j++){
			avgs[j]=0;
		}
		for(var i=0;i<fiveFrames.length;i++){
			for(var j=3;j<avgs.length;j++){
				avgs[j]+=fiveFrames[i][j];
			}
		}
		for(var j=3;j<avgs.length;j++){
			avgs[j]=avgs[j]/fiveFrames.length;
		}
	}

	function addCheckmarks(oldData){
		var data=oldData;
		data[1]=Math.round(data[1]);
		if (data[1]==1) {
			data[1]='<span class="check"></span>';
		} else {
			data[1]='<span style="color:red">X<span>';
		}

		data[2]=Math.round(data[2]);
		if (data[2]==1){
			data[2]='<span class="check"></span>';
		} else {
			data[2]='<span style="color:red">X<span>';
		}
		return data;
	}

	function addRow(name, data){
		var tstr='<tr><th>'+name+'</th>';
		for (var i=0;i<data.length;i++) {
			if (i==3 || i==4 || i==5 || i == 6 || i == 7) {
				tstr+='<td>'+parseFloat(data[i]).toFixed(4)+'</td>';
			} else {
				tstr+='<td>'+data[i]+'</td>';
			}
			
		}
		tstr+='</tr>';
		return tstr;
	}

	return thisModule;
}());
