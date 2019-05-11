var width = 900;
var height = 250;

var active = d3.select(null);//keep track of active province

var mapSVG = d3.select("#map")
  .append("svg")
  .attr("width", width)
  .attr("height", height)

var canadaMap = mapSVG.append("g").attr("id", "mapGroup");
var projection = d3.geoMercator()
                    .scale(450)
                    .translate([width*1.2, height*2.4]);

var path = d3.geoPath().projection(projection);

var selectedProvince = null;

//Changes filter and the color of active province
function changeFilter(d){

  //check if selected provinces is already active
  //reset if true
  //otherwise remove active from current, and make selection active
  if(active.node() === this) return reset();
  active.classed("active", false);
  active = d3.select(this).classed("active", true);

  //change the title (Potentially remove)
  filterText.text(this.__data__.properties.name);

  //call updateChart from LineChart.js
  //this.__data__.properties.name == Province name (string)
  updateLineChart(this.__data__.properties.name);
  updatePieBar(this.__data__.properties.name);
}

//reset selection
function reset(){
  active.classed("active", false);
  active = d3.select(null);
}

//load map data
d3.json("./data/canadaprovtopo.json")
.then(function(canada){

  //draw the provinces
  canadaMap.selectAll("path")
        .data(topojson.feature(canada, canada.objects.canadaprov).features)
        .enter().append("path")
        .attr("d", path)
        .attr("class", "provBorders")
        .on("click", changeFilter);


 }).catch(function(error){ console.log("Something went Horribly Wrong!");})