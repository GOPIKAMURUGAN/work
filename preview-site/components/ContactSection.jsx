import React from "react";

export default function ContactSection() {
  return (
    <section
      id="contact"
      style={{
        padding: "60px 20px",
        backgroundColor: "#f9f9f9",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      {/* Heading */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h2
          style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "10px" }}
        >
          Contact Us
        </h2>
        <p style={{ fontSize: "16px", color: "#555" }}>Get in touch with us</p>
      </div>

      {/* 2 Columns Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "40px",
          maxWidth: "1000px",
          margin: "0 auto",
          fontSize: "16px",
        }}
      >
        {/* Left Column - Info Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              padding: "20px",
              border: "1px solid #ddd",
              borderRadius: "10px",
              background: "#F0FDF4",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            }}
          >
            <h4 style={{ marginBottom: "10px", fontWeight: "bold" }}>Phone</h4>
            <p>+91 954236256</p>
          </div>

          <div
            style={{
              padding: "20px",
              border: "1px solid #ddd",
              borderRadius: "10px",
              background: "#F0FDF4",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            }}
          >
            <h4 style={{ marginBottom: "10px", fontWeight: "bold" }}>
              Location
            </h4>
            <p>Hyderabad, Telangana</p>
          </div>

          <div
            style={{
              padding: "20px",
              border: "1px solid #ddd",
              borderRadius: "10px",
              background: "#F0FDF4",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            }}
          >
            <h4 style={{ marginBottom: "10px", fontWeight: "bold" }}>
              Business Hours
            </h4>
            <p>8:00 AM - 8:00 PM</p>
          </div>

          <div
            style={{
              padding: "20px",
              border: "1px solid #ddd",
              borderRadius: "10px",
              background: "#F0FDF4",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            }}
          >
            <h4 style={{ marginBottom: "10px", fontWeight: "bold" }}>
              Products
            </h4>
            <p>Explore</p>
          </div>
        </div>

        {/* Right Column - Form */}
        <form
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            background: "#F0FDF4",
            padding: "30px",
            borderRadius: "12px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          }}
        >
          <input
            type="text"
            placeholder="Your Name"
            required
            style={{
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              backgroundColor: "#F0FDF4",
            }}
          />
          <input
            type="tel"
            placeholder="Phone Number"
            required
            style={{
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              backgroundColor: "#F0FDF4",
            }}
          />
          <textarea
            placeholder="Message (Optional)"
            rows="4"
            style={{
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              resize: "none",
              backgroundColor: "#F0FDF4",
            }}
          ></textarea>

          <button
            type="submit"
            style={{
              padding: "12px",
              backgroundColor: "#F59E0B",
              color: "black",
              border: "none",
              borderRadius: "30px",
              fontWeight: "bold",
              cursor: "pointer",
              marginTop: "10px",
              width: "150px",
              alignSelf: "flex-start",
              fontFamily: "Poppins, sans-serif",
            }}
          >
            Send Message
          </button>
        </form>
      </div>
    </section>
  );
}
