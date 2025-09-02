import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Register from './components/Register';
import Login from './components/Login';
import VerifyOTP from './components/VerifyOTP';
import Home from './components/home';
import DashboardLayout from './components/DashboardLayout';
import StockUpdate from './components/StockUpdate';
import Customers from './components/Customers';
import ViewInventory from './components/ViewInventory';
import ViewSales from './components/ViewSales';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AdvertisementPage from './components/AdvertisementPage';
import Getstarted from './components/Getstarted.js';
// import ViewCustomers from './components/ViewCustomers.js';
// import UploadCustomerdetails from './components/UploadCustomerdetails.js';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route path="stock/add" element={<StockUpdate action="add" />} />
          <Route path="customers/add" element={<Customers action="add" />} />
          <Route path="stock/view" element={<ViewInventory />} />
          <Route path="customers/view" element={<ViewSales />} />
          <Route path="dashboard/analyse" element={<AnalyticsDashboard />} />
          <Route path="advertisement" element={<AdvertisementPage />} />
          <Route path="dashboard/getstarted" element={<Getstarted />} />
          {/* <Route path="customersdetails/view" element={<ViewCustomers />} /> */}
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

const PrivateRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default App;
