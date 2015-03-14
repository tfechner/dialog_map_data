var url = 'https://api.keen.io/3.0/projects/54b6884e96773d36ffcb1d4a/queries/extraction?api_key=95f7c9d5d7af1a8dfc4d5bf22e9e21627ecb74716bd41b7033a5cfe779cc56b6f1d3e761230cd06474a6d837c3c565d3c43dcc1886bde939e6ef53aa78611d4d54aa25fa6c0bec1b645b353912235c076eebb03730719195c7b6e22f3f94bd450813848ae2648ca4267314d2a5e84603&event_collection=tracking'

//ToDo: INclude: https://github.com/jsmreese/moment-duration-format

var width = $(window).width()-100,
    height = 300,
	barHeight = 50,
	barPadding = 5;

var session_timer = 300000;	// 60 Minuten

//Create a ToolTip
	var tooltip = d3.select("body").append("div")   
    .attr("id", "tooltip")
	.style("opacity", 0.9)	
	.classed("hidden", true);	

var color_map = ["#326B5F","#70AC2D","#446329","#55B5A4","#70A460","#48BD5C"]	
var color_page =["#784C20","#CB4B23","#CD9433","#CC7E4F"]
	


//d3.json(url, function(error, json) {
 // if (error) return console.warn(error);
  keen_data = json.result;

  var nested_keen = d3.nest()
    .key(function(d) { return d.fingerprint; })
    .entries(keen_data);
	
	//Sort by length of the array to have the biggest& most active first.
	nested_keen.sort(function(a,b){
	return b.values.length - a.values.length}
	);
	
	
	

	nested_keen.forEach(function (d,i) {
		//Sort the data per user by the timestamp as the events that are send are async.
		nested_keen[i].values.sort(function(a,b){return a.timestamp - b.timestamp});

		var one_session = [];
		var all_session = [];

		//Sorted by fingerprint access individual user values		
		nested_keen[i].values.forEach(function (individual_value,e) {

			if(e == nested_keen[i].values.length-1){
				nested_keen[i].values[e].next_timestamp = nested_keen[i].values[e].timestamp + 1000; // + 1000 to get an idea of the last action - it is not shown if it has no duration;
			}
			else{
				nested_keen[i].values[e].next_timestamp = nested_keen[i].values[e+1].timestamp;	
			} 
			var action_timestamp = moment(nested_keen[i].values[e].timestamp)
			var action_next_timestamp = moment(nested_keen[i].values[e].next_timestamp)
			var action_duration = moment.duration(action_next_timestamp.diff(action_timestamp));


			nested_keen[i].values[e].time = action_duration.valueOf();
			nested_keen[i].values[e].time_human = action_duration;
				
			if(nested_keen[i].values[e].time > session_timer){
				nested_keen[i].values[e].time_threshold_hit = true;
				//console.log(nested_keen[i].key+" "+nested_keen[i].values[e].time_human);
			} 
			else{
				nested_keen[i].values[e].time_threshold_hit = false;
			}


			if(nested_keen[i].values[e].time_threshold_hit)
			{
				//Modify the "next_timestamp" element as we use it to draw the boxes to something sensible.
				//Add the element to the session where the time threshold was hit e.g. pls one second 1000
				nested_keen[i].values[e].next_timestamp = nested_keen[i].values[e].timestamp + 1000;
				one_session.push(nested_keen[i].values[e]);
				//push sessions to all sessions
				all_session.push(one_session);
				//clear for addtional sessions
				one_session = [];
			}
			else one_session.push(nested_keen[i].values[e]);

		});


		var a = moment(nested_keen[i].values[0].timestamp);
		var b = moment(nested_keen[i].values[nested_keen[i].values.length-1].timestamp);

		nested_keen[i].timespent_total = moment.duration(b.diff(a));

		//push the last session to all sessions.
		all_session.push(one_session);
		//persist it
		nested_keen[i].all_session = all_session;
		//console.log(nested_keen[i].timespent_total);
		nested_keen[i].timespent_total_human = nested_keen[i].timespent_total.humanize();

	});

/*
var non_idle_users = nested_keen.filter(function (d) {
	return d.values.length > 2
});
console.log("Non-Idle Users: "+ non_idle_users.length);

var removed_trolls = non_idle_users.filter(function (d) {
	return d.timespent_total > 0
});
console.log("Users looking at homepage more than 10 sec: "+ removed_trolls.length);
*/

var users_with_one_session = nested_keen.filter(function (d) {
	return d.all_session.length < 2
});
console.log("Users with one Session: "+ users_with_one_session.length);

var users_with_multiple_sessions = nested_keen.filter(function (d) {
	return d.all_session.length>1
});
console.log("Users with multiple Sessions: "+ users_with_multiple_sessions.length);
console.log("Total Amount of users: "+ nested_keen.length)


prepare_divs(users_with_one_session);
console.log("Shown # of Users with one session: "+ users_with_one_session.length)

//draw(nested_keen[16])

function prepare_divs(nested_keen) {
	var divs = d3.select("body")
	.selectAll("div")
	.data(nested_keen,function(d){
		//console.log(d);
		return d;})
	.data(nested_keen)
	.enter()
	.append("div")
	.attr("id", function(d) {
		return "fingerprint_"+d.key
	})
	
	nested_keen.forEach(function (d,i) {
		draw(nested_keen[i]);
	});
};

function draw(keen_data_fingerprint) {
	
	//Not nice but I'm too lazy to change this
	var zoom = d3.behavior.zoom()
    .scaleExtent([-10, 10])
    .on("zoom", zoomed);

	function zoomed(key) {
	  g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
	}

	var container = d3.select("#fingerprint_"+keen_data_fingerprint.key)
	.append("svg")
	.attr("width", width)
    .attr("height", height)
	.call(zoom)

	var g = container.append("g");

	var keen_data = keen_data_fingerprint.values

	var x = d3.time.scale()
    .domain([keen_data[0].timestamp,keen_data[keen_data.length-1].next_timestamp])
    .range([0, width]);
	
    g.append("text")
    .attr("x",0)
    .attr("y",barHeight*2)
    //.attr("dy", ".35em")
    .text("Fingerprint:"+ keen_data_fingerprint.key 
    	+" Number of actions "+ keen_data_fingerprint.values.length
    	+" Session Time: "+keen_data_fingerprint.timespent_total_human);

	var group = g.selectAll("g")
    .data(keen_data)
    .enter()
    .append("g")
	.attr("class", "chart")	
	.attr("transform", function(d, i) { return "translate("+0*i+",0)"; });

	/*
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
	*/

	
	group.append("g")
	.attr("transform", function(d, i) { return "translate("+(x(d.timestamp)) +",0)"; })
	.append("rect")
	.attr("width", function(d) { return (x(d.next_timestamp) - x(d.timestamp)) } )
	.attr("height", barHeight - 1)
	.attr("fill", function(d) {
            return setRectColor(d,this);
    });

    //g.transition().call(zoom.scale(width/container.node().getBBox().width).event);

}


function setRectColor(d, context) {

	//Map Actions
	if  (d.action == "map:extentchange") return color_map[0];
	else if  (d.action == "navigate") return color_map[1];
	
	else if  (d.action == "marker:click") return color_map[2];
	else if  (d.action == "marker:mouseover") return color_map[2];
	
	//Sidebar Actions
	else if  (d.action == "sidebar:contributionMouseEnter") return color_map[5];
	else if  (d.action == "sidebar:contributionMouseLeave") return color_map[5];
	else if  (d.action == "sidebar:mouseoverFeatureTag") return color_map[5];
	else if  (d.action == "sidebar:mouseoverFeatureReferenceTag") return color_map[5];
	else if  (d.action == "sidebar:clickReply") return color_map[5];
	else if  (d.action == "sidebar:clickback") return color_map[5];
	else if  (d.action == "sidebar:clickToggleFilter") return color_map[5];
	else if  (d.action == "sidebar:clickLegend") return color_map[5];
	
	else if (d.action == "loadPage") return color_page[0];
	//else return  color_page[3];
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

function draw_old(keen_data_fingerprint, div_id) {
	
	var svg = d3.select("body")
	.append("div")
    //.attr("id", function(d) { return d.label; })
	.append("svg")
    .attr("width", width)
    .attr("height", height);
    //.call(zoom);
	
	var container = svg.append("g");
	
	var keen_data = keen_data_fingerprint.values
	//As we have sorted the data by timestamp we don't have to find the min and max =
	var x = d3.time.scale()
    .domain([keen_data[0].timestamp,keen_data[keen_data.length-1].next_timestamp])
    // .range([0, width-(keen_data.length*20)]);
    .range([0, width]);
	
	/*keen_data.forEach(function (d,i) {
		console.log( x(keen_data[i].next_timestamp) - x(keen_data[i].timestamp) );
	});
	*/
	
	
	var group = container.selectAll("g")
    .data(keen_data)
    .enter().append("g")
	.attr("class", "chart")	
	.attr("transform", function(d, i) { return "translate("+0*i+",0)"; })
	.on("mouseover", function (d) {
		//showTooltip(d, this);
	})
    .on("mouseout", function () {		
		//d3.select("#tooltip").classed("hidden", true);;
	});
	
	/*group.append("circle")
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
	*/
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