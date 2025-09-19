import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CategoryCard from "./CategoryCard";
import CreateCategoryModal from "./CreateCategoryModal";

function CategoryList({ parentId = null }) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState([]);

  // 🔹 handleCreated defined here
  const handleCreated = () => setRefresh((prev) => !prev);

  // fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const params = parentId !== null ? { parentId } : { parentId: null };
      const res = await axios.get("http://localhost:5000/api/categories", { params });
      setCategories(res.data);

      // fetch full breadcrumb
      const crumbs = [];
      let currentId = parentId;
      while (currentId) {
        const categoryRes = await axios.get(`http://localhost:5000/api/categories/${currentId}`);
        const category = categoryRes.data;
        crumbs.unshift({ id: category._id, name: category.name });
        currentId = category.parent;
      }
      setBreadcrumb(crumbs);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch categories");
    }
  }, [parentId, refresh]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleEdit = (category) => {
    setEditing(category);
    setEditModalOpen(true);
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete "${category.name}" and its subcategories?`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/categories/${category._id}`);
      setRefresh((prev) => !prev);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <div>
      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <div style={{ marginBottom: 12, fontWeight: "bold", fontSize: 14 }}>
          <span
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/categories")}
          >
            Categories
          </span>
          {breadcrumb.map((b, i) => (
            <span key={b.id}>
              {" "} &gt;{" "}
              <span
                style={{ cursor: "pointer", textDecoration: "underline" }}
                onClick={() => navigate(`/categories/${b.id}`)}
              >
                {b.name}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Buttons */}
      {/* Buttons */}
<div style={{ marginBottom: 12, display: "flex", gap: "10px" }}>
  {parentId && (
    <button
      onClick={() => navigate(-1)}
      style={{
        padding: "8px 16px",
        borderRadius: "8px",
        border: "none",
        background: "#fff",
        color: "#333",
        cursor: "pointer",
        fontWeight: "bold",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      ⬅ Back
    </button>
  )}

  <button
    onClick={() => setModalOpen(true)}
    style={{
      padding: "8px 16px",
      borderRadius: "8px",
      border: "none",
      background: "#00AEEF", // blue
      color: "#fff",          // text white
      cursor: "pointer",
      fontWeight: "bold",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    }}
  >
    {parentId ? "+ Create Subcategory" : "+ Create Category"}
  </button>
</div>


      {/* Modals */}
      <CreateCategoryModal
        show={modalOpen}
        onClose={() => setModalOpen(false)}
        parentId={parentId}
        onCreated={handleCreated}
      />
      <CreateCategoryModal
        show={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditing(null);
        }}
        onCreated={() => {
          setEditModalOpen(false);
          setEditing(null);
          setRefresh((prev) => !prev);
        }}
        initialData={editing}
      />

      {/* Category Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "16px",
          marginTop: "20px",
        }}
      >
        {categories.map((cat) => (
          <CategoryCard
            key={cat._id}
            category={cat}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}

export default CategoryList;
