import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import "leaflet/dist/leaflet.css";


// Pages
import Dashboard from "./pages/Dashboard";
import Master from "./pages/Master";
import MasterDetail from "./pages/MasterDetail";
import Questions from "./pages/Questions";
import CategoryPage from "./components/CategoryPage";
import CustomersPage from "./pages/CustomersPage";

// Vendor Pages (Step 1 → Step 2 → Step 3)
import Vendors from "./pages/VendorPage"; // Step 1
import VendorStatusPage from "./pages/VendorStatusPage"; // Step 2
import VendorStatusListPage from "./pages/VendorStatusListPage"; // Step 2 detail
import VendorBusinessPage from "./pages/VendorBusinessPage"; // Step 3

function App() {
  return (
    <Router>
      <div style={{ display: "flex" }}>
        <Sidebar />
        <div style={{ flex: 1, padding: "20px" }}>
          <Routes>
            {/* Dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Master Pages */}
            <Route path="/master" element={<Master />} />
            <Route path="/master/:parentId" element={<MasterDetail />} />

            {/* Questions */}
            <Route path="/questions" element={<Questions />} />

            {/* Vendor Flow */}
            <Route path="/vendors" element={<Vendors />} /> {/* Step 1 */}
            <Route path="/vendors/status/:categoryId" element={<VendorStatusPage />} /> {/* Step 2 */}
            <Route
              path="/vendors/status/:categoryId/:status"
              element={<VendorStatusListPage />}
            /> {/* Step 2 detail */}
            <Route path="/vendors/:vendorId" element={<VendorBusinessPage />} /> {/* Step 3 */}

            {/* Categories */}
            <Route path="/categories" element={<CategoryPage />} />
            <Route path="/categories/:parentId" element={<CategoryPage />} />

            {/* Customers */}
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
