// frontend/src/components/LocationPickerModal.jsx
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Fix default marker icon paths (Leaflet + CRA)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Marker that can be clicked or dragged
function ClickableMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  if (!position || !Array.isArray(position)) return null;

  return (
    <Marker
      position={position}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const { lat, lng } = e.target.getLatLng();
          setPosition([lat, lng]);
        },
      }}
    />
  );
}

export default function LocationPickerModal({
  show,
  onClose,
  onSave,
  initialPosition,
  nearbyLocations: initialNearby = [],
  title = "Pick Location",
}) {
  const defaultPosition = [13.0827, 80.2707]; // Chennai fallback

  const [position, setPosition] = useState(initialPosition || defaultPosition);
  const [nearbyLocations, setNearbyLocations] = useState(initialNearby);

  // Reset state when modal opens or initial props change
 useEffect(() => {
  if (!show) return;
  setPosition(initialPosition ? [...initialPosition] : [...defaultPosition]);
  setNearbyLocations(initialNearby ? [...initialNearby] : []);
}, [show]);


  if (!show) return null;

  const handleSave = () => {
    if (!position || !Array.isArray(position)) {
      return alert("Pick a location on the map first");
    }
    onSave({ lat: position[0], lng: position[1], nearbyLocations });
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000,
      }}
    >
      <div
        style={{
          width: "90%",
          maxWidth: 900,
          height: "80%",
          background: "#fff",
          borderRadius: 12,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 12,
            borderBottom: "1px solid #eee",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: 0 }}>{title}</h3>
          <div>
            <button onClick={onClose} style={{ marginRight: 8, padding: "6px 10px" }}>
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{ padding: "6px 10px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6 }}
            >
              Save
            </button>
          </div>
        </div>

        {/* Map */}
        <div style={{ flex: 1, position: "relative" }}>
          <MapContainer center={position} zoom={13} style={{ width: "100%", height: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ClickableMarker position={position} setPosition={setPosition} />
          </MapContainer>
        </div>

        {/* Nearby Locations */}
        <div style={{ padding: 12 }}>
          <h4>Nearby Locations (up to 5)</h4>
          {Array.from({ length: 5 }).map((_, idx) => (
            <input
              key={idx}
              type="text"
              placeholder={`Nearby Location ${idx + 1}`}
              value={nearbyLocations[idx] || ""}
              onChange={(e) => {
                const copy = [...nearbyLocations];
                copy[idx] = e.target.value;
                setNearbyLocations(copy);
              }}
              style={{ display: "block", marginBottom: 6, width: "100%", padding: 6 }}
            />
          ))}
        </div>

        {/* Selected Coordinates */}
        <div style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            Selected: {position?.[0]?.toFixed?.(6) ?? "-"}, {position?.[1]?.toFixed?.(6) ?? "-"}
          </div>
          <button
            onClick={() => {
              if (!Array.isArray(position)) setPosition(initialPosition || defaultPosition);
            }}
            style={{ padding: "6px 12px" }}
          >
            Use This Location
          </button>
        </div>
      </div>
    </div>
  );
}
