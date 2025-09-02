import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import './DashboardLayout.css';

function DashboardLayout() {
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isSalesOpen, setIsSalesOpen] = useState(false);
  const [isCustomersOpen, setIsCustomersOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>RCA</h2>
        </div>

        <div className="store-info">
          <span className="store-icon">🏪</span>
          <span className="store-name">DMART</span>
        </div>

        <ul className="menu-list">
          <li>
            <Link to="dashboard/getstarted" className="menu-item">
              <span className="menu-icon">⚡</span>
              Get Started
            </Link>
          </li>
          
          <li>
            <Link to="dashboard/analyse" className="menu-item">
              <span className="menu-icon">📊</span>
              Dashboard
            </Link>
          </li>

          <li className="dropdown">
            <div className="menu-item" onClick={() => setIsInventoryOpen(!isInventoryOpen)}>
              <span className="menu-icon">📦</span>
              Inventory
              <span className={`dropdown-arrow ${isInventoryOpen ? 'open' : ''}`}>▼</span>
            </div>
            {isInventoryOpen && (
              <ul className="submenu">
                <li><Link to="stock/add">Upload Inventory</Link></li>
                <li><Link to="stock/view">View Inventory</Link></li>
              </ul>
            )}
          </li>

          <li className="dropdown">
            <div className="menu-item" onClick={() => setIsSalesOpen(!isSalesOpen)}>
              <span className="menu-icon">💰</span>
              Sales
              <span className={`dropdown-arrow ${isSalesOpen ? 'open' : ''}`}>▼</span>
            </div>
            {isSalesOpen && (
              <ul className="submenu">
                <li><Link to="customers/add">Upload Sale</Link></li>
                <li><Link to="customers/view">View Sales</Link></li>
              </ul>
            )}
          </li>

          {/* <li className="dropdown">
            <div className="menu-item" onClick={() => setIsCustomersOpen(!isCustomersOpen)}>
              <span className="menu-icon">👥</span>
              Customer Profiling
              <span className={`dropdown-arrow ${isCustomersOpen ? 'open' : ''}`}>▼</span>
            </div>
            {isCustomersOpen && (
              <ul className="submenu">
                <li><Link to="customersdetails/add">Upload Customers</Link></li>
                <li><Link to="customersdetails/view">View Customers</Link></li>
              </ul>
            )}
          </li> */}

          <li>
            <Link to="advertisement" className="menu-item">
              <span className="menu-icon">🛍️</span>
              Advertisement
            </Link>
          </li>

        </ul>

        
      </nav>

      <main className="main-content">
        <div className="background-image"></div>
        <div className="content-overlay">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
