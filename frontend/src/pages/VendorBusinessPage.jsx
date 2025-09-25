import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";


// Modal for updating vendor price
function UpdatePriceModal({ show, onClose, category, vendorId, onUpdated }) {
  const [price, setPrice] = useState(category?.vendorPrice ?? "");

  useEffect(() => {
    setPrice(category?.vendorPrice ?? "");
  }, [category]);

  if (!show || !category) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newPrice = parseFloat(price);
    if (isNaN(newPrice)) {
      alert("Please enter a valid number for price");
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/api/vendors/${vendorId}/prices`,
        { categoryId: category.id, price: newPrice },
        { headers: { "Content-Type": "application/json" } }
      );
      onUpdated();
      onClose();
    } catch (err) {
      console.error("PUT /prices error:", err.response?.data || err.message);
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
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "flex-end",
            }}
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

// Flatten category tree to only leaf nodes, keeping full path
function flattenTree(node, rows = [], parentLevels = []) {
  if (!node) return rows;
  const levels = [...parentLevels, node.name ?? "Unnamed"];

  // Only push leaf nodes
  if (!node.children || node.children.length === 0) {
    rows.push({
      id: node.id,
      levels,
      price: node.vendorPrice ?? node.defaultPrice ?? "-",
      categoryId: node.id,
    });
  } else {
    node.children.forEach((child) => flattenTree(child, rows, levels));
  }

  return rows;
}

export default function VendorBusinessPage() {
  const { vendorId } = useParams();
  const [vendor, setVendor] = useState(null);
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCategory, setModalCategory] = useState(null);

  const fetchTree = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/vendors/${vendorId}/categories`
      );
      setVendor(res.data.vendor);

      const rootCategory = res.data.categories;
      if (rootCategory) {
        setTree([{ ...rootCategory, children: rootCategory.children || [] }]);
      } else {
        setTree([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Failed to fetch vendor categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, [vendorId]);

  const rows = tree.flatMap((root) => flattenTree(root));

  // Determine max levels dynamically
  const maxLevels = rows.reduce(
    (max, row) => Math.max(max, row.levels.length),
    0
  );
  const levelHeaders = Array.from({ length: maxLevels }, (_, idx) =>
    idx === 0 ? "Category" : `Level ${idx + 1}`
  );

  return (
    <div>
      <h1>{vendor?.businessName || "Vendor Business Categories"}</h1>
      
      {vendor && (
        <p>
          <b>Vendor Name:</b> {vendor.contactName} <br />
          <b>Phone:</b> {vendor.phone}
        </p>
      )}

      {/* 🔹 Preview button at top-right */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "10px",
        }}
      >
        {/* Preview button */}
        <button
          onClick={() => {
            if (!vendorId || !rows[0]?.categoryId) {
              alert("No category found to preview");
              return;
            }
            // Use path params to match Next.js dynamic route
            window.open(
              `http://localhost:3000/preview/${vendorId}/${rows[0].categoryId}`,
              "_blank"
            );
          }}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            background: "green",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Preview
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : rows.length === 0 ? (
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
                        name: row.levels[row.levels.length - 1],
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

      <UpdatePriceModal
        show={!!modalCategory}
        onClose={() => setModalCategory(null)}
        category={modalCategory}
        vendorId={vendorId}
        onUpdated={fetchTree}
      />
    </div>
  );
}
