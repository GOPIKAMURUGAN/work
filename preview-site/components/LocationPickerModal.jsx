// preview-site/components/LocationPickerModal.jsx
import React, { useState, useEffect } from "react";

// Props:
// show: boolean
// onClose: function
// onSave: function (array of locations)
// initialPositions: array of { lat, lng, label }
// title: string

export default function LocationPickerModal({
  show,
  onClose,
  onSave,
  initialPositions = [],
  title = "Select Locations",
}) {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    setLocations(initialPositions);
  }, [initialPositions]);

  if (!show) return null;

  const handleAddLocation = () => {
    setLocations([...locations, { lat: 0, lng: 0, label: "" }]);
  };

  const handleChange = (index, key, value) => {
    const newLocs = [...locations];
    newLocs[index][key] = key === "label" ? value : parseFloat(value);
    setLocations(newLocs);
  };

  const handleRemove = (index) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(locations);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "10px",
          minWidth: "400px",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <h3>{title}</h3>
        {locations.map((loc, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "8px",
              alignItems: "center",
            }}
          >
            <input
              type="number"
              placeholder="Lat"
              value={loc.lat}
              onChange={(e) => handleChange(idx, "lat", e.target.value)}
              style={{ width: "80px", padding: "4px" }}
            />
            <input
              type="number"
              placeholder="Lng"
              value={loc.lng}
              onChange={(e) => handleChange(idx, "lng", e.target.value)}
              style={{ width: "80px", padding: "4px" }}
            />
            <input
              type="text"
              placeholder="Label"
              value={loc.label}
              onChange={(e) => handleChange(idx, "label", e.target.value)}
              style={{ flex: 1, padding: "4px" }}
            />
            <button
              onClick={() => handleRemove(idx)}
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                background: "red",
                color: "#fff",
                border: "none",
              }}
            >
              X
            </button>
          </div>
        ))}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
          <button
            onClick={handleAddLocation}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              background: "#00AEEF",
              color: "#fff",
              border: "none",
            }}
          >
            Add Location
          </button>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={onClose}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                background: "#ccc",
                border: "none",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                background: "green",
                color: "#fff",
                border: "none",
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
