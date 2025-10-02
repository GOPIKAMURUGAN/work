// components/BusinessLocationModal.jsx
import { useState, useEffect } from "react";

export default function BusinessLocationModal({ show, onClose, locations = [], onSave }) {
  const [localLocations, setLocalLocations] = useState([]);

  useEffect(() => {
    setLocalLocations(locations);
  }, [locations]);

  if (!show) return null;

  const handleAdd = () => {
    if (localLocations.length >= 5) return alert("Maximum 5 locations allowed");
    setLocalLocations([...localLocations, ""]);
  };

  const handleChange = (idx, value) => {
    const updated = [...localLocations];
    updated[idx] = value;
    setLocalLocations(updated);
  };

  const handleDelete = (idx) => {
    const updated = [...localLocations];
    updated.splice(idx, 1);
    setLocalLocations(updated);
  };

  const handleSave = () => {
    const filtered = localLocations.filter((loc) => loc.trim() !== "");
    onSave(filtered);
    onClose();
  };

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
    }}>
      <div style={{ background: "#fff", padding: 20, borderRadius: 10, minWidth: 300 }}>
        <h3>Business Locations</h3>
        {localLocations.map((loc, idx) => (
          <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
            <input
              type="text"
              value={loc}
              onChange={(e) => handleChange(idx, e.target.value)}
              placeholder={`Location ${idx + 1}`}
              style={{ flex: 1, padding: 6, borderRadius: 6, border: "1px solid #ccc" }}
            />
            <button
              onClick={() => handleDelete(idx)}
              style={{ background: "red", color: "#fff", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}
            >
              Delete
            </button>
          </div>
        ))}
        <button
          onClick={handleAdd}
          style={{ background: "#00AEEF", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", marginBottom: 12, cursor: "pointer" }}
        >
          + Add Location
        </button>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            onClick={onClose}
            style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: "#00AEEF", color: "#fff", cursor: "pointer" }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
