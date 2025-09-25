// pages/preview/[vendorId]/[categoryId].jsx
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import TopNavBar from "../../../components/TopNavBar";
import HomeSection from "../../../components/HomeSection";
import BenefitsSection from "../../../components/BenefitsSection";
import AboutSection from "../../../components/AboutSection";
import ContactSection from "../../../components/ContactSection";
import Footer from "../../../components/Footer";

const PreviewPage = () => {
  const router = useRouter();
  const { vendorId, categoryId } = router.query;

  const [vendor, setVendor] = useState(null);
  const [categoryTree, setCategoryTree] = useState(null);
  const [loadingVendor, setLoadingVendor] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!router.isReady || !vendorId) return;
    setLoadingVendor(true);
    fetch(`/api/vendors/${vendorId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => setVendor(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoadingVendor(false));
  }, [router.isReady, vendorId]);

  useEffect(() => {
    if (!router.isReady || !vendorId || !categoryId) return;
    setLoadingCategories(true);
    fetch(`/api/vendors/${vendorId}/preview/${categoryId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Category not found");
        return data;
      })
      .then((data) => setCategoryTree(data.categories))
      .catch((err) => setError(err.message))
      .finally(() => setLoadingCategories(false));
  }, [router.isReady, vendorId, categoryId]);

  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (loadingVendor) return <p>Loading vendor info...</p>;
  if (!vendor) return <p>Vendor not found.</p>;
  if (loadingCategories) return <p>Loading categories...</p>;
  if (!categoryTree) return <p>No categories found.</p>;

  // helpers
  const hasChildren = (node) =>
    node && Array.isArray(node.children) && node.children.length > 0;

  // Card component
  const ParentWithSizesCard = ({ node }) => {
    if (!node) return null;

    const [selectedParent, setSelectedParent] = useState(null);
    const [selectedChild, setSelectedChild] = useState(null);

    useEffect(() => {
      if (node.children?.length > 0) {
        const defaultParent = node.children[0];
        setSelectedParent(defaultParent);
        if (defaultParent.children?.length > 0) {
          setSelectedChild(defaultParent.children[0]);
        } else {
          setSelectedChild(defaultParent);
        }
      } else {
        setSelectedParent(node);
        setSelectedChild(node);
      }
    }, [node]);

    const displayNode = selectedChild || selectedParent;

    return (
      <section style={{ marginBottom: 28 }}>
        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            padding: 20,
            background: "#fff",
            width: 300,
            minHeight: 400,
            boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          <h2 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 600 }}>
            {node.name}
          </h2>

          {displayNode?.imageUrl && (
            <img
              src={
                displayNode.imageUrl.startsWith("http")
                  ? displayNode.imageUrl
                  : `http://localhost:5000${displayNode.imageUrl}`
              }
              alt={displayNode.name}
              style={{
                width: 50,
                height: 50,
                borderRadius: 8,
                objectFit: "cover",
                marginBottom: 12,
              }}
            />
          )}

          {displayNode && (
            <div style={{ marginBottom: 12 }}>
              {displayNode.price && (
                <p style={{ color: "#059669", fontWeight: 600, margin: 0 }}>
                  ₹ {displayNode.price}
                </p>
              )}
              {displayNode.terms && (
                <ul style={{ marginTop: 4, paddingLeft: 18 }}>
                  {displayNode.terms.split(",").map((t, i) => (
                    <li key={i} style={{ fontSize: 13, color: "#4b5563" }}>
                      {t.trim()}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {node.children?.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 10,
              }}
            >
              {node.children.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setSelectedParent(opt);
                    if (opt.children?.length > 0)
                      setSelectedChild(opt.children[0]);
                    else setSelectedChild(opt);
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    border:
                      selectedParent?.id === opt.id
                        ? "2px solid #059669"
                        : "1px solid #d1d5db",
                    background:
                      selectedParent?.id === opt.id ? "#059669" : "#f9fafb",
                    color: selectedParent?.id === opt.id ? "#fff" : "#111827",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          )}

          {selectedParent?.children?.length > 0 && (
            <div
              style={{
                display: "flex", // 👈 makes Zero Trim & Full Body Trim horizontal
                gap: 8,
                marginBottom: 12,
                flexWrap: "wrap",
              }}
            >
              {selectedParent.children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    border:
                      selectedChild?.id === child.id
                        ? "2px solid #2563eb"
                        : "1px solid #d1d5db",
                    background:
                      selectedChild?.id === child.id ? "#2563eb" : "#f9fafb",
                    color: selectedChild?.id === child.id ? "#fff" : "#111827",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  {child.name}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => alert(`Booking ${displayNode?.name}`)}
            style={{
              marginTop: "auto",
              width: "100%",
              padding: "10px 14px",
              borderRadius: 28,
              border: "none",
              background: "rgb(245 158 11)",
              color: "#111827",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Book Now
          </button>
        </div>
      </section>
    );
  };

  // Universal render tree function
  const renderTree = (root) => {
    if (!root || !Array.isArray(root.children)) return null;

    return root.children.map((lvl1) => {
      const hasNested =
        lvl1.children && lvl1.children.some((c) => hasChildren(c));

      if (hasNested) {
       return (
  <section key={lvl1.id} style={{ marginBottom: 28 }}>
    <h2
      style={{
        margin: "0 0 12px",
        textTransform: "uppercase",
        fontSize: 18,
        fontWeight: 600,
      }}
    >
      {lvl1.name}
    </h2>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
      {lvl1.children && lvl1.children.length > 0 ? (
        lvl1.children.map((child) => (
          <ParentWithSizesCard key={child.id} node={child} />
        ))
      ) : (
        <ParentWithSizesCard node={lvl1} />
      )}
    </div>
  </section>
);

      }

      return (
        <div
          key={lvl1.id}
          style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 28 }}
        >
          <ParentWithSizesCard node={lvl1} />
        </div>
      );
    });
  };

  return (
    <div style={{ padding: 0, background: "#F0FDF4", fontFamily: "Poppins, sans-serif" }}>
      <TopNavBar businessName={vendor.businessName} />
      <HomeSection businessName={vendor.businessName} />
      <main
        id="products"
        style={{
          padding: "20px",
          marginTop: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "32px",
        }}
      >
        {renderTree(categoryTree)}
      </main>
      <BenefitsSection />
      <AboutSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default PreviewPage;
