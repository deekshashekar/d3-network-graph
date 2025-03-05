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

const Graph = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const isNodeType = (node: string | NodeType): node is NodeType => {
    return typeof node === "object";
  };

  useEffect(() => {
    const width = 928;
    const height = 600;

    const nodes: NodeType[] = [
      { id: "Myriel", group: "team1" },
      { id: "Anne", group: "team1" },
      { id: "Constance", group: "team1" },
      { id: "Jacob", group: "team1" },
      { id: "Peter", group: "team1" },
      { id: "Julia", group: "team1" },
      { id: "Tom", group: "team1" },
      { id: "Mason", group: "team1" },
      { id: "Max", group: "team1" },
      { id: "Russel", group: "team1" },
    ];

    const links: LinkType[] = [
      { source: "Anne", target: "Myriel", value: 1 },
      { source: "Anne", target: "Peter", value: 2 },
      { source: "Anne", target: "Constance", value: 2 },
      { source: "Russel", target: "Jacob", value: 1 },
      { source: "Julia", target: "Myriel", value: 3 },
      { source: "Constance", target: "Tom", value: 1 },
      { source: "Mason", target: "Peter", value: 1 },
      { source: "Myriel", target: "Max", value: 1 },
      { source: "Myriel", target: "Jacob", value: 1 },
      { source: "Peter", target: "Constance", value: 1 },
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
          .id((d) => (d as NodeType).id) // Explicitly cast as NodeType
      )
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Dragging behavior
    function drag(simulation: d3.Simulation<NodeType, undefined>) {
      function dragstarted(
        event: d3.D3DragEvent<SVGCircleElement, NodeType, NodeType>,
        d: NodeType
      ) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(
        event: d3.D3DragEvent<SVGCircleElement, NodeType, NodeType>,
        d: NodeType
      ) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(
        event: d3.D3DragEvent<SVGCircleElement, NodeType, NodeType>,
        d: NodeType
      ) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }

      return d3
        .drag<SVGCircleElement, NodeType>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    // links
    const link = svg
      .append("g")
      .attr("stroke", "#000000")
      .attr("stroke-opacity", 10)
      .selectAll("line")
      .data(linksLinked)
      .join("line")
      .attr("stroke-width", (d) => Math.sqrt(d.value));

    // nodes
    const node = svg
      .append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll<SVGCircleElement, NodeType>("circle")
      .data(nodesLinked)
      .join("circle")
      .attr("r", 5)
      .attr("fill", "steelblue")
      .call(drag(simulation));

    // Updating positions on every tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (isNodeType(d.source) ? d.source.x ?? 0 : 0))
        .attr("y1", (d) => (isNodeType(d.source) ? d.source.y ?? 0 : 0))
        .attr("x2", (d) => (isNodeType(d.target) ? d.target.x ?? 0 : 0))
        .attr("y2", (d) => (isNodeType(d.target) ? d.target.y ?? 0 : 0));

      node.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);
    });

    // Cleanup effect to prevent memory leaks and duplicate SVGs
    return () => {
      svg.selectAll("*").remove();
      simulation.stop();
    };
  }, []);

  return <svg ref={svgRef} />;
};

export default Graph;
