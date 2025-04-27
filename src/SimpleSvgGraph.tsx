import * as d3 from "d3";
import { useEffect, useRef } from "react";

interface NodeType extends d3.SimulationNodeDatum {
  id: string;
  group: string;
  fx?: number | null;
  fy?: number | null;
}

interface LinkType extends d3.SimulationLinkDatum<NodeType> {
  source: string | NodeType;
  target: string | NodeType;
  value: number;
}

const SimpleSvgGraph = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const isNodeType = (node: string | NodeType): node is NodeType => {
    return typeof node === "object";
  };

  useEffect(() => {
    const width = 1400;
    const height = 600;

    const nodes: NodeType[] = [
      { id: "Myriel", group: "team1" },
      { id: "Anne", group: "team1" },
      { id: "Peter", group: "team2" },
      { id: "Jacob", group: "team1" },
      { id: "Tom", group: "team2" },
    ];
  
    const links: LinkType[] = [
      { source: "Peter", target: "Myriel", value: 6 },
      { source: "Anne", target: "Peter", value: 2 },
      { source: "Myriel", target: "Tom", value: 7 },
      { source: "Jacob", target: "Peter", value: 5 },
    ];

    const linksLinked = links.map((d) => ({ ...d }));
    const nodesLinked = nodes.map((d) => ({ ...d }));

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .style("max-width", "100%")
      .style("height", "auto");

    // Creating a force simulation
    const simulation = d3
      .forceSimulation<NodeType>(nodesLinked)
      .force(
        "link",
        d3
          .forceLink<NodeType, LinkType>(linksLinked)
          .id((d) => (d as NodeType).id).distance(150)
      )
      .force("charge", d3.forceManyBody().strength(-1000).distanceMax(1300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // links
    const link = svg
      .append("g")
      .attr("stroke", "#000000")
      .attr("stroke-opacity", 10)
      .selectAll("line")
      .data(linksLinked)
      .join("line")
      .attr("stroke-width",1);

    // nodes
    const node = svg
      .append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll<SVGCircleElement, NodeType>("circle")
      .data(nodesLinked)
      .join("circle")
      .attr("r", 10)
      .attr("fill", "steelblue")
      // .call(drag(simulation));

    const labels = svg
      .append("g")
      .selectAll("text")
      .data(nodesLinked)
      .join("text")
      .attr("text-anchor", "middle")
      .attr("dy", -5)
      .style("font-size", "10px")
      .style("fill", "#000")
      .text((d) => d.id);

    // Updating positions on every tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (isNodeType(d.source) ? d.source.x ?? 0 : 0))
        .attr("y1", (d) => (isNodeType(d.source) ? d.source.y ?? 0 : 0))
        .attr("x2", (d) => (isNodeType(d.target) ? d.target.x ?? 0 : 0))
        .attr("y2", (d) => (isNodeType(d.target) ? d.target.y ?? 0 : 0));

      node.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);
      labels.attr("x", (d) => d.x ?? 0).attr("y", (d) => (d.y ?? 0) - 8);
    });

    // Cleanup effect to prevent memory leaks and duplicate SVGs
    return () => {
      svg.selectAll("*").remove();
      simulation.stop();
    };
  }, []);

  return <svg ref={svgRef} />;
};

export default SimpleSvgGraph;
