import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function VendorPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/vendors");
      setVendors(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  return (
    <div>
      <h1>Vendors</h1>
      {loading ? (
        <div>Loading...</div>
      ) : vendors.length === 0 ? (
        <div>No activated vendors yet</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: 16,
          }}
        >
          {vendors.map((v) => (
            <div
              key={v._id} // ✅ use _id
              style={{
                border: "1px solid #ccc",
                borderRadius: 8,
                padding: 12,
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <h3>{v.businessName}</h3>
              <p>
                Mobile No: {v.customerId?.fullNumber || v.phone || "N/A"} <br />
                Contact Name: {v.contactName || "N/A"} <br />
                Category: {v.categoryId?.name || "N/A"}
              </p>
              <button
                onClick={() => navigate(`/vendors/${v._id}`)} // ✅ navigate using _id
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: "#00AEEF",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                View Business
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VendorPage;
