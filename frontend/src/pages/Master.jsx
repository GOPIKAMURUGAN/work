import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function MasterCard({ item, onOpen, onEdit, onDelete }) {
  return (
    <div
      style={{
        borderRadius: "8px",
        background: "#fff",
        color: "#333",
        padding: "10px",
        width: "220px",
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        border: "1px solid #e5e7eb",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 8, color: "#00AEEF" }}>{item.name}</h3>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        <button
          onClick={() => onOpen(item)}
          title="Open"
          style={{
            cursor: "pointer",
            background: "none",
            border: "1px solid #000",
            borderRadius: "4px",
            padding: "4px 8px",
            color: "#000",
            fontWeight: "bold",
          }}
        >
          ➡
        </button>
        <button
          onClick={() => onEdit(item)}
          title="Edit"
          style={{
            cursor: "pointer",
            background: "none",
            border: "none",
            color: "#00AEEF",
            fontSize: "16px",
          }}
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(item)}
          title="Delete"
          style={{
            cursor: "pointer",
            background: "none",
            border: "none",
            color: "#00AEEF",
            fontSize: "16px",
          }}
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

function CreateMasterModal({ show, onClose, parentId = null, onCreated }) {
  const [name, setName] = useState("");
  const [sequence, setSequence] = useState(0);
  if (!show) return null;

  const submit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", name);
      if (parentId) formData.append("parentId", parentId);
      formData.append("sequence", sequence);
      const res = await fetch("http://localhost:5000/api/masters", { method: "POST", body: formData });
      if (!res.ok) throw new Error(await res.text());
      onCreated?.();
      onClose();
    } catch (err) {
      alert(err.message || "Failed to create");
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0006", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <form onSubmit={submit} style={{ background: "#fff", padding: 20, borderRadius: 12, width: 360 }}>
        <h3 style={{ marginTop: 0 }}>{parentId ? "Create Sub Master" : "Create Master"}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
          <label>Sequence</label>
          <input value={sequence} onChange={(e) => setSequence(e.target.value)} type="number" />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit">Save</button>
        </div>
      </form>
    </div>
  );
}

function EditMasterModal({ show, onClose, initialData, onUpdated }) {
  const [name, setName] = useState(initialData?.name || "");
  const [sequence, setSequence] = useState(initialData?.sequence || 0);
  useEffect(() => {
    setName(initialData?.name || "");
    setSequence(initialData?.sequence || 0);
  }, [initialData, show]);
  if (!show) return null;

  const submit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      if (name) formData.append("name", name);
      formData.append("sequence", sequence);
      const res = await fetch(`http://localhost:5000/api/masters/${initialData._id}`, { method: "PUT", body: formData });
      if (!res.ok) throw new Error(await res.text());
      onUpdated?.();
      onClose();
    } catch (err) {
      alert(err.message || "Failed to update");
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0006", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <form onSubmit={submit} style={{ background: "#fff", padding: 20, borderRadius: 12, width: 360 }}>
        <h3 style={{ marginTop: 0 }}>Edit Master</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
          <label>Sequence</label>
          <input value={sequence} onChange={(e) => setSequence(e.target.value)} type="number" />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit">Save</button>
        </div>
      </form>
    </div>
  );
}

function MasterList({ parentId = null }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = parentId !== null ? { parentId } : { parentId: null };
      const res = await axios.get("http://localhost:5000/api/masters", { params });
      setItems(res.data);

      // Build breadcrumb chain up to root
      const crumbs = [];
      let currentId = parentId;
      while (currentId) {
        const r = await axios.get(`http://localhost:5000/api/masters/${currentId}`);
        const m = r.data;
        crumbs.unshift({ id: m._id, name: m.name });
        currentId = m.parent || null;
      }
      setBreadcrumb(crumbs);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [parentId, refresh]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const open = (item) => navigate(`/master/${item._id}`);
  const edit = (item) => {
    setEditing(item);
    setShowEdit(true);
  };
  const del = async (item) => {
    if (!window.confirm("Delete?")) return;
    await axios.delete(`http://localhost:5000/api/masters/${item._id}`);
    setRefresh((v) => !v);
  };

  return (
    <div>
      {breadcrumb.length > 0 && (
        <div style={{ marginBottom: 12, fontWeight: "bold", fontSize: 14 }}>
          <span style={{ cursor: "pointer" }} onClick={() => navigate("/master")}>
            Master Data
          </span>
          {breadcrumb.map((b) => (
            <span key={b.id}>
              {" "}&gt;{" "}
              <span
                style={{ cursor: "pointer", textDecoration: "underline" }}
                onClick={() => navigate(`/master/${b.id}`)}
              >
                {b.name}
              </span>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: "0 0 12px" }}>{parentId ? "Sub Fields" : "Master Data"}</h2>
        <div style={{ display: "flex", gap: "10px" }}>
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
            onClick={() => setShowModal(true)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              background: "#00AEEF",
              color: "#fff",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            {parentId ? "+ Create Sub" : "+ Create Master"}
          </button>
        </div>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "16px",
            marginTop: "20px",
          }}
        >
          {items.map((it) => (
            <MasterCard key={it._id} item={it} onOpen={open} onEdit={edit} onDelete={del} />
          ))}
        </div>
      )}
      <CreateMasterModal show={showModal} onClose={() => setShowModal(false)} parentId={parentId} onCreated={() => setRefresh((v) => !v)} />
      <EditMasterModal
        show={showEdit}
        onClose={() => { setShowEdit(false); setEditing(null); }}
        initialData={editing}
        onUpdated={() => { setShowEdit(false); setEditing(null); setRefresh((v) => !v); }}
      />
    </div>
  );
}

function Master({ parentId = null }) {
  return (
    <div>
      <h1>Master</h1>
      <MasterList parentId={parentId} />
    </div>
  );
}

export default Master;
