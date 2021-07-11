export default function define(runtime, observer) {
  const main = runtime.module();
  const fileAttachments = new Map([["schema.json", new URL("/api/schema", import.meta.url)]]);

  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));

  main.variable("viewof tile").define("viewof tile", ["d3", "html"], function (d3, html) {
    const options = [];

    const form = html`<form style="display: flex; align-items: center; min-height: 33px;"><select name=i>${options.map(o => Object.assign(html`<option>`, { textContent: o.name, selected: o.selected }))}`;
    form.i.onchange = () => form.dispatchEvent(new CustomEvent("input"));
    form.oninput = () => form.value = d3.treemapBinary;
    form.oninput();

    return form;
  });

  main.variable("tile").define("tile", ["Generators", "viewof tile"], (G, _) => G.input(_));

  main.variable(observer("chart")).define("chart", ["treemap", "data", "d3", "width", "height", "color"],
    function (treemap, data, d3, width, height, color) {
      const root = treemap(data);

      const svg = d3.create("svg")
        .attr("viewBox", [-8, 30, width, height])
        .style("font", "10px open-sans")
        .attr("class", "schema");;

      const leaf = svg.selectAll("g")
        .data(root.leaves())
        .join("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

      // Add boxes for the classes
      leaf
        .append("rect")
        .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
        .attr("fill-opacity", 0.8)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0);

      // Add title for the classes
      leaf
        .append("a")
        .attr("xlink:href", function (d) { return "/classes/" + d.data.type; })
        .append("text")
        .selectAll("tspan")
        .data(d => d.data.name.split(/(?=[A-Z][a-z])|\s+/g).concat(d.data.uid))
        .join("tspan")
        .attr("x", 3)
        .attr("y", (d, i) => `${1 + i * 0.9}em`)
        .text(d => d);

      // Add title for the categories
      svg
        .selectAll("categories")
        .data(root.descendants().filter(function (d) { return d.depth == 1 }))
        .enter()
        .append("a")
        .attr("xlink:href", function (d) { return "/categories/" + d.data.type; })
        .append("text")
        .attr("x", function (d) { return d.x0 + 5 })
        .attr("y", function (d) { return d.y0 + 20 })
        .text(function (d) { return d.data.name })
        .style("font", "13px open-sans")
        .attr("fill", function (d) { return color(d.data.name) });

      return svg.node();
    }
  );

  main.variable("data").define("data", ["FileAttachment"], function (FileAttachment) {
    return (FileAttachment("schema.json").json())
  });

  main.variable("treemap").define("treemap", ["d3", "tile", "width", "height"], function (d3, tile, width, height) {
    return (
      data => d3.treemap()
        .tile(tile)
        .size([width, height])
        .paddingTop(28)
        .paddingRight(7)
        .paddingInner(1) // Padding between each rectangle
        .round(true)
        (d3.hierarchy(data).sum(d => d.value)))
  });

  main.variable("width").define("width", function () { return (950) });
  main.variable("height").define("height", function () { return (850) });
  main.variable("format").define("format", ["d3"], function (d3) { return (d3.format(",d")) });
  main.variable("color").define("color", ["d3"], function (d3) { return (d3.scaleOrdinal(d3.schemeCategory10)) });
  main.variable("d3").define("d3", ["require"], function (require) { return (require("d3@6")) });

  return main;
}