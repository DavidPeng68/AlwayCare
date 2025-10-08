import React, { useState, useEffect } from 'react';
import { FaChartBar, FaShieldAlt, FaExclamationTriangle, FaCheck, FaClock, FaTimes } from 'react-icons/fa';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_BASE_URL from '../config';
import { getImageUrl } from '../utils/imageUtils';
import './Analysis.css';

const Analysis = () => {
  const [analyses, setAnalyses] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  useEffect(() => {
    fetchAnalyses();
    fetchStats();
  }, []);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/analysis/completed`);
      setAnalyses(response.data.analyses || []);
    } catch (error) {
      console.error('Error fetching analyses:', error);
      toast.error('Failed to load analyses');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/analysis/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getRiskLevelIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'none':
        return <FaCheck className="risk-icon safe" />;
      case 'low':
        return <FaShieldAlt className="risk-icon low" />;
      case 'medium':
        return <FaExclamationTriangle className="risk-icon medium" />;
      case 'high':
        return <FaExclamationTriangle className="risk-icon high" />;
      default:
        return <FaClock className="risk-icon" />;
    }
  };

  // Risk level color mapping (unused but kept for future use)
  // const getRiskLevelColor = (riskLevel) => {
  //   switch (riskLevel) {
  //     case 'none':
  //       return '#28a745';
  //     case 'low':
  //       return '#ffc107';
  //     case 'medium':
  //       return '#fd7e14';
  //     case 'high':
  //       return '#dc3545';
  //     default:
  //       return '#6c757d';
  //   }
  // };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const renderDetectedObjects = (detectedObjects) => {
    console.log('Rendering detected objects:', detectedObjects);
    
    if (!detectedObjects || detectedObjects.length === 0) {
      return <p className="no-objects">No objects detected</p>;
    }

    return (
      <div className="detected-objects">
        {detectedObjects.map((obj, index) => {
          console.log('Object:', obj);
          return (
            <div key={index} className="detected-object">
              <span className="object-name">{obj.name || 'Unknown'}</span>
              <span className="object-confidence">
                {obj.confidence ? (obj.confidence * 100).toFixed(1) : '0'}%
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="analysis">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="analysis-header">
            <h1>Analysis Results</h1>
            <p>View detailed safety analysis of your uploaded images</p>
          </div>

          {/* Statistics */}
          <div className="stats-section">
            <h2>Analysis Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <FaChartBar className="stat-icon" />
                <div className="stat-content">
                  <h3>Total Analyses</h3>
                  <p className="stat-number">
                    {stats.statusDistribution?.find(s => s.analysis_status === 'completed')?.count || 0}
                  </p>
                </div>
              </div>

              <div className="stat-card">
                <FaShieldAlt className="stat-icon" />
                <div className="stat-content">
                  <h3>Safe Environments</h3>
                  <p className="stat-number">
                    {stats.riskDistribution?.find(r => r.risk_level === 'none')?.count || 0}
                  </p>
                </div>
              </div>

              <div className="stat-card">
                <FaExclamationTriangle className="stat-icon" />
                <div className="stat-content">
                  <h3>Hazards Detected</h3>
                  <p className="stat-number">
                    {(stats.riskDistribution?.filter(r => r.risk_level !== 'none') || [])
                      .reduce((sum, r) => sum + r.count, 0)}
                  </p>
                </div>
              </div>

              <div className="stat-card">
                <FaClock className="stat-icon" />
                <div className="stat-content">
                  <h3>Pending Analysis</h3>
                  <p className="stat-number">
                    {stats.statusDistribution?.find(s => s.analysis_status === 'pending')?.count || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Analyses List */}
          <div className="analyses-section">
            <h2>Recent Analyses</h2>
            
            {loading ? (
              <div className="loading-container">
                <FaClock className="loading-spinner" />
                <span>Loading analyses...</span>
              </div>
            ) : analyses.length === 0 ? (
              <div className="empty-state">
                <FaChartBar className="empty-icon" />
                <h3>No analyses available</h3>
                <p>Upload images to see analysis results here</p>
              </div>
            ) : (
              <div className="analyses-grid">
                {analyses.map((analysis) => (
                  <motion.div
                    key={analysis.id}
                    className="analysis-card"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => {
                      console.log('Selected analysis:', analysis);
                      setSelectedAnalysis(analysis);
                    }}
                  >
                    <div className="analysis-preview">
                      <img
                        src={getImageUrl(`uploads/${analysis.filename}`)}
                        alt={analysis.original_filename}
                        onError={(e) => {
                          console.error('Image failed to load:', e.target.src);
                          console.error('Full URL:', getImageUrl(`uploads/${analysis.filename}`));
                          // Don't hide the image immediately, let the placeholder show
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                        onLoad={(e) => {
                          console.log('Image loaded successfully:', e.target.src);
                          e.target.style.display = 'block';
                          e.target.nextSibling.style.display = 'none';
                        }}
                        style={{ display: 'block' }}
                      />
                      <div className="image-placeholder" style={{ display: 'none' }}>
                        <FaChartBar />
                        <p>Image not available</p>
                      </div>
                    </div>

                    <div className="analysis-info">
                      <h4>{analysis.original_filename}</h4>
                      <p className="analysis-time">
                        {formatDate(analysis.upload_timestamp)}
                      </p>

                      <div className="risk-assessment">
                        {getRiskLevelIcon(analysis.risk_level)}
                        <div className="risk-details">
                          <span className={`risk-level ${analysis.risk_level}`}>
                            {analysis.risk_level?.toUpperCase() || 'UNKNOWN'}
                          </span>
                          {analysis.risk_description && (
                            <p className="risk-description">
                              {analysis.risk_description}
                            </p>
                          )}
                        </div>
                      </div>

                      {analysis.detectedObjects && (
                        <div className="detected-objects-summary">
                          <strong>Detected:</strong> {analysis.detectedObjects.length} objects
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Analysis Detail Modal */}
      {selectedAnalysis && (
        <div className="modal-overlay" onClick={() => setSelectedAnalysis(null)}>
          <motion.div
            className="modal-content"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Analysis Details</h2>
              <button
                className="modal-close"
                onClick={() => setSelectedAnalysis(null)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="analysis-image">
                <img
                  src={getImageUrl(`uploads/${selectedAnalysis.filename}`)}
                  alt={selectedAnalysis.original_filename}
                  onError={(e) => {
                    console.error('Modal image failed to load:', e.target.src);
                    console.error('Full URL:', getImageUrl(`uploads/${selectedAnalysis.filename}`));
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                  onLoad={(e) => {
                    console.log('Modal image loaded successfully:', e.target.src);
                    e.target.style.display = 'block';
                    e.target.nextSibling.style.display = 'none';
                  }}
                  style={{ display: 'block' }}
                />
                <div className="image-placeholder" style={{ display: 'none' }}>
                  <FaChartBar />
                  <p>Image not available</p>
                </div>
              </div>

              <div className="analysis-details">
                <h3>{selectedAnalysis.original_filename}</h3>
                <p className="analysis-time">
                  Analyzed on {formatDate(selectedAnalysis.upload_timestamp)}
                </p>

                <div className="risk-summary">
                  <div className="risk-header">
                    {getRiskLevelIcon(selectedAnalysis.risk_level)}
                    <span className={`risk-level ${selectedAnalysis.risk_level}`}>
                      {selectedAnalysis.risk_level?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </div>
                  
                  {selectedAnalysis.risk_description && (
                    <div className="risk-description-full">
                      {selectedAnalysis.risk_description}
                    </div>
                  )}
                </div>

                <div className="detected-objects-section">
                  <h4>Detected Objects</h4>
                  {renderDetectedObjects(selectedAnalysis.detectedObjects)}
                </div>

                {selectedAnalysis.confidenceScores && (
                  <div className="confidence-scores">
                    <h4>Confidence Scores</h4>
                    <div className="confidence-grid">
                      {Object.entries(selectedAnalysis.confidenceScores).map(([object, data]) => {
                        console.log('Confidence score:', object, data);
                        return (
                          <div key={object} className="confidence-item">
                            <span className="object-name">{object}</span>
                            <span className="confidence-value">
                              {data && data.confidence ? (data.confidence * 100).toFixed(1) : '0'}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Analysis;
