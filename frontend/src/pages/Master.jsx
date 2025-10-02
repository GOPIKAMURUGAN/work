import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Card for each master/sub-master
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
        <button onClick={() => onOpen(item)} title="Open" style={buttonStyle}>
          ➡
        </button>
        <button onClick={() => onEdit(item)} title="Edit" style={iconButton}>
          ✏️
        </button>
        <button onClick={() => onDelete(item)} title="Delete" style={iconButton}>
          🗑️
        </button>
      </div>
    </div>
  );
}

// Create Modal
function CreateMasterModal({ show, onClose, parentId, onCreated }) {
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
    <ModalContainer onClose={onClose}>
      <h3>{parentId ? "Create Sub Master" : "Create Master"}</h3>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
        <label>Sequence</label>
        <input value={sequence} onChange={(e) => setSequence(e.target.value)} type="number" />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit">Save</button>
        </div>
      </form>
    </ModalContainer>
  );
}

// Edit Modal
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
      formData.append("name", name);
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
    <ModalContainer onClose={onClose}>
      <h3>Edit Master</h3>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
        <label>Sequence</label>
        <input value={sequence} onChange={(e) => setSequence(e.target.value)} type="number" />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit">Save</button>
        </div>
      </form>
    </ModalContainer>
  );
}

// Modal wrapper
function ModalContainer({ children, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#0006", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", padding: 20, borderRadius: 12, width: 360 }}>
        {children}
      </div>
    </div>
  );
}

// Button styles
const buttonStyle = {
  cursor: "pointer",
  background: "none",
  border: "1px solid #000",
  borderRadius: "4px",
  padding: "4px 8px",
  color: "#000",
  fontWeight: "bold",
};

const iconButton = {
  cursor: "pointer",
  background: "none",
  border: "none",
  color: "#00AEEF",
  fontSize: "16px",
};

// Main List Component
function MasterList({ parentId = null }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = parentId ? { parentId } : { parentId: null };
      const res = await axios.get("http://localhost:5000/api/masters", { params });
      setItems(res.data);

      // Build breadcrumb
      const crumbs = [];
      let current = parentId;
      while (current) {
        const r = await axios.get(`http://localhost:5000/api/masters/${current}`);
        crumbs.unshift({ id: r.data._id, name: r.data.name, parent: r.data.parent });
        current = r.data.parent;
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
  const edit = (item) => { setEditing(item); setShowEdit(true); };
  const del = async (item) => {
    if (!window.confirm("Delete?")) return;
    await axios.delete(`http://localhost:5000/api/masters/${item._id}`);
    setRefresh((v) => !v);
  };

  return (
    <div>
      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <div style={{ marginBottom: 12, fontWeight: "bold", fontSize: 14 }}>
          <span style={{ cursor: "pointer" }} onClick={() => navigate("/master")}>
            Master Data
          </span>
          {breadcrumb.map((b) => (
            <span key={b.id}>
              {" > "}
              <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => navigate(`/master/${b.id}`)}>
                {b.name}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Header + Create button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>{parentId ? "Sub Fields" : "Master Data"}</h2>
        <div style={{ display: "flex", gap: 10 }}>
          {parentId && <button onClick={() => navigate(-1)} style={iconBtnBack}>⬅ Back</button>}
          <button onClick={() => setShowCreate(true)} style={iconBtnCreate}>
            {parentId ? "+ Create Sub" : "+ Create Master"}
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginTop: 20 }}>
          {items.map((it) => <MasterCard key={it._id} item={it} onOpen={open} onEdit={edit} onDelete={del} />)}
        </div>
      )}

      {/* Wrap modals in a fragment */}
      <>
        <CreateMasterModal show={showCreate} onClose={() => setShowCreate(false)} parentId={parentId} onCreated={() => setRefresh(v => !v)} />
        <EditMasterModal show={showEdit} onClose={() => { setShowEdit(false); setEditing(null); }} initialData={editing} onUpdated={() => setRefresh(v => !v)} />
      </>
    </div>
  );
}

// Styles
const iconBtnBack = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "none",
  background: "#fff",
  color: "#333",
  cursor: "pointer",
  fontWeight: "bold",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
};

const iconBtnCreate = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "none",
  background: "#00AEEF",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
};

// Main Master component
export default function Master({ parentId = null }) {
  return (
    <div>
      <MasterList parentId={parentId} />
    </div>
  );
}
