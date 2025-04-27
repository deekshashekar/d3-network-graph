import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";

interface NodeType extends d3.SimulationNodeDatum {
  id: string;
  group: string;
 }
 interface LinkType extends d3.SimulationLinkDatum<NodeType> {
  source: string | NodeType;
  target: string | NodeType;
  score: number;
 }

const InteractiveCanvasGraph = () => {
  const nodes: NodeType[] = [
    { id: "Myriel", group: "team1" },
    { id: "Anne", group: "team2" },
    { id: "Bob", group: "team1" },
    { id: "Charles", group: "team2" }
  ];
  const links: LinkType[] = [
    { source: "Anne", target: "Myriel", score: 3 },
    { source: "Bob", target: "Myriel", score: 5 },
    { source: "Charles", target: "Anne", score: 8 },
    { source: "Bob", target: "Anne", score: 6 }
  ];
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentTransform = useRef(d3.zoomIdentity);
  const hoveredNodeRef = useRef<any>(null);
  const unconnectedPositions = useRef<Map<string, {x: number, y: number, fx: number | null, fy: number | null}>>(new Map());

  const nodeConnectionsMap = useMemo(() => {
    const connectionsMap: Record<string, Set<string>> = {};
    
    nodes.forEach(node => {
      connectionsMap[node.id] = new Set();
    });
    
    // Add connections based on links
    links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      if (connectionsMap[sourceId]) {
        connectionsMap[sourceId].add(targetId);
      }
      if (connectionsMap[targetId]) {
        connectionsMap[targetId].add(sourceId);
      }
    });
    
    return connectionsMap;
  }, [nodes, links]);

  const initForceGraph = (canvas: HTMLCanvasElement) => {
    const context = canvas.getContext("2d");
    const width = (canvas.width = 1410);
    const height = (canvas.height = 800);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context?.scale(dpr, dpr);
    let needsUpdate = true;
    let animationFrameId: number | undefined;

    const connectedNodeIds = new Set(
      links.flatMap((link) => [
        typeof link.source === 'object' ? link.source.id : link.source,
        typeof link.target === 'object' ? link.target.id : link.target
      ])
    );
    const connectedNodes = nodes.filter((node) => connectedNodeIds.has(node.id));


    const quadtree = d3.quadtree<any>()
      .x((d) => d.x || 0)
      .y((d) => d.y || 0)
      .addAll(connectedNodes);

    const simulation = d3
      .forceSimulation(connectedNodes as d3.SimulationNodeDatum[])
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(300))
      .force("charge", d3.forceManyBody().strength(-1000).distanceMax(1300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50))
      .force("x", d3.forceX(width / 2).strength(0.07))
      .force("y", d3.forceY(height / 2).strength(0.07))
      .alphaDecay(0.005)
      .velocityDecay(0.3)
      .on("tick", () => {
        // Update quadtree on each tick for accurate positions
        quadtree.addAll(connectedNodes);
        needsUpdate = true;
      });

    function getMousePosition(event: any) {
      const point = d3.pointer(event, canvas);
      return {
        x: (point[0] - currentTransform.current.x) / currentTransform.current.k,
        y: (point[1] - currentTransform.current.y) / currentTransform.current.k
      };
    }

    function findNodeAtPosition(point: { x: number; y: number }) {
      const searchRadius = 15; 
      
      // Use quadtree to find the nearest connected node
      const connectedNode = quadtree.find(point.x, point.y, searchRadius);
      if (connectedNode) {
        if (Math.hypot((connectedNode.x || 0) - point.x, (connectedNode.y || 0) - point.y) < searchRadius) {
          return { node: connectedNode, isConnected: true };
        }
      }
      
      
      return null;
    }

    const dragBehavior = d3.drag<HTMLCanvasElement, any>()
      .container(() => canvas)
      .filter(event => !event.ctrlKey && !event.button)
      .subject((event) => {
        const point = getMousePosition(event);
        const result = findNodeAtPosition(point);
        if (!result) return;
        
        const { node, isConnected } = result;
        
        if (isConnected) {
          return { x: node.x, y: node.y, data: node, isConnected };
        } else {
          const pos = unconnectedPositions.current.get(node.id);
          if (!pos) return;
          return { x: pos.x, y: pos.y, data: node, isConnected };
        }
      })
      .on("start", (event) => {
        if (!event.subject) return;
        
        if (event.subject.isConnected) {
          if (!event.active) simulation.alphaTarget(0.3);
          const d = event.subject.data;
          d.fx = event.x;
          d.fy = event.y;
        } else {
          const pos = unconnectedPositions.current.get(event.subject.data.id);
          if (pos) {
            pos.fx = event.x;
            pos.fy = event.y;
          }
        }
        
        canvas.style.cursor = "grabbing";
      })
      .on("drag", (event) => {
        if (!event.subject) return;
        
        if (event.subject.isConnected) {
          const d = event.subject.data;
          d.fx = event.x;
          d.fy = event.y;
        } else {
          const pos = unconnectedPositions.current.get(event.subject.data.id);
          if (pos) {
            pos.x = event.x;
            pos.y = event.y;
            pos.fx = event.x;
            pos.fy = event.y;
          }
        }
        
        needsUpdate = true;
      })
      .on("end", (event) => {
        if (!event.subject) return;
        
        if (event.subject.isConnected) {
          if (!event.active) simulation.alphaTarget(0);
          // Connected nodes keep their position
        } else {
          const pos = unconnectedPositions.current.get(event.subject.data.id);
          if (pos) {
            // Retaining the fixed position for unconnected nodes
            pos.x = event.x;
            pos.y = event.y;
            pos.fx = event.x;
            pos.fy = event.y;
          }
        }
        
        canvas.style.cursor = "default";
        needsUpdate = true;
      });

    d3.select(canvas).call(dragBehavior);
    
    canvas.addEventListener("mousemove", (event) => {
      const pos = getMousePosition(event);
      const result = findNodeAtPosition(pos);
      const node = result ? result.node : null;
      
      if (node !== hoveredNodeRef.current) {
        hoveredNodeRef.current = node || null;
        needsUpdate = true;
        canvas.style.cursor = node ? "pointer" : "default";
      }
    });

    function render() {
      if (needsUpdate && context) {
        needsUpdate = false;
        context.save();
        context.clearRect(0, 0, width, height);
        context.translate(currentTransform.current.x, currentTransform.current.y);
        context.scale(currentTransform.current.k, currentTransform.current.k);

        const hoveredNodeId = hoveredNodeRef.current ? hoveredNodeRef.current.id : null;
        
        // Draw links
        links.forEach((link) => {
          const source = link.source as any;
          const target = link.target as any;
          const sourceId = typeof source === 'object' ? source.id : source;
          const targetId = typeof target === 'object' ? target.id : target;
          
          const isHighlighted = hoveredNodeId && (
            sourceId === hoveredNodeId || 
            targetId === hoveredNodeId
          );

          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dr = Math.sqrt(dx * dx + dy * dy);

          const curveOffset = 20;
          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2;
          
          const normalX = -dy / dr * curveOffset;
          const normalY = dx / dr * curveOffset;
          const controlX = midX + normalX;
          const controlY = midY + normalY;

          // Set opacity based on hover state
          const opacity = hoveredNodeId && !isHighlighted ? 0.15 : 1;
          
          // Draw curved path
          context.beginPath();
          context.moveTo(source.x, source.y);
          context.quadraticCurveTo(controlX, controlY, target.x, target.y);
          
          // Highlight connections to hovered node
          const linkColor = isHighlighted ? "#100" : "#999";
          context.strokeStyle = hoveredNodeId 
            ? isHighlighted ? linkColor : `rgba(153, 153, 153, ${opacity})` 
            : linkColor;
          context.lineWidth = isHighlighted ? 2 : 1.5;
          context.stroke();

          // Arrowhead
          const angle = Math.atan2(target.y - controlY, target.x - controlX);
          const arrowLength = 25;
          context.beginPath();
          context.moveTo(target.x, target.y);
          context.lineTo(
            target.x - arrowLength * Math.cos(angle - Math.PI / 10),
            target.y - arrowLength * Math.sin(angle - Math.PI / 10)
          );
          context.lineTo(
            target.x - arrowLength * Math.cos(angle + Math.PI / 10),
            target.y - arrowLength * Math.sin(angle + Math.PI / 10)
          );
          context.closePath();
          context.fillStyle = hoveredNodeId 
            ? isHighlighted ? linkColor : `rgba(153, 153, 153, ${opacity})` 
            : linkColor;
          context.fill();

          // Score label
          const labelPosition = 0.6;
          const labelX = source.x + (controlX - source.x) * labelPosition;
          const labelY = source.y + (controlY - source.y) * labelPosition;
          
          context.textBaseline = "middle";
          context.textAlign = "center";
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = "high";
          context.font = "12px sans-serif";
          context.fillStyle = hoveredNodeId 
            ? isHighlighted ? "#000" : `rgba(255, 255, 255, ${opacity})` 
            : "#000";
          const noddyScore = link.score;
          context.fillText(noddyScore ? noddyScore.toFixed(1) : "", labelX, labelY);
        });

        // Draw connected nodes
        connectedNodes.forEach((node) => {
          const isHovered = hoveredNodeRef.current && node.id === hoveredNodeRef.current.id;
          const isConnectedToHovered = hoveredNodeRef.current && 
            nodeConnectionsMap[hoveredNodeRef.current.id]?.has(node.id);
          
          const shouldHighlight = isHovered || isConnectedToHovered;
          const opacity = hoveredNodeId && !shouldHighlight ? 0.2 : 1;
          
          context.beginPath();
          context.arc(node.x!, node.y!, shouldHighlight ? 18 : 15, 0, 2 * Math.PI);
          let fillColor = node.group === "team1" ? "blue" : "red";
          
          if (shouldHighlight) {
            context.shadowColor = "#ffffff";
            context.shadowBlur = 15;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;
            context.fillStyle = "#499"

          } else {
            if (hoveredNodeId) {
              const color = d3.color(fillColor);
              if (color) {
                color.opacity = opacity;
                context.fillStyle = color.toString();
              } else {
                context.fillStyle = `rgba(153, 153, 153, ${opacity})`;
              }
            } else {
              context.fillStyle = fillColor;
            }
          }
          context.fill();
          
          // Reset shadow
          context.shadowColor = "transparent";
          context.shadowBlur = 0;
          
          // Apply opacity to text for non-highlighted nodes
          const labelColor = shouldHighlight ? "#010" : "#000";
          context.fillStyle = hoveredNodeId && !shouldHighlight 
            ? `rgba(255, 255, 255, ${opacity})` 
            : labelColor;
          context.font = shouldHighlight ? "bold 18px sans-serif" : "18px sans-serif";
          context.fillText(node.id, node.x! + 12, node.y! + 18);
        });

        context.restore();
      }
      animationFrameId = requestAnimationFrame(render);
    }

    render();

    const zoomBehavior = d3.zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.05, 4])
      .on("zoom", (event) => {
        currentTransform.current = event.transform;
        needsUpdate = true;
      });

    d3.select(canvas).call(zoomBehavior);

    const initialScale = 0.7; 
    // Calculate translation to keep the center in view at the initial scale
    const initialX = (width - width * initialScale) / 2;
    const initialY = (height - height * initialScale) / 2;

    // Create the initial transform object
    const initialTransform = d3.zoomIdentity
      .translate(initialX, initialY)
      .scale(initialScale);

    // Apply this transform to the zoom behavior
    d3.select(canvas).call(zoomBehavior.transform, initialTransform);

    // Update the ref to match the initial state
    currentTransform.current = initialTransform;
    needsUpdate = true;

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      simulation.stop();
      canvas.removeEventListener("mousemove", () => {});
      d3.select(canvas)
        .on(".drag", null)
        .on(".zoom", null);
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const cleanup = initForceGraph(canvas);
    return cleanup;
  }, [nodes, links]);

  return <canvas ref={canvasRef} />;
};

export default InteractiveCanvasGraph;