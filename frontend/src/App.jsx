import React from "react";
import FileUpload from "./FileUpload.jsx";

function App() {
  return (
    <div style={{ 
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      margin: 0,
      padding: 0,
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      {/* Main container with max width for desktop */}
      <div style={{
        width: "100%",
        maxWidth: "1200px",
        minHeight: "100vh",
        margin: "0 auto",
        padding: "0"
      }}>
        <FileUpload />
      </div>
    </div>
  );
}

export default App;