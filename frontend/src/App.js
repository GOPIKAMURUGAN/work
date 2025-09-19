import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Master from "./pages/Master";
import Questions from "./pages/Questions";
import Vendors from "./pages/VendorPage";
import CategoryPage from "./components/CategoryPage";
import CustomersPage from "./pages/CustomersPage";

import VendorBusinessPage from "./pages/VendorBusinessPage";

function App() {
  return (
    <Router>
      <div style={{ display: "flex" }}>
        <Sidebar />
        <div style={{ flex: 1, padding: "20px" }}>
          <Routes>
            {/* Categories */}
            <Route path="/categories" element={<CategoryPage />} end />
            <Route path="/categories/:parentId" element={<CategoryPage />} />
            {/* Other pages */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/master" element={<Master />} />
            <Route path="/questions" element={<Questions />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route
              path="/vendors/:vendorId"
              element={<VendorBusinessPage />}
            />{" "}
            {/* ✅ NEW */}
            <Route path="/customers" element={<CustomersPage />} />
            {/* Fallback */}
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
