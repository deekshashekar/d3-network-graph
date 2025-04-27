import { JSX, useState } from "react";
import "./App.css";
import SimpleSvgGraph from "./SimpleSvgGraph";
import SimpleCanvasGraph from "./SimpleCanvasGraph";
import InteractiveSvgGraph from "./InteractiveSvgGraph";
import InteractiveCanvasGraph from "./InteractiveCanvasGraph";

type TabKey = "svg" | "canvas" | "svgInteractive" | "canvasInteractive";

interface Tab {
  key: TabKey;
  label: string;
  component: JSX.Element;
}

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("canvas"); // Default to svg tab

  // Define the tabs configuration
  const tabs: Tab[] = [
    {
      key: "canvas",
      label: "Simple graph using canvas",
      component: <SimpleCanvasGraph />, 
    },
    { key: "svg", label: "Simple graph using svg", component: <SimpleSvgGraph /> },
    {
      key: "canvasInteractive",
      label: "Interactive graph using canvas",
      component: <InteractiveCanvasGraph />, 
    },
    {
      key: "svgInteractive",
      label: "Interactive graph using svg",
      component: <InteractiveSvgGraph />,
    },
    
  ];

  const activeComponent = tabs.find((tab) => tab.key === activeTab)?.component;

  return (
    <>
      <h1 style={{ display: "flex", justifyContent: "center" }}>
        {" "}
        Visualisation with D3
      </h1>
      {/* Tab buttons */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "10px 20px",
              margin: "0 5px",
              cursor: "pointer",
              border: "1px solid #ccc",
              backgroundColor: activeTab === tab.key ? "#e0e0e0" : "#fff",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Display the active component */}
      <div>{activeComponent}</div>
    </>
  );
}

export default App;
