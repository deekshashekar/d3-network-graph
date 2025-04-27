import { useEffect, useRef } from "react";
import * as d3 from "d3";

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

const InteractiveSvgGraph = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  // --- Refs for D3 selections ---
  const nodeRef = useRef<d3.Selection<SVGCircleElement, NodeType, SVGGElement, unknown> | null>(null);
  const linkRef = useRef<d3.Selection<SVGLineElement, LinkType, SVGGElement, unknown> | null>(null);
  const labelsRef = useRef<d3.Selection<SVGTextElement, NodeType, SVGGElement, unknown> | null>(null);
  const linkLabelsRef = useRef<d3.Selection<SVGTextElement, LinkType, SVGGElement, unknown> | null>(null);

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

  const isNodeType = (node: string | NodeType): node is NodeType => {
    return typeof node === "object" && node !== null && 'id' in node;
  };

      //Dragging behavior
      function drag(simulation: d3.Simulation<NodeType, LinkType>) {
        function dragstarted(
          event: d3.D3DragEvent<SVGCircleElement, NodeType, NodeType>
        ) {
          if (!event.active) simulation.alphaTarget(0.3).restart();
        }
  
        function dragged(
          event: d3.D3DragEvent<SVGCircleElement, NodeType, NodeType>
        ) {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        }
  
        function dragended(
          event: d3.D3DragEvent<SVGCircleElement, NodeType, NodeType>
        ) {
          if (!event.active) simulation.alphaTarget(0);
        }
  
        return d3
          .drag<SVGCircleElement, NodeType>()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended);
      }

      

  useEffect(() => {
    const width = 1400;
    const height = 800;

    const linksLinked = links.map((d) => ({ ...d }));
    const nodesLinked = nodes.map((d) => ({ ...d }));

    // --- Build Adjacency List for Highlighting ---
    const linkedByIndex: { [key: string]: boolean } = {};
    linksLinked.forEach(d => {
        // Note: Simulation resolves string IDs later, so we use strings here.
        const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
        const targetId = typeof d.target === 'string' ? d.target : d.target.id;
        linkedByIndex[`${sourceId},${targetId}`] = true;
        linkedByIndex[`${targetId},${sourceId}`] = true; // For undirected check
    });

    function areNodesConnected(a: NodeType, b: NodeType): boolean {
        return linkedByIndex[`${a.id},${b.id}`] || linkedByIndex[`${b.id},${a.id}`] || a.id === b.id;
    }

 
    
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .style("max-width", "100%")
      .style("height", "auto");

    // Clear previous SVG contents if any
    svg.selectAll("*").remove();
    const g = svg.append("g");
    // --- Add marker definition ---
    svg.append("defs").append("marker")
        .attr("id", "arrowhead")
        .attr("viewBox", "-0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", 0)
        .attr("orient", "auto")
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("xoverflow", "visible")
      .append("svg:path")
        .attr("d", "M 0,-5 L 10 ,0 L 0,5")
        .attr("fill", "#000") // Arrow color
        .style("stroke","none");
        // Create a container group for zoomable content
      

        //zoom behavior
        const zoom = d3.zoom<SVGSVGElement, unknown>().on("zoom", (event) => {
          g.attr("transform", event.transform);
      });
      svg.call(zoom as any);

      // Setting default zoom level
      const defaultScale = 1.5;
      const defaultX = width / 2;
      const defaultY = height / 4;

      svg.call((selection) =>
          zoom.transform(
              selection as d3.Selection<SVGSVGElement, unknown, any, any>,
              d3.zoomIdentity.translate(defaultX, defaultY).scale(defaultScale)
          )
      )
  
    // --- Simulation Setup ---
    const simulation = d3
      .forceSimulation<NodeType, LinkType>(nodesLinked) // Specify both types
      .force(
        "link",
        d3
          .forceLink<NodeType, LinkType>(linksLinked)
          .id((d) => d.id) // Use node ID
      )
      .force("charge", d3.forceManyBody().strength(-1000).distanceMax(1300))
      .force("center", d3.forceCenter(width / 16, height / 16));

    // --- Create Elements & Assign to Refs (Append to g) ---
    linkRef.current = g
      .append("g")
        .attr("class", "links")
        .attr("stroke", "#000000")
        .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(linksLinked)
      .join("line")
        .attr("stroke-width", 1)
        .attr("marker-end", "url(#arrowhead)") as any;

    nodeRef.current = g
      .append("g")
        .attr("class", "nodes")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
      .selectAll<SVGCircleElement, NodeType>("circle")
      .data(nodesLinked)
      .join("circle")
        .attr("r", 5)
        .attr("fill", d => d.group === 'team1' ? "steelblue" : "red") // Color by group
        .call(drag(simulation)) as any;

    labelsRef.current = g
      .append("g")
        .attr("class", "labels")
      .selectAll("text")
      .data(nodesLinked)
      .join("text")
        .attr("text-anchor", "middle")
        .attr("dy", -5)
        .style("font-size", "10px")
        .style("fill", "#000")
        .text((d) => d.id) as any;

    linkLabelsRef.current = g
        .append("g")
          .attr("class", "link-labels")
        .selectAll("text")
        .data(linksLinked)
        .join("text")
          .attr("text-anchor", "middle")
          .style("font-size", "9px")
          .style("fill", "#555")
          .text(d => d.value) as any;

    // --- Hover Interaction Setup ---
    nodeRef.current!.on("mouseover", (event, hoveredNode) => {
        if (!nodeRef.current || !linkRef.current || !labelsRef.current || !linkLabelsRef.current) return;

        // Highlight hovered node
        d3.select(event.currentTarget).attr("stroke", "white").attr("r", 7);

        // Fade others
        nodeRef.current!.style("opacity", d => areNodesConnected(hoveredNode, d) ? 1 : 0.2);
        labelsRef.current!.style("opacity", d => areNodesConnected(hoveredNode, d) ? 1 : 0.2);

        linkRef.current!.style("opacity", l => {
            const sourceNode = isNodeType(l.source) ? l.source : nodesLinked.find(n => n.id === l.source);
            const targetNode = isNodeType(l.target) ? l.target : nodesLinked.find(n => n.id === l.target);
            return (sourceNode && sourceNode.id === hoveredNode.id) || (targetNode && targetNode.id === hoveredNode.id) ? 1 : 0.1;
        });
        linkLabelsRef.current!.style("opacity", l => {
            const sourceNode = isNodeType(l.source) ? l.source : nodesLinked.find(n => n.id === l.source);
            const targetNode = isNodeType(l.target) ? l.target : nodesLinked.find(n => n.id === l.target);
            return (sourceNode && sourceNode.id === hoveredNode.id) || (targetNode && targetNode.id === hoveredNode.id) ? 1 : 0.1;
        });
    });

    nodeRef.current!.on("mouseout", () => {
        if (!nodeRef.current || !linkRef.current || !labelsRef.current || !linkLabelsRef.current) return;

        // Reset styles
        nodeRef.current!.style("opacity", 1).attr("stroke", "#fff").attr("r", 5);
        linkRef.current!.style("opacity", 0.6);
        labelsRef.current!.style("opacity", 1);
        linkLabelsRef.current!.style("opacity", 1);
    });

    // Updating positions on every tick
    simulation.on("tick", () => {
        if (!linkRef.current || !nodeRef.current || !labelsRef.current || !linkLabelsRef.current) return; // Check refs exist

        // Update link positions
        linkRef.current!
            .attr("x1", (d) => (isNodeType(d.source) ? d.source.x ?? 0 : 0))
            .attr("y1", (d) => (isNodeType(d.source) ? d.source.y ?? 0 : 0))
            .attr("x2", (d) => (isNodeType(d.target) ? d.target.x ?? 0 : 0))
            .attr("y2", (d) => (isNodeType(d.target) ? d.target.y ?? 0 : 0));

        // Update node positions
        nodeRef.current!.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);

        // Update node label positions
        labelsRef.current!.attr("x", (d) => d.x ?? 0).attr("y", (d) => (d.y ?? 0) - 8); 

        linkLabelsRef.current!
            .attr("x", d => {
                const sourceX = isNodeType(d.source) ? d.source.x ?? 0 : 0;
                const targetX = isNodeType(d.target) ? d.target.x ?? 0 : 0;
                return (sourceX + targetX) / 2;
            })
            .attr("y", d => {
                const sourceY = isNodeType(d.source) ? d.source.y ?? 0 : 0;
                const targetY = isNodeType(d.target) ? d.target.y ?? 0 : 0;
                return (sourceY + targetY) / 2 - 5;
            });
    });

    // Cleanup effect
    return () => {
      simulation.stop();
  
    };
  }, []);

  return <svg ref={svgRef} />;
};

export default InteractiveSvgGraph;