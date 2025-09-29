import React, { useState } from "react";
export default function ProductsMenu({ root, selectedLeaf, onLeafSelect }) {
  const [expanded, setExpanded] = useState(new Set());

  const hasChildren = (node) => node?.children?.length > 0;

  const toggle = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const NodeItem = ({ node, depth = 0 }) => {
    if (!node) return null;
    const isParent = hasChildren(node);
    const isExpanded = expanded.has(node.id);
    const isSelected = selectedLeaf?.id === node.id;

    return (
      <div style={{ marginLeft: depth * 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            onClick={() => onLeafSelect(node)}
            style={{
              cursor: "pointer",
              fontWeight: isSelected ? 600 : 500,
              fontSize: 14,
              color: isSelected ? "#2563eb" : "#111827",
            }}
          >
            {node.name}
          </span>
          {isParent && (
            <span
              onClick={() => toggle(node.id)}
              style={{ cursor: "pointer", fontSize: 14 }}
            >
              {isExpanded ? "▾" : "▸"}
            </span>
          )}
        </div>
        {isParent && isExpanded && (
          <div style={{ marginTop: 4 }}>
            {node.children.map((child) => (
              <NodeItem key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!root) return null;

  return (
    <nav
      style={{
        padding: 12,
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      {root.children?.map((child) => (
        <NodeItem key={child.id} node={child} />
      ))}
    </nav>
  );
}

