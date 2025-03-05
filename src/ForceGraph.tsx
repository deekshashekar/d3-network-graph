// import { useEffect, useMemo, useRef } from "react";

// import * as d3 from "d3";

// const ForceGraph = ({ nodes, links }: { nodes: any[]; links: any[] }) => {
//   const svgRef = useRef<SVGSVGElement>(null);

//   const filterLinksByNodes = (nodes: any[], links: any[]) => {
//     const nodeIds = new Set(nodes.map((node) => node.id));

//     return links.filter(
//       (link) => nodeIds.has(link.source) && nodeIds.has(link.target)
//     );
//   };

//   const filteredLinks = useMemo(
//     () => filterLinksByNodes(nodes, links),
//     [nodes, links]
//   );

//   const connectedNodeIds = new Set<string>();

//   const { connectedLinks, unconnectedNodes } = useMemo(() => {
//     const filteredLinks = filterLinksByNodes(nodes, links);

//     filteredLinks.forEach((link) => {
//       connectedNodeIds.add(link.source);

//       connectedNodeIds.add(link.target);
//     });

//     const unconnectedNodes = nodes.filter(
//       (node) => !connectedNodeIds.has(node.id)
//     );

//     return { connectedLinks: filteredLinks, unconnectedNodes };
//   }, [links, nodes]);

//   const calculateAverageScores = (scoresByGroup: Record<string, number[]>) => {
//     const averages: Record<string, number> = {};

//     Object.keys(scoresByGroup).forEach((groupKey) => {
//       const scores = scoresByGroup[groupKey];

//       const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;

//       averages[groupKey] = avg;
//     });

//     return averages;
//   };

//   //Calculating average score of target from a source

//   const averageScoresByLink = useMemo(() => {
//     const scoresByLink: Record<string, number[]> = {};

//     links.forEach((link) => {
//       const linkKey = `${link.source}-${link.target}`;

//       if (!scoresByLink[linkKey]) {
//         scoresByLink[linkKey] = [];
//       }

//       scoresByLink[linkKey].push(Number(link.score));
//     });

//     return calculateAverageScores(scoresByLink);
//   }, [links]);

//   // Calculating total average score of target from all sources

//   const averageScores = useMemo(() => {
//     const scoresByEmployee: Record<string, number[]> = {};

//     links.forEach((link) => {
//       if (!scoresByEmployee[link.target]) {
//         scoresByEmployee[link.target] = [];
//       }

//       scoresByEmployee[link.target].push(Number(link.score));
//     });

//     return calculateAverageScores(scoresByEmployee);
//   }, [links]);

//   //Defining color range for the scores

//   const colorScale = useMemo(() => {
//     return d3

//       .scaleLinear<string>()

//       .domain([0, 7, 10])

//       .range(["#f76868", "#9fde3c", "#064a17"]);
//   }, []);

//   const nodesWithColor = useMemo(() => {
//     const scoresByNode: Record<string, number[]> = {};

//     links.forEach((link) => {
//       if (!scoresByNode[link.target]) {
//         scoresByNode[link.target] = [];
//       }

//       scoresByNode[link.target].push(Number(link.score));
//     });

//     return nodes

//       .filter((node) => connectedNodeIds.has(node.id))

//       .map((node) => {
//         const hasScore = scoresByNode[node.id]?.length > 0;

//         return {
//           ...node,

//           color: hasScore ? colorScale(averageScores[node.id] || 0) : "#999",
//         };
//       });
//   }, [nodes, links, averageScores, colorScale]);

//   const isBidirectionalLink = (link: any, links: any[]) => {
//     return links.some(
//       (l) => l.source === link.target && l.target === link.source
//     );
//   };

//   useEffect(() => {
//     const width = 800;

//     const height = 500;

//     const svg = d3.select(svgRef.current as SVGSVGElement);

//     svg.selectAll("*").remove();
//     const g = svg.append("g");
//     const defs = svg.append("defs");
//     const nodeGradient = defs

//       .append("radialGradient")

//       .attr("id", "nodeGradient")

//       .attr("cx", "50%")

//       .attr("cy", "50%")

//       .attr("r", "50%");

//     nodeGradient

//       .append("stop")

//       .attr("offset", "0%")

//       .attr("stop-color", "#ffcc00");

//     nodeGradient

//       .append("stop")

//       .attr("offset", "100%")

//       .attr("stop-color", "#ff6600");

//     svg

//       .append("defs")

//       .append("marker")

//       .attr("id", "arrow")

//       .attr("viewBox", "0 -5 10 10")

//       .attr("refX", 15)

//       .attr("refY", 0)

//       .attr("markerWidth", 6)

//       .attr("markerHeight", 6)

//       .attr("orient", "auto")

//       .append("path")

//       .attr("d", "M0,-5L10,0L0,5")

//       .attr("fill", "#999");

//     //zoom behavior

//     const zoom = d3.zoom<SVGSVGElement, unknown>().on("zoom", (event) => {
//       g.attr("transform", event.transform);
//     });

//     svg.call(zoom);

//     // Setting default zoom level

//     const defaultScale = 0.3;

//     const defaultX = width / 2;

//     const defaultY = height / 2;

//     svg.call((selection) =>
//       zoom.transform(
//         selection as d3.Selection<SVGSVGElement, unknown, any, any>,

//         d3.zoomIdentity.translate(defaultX, defaultY).scale(defaultScale)
//       )
//     );

//     function highlightNode(nodeData: { id: any }) {
//       node.attr("opacity", (d) => (d.id === nodeData.id ? 1 : 0.2));

//       link.attr("opacity", (l) =>
//         l.source.id === nodeData.id || l.target.id === nodeData.id ? 1 : 0.2
//       );

//       node.attr("opacity", (d) =>
//         d.id === nodeData.id ||
//         links.some((l) => l.source.id === d.id && l.target.id === nodeData.id)
//           ? 1
//           : 0.2
//       );
//     }

//     function resetHighlight() {
//       node.attr("opacity", 1);

//       link.attr("opacity", 1);
//     }

//     const simulation = d3

//       .forceSimulation(nodesWithColor)

//       .force(
//         "link",

//         d3

//           .forceLink(links)

//           .id((d: any) => d.id)

//           .distance(200)
//       )

//       .force("x", d3.forceX(900).strength(0.01))

//       .force("charge", d3.forceManyBody().strength(-300))

//       .force("center", d3.forceCenter(width / 2, height / 2))

//       .alphaDecay(0.01);

//     // Unconnected nodes simulation

//     const unconnectedSimulation = d3

//       .forceSimulation(unconnectedNodes)

//       .force("x", d3.forceX(-500).strength(0.01))

//       .force("y", d3.forceY(height / 2).strength(0.01))

//       .force("charge", d3.forceManyBody().strength(-100));

//     const link = g

//       .append("g")

//       .attr("stroke", "#999")

//       .attr("stroke-opacity", 0.6)

//       .selectAll("line")

//       .data(filteredLinks)

//       .join("line")

//       .attr("stroke-width", 2.6)

//       .attr("marker-end", (d: any) => {
//         const reverseLinkExists = isBidirectionalLink(d, filteredLinks);

//         return reverseLinkExists && d.source.id > d.target.id
//           ? null
//           : "url(#arrow)";
//       });

//     const node = g

//       .append("g")

//       .attr("stroke", "#fff")

//       .attr("stroke-width", 1.5)

//       .selectAll("circle")

//       .data(nodesWithColor)

//       .join("circle")

//       .attr("r", 15)

//       .attr("fill", (d) => d.color)

//       .on("mouseover", (event, d) => highlightNode(d))

//       .on("mouseout", resetHighlight)

//       .on("click", (event, d) => highlightNode(d))

//       .call(
//         d3

//           .drag<any, any>()

//           .on("start", (event, d: any) => {
//             if (!event.active) simulation.alphaTarget(0.3).restart();

//             d.fx = d.x;

//             d.fy = d.y;

//             simulation.force("charge", d3.forceManyBody().strength(-10));
//           })

//           .on("drag", (event, d: any) => {
//             d.fx = event.x;

//             d.fy = event.y;
//           })

//           .on("end", (event, d: any) => {
//             if (!event.active) simulation.alphaTarget(0);

//             d.fx = event.x;

//             d.fy = event.y;

//             simulation.force("charge", d3.forceManyBody().strength(-200));
//           })
//       );

//     // Add unconnected nodes to the graph

//     const unconnectedNodeCircles = g

//       .append("g")

//       .attr("stroke", "#fff")

//       .attr("stroke-width", 1.5)

//       .selectAll("circle")

//       .data(unconnectedNodes)

//       .join("circle")

//       .attr("r", 15)

//       .attr("fill", "#999")

//       .call(
//         d3

//           .drag<any, any>()

//           .on("start", (event, d: any) => {
//             if (!event.active) unconnectedSimulation.alphaTarget(0.3).restart();

//             d.fx = d.x;

//             d.fy = d.y;
//           })

//           .on("drag", (event, d: any) => {
//             d.fx = event.x;

//             d.fy = event.y;
//           })

//           .on("end", (event, d: any) => {
//             if (!event.active) unconnectedSimulation.alphaTarget(0);

//             d.fx = null;

//             d.fy = null;
//           })
//       );

//     const unconnectedLabels = g

//       .append("g")

//       .selectAll("text")

//       .data(unconnectedNodes)

//       .join("text")

//       .attr("text-anchor", "middle")

//       .attr("dy", -20)

//       .style("font-size", "10px")

//       .style("fill", "#fff")

//       .text((d: any) => d.label || d.id);

//     const labels = g

//       .append("g")

//       .selectAll("text")

//       .data(nodesWithColor)

//       .join("text")

//       .attr("text-anchor", "middle")

//       .attr("dy", -15)

//       .style("font-size", "10px")

//       .style("fill", "#fff")

//       .text((d: any) => d.label);

//     const linkLabels = g

//       .append("g")

//       .selectAll("text")

//       .data(filteredLinks)

//       .join("text")

//       .attr("text-anchor", "middle")

//       .style("font-size", "10px")

//       .style("fill", "#fff")

//       .text((d: any) => {
//         const linkKey = `${d.source.id || d.source}-${d.target.id || d.target}`;

//         const isBidirectional = isBidirectionalLink(d, filteredLinks);

//         // Displaying score in one direction for bidirectional links

//         if (isBidirectional) {
//           if ((d.source.id || d.source) < (d.target.id || d.target)) {
//             return averageScoresByLink[linkKey] !== undefined
//               ? averageScoresByLink[linkKey]?.toFixed(1)
//               : "";
//           } else {
//             return "";
//           }
//         }

//         //Displaying score for unidirectional links

//         return averageScoresByLink[linkKey] !== undefined
//           ? averageScoresByLink[linkKey]?.toFixed(1)
//           : "";
//       });

//     const parallelLinkLabels = g

//       .append("g")

//       .attr("class", "parallel-link-labels");

//     const parallelLinksMap = new Map();

//     simulation.on("tick", () => {
//       link

//         .attr("x1", (d: any) => d.source.x)

//         .attr("y1", (d: any) => d.source.y)

//         .attr("x2", (d: any) => d.target.x)

//         .attr("y2", (d: any) => d.target.y)

//         .each(function (d: any) {
//           const isBidirectional = isBidirectionalLink(d, filteredLinks);

//           if (isBidirectional) {
//             if (!parallelLinksMap.has(d)) {
//               const parallelLink = d3

//                 .select(this)

//                 .clone(true)

//                 .attr("stroke", "#999")

//                 .attr("stroke-opacity", 0.6)

//                 .attr("marker-end", null);

//               parallelLinksMap.set(d, parallelLink);

//               parallelLinkLabels

//                 .append("text")

//                 .datum(d)

//                 .attr("class", "parallel-link-label")

//                 .attr("font-size", "10px")

//                 .attr("fill", "#fff")

//                 .text((d: any) => {
//                   const linkKey = `${d.source.id || d.source}-${
//                     d.target.id || d.target
//                   }`;

//                   const isBidirectional = isBidirectionalLink(d, filteredLinks);

//                   if (isBidirectional && d.source.id > d.target.id) {
//                     return averageScoresByLink[linkKey] !== undefined
//                       ? averageScoresByLink[linkKey]?.toFixed(1)
//                       : "";
//                   }

//                   return "";
//                 });
//             }

//             const parallelLink = parallelLinksMap.get(d);

//             const offset = 10;

//             if (parallelLink) {
//               parallelLink

//                 .attr("x1", d.source.x + offset)

//                 .attr("y1", d.source.y + offset)

//                 .attr("x2", d.target.x + offset)

//                 .attr("y2", d.target.y + offset)

//                 .attr("marker-end", (d: any) => {
//                   const reverseLinkExists = filteredLinks.some(
//                     (link: any) =>
//                       link.source === d.target && link.target === d.source
//                   );

//                   return reverseLinkExists && d.source.id < d.target.id
//                     ? null
//                     : "url(#arrow)";
//                 });

//               parallelLinkLabels

//                 .selectAll(".parallel-link-label")

//                 .attr("x", (d: any) => (d.source.x + d.target.x) / 2 + offset)

//                 .attr("y", (d: any) => (d.source.y + d.target.y) / 2 + offset);
//             }
//           }
//         });

//       node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);

//       labels.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y - 15);

//       linkLabels

//         .attr("x", (d: any) => (d.source.x + d.target.x) / 2)

//         .attr("y", (d: any) => (d.source.y + d.target.y) / 2);
//     });

//     unconnectedSimulation.on("tick", () => {
//       unconnectedNodeCircles

//         .attr("cx", (d: any) => d.x)

//         .attr("cy", (d: any) => d.y);

//       unconnectedLabels

//         .attr("x", (d: any) => d.x)

//         .attr("y", (d: any) => d.y - 20);
//     });

//     return () => {
//       simulation.stop();

//       unconnectedSimulation.stop();
//     };
//   }, [nodes, links, connectedLinks, unconnectedNodes]);

//   return <svg ref={svgRef} width="100vw" height="100vh" />;
// };

// export default ForceGraph;
