import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Upload, BarChart3, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ImageUpload from '../components/ImageUpload';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, imagesResponse] = await Promise.all([
        axios.get('/api/analysis/stats/user'),
        axios.get('/api/images/my-images')
      ]);

      setStats(statsResponse.data);
      setImages(imagesResponse.data.images);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
    fetchDashboardData(); // Refresh data
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="status-icon completed" />;
      case 'processing':
        return <Clock size={16} className="status-icon processing" />;
      case 'pending':
        return <Clock size={16} className="status-icon pending" />;
      case 'failed':
        return <XCircle size={16} className="status-icon failed" />;
      default:
        return null;
    }
  };

  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low':
        return 'var(--primary-green)';
      case 'medium':
        return 'var(--accent-orange)';
      case 'high':
        return 'var(--accent-red)';
      case 'critical':
        return '#D32F2F';
      default:
        return 'var(--text-light)';
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Welcome back, {user?.username}!</h1>
          <p>Monitor your child safety analysis and upload new images</p>
        </div>
        <button 
          onClick={() => setShowUpload(true)} 
          className="btn btn-primary"
        >
          <Upload size={20} />
          Upload Image
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <BarChart3 size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.totalImages}</h3>
              <p>Total Images</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon completed">
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.analyzedImages}</h3>
              <p>Analyzed</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon processing">
              <Clock size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.pendingImages}</h3>
              <p>Pending</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon failed">
              <XCircle size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.failedImages}</h3>
              <p>Failed</p>
            </div>
          </div>
        </div>
      )}

      {/* Risk Level Summary */}
      {stats && stats.riskLevels && (
        <div className="risk-summary">
          <h2>Risk Level Summary</h2>
          <div className="risk-levels-grid">
            <div className="risk-level-card low">
              <h3>{stats.riskLevels.low}</h3>
              <p>Low Risk</p>
            </div>
            <div className="risk-level-card medium">
              <h3>{stats.riskLevels.medium}</h3>
              <p>Medium Risk</p>
            </div>
            <div className="risk-level-card high">
              <h3>{stats.riskLevels.high}</h3>
              <p>High Risk</p>
            </div>
            <div className="risk-level-card critical">
              <h3>{stats.riskLevels.critical}</h3>
              <p>Critical Risk</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Images */}
      <div className="recent-images">
        <div className="section-header">
          <h2>Recent Images</h2>
          <button onClick={fetchDashboardData} className="btn btn-secondary">
            Refresh
          </button>
        </div>

        {images.length === 0 ? (
          <div className="empty-state">
            <Upload size={48} />
            <h3>No images uploaded yet</h3>
            <p>Upload your first image to start analyzing for safety concerns</p>
            <button 
              onClick={() => setShowUpload(true)} 
              className="btn btn-primary"
            >
              Upload First Image
            </button>
          </div>
        ) : (
          <div className="images-grid">
            {images.slice(0, 6).map((image) => (
              <div key={image.id} className="image-card">
                <div className="image-header">
                  <div className="image-status">
                    {getStatusIcon(image.status)}
                    <span className="status-text">{image.status}</span>
                  </div>
                  {image.riskLevel && (
                    <span 
                      className="risk-badge"
                      style={{ backgroundColor: getRiskLevelColor(image.riskLevel) }}
                    >
                      {image.riskLevel.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="image-preview">
                  <img 
                    src={`/uploads/${image.filename}`} 
                    alt={image.originalName}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="image-placeholder">
                    <Upload size={32} />
                    <span>Image not available</span>
                  </div>
                </div>

                <div className="image-info">
                  <h4>{image.originalName}</h4>
                  <p className="upload-time">
                    {new Date(image.uploadTime).toLocaleDateString()}
                  </p>
                  
                  {image.detectedObjects && image.detectedObjects.length > 0 && (
                    <div className="detected-objects">
                      <p className="objects-label">Detected:</p>
                      <div className="objects-tags">
                        {image.detectedObjects.slice(0, 3).map((object, index) => (
                          <span key={index} className="object-tag">
                            {object}
                          </span>
                        ))}
                        {image.detectedObjects.length > 3 && (
                          <span className="object-tag more">
                            +{image.detectedObjects.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload Image for Analysis</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowUpload(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <ImageUpload onClose={() => setShowUpload(false)} onUploadSuccess={handleUploadSuccess} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;