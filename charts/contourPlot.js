(function() {

	var points = raw.models.points();

	points.dimensions().remove('size');
	points.dimensions().remove('label');
	points.dimensions().remove('color');

	var chart = raw.chart()
		.title('Contour Plot')
		.description(
			"It shows the estimated density of point clouds, which is especially useful to avoid overplotting in large datasets.<br/>Based on <a href='https://bl.ocks.org/mbostock/7f5f22524bd1d824dd53c535eda0187f'>Density Contours II</a>")
		.thumbnail("imgs/contourplot.png")
		.category('Dispersion')
		.model(points)

	var width = chart.number()
		.title("Width")
		.defaultValue(1000)
		.fitToWidth(true)

	var height = chart.number()
		.title("Height")
		.defaultValue(500)

	//left margin
	var marginLeft = chart.number()
		.title('Left Margin')
		.defaultValue(40)

	var bandwidth = chart.number()
		.title("Standard deviation")
		.defaultValue(40)

	var colorMode = chart.list()
		.title("Colors applied to")
		.values(["Stroke", "Fill"])
		.defaultValue("Stroke")

	var useZero = chart.checkbox()
		.title("Set origin at (0,0)")
		.defaultValue(false)

	var colors = chart.color()
		.title("Color scale")

	var showPoints = chart.checkbox()
		.title("Show points")
		.defaultValue(true);

	var showLegend = chart.checkbox()
		.title("show legend")
		.defaultValue(false);

	chart.draw(function(selection, data) {

		// Retrieving dimensions from model
		var x = points.dimensions().get('x'),
			y = points.dimensions().get('y'),
			legendWidth = 100;

		//define margins
		var margin = {
			top: 0,
			right: showLegend() ? legendWidth : 0,
			bottom: 20,
			left: marginLeft()
		};

		// calculate size
		var w = width() - margin.left - margin.right,
			h = height() - margin.bottom - margin.top;

		// create the selection
		var g = selection
			.attr("width", +width())
			.attr("height", +height())
			.append("g")
			.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

		var xExtent = !useZero() ? d3.extent(data, function(d) {
				return d.x;
			}) : [0, d3.max(data, function(d) {
				return d.x;
			})],
			yExtent = !useZero() ? d3.extent(data, function(d) {
				return d.y;
			}) : [0, d3.max(data, function(d) {
				return d.y;
			})];

		var xScale = x.type() == "Date" ?
			d3.scaleTime().range([0, w]).domain(xExtent) :
			d3.scaleLinear().range([0, w]).domain(xExtent);

		var yScale = y.type() == "Date" ?
			d3.scaleTime().range([h, 0]).domain(yExtent) :
			d3.scaleLinear().range([h, 0]).domain(yExtent);

		var xAxis = d3.axisBottom(xScale).tickSize(6, -h);
		var yAxis = d3.axisLeft(yScale).ticks(10).tickSize(6, -w);

		g.append("clipPath")
			.attr("id", "clip")
			.append("rect")
			.attr("class", "mesh")
			.attr("width", w)
			.attr("height", h);

		var contours = d3.contourDensity()
			.x(function(d) {
				return xScale(d.x);
			})
			.y(function(d) {
				return yScale(d.y);
			})
			.size([w, h])
			.bandwidth(bandwidth())
			(data);

		colors.domain(contours, function(d) {
			return d.value;
		});

		var contourPaths = g.insert("g", "g")
			.attr("clip-path", "url(#clip)")
			.attr("stroke-linejoin", "round")
			.selectAll("path")
			.data(contours)
			.enter().append("path")
			.attr("d", d3.geoPath());

		if (colorMode() == "Fill") {

			contourPaths.attr("fill", function(d) {
					return colors()(d.value)
				})
				.attr("stroke", "none")

		} else if (colorMode() == "Stroke") {

			contourPaths.attr("stroke", function(d) {
					return colors()(d.value)
				})
				.attr("fill", "none")
		}

		var point = g.selectAll("g.point")
			.data(data)
			.enter().append("g")
			.attr("class", "point")

		point.append("circle")
			.filter(function() {
				return showPoints();
			})
			.style("fill", "#000")
			.attr("transform", function(d) {
				return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")";
			})
			.attr("r", 1);

		g.append("g")
			.attr("class", "y axis")
			.call(yAxis);

		g.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + h + ")")
			.call(xAxis);

		g.selectAll(".axis")
			.selectAll("text")
			.style("font", "10px Arial, Helvetica")

		g.selectAll(".axis")
			.selectAll("path")
			.style("fill", "none")
			.style("stroke", "#000000")
			.style("shape-rendering", "crispEdges")

		g.selectAll(".axis")
			.selectAll("line")
			.style("fill", "none")
			.style("stroke", "#000000")
			.style("shape-rendering", "crispEdges")

		if (showLegend()) {
			var newLegend = raw.legend()
				.legendWidth(legendWidth)
				.addColor('Density', colors())
			selection.call(newLegend);
		}
	})
})();
