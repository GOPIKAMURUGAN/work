import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

export default function VendorStatusListPage() {
  const { categoryId, status } = useParams();
  const [vendors, setVendors] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catRes, vendorsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/categories/${categoryId}`),
        axios.get(
          `http://localhost:5000/api/vendors/byCategory/${categoryId}?status=${encodeURIComponent(
            status
          )}`
        ),
      ]);
      setCategory(catRes.data);
      setVendors(vendorsRes.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, status]);

  return (
    <div>
      <h2>
        {category?.name || "Category"} - {status} Vendors
      </h2>
      {loading ? (
        <div>Loading...</div>
      ) : vendors.length === 0 ? (
        <div>No vendors found</div>
      ) : (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ccc", padding: 8 }}>Business</th>
              <th style={{ border: "1px solid #ccc", padding: 8 }}>Contact</th>
              <th style={{ border: "1px solid #ccc", padding: 8 }}>Phone</th>
              <th style={{ border: "1px solid #ccc", padding: 8 }}>Category</th>
              <th style={{ border: "1px solid #ccc", padding: 8 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v._id}>
                <td style={{ border: "1px solid #ccc", padding: 8 }}>{v.businessName}</td>
                <td style={{ border: "1px solid #ccc", padding: 8 }}>{v.contactName}</td>
                <td style={{ border: "1px solid #ccc", padding: 8 }}>
                  {v.customerId?.fullNumber || v.phone}
                </td>
                <td style={{ border: "1px solid #ccc", padding: 8 }}>{v.categoryId?.name}</td>
                <td style={{ border: "1px solid #ccc", padding: 8 }}>
                  <button
                    onClick={() => navigate(`/vendors/${v._id}`)}
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}



