import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="container">
      <nav className="navbar">
        <div className="logo">
          <div className="logo-icon">
            <span className="logo-text">RCA</span>
          </div>
        </div>
        <div className="buttons">
          <button className="demo-button" onClick={() => navigate("/login")}>
            Log In
          </button>
          <button className="signup-button" onClick={() => navigate("/register")}>
            Sign Up
          </button>
        </div>
      </nav>
      <div className="content">
        <p className="intro-text">Welcome to</p>
        <h1 className="headline">Retail Customer Analytics</h1>
        <p className="subtext">
          Unlock the power of your customer insights with RCA. We help you analyze trends,
          predict behaviors, and make data-driven decisions that directly impact your bottom line.
        </p>
        <button className="cta-button" onClick={() => navigate("/register")}>
          Get Started
        </button>
      </div>
    </div>
  );
};

export default Home;
