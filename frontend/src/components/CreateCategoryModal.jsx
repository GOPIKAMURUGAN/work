import { useState, useEffect } from "react";

function CreateCategoryModal({
  show,
  onClose,
  parentId = null,
  initialData = null,
  onCreated,
}) {
  const [name, setName] = useState("");
  const [image, setImage] = useState(null);
  const [price, setPrice] = useState("");
  const [terms, setTerms] = useState("");
  const [visibleToUser, setVisibleToUser] = useState(false);
  const [visibleToVendor, setVisibleToVendor] = useState(false);
  const [sequence, setSequence] = useState(0);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setImage(null);
      setPrice(initialData.price ?? "");
      setTerms(initialData.terms ?? "");
      setVisibleToUser(initialData.visibleToUser || false);
      setVisibleToVendor(initialData.visibleToVendor || false);
      setSequence(initialData.sequence ?? 0);
    } else {
      setName("");
      setImage(null);
      setPrice("");
      setTerms("");
      setVisibleToUser(false);
      setVisibleToVendor(false);
      setSequence(0);
    }
  }, [initialData, show]);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || (!image && !initialData)) {
      alert("Please fill required fields!");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      if (image) formData.append("image", image);
      if (parentId) formData.append("parentId", parentId);
      formData.append("price", price === "" ? "" : price);
      formData.append("sequence", sequence); // only once
      formData.append("terms", terms);
      formData.append("visibleToUser", visibleToUser);
      formData.append("visibleToVendor", visibleToVendor);

      let url = "http://localhost:5000/api/categories";
      let method = "POST";
      if (initialData && initialData._id) {
        url += `/${initialData._id}`;
        method = "PUT";
      }

      const res = await fetch(url, { method, body: formData });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to save category");
      }

      // reset form
      setName("");
      setImage(null);
      setPrice("");
      setTerms("");
      setVisibleToUser(false);
      setVisibleToVendor(false);
      setSequence(0);

      onCreated?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      alert(err.message);
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
        backgroundColor: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          color: "#000",
          padding: "30px",
          borderRadius: "12px",
          minWidth: "350px",
          maxWidth: "90%",
          boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
          textAlign: "center",
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>
          {initialData
            ? "Edit Category"
            : parentId
            ? "Create Subcategory"
            : "Create Category"}
        </h2>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            alignItems: "center",
          }}
        >
          <input
            type="number"
            placeholder="Sequence (Order)"
            value={sequence}
            onChange={(e) =>
              setSequence(e.target.value === "" ? 0 : Number(e.target.value))
            }
            style={{
              padding: "10px",
              width: "100%",
              borderRadius: "8px",
              border: "1px solid #ccc",
              background: "#fff",
              color: "#000",
            }}
          />

          <input
            type="text"
            placeholder="Enter Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              padding: "10px",
              width: "100%",
              borderRadius: "8px",
              border: "1px solid #ccc",
              background: "#fff",
              color: "#00AEEF", // blue for name
              fontWeight: "bold",
            }}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            style={{
              padding: "5px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              background: "#fff",
              color: "#000",
              width: "100%",
            }}
          />
          <input
            type="number"
            placeholder="Price (Optional)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={{
              padding: "10px",
              width: "100%",
              borderRadius: "8px",
              border: "1px solid #ccc",
              background: "#fff",
              color: "#000",
            }}
          />
          <textarea
            placeholder="Terms & Conditions (comma-separated)"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            style={{
              padding: "10px",
              width: "100%",
              borderRadius: "8px",
              border: "1px solid #ccc",
              background: "#fff",
              color: "#000",
            }}
          ></textarea>

          <label style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={visibleToUser}
              onChange={(e) => setVisibleToUser(e.target.checked)}
            />
            <span style={{ color: "#000" }}>Visible to User</span>
          </label>
          <label style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={visibleToVendor}
              onChange={(e) => setVisibleToVendor(e.target.checked)}
            />
            <span style={{ color: "#000" }}>Visible to Vendor</span>
          </label>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                marginRight: "10px",
                padding: "10px",
                borderRadius: "8px",
                border: "none",
                background: "#00AEEF", // blue button
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "8px",
                border: "none",
                background: "#00AEEF", // blue button
                color: "#fff",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {initialData ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateCategoryModal;
