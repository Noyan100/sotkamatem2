import React from "react";

const OpacitySlider = ({ setOpacity }) => {
  return (
    <input
      type="range"
      min="0"
      max="1"
      step="0.1"
      onChange={(e) => setOpacity(parseFloat(e.target.value))}
    />
  );
};

export default OpacitySlider;
