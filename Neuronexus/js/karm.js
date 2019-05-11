const DATAURL = 'https://gist.githubusercontent.com/karmsidhu'+
	'/d5b91316c786148084d3b9547cb3d015/raw/9eee233dcb56b01f5'+
	'ff3bd114c3614330cc1f69e/allprovinces.csv';

var updatePieBar = null;

d3.csv("./data/AllProvinces.csv", d => {
	return {
		province: d.Province,
		program: d.Program,
		pType: d['Program Type'],
		gvtMinistry: d['Government Ministry (At Present)'],
		pComponent: d['Program Component'],
		units: d.Units,
		year: d['Fiscal Year end date'],
		value: parseFloat(d.value)
	};
})
	.then(loadedData => {
		console.log(`Successfully accessed ${DATAURL}`);

		var model = {
			data: loadedData,
			pieData: null,
			barData: null,
			filterData: (attr, val) => {
				model.data = model.data.filter(d => {
					return d[attr].trim() === val.trim();
				})
			},
			groupBySum: (attr, sumAttr) => {
				model.data =  model.data.reduce(function (acc, obj) {
					var key = obj[attr];
					if (!acc[key]) {
						acc[key] = 0;
					}
					if (obj[sumAttr] >= 0){
						acc[key] += obj[sumAttr];
					}
					return acc;
				}, {});
				model.setPieGraphData();
			},
			setPieGraphData: () => {
				var pieData = [];
				for (var key in model.data){
					pieData.push({
						name: key,
						value: model.data[key]
					});
				}
				model.pieData = pieData;
			},
			setBarGraphData: () => {
				var barData = [];
				for (var key in model.data){
					barData.push({

					});
				}
				model.barData = barData;
			},
			getDistinctValues: (attr) => {
				var allValues = model.data.map(d => {return d[attr];})
				return new Set(allValues);
			},
			resetData: () => {
				model.data = loadedData;
			}
		};

		var handler = {
			resetDataEvent: () => {
				model.resetData();
				view.updateProvinceSelection(model.getDistinctValues('province'));
				d3.select('#pieGraph').html('');
				d3.select('#barGraph').html('');
			},

			filterByProvinceMap: (provName) => {
				var index = view.provSelection.selectedIndex;
					handler.resetDataEvent();
					var province = provName;
					model.filterData('province', province);
					model.filterData('units', 'Millions'); // Needs an option for caseloads
					model.groupBySum(handler.getSelected(), 'value');
					view.provSelection.selectedIndex = index;
					view.pieGraph.generateChart(model.pieData, 500, 500);
					view.barGraph.generateChart(model.pieData, 960, 500)
			},

			filterByProvince: () => {
				var index = view.provSelection.selectedIndex;
				if(index != 0) {
					handler.resetDataEvent();
					var province = view.provSelection[index].text;
					model.filterData('province', province);
					model.filterData('units', 'Millions'); // Needs an option for caseloads
					model.groupBySum(handler.getSelected(), 'value');
					view.provSelection.selectedIndex = index;
					view.pieGraph.generateChart(model.pieData, 500, 500);
					view.barGraph.generateChart(model.pieData, 960, 500)
				}
			},

			initializeEventListeners: () => {
				view.resetButton.addEventListener('click', handler.resetDataEvent);
				view.provSelection.addEventListener('change', handler.filterByProvinceMap);
				view.radioButton.addEventListener('change', handler.filterByProvince);

			},

			getSelected: () => {
				var list = view.radioButton;
				for(var i = 0; i < list.length; i++){
					if(list[i].checked){
						return list[i].defaultValue;
					}	
				}
			}

			
		};

		var view = {
			resetButton: document.getElementById('resetProvinceButton'),
			provSelection: document.getElementById('provinceSelection'),
			radioButton: document.getElementById('dataTypeForm'),
			updateProvinceSelection: (provinces) => {
				view.provSelection.options.length = 1;
				provinces.forEach(province => {
					var prov = document.createElement('option');
					prov.text = province;
					view.provSelection.add(prov);
				})
			},
			pieGraph: {
				pie: (data) => {
					const arcs = d3.pie()
						.sort((a,b) => {return a.value >= b.value})
						.value(data => data.value);
					return arcs(data);
				},
				arc: (width, height, margin) => {
					const arc = d3.arc()
						.innerRadius(Math.min(width, height) / 2 - 100)
						.outerRadius(Math.min(width, height) / 2 - margin);
					return arc;
				},
				arcLabel: (width, height) => {
					const radius = Math.min(width, height) / 2 * 0.8;
					const arcLabel = d3.arc().innerRadius(radius).outerRadius(radius);
					return arcLabel;
				},
				color: (data) => {
					var colors = ["#a6cee3","#1f78b4","#b2df8a",
					"#33a02c","#fb9a99","#e31a1c","#fdbf6f",
					"#ff7f00","#cab2d6","#6a3d9a","#ffff99","#b15928"];
					const color = d3.scaleOrdinal()
						.domain(data)
						.range(d3.schemeDark2);
					return color(data);
				},
				generateChart: (data, width, height) => {
					const arcs = view.pieGraph.pie(data);
					const svg = d3.select('#pieGraph')
						.append('svg')
							.attr('width', width)
							.attr('height', height)
							.attr("text-anchor", "middle")
							.style("font", "12px sans-serif");
					const g = svg.append("g")
						.attr("transform", `translate(${width / 2},${height / 2})`);

					var tooltip = d3.select('#pieGraph')
						.append('div')
							.style('position', 'absolute')
							.style('border', 'solid')
							.style('border-width', '2px')
							// .style('z-index', 100) // need to be wary of layers
							.style('opacity', 0)
							.attr('id', 'tooltip')
							.style('background-color', 'white')
							.style('font', '16px sans-serif')
							.style("padding", "5px");

					var mouseover = function(d) {
						tooltip.style("opacity", 1);
						d3.select(this)
							.style("stroke", "black")
							.style("opacity", 1);
					}
					var mousemove = function(d) {
						tooltip.html(d.data.name + ': ' + d.value.toLocaleString())
							.style("left", (d3.mouse(this)[0]) + "px")
							.style("top", (d3.mouse(this)[1]+200) + "px");
					}
					var mouseleave = function(d) {
						tooltip.style("opacity", 0);
						d3.select(this)
							.style("stroke", 'white')
							.style('stroke-width', '2')
							.style("opacity", 0.8);
					}

					// g.selectAll("path")
					// 	.data(arcs)
					// 	.enter().append("path")
					// 		// .merge(g)
					// 		.attr("fill", d => view.pieGraph.color(d.data.name))
					// 		.attr("stroke", "white")
					// 		.attr('stroke-width', '2')
					// 		.attr('opacity', 0.8)
					// 		// .transition()
					// 		// .duration((d, i) => {return i * 800;})
					// 		.attr("d", view.pieGraph.arc(width, height, 40))
					// 		.on('mouseover', mouseover)
					// 		.on('mousemove', mousemove)
					// 		.on('mouseleave', mouseleave)
					// 	.append("title")
					// 		.text(d => `${d.data.name}: ${d.data.value.toLocaleString()}`);
					// const radius = Math.min(width, height) / 2 * 0.8;
					
					var path = g.selectAll("path")
						.data(view.pieGraph.pie(data))
						.enter().append("path")
						.attr("fill", function(d, i) {return view.pieGraph.color(d.data.name);})
						.transition()
						.duration(1000)
						.attrTween('d', function(d) {
							var i = d3.interpolate(d.startAngle+0.1, d.endAngle);
							return function(t) {
									const arc = d3.arc()
										.innerRadius(0)
										.outerRadius(Math.min(width, height) / 2);
									d.endAngle = i(t);
								return arc(d);}});

					g.selectAll('path')
						.attr("stroke", "white")
						.attr('stroke-width', '2')
						.attr('opacity', 0.8)
						.on('mouseover', mouseover)
						.on('mousemove', mousemove)
						.on('mouseleave', mouseleave)
						.append('title')
							.text(d => `${d.data.name}: ${d.data.value.toLocaleString()}`);

					const text = g.selectAll("text")
						.data(arcs)
						.enter().append("text")
							.attr("transform", d => `translate(${view.pieGraph
								.arcLabel(width, height).centroid(d)})`)
							.attr("dy", "0.35em");
				
					text.filter(d => (d.endAngle - d.startAngle) > 0.25).append("tspan")
						.attr("x", 0)
						.attr("y", "0.7em")
						.attr("fill-opacity", 0.7)
						.text(d => d.data.value.toLocaleString());
				}
			},
			barGraph: {
				generateChart: (data, width, height) => {
					data = data.sort((a,b) => {return d3.ascending(a.value, b.value);});
					var margin = {
            top: 15,
            right: 25,
            bottom: 15,
            left: 60
        	};

        	width = width - margin.left - margin.right;
					height = height - margin.top - margin.bottom;

					var svg = d3.select('#barGraph')
						.append('svg')
							.attr("width", width + margin.left + margin.right)
							.attr("height", height + margin.top + margin.bottom)
						.append("g")
							.attr("transform", 
								"translate(" + margin.left + "," + margin.top + ")");

					var x = d3.scaleLinear()
						.range([0, width])
						.domain([0, d3.max(data, (d) => {return d.value;})]);
			
					var y = d3.scaleBand()
						.range([height, 0])
						.domain(data.map((d) => {return d.name;}))
						.padding(0.1);
					
					svg.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(y));

					var bars = svg.selectAll(".bar")
						.data(data)
						.enter()
						.append("g");

					bars.append("rect")
						.style('fill', d => view.pieGraph.color(d.name))
            .attr("y", d => {return y(d.name);})
            .attr("height", y.bandwidth())
						.attr("width", d => {return x(0);})
						.attr("x", x(0));

					var i = 1; // TODO - Get enumeration working
					bars.selectAll('rect')
						.attr('opacity', 0.8)
						.transition()
						.duration(1000)
						.attr('x', d => {return x(0);})
						.attr('width', d => {return x(d.value);});
						// .delay(d => {return 75*i++}); // TODO: (d, i) => not enumerating
					
					var tooltip = d3.select('#barGraph')
						.append('div')
							.style('position', 'absolute')
							.style('border', 'solid')
							.style('border-width', '2px')
							.style('opacity', 0)
							.attr('id', 'tooltip')
							.style('background-color', 'white')
							.style('font', '16px sans-serif')
							.style("padding", "5px");

					var mouseover = function(d) {
						tooltip.style("opacity", 1);
						d3.select(this)
							.style("stroke", "black")
							.style("opacity", 1);
					}
					var mousemove = function(d) {
						tooltip.html(d.name + ': ' + d.value.toLocaleString())
							.style("left", (d3.mouse(this)[0]) + "px")
							.style("top", (d3.mouse(this)[1]+500) + "px");
					}
					var mouseleave = function(d) {
						tooltip.style("opacity", 0);
						d3.select(this)
							.style("stroke", 'white')
							.style('stroke-width', '2')
							.style("opacity", 0.8);
					}

					bars
						.on('mouseover', mouseover)
						.on('mousemove', mousemove)
						.on('mouseleave', mouseleave);
				}
			},
			scatterGraph: {
				margin: {
					top: 10,
					right: 30, 
					bottom: 30, 
					left: 60
				},
				generateChart: (data, width, height) => {
					width = width - view.scatterGraph.margin.left + 
						view.scatterGraph.margin.right;
					height = height - view.scatterGraph.margin.bottom + 
						view.scatterGraph.margin.top;
					
					var svg = d3.select('#scatterGraph')
						.append('svg');
				}
			}
		};
		handler.initializeEventListeners();
		view.updateProvinceSelection(model.getDistinctValues('province'));
		d3.select('#consoleLogData').on('click', () => {console.log(model.data);});
		updatePieBar = handler.filterByProvinceMap;
	})
	.catch(function(exception){
		console.log(exception);
	});

