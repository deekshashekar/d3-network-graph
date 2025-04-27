import { useEffect, useRef } from "react";
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

const SimpleCanvasGraph = () => {
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
     const initForceGraph = (canvas: HTMLCanvasElement) => {
       const context = canvas.getContext("2d");
       if (!context) return () => {};       
       const width = 1400;
       const height = 600;
       canvas.width = width;
       canvas.height = height;

       // force simulation setup
       const simulation = d3.forceSimulation<NodeType>(nodes)
         .force("link", d3.forceLink<NodeType, LinkType>(links).id(d => d.id).distance(200))
         .force("charge", d3.forceManyBody().strength(-150))
         .force("center", d3.forceCenter(width / 2, height / 2))
         .on("tick", render); // this calls render on each tick

       function render() {
         if (!context) return;
         context.clearRect(0, 0, width, height);

         // Draw links
         links.forEach((link) => {
           const source = link.source as NodeType;
           const target = link.target as NodeType;
           context.beginPath();
           context.moveTo(source.x!, source.y!);
           context.lineTo(target.x!, target.y!);
           context.strokeStyle = "#999";
           context.lineWidth = 1;
           context.stroke();
         });

         // Draw nodes
         nodes.forEach((node) => {
           context.beginPath();
           context.arc(node.x!, node.y!, 10, 0, 2 * Math.PI);
           context.fillStyle = node.group === "team1" ? "blue" : "red";
           context.fill();

           context.fillStyle = "#000";
           context.font = "10px sans-serif";
           context.textAlign = "center";
           context.textBaseline = "middle";
           context.fillText(node.id, node.x!, node.y! - 18);
         });
       }

       render();

       return () => {
         simulation.stop();
       };
     }

     useEffect(() => {
       const canvas = canvasRef.current;
       if (!canvas) return;
      
       const cleanup = initForceGraph(canvas);
       return cleanup;
     }, []);
    
     return <canvas ref={canvasRef} />;
};

export default SimpleCanvasGraph