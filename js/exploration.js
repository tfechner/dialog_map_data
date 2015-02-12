var url = 'https://api.keen.io/3.0/projects/54b6884e96773d36ffcb1d4a/queries/extraction?api_key=95f7c9d5d7af1a8dfc4d5bf22e9e21627ecb74716bd41b7033a5cfe779cc56b6f1d3e761230cd06474a6d837c3c565d3c43dcc1886bde939e6ef53aa78611d4d54aa25fa6c0bec1b645b353912235c076eebb03730719195c7b6e22f3f94bd450813848ae2648ca4267314d2a5e84603&event_collection=tracking'


var width = $(window).width(),
    height = 500,
	barHeight = 20;
	barPadding = 5;
	
var zoom = d3.behavior.zoom()
    .scaleExtent([-10, 10])
    .on("zoom", zoomed);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(zoom);

//Create a ToolTip
	var tooltip = d3.select("body").append("div")   
    .attr("id", "tooltip")
	.style("opacity", 0.9)	
	.classed("hidden", true);	

var color = ["#5C1A6D", "#92FBCD", "#AC0330"];	
	
var container = svg.append("g");

//d3.json(url, function(error, json) {
 // if (error) return console.warn(error);
  keen_data = json.result;

  var nested_keen = d3.nest()
    .key(function(d) { return d.fingerprint; })
    .entries(keen_data);
	
	nested_keen.sort(function(a,b){
	return b.values.length - a.values.length}
	);
	
	
	
	/*var timestamps =[];
	keen_data.forEach(function (d,i) {
		//cleanup this is not needed as the array is sorted later according to the timestamps
		timestamps.push(d.timestamp);
		if(i == keen_data.length-1) keen_data[i].next_timestamp = keen_data.timestamp + 100; 
		else keen_data[i].next_timestamp = keen_data[i+1].timestamp;
		
		//keen_data[i].width = keen_data[i].next_timestamp - keen_data[i].timestamp;
		
	});
	*/
	//Sort the data by timestamp as the events that are send are async.
	nested_keen.forEach(function (d,i) {
		nested_keen[i].values.sort(function(a,b){return a.timestamp - b.timestamp});
		nested_keen[i].values.forEach(function (f,e) {
		
			if(e == nested_keen[i].values.length-1){
				nested_keen[i].values[e].next_timestamp = nested_keen[i].values[e].timestamp + 100;
			}
			else nested_keen[i].values[e].next_timestamp = nested_keen[i].values[e+1].timestamp;
			nested_keen[i].values[e].time = (nested_keen[i].values[e].next_timestamp - nested_keen[i].values[e].timestamp)
		
		});
	});
	
	draw(nested_keen[1]);
	
	
//});

function draw(keen_data_fingerprint) {
	
	var keen_data = keen_data_fingerprint.values
//As we have sorted the data by timestamp we don't have to find the min and max =
	var x = d3.time.scale()
    .domain([keen_data[0].timestamp,keen_data[keen_data.length-1].next_timestamp])
    // .range([0, width-(keen_data.length*20)]);
    .range([0, width]);
	
	keen_data.forEach(function (d,i) {
		console.log( x(keen_data[i].next_timestamp) - x(keen_data[i].timestamp) );
	});
	
	var group = container.selectAll("g")
    .data(keen_data)
    .enter().append("g")
	.attr("class", "chart")	
	.attr("transform", function(d, i) { return "translate("+10*i+",0)"; })
	.on("mouseover", function (d) {
		showTooltip(d, this);
	})
    .on("mouseout", function () {		
		d3.select("#tooltip").classed("hidden", true);;
	});
	
	group.append("circle")
	.attr("cx", function(d) { return x(d.timestamp) } )
    //.attr("height", barHeight - 1);
	.attr("cy",barHeight)
	.attr("r", 2);
	
	group.append("g")
    .attr("transform", function(d, i) { return "translate("+ x(d.timestamp) +","+ barHeight +") rotate(45) "; })
	.append("text")
    .attr("x", 0)
    .attr("y", 8)
    //.attr("dy", ".35em")
    .text(function(d) { 
	if (d.action == "loadPage") return d.url;
	else if  (d.action == "sidebar:contributionMouseEnter") return "Sidebar Mouse Enter: "+d.contribution;
	else if  (d.action == "sidebar:contributionMouseLeave") return "Sidebar Mouse Leave: "+d.contribution;
	else if  (d.action == "sidebar:mouseoverFeatureTag") return "Mouse Over Feature Tag :"+d.tag.properties.title;
	else if  (d.action == "sidebar:clickReply") return "Sidebar Click Reply: "+d.contribution_id; 
	else return d.action;
	});
	
	group.append("g")
	.attr("transform", function(d, i) { return "translate("+(x(d.timestamp)) +",0)"; })
	.append("rect")
	.attr("width", function(d) { return (x(d.next_timestamp) - x(d.timestamp)) } )
	.attr("height", barHeight - 1)
	.attr("fill", function(d) {
            return setRectColor(d,this);
    });
    svg.transition().call(zoom.scale($(window).width()/container.node().getBBox().width).event);

}


function setRectColor(d, context) {

	if (d.action == "loadPage") return color[0];
	else if  (d.action == "sidebar:contributionMouseEnter") return color[1];
	else if  (d.action == "sidebar:contributionMouseLeave") return color[1];
	else if  (d.action == "sidebar:mouseoverFeatureTag") return color[1];
	else if  (d.action == "sidebar:mouseoverFeatureReferenceTag") return color[1];
	else if  (d.action == "sidebar:clickReply") return color[1];
	else if  (d.action == "map:extentchange") return color[1];
	else if  (d.action == "sidebar:clickback") return color[1];
	else if  (d.action == "sidebar:clickToggleFilter") return color[1];
	else if  (d.action == "sidebar:clickLegend") return color[1];
	else if  (d.action == "marker:click") return color[1];
	else if  (d.action == "marker:mouseover") return color[1];
	else if  (d.action == "navigate") return color[1];
	else return  color[2];
}


function zoomed() {
  container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}


function showTooltip(d, context) {
    //Update the to get its dimensions - 
    d3.select("#tooltip")
        .html(JSON.stringify(d, replacer));

    //Get Mouse Cursor Position
    var t_width = parseFloat(d3.select("#tooltip").style("width"));
    var t_height = d3.select("#tooltip").style("height");

    // Für den Arrow per CSS muss hier noch was abgezogen werden.. bla einfach weglassen
    var xPosition = (parseFloat(d3.event.pageX));
    if ((parseFloat(d3.event.pageX) + t_width) > $(document).width()) {
        xPosition = (parseFloat(d3.event.pageX) - t_width);
    }

    //Hier pauschal "etwas" drunter setzen
    var yPosition = (parseFloat(d3.event.pageY) + 10);

    d3.select("#tooltip")
        .style("left", xPosition + "px")
        .style("top", yPosition + "px");
    d3.select("#tooltip").classed("hidden", false);
}

function replacer(key,value)
{
    if (key=="keen") return undefined;
    else if (key=="fingerprint") return undefined;
	else if (key=="map") return undefined;
    else if (key=="geometry") return undefined;
    else if (key=="type") return undefined;
	else if (key=="marker-size") return undefined;
	else if (key=="marker-symbol") return undefined;
	else if (key=="marker-color") return undefined;
	else if (key=="id") return undefined;
	else return value;
}