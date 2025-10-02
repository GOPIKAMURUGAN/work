import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import LocationPickerModal from "../components/LocationPickerModal";
import BusinessLocationModal from "../components/BusinessLocationModal";


// ---------------- Update Price Modal ----------------
function UpdatePriceModal({ show, onClose, category, vendorId, onUpdated }) {
  const [price, setPrice] = useState(
    category?.vendorPrice ?? category?.price ?? ""
  );

  useEffect(() => {
    setPrice(category?.vendorPrice ?? category?.price ?? "");
  }, [category]);

  if (!show || !category) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newPrice = parseFloat(price);
    if (isNaN(newPrice)) return alert("Enter a valid number");

    try {
      await axios.put(`http://localhost:5000/api/vendors/${vendorId}/prices`, {
        categoryId: category.id,
        price: newPrice,
      });
      onUpdated(category.id, newPrice);
      onClose();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to update price");
    }
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
          minWidth: "300px",
        }}
      >
        <h3>Update Price: {category.name}</h3>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "10px" }}
        >
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Vendor Price"
            required
            style={{
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
          <div
            style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                background: "#ccc",
                border: "none",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                background: "#00AEEF",
                border: "none",
                color: "#fff",
              }}
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------- Flatten Tree Helper ----------------
function flattenTree(node, rows = [], parentLevels = []) {
  if (!node) return rows;
  const levels = [...parentLevels, node.name ?? "Unnamed"];
  if (!node.children || node.children.length === 0) {
    rows.push({
      id: node._id ?? node.id,
      levels,
      price:
        typeof node.vendorPrice === "number"
          ? node.vendorPrice
          : node.price ?? "-",
      categoryId: node._id ?? node.id,
    });
  } else {
    node.children.forEach((child) => flattenTree(child, rows, levels));
  }
  return rows;
}

// ---------------- Main Component ----------------
export default function VendorStatusListPage() {
  const { categoryId, status } = useParams();
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [tree, setTree] = useState([]);
  const [modalCategory, setModalCategory] = useState(null);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  // New states
  const [showBusinessLocationModal, setShowBusinessLocationModal] =
    useState(false);
  const [selectedVendorForBusiness, setSelectedVendorForBusiness] =
    useState(null);
  const [businessLocations, setBusinessLocations] = useState([]);
  const [homeLocations, setHomeLocations] = useState([]);


  // New states for location modal
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedVendorForLocation, setSelectedVendorForLocation] =
    useState(null);

  useEffect(() => {
    if (!status || !categoryId) return;

    const fetchVendors = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(
          `http://localhost:5000/api/vendors/byCategory/${categoryId}?status=${encodeURIComponent(
            status
          )}`
        );
        setVendors(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch vendors");
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, [status, categoryId]);

  const fetchVendorCategories = async (vendorId) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/vendors/${vendorId}/categories`
      );
      let categories = res.data.categories;
      if (!categories) setTree([]);
      else if (Array.isArray(categories))
        setTree([{ _id: "root", name: "Root", children: categories }]);
      else setTree([{ ...categories, children: categories.children || [] }]);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch vendor categories");
    }
  };

  const handleVendorClick = (vendor) => {
    setSelectedVendor(vendor);
    fetchVendorCategories(vendor._id);
  };

  const handleHomeLocationSave = async (locations) => {
  try {
    await axios.put(
      `http://localhost:5000/api/vendors/${selectedVendorForLocation._id}/location`,
      {
        // Keep existing lat/lng and address if already set, just update nearbyLocations
        lat: selectedVendorForLocation.location?.lat || 0,
        lng: selectedVendorForLocation.location?.lng || 0,
        address: selectedVendorForLocation.location?.address || "",
        nearbyLocations: locations, // homeLocations array
      }
    );

    alert("Home locations saved successfully");

    // Update local vendor state
    setVendors((prev) =>
      prev.map((v) =>
        v._id === selectedVendorForLocation._id
          ? { ...v, location: { ...v.location, nearbyLocations: locations } }
          : v
      )
    );
  } catch (err) {
    console.error(err);
    alert("Failed to save home locations");
  } finally {
    setShowLocationModal(false);
  }
};



  const handlePriceUpdate = (categoryId, newPrice) => {
    setTree((prevTree) => {
      const updateNode = (node) => {
        if (!node) return node;
        if ((node._id ?? node.id) === categoryId)
          return { ...node, vendorPrice: newPrice };
        if (node.children)
          return { ...node, children: node.children.map(updateNode) };
        return node;
      };
      return prevTree.map(updateNode);
    });
  };

  // Save location API call
  const handleLocationSave = async ({ lat, lng, address, nearbyLocations }) => {
    try {
      await axios.put(
        `http://localhost:5000/api/vendors/${selectedVendorForLocation._id}/location`,
        { lat, lng, address, nearbyLocations }
      );
      alert("Location saved successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to save location");
    } finally {
      setShowLocationModal(false);
      setShowBusinessModal(false);
    }
  };

  const rows = tree.flatMap((root) => flattenTree(root));
  const maxLevels = rows.reduce(
    (max, row) => Math.max(max, row.levels.length),
    0
  );
  const levelHeaders = Array.from({ length: maxLevels }, (_, idx) =>
    idx === 0 ? "Category" : `Level ${idx + 1}`
  );

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>{status} Vendors</h1>
      {vendors.length === 0 ? (
        <p>No vendors found in this status.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {vendors.map((v) => (
            <li
              key={v._id}
              style={{
                marginBottom: 12,
                padding: 10,
                border: "1px solid #ccc",
                borderRadius: 6,
              }}
            >
              <p>
                <b>Vendor Name:</b> {v.contactName || "-"}
              </p>
              <p>
                <b>Contact Number:</b>{" "}
                {v.customerId?.fullNumber || v.phone || "-"}
              </p>
              <p>
                <b>Business Name:</b> {v.businessName || "-"}
              </p>

              <button
                onClick={() => handleVendorClick(v)}
                style={{
                  marginTop: 6,
                  padding: "4px 8px",
                  borderRadius: "4px",
                  background: "#00AEEF",
                  color: "#fff",
                  border: "none",
                }}
              >
                View Categories
              </button>

              {/* New Home Location Button */}
              <button
  onClick={() => {
    setSelectedVendorForLocation(v);
    setHomeLocations(v.homeLocations || []); // use array of home locations
    setShowLocationModal(true);
  }}
  style={{
    marginLeft: 10,
    padding: "4px 8px",
    borderRadius: "4px",
    background: "green",
    color: "#fff",
    border: "none",
  }}
>
  Home Location
</button>


              <button
                onClick={() => {
                  setSelectedVendorForBusiness(v);
                  setBusinessLocations(v.businessLocations || []);
                  setShowBusinessLocationModal(true);
                }}
                style={{
                  marginLeft: 10,
                  padding: "4px 8px",
                  borderRadius: "4px",
                  background: "orange",
                  color: "#fff",
                  border: "none",
                }}
              >
                Business Location
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedVendor && (
        <div style={{ marginTop: 30, position: "relative" }}>
          <h2>Categories for {selectedVendor.businessName}</h2>

          {/* Preview button */}
          <button
            onClick={() => {
              if (rows[0]) {
                const categoryIdForPreview = rows[0].categoryId;

                // fallback to vendor location if modal location not set
                const lat =
                  selectedVendorForLocation?.location?.lat ??
                  selectedVendor.location?.lat;
                const lng =
                  selectedVendorForLocation?.location?.lng ??
                  selectedVendor.location?.lng;
                const homeLocs = selectedVendorForLocation?.homeLocations || [];  

                window.open(
                  `http://localhost:3000/preview/${selectedVendor._id}/${categoryIdForPreview}?lat=${lat}&lng=${lng}`,
                  "_blank"
                );
              } else {
                alert("No category available for preview");
              }
            }}
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              padding: "6px 12px",
              borderRadius: 6,
              background: "#2563EB",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Preview
          </button>

          {rows.length === 0 ? (
            <p>No categories found</p>
          ) : (
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  {levelHeaders.map((header, idx) => (
                    <th
                      key={idx}
                      style={{ border: "1px solid #ccc", padding: "8px" }}
                    >
                      {header}
                    </th>
                  ))}
                  <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                    Price
                  </th>
                  <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    {levelHeaders.map((_, idx) => (
                      <td
                        key={idx}
                        style={{ border: "1px solid #ccc", padding: "8px" }}
                      >
                        {row.levels[idx] ?? "-"}
                      </td>
                    ))}
                    <td>{row.price}</td>
                    <td>
                      <button
                        onClick={() =>
                          setModalCategory({
                            id: row.categoryId,
                            name: row.levels.slice(-1)[0],
                            vendorPrice: row.price,
                          })
                        }
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          background: "#00AEEF",
                          color: "#fff",
                          border: "none",
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modals */}
      <UpdatePriceModal
        show={!!modalCategory}
        onClose={() => setModalCategory(null)}
        category={modalCategory}
        vendorId={selectedVendor?._id}
        onUpdated={handlePriceUpdate}
      />

      <LocationPickerModal
  show={showLocationModal}
  onClose={() => setShowLocationModal(false)}
  onSave={handleHomeLocationSave}
  initialPositions={homeLocations} // pass array
  title="Manage Home Locations"
/>

      <BusinessLocationModal
        show={showBusinessLocationModal}
        locations={businessLocations}
        onClose={() => setShowBusinessLocationModal(false)}
        onSave={async (newLocations) => {
          try {
            await axios.put(
              `http://localhost:5000/api/vendors/${selectedVendorForBusiness._id}/businessLocations`,
              { locations: newLocations }
            );
            setBusinessLocations(newLocations);

            // Update vendor list locally
            setVendors((prev) =>
              prev.map((v) =>
                v._id === selectedVendorForBusiness._id
                  ? { ...v, businessLocations: newLocations }
                  : v
              )
            );

            alert("Business locations updated");
          } catch (err) {
            console.error(err);
            alert("Failed to update business locations");
          }
        }}
      />
    </div>
  );
}
