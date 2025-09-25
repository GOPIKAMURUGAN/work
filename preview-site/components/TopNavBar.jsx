import React from "react";

export default function TopNavBar({ businessName }) {
  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "15px 30px",
        backgroundColor: "#E4E7EC", // Page bg color
        position: "sticky",
        top: 0,
        zIndex: 1000,
        fontFamily: "Poppins, sans-serif",
      }}
    >
      {/* Left side: Business Name */}
      <div style={{ fontSize: "24px", fontWeight: "700", color: "#059669" }}>
        {businessName}
      </div>

      {/* Right side: Nav links */}
      <nav>
        <ul
          style={{
            display: "flex",
            gap: "20px",
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
        >
          {["Home", "Products", "Benefits", "About", "Contact"].map((item) => (
            <li key={item}>
              <a
                href={`#${item.toLowerCase()}`}
                style={{
                  color: "#333333",
                  textDecoration: "none",
                  fontWeight: 500,
                  transition: "color 0.2s",
                  fontSize: "16px",
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#059669")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#333333")}
              >
                {item}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
