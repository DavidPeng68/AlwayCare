import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Home, User, LogOut, Upload, BarChart3 } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <Shield className="navbar-icon" />
          <span className="navbar-title">AlwaysCare</span>
        </Link>

        <div className="navbar-menu">
          <Link to="/" className="navbar-link">
            <Home size={20} />
            <span>Home</span>
          </Link>

          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="navbar-link">
                <BarChart3 size={20} />
                <span>Dashboard</span>
              </Link>
              <div className="navbar-user">
                <span className="navbar-username">
                  <User size={16} />
                  {user?.username}
                </span>
                <button onClick={handleLogout} className="navbar-logout">
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <div className="navbar-auth">
              <Link to="/login" className="btn btn-secondary">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;