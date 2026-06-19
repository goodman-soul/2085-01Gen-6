import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import HomePage from "@/pages/user/HomePage";
import ScanPage from "@/pages/user/ScanPage";
import ReturnPage from "@/pages/user/ReturnPage";
import OrdersPage from "@/pages/user/OrdersPage";
import OrderDetailPage from "@/pages/user/OrderDetailPage";
import RecordsPage from "@/pages/user/RecordsPage";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminOrdersPage from "@/pages/admin/AdminOrdersPage";
import AdminRecordsPage from "@/pages/admin/AdminRecordsPage";
import { useBedStore } from "@/store/useBedStore";
import { useOrderStore } from "@/store/useOrderStore";
import { useRecordStore } from "@/store/useRecordStore";

export default function App() {
  const initBeds = useBedStore((s) => s.initBeds);
  const initOrders = useOrderStore((s) => s.initOrders);
  const initRecords = useRecordStore((s) => s.initRecords);

  useEffect(() => {
    initBeds();
    initOrders();
    initRecords();
  }, [initBeds, initOrders, initRecords]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/scan/:bedId" element={<ScanPage />} />
        <Route path="/return/:orderId" element={<ReturnPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:orderId" element={<OrderDetailPage />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminLayout>
              <AdminOrdersPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/records"
          element={
            <AdminLayout>
              <AdminRecordsPage />
            </AdminLayout>
          }
        />
      </Routes>
    </Router>
  );
}
