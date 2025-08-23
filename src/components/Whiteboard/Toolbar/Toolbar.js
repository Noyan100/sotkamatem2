import React from "react";

const Toolbar = ({ children }) => {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        padding: "10px",
        background: "white",
        borderRadius: "8px",
        boxShadow: "0 0 10px rgba(0,0,0,0.2)",
        zIndex: 1000,
        pointerEvents: "auto",
        display: "flex",
        gap: "10px",
      }}
    >
      {children}
    </div>
  );
};

export default Toolbar;
