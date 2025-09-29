import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Master from "./pages/Master";
import MasterDetail from "./pages/MasterDetail";
import Questions from "./pages/Questions";
import Vendors from "./pages/VendorPage";
import VendorStatusPage from "./pages/VendorStatusPage";
import VendorStatusListPage from "./pages/VendorStatusListPage";
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
            <Route path="/master/:parentId" element={<MasterDetail />} />
            <Route path="/questions" element={<Questions />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/vendors/status/:categoryId" element={<VendorStatusPage />} />
            <Route path="/vendors/status/:categoryId/:status" element={<VendorStatusListPage />} />
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
