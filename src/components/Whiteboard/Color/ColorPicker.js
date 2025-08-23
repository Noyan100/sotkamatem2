import React from "react";

const ColorPicker = ({ color, setColor, defaultColor = "#000000" }) => {
  const handleReset = () => {
    setColor(defaultColor);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
      <span style={{ marginRight: "0px" }}>Цвет:</span>
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        style={{
          width: "30px",
          height: "30px",
          padding: 0,
          borderRadius: "4px",
          cursor: "pointer",
        }}
      />
      <button
        onClick={handleReset}
        style={{
          padding: "2px 6px",
          fontSize: "13px",
          borderRadius: "4px",
          background: "black",
          cursor: "pointer",
          color: "white",
          lineHeight: "20px",
        }}
        title="Сбросить цвет"
      >
        ↺
      </button>
    </div>
  );
};

export default ColorPicker;
