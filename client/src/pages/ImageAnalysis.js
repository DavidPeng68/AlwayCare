import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import './ImageAnalysis.css';

const ImageAnalysis = () => {
  const { imageId } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    fetchAnalysis();
  }, [imageId]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/analysis/${imageId}`);
      setAnalysis(response.data);
      
      // Start polling if analysis is still processing
      if (response.data.status === 'pending' || response.data.status === 'processing') {
        startPolling();
      }
    } catch (error) {
      console.error('Error fetching analysis:', error);
      toast.error('Failed to load analysis results');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    setPolling(true);
    const poll = async () => {
      try {
        const response = await axios.get(`/api/analysis/${imageId}`);
        setAnalysis(response.data);
        
        if (response.data.status === 'completed' || response.data.status === 'failed') {
          setPolling(false);
          return;
        }
        
        setTimeout(poll, 5000); // Poll every 5 seconds
      } catch (error) {
        console.error('Polling error:', error);
        setPolling(false);
      }
    };
    
    setTimeout(poll, 5000);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} className="status-icon completed" />;
      case 'processing':
        return <Clock size={20} className="status-icon processing" />;
      case 'pending':
        return <Clock size={20} className="status-icon pending" />;
      case 'failed':
        return <XCircle size={20} className="status-icon failed" />;
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

  const getRiskLevelIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'low':
        return <CheckCircle size={20} />;
      case 'medium':
      case 'high':
      case 'critical':
        return <AlertTriangle size={20} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="image-analysis">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading analysis results...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="image-analysis">
        <div className="error-state">
          <h2>Analysis not found</h2>
          <p>The requested analysis could not be found.</p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="image-analysis">
      {/* Header */}
      <div className="analysis-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <div className="header-content">
          <h1>Image Analysis Results</h1>
          <div className="analysis-status">
            {getStatusIcon(analysis.status)}
            <span className="status-text">{analysis.status}</span>
            {polling && <span className="polling-indicator">Updating...</span>}
          </div>
        </div>
      </div>

      {/* Analysis Content */}
      <div className="analysis-content">
        {/* Image Display */}
        <div className="image-section">
          <div className="image-container">
            <img 
              src={`/uploads/${analysis.filename || 'placeholder'}`} 
              alt="Analyzed image"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="image-placeholder">
              <p>Image not available</p>
            </div>
          </div>
        </div>

        {/* Analysis Results */}
        <div className="results-section">
          {/* Risk Level */}
          {analysis.riskLevel && (
            <div className="risk-level-card">
              <div className="risk-header">
                <h3>Risk Assessment</h3>
                <span 
                  className="risk-level-badge"
                  style={{ backgroundColor: getRiskLevelColor(analysis.riskLevel) }}
                >
                  {getRiskLevelIcon(analysis.riskLevel)}
                  {analysis.riskLevel.toUpperCase()} RISK
                </span>
              </div>
              <p className="risk-description">
                {analysis.riskLevel === 'low' && 'No significant safety concerns detected.'}
                {analysis.riskLevel === 'medium' && 'Some potential safety concerns identified.'}
                {analysis.riskLevel === 'high' && 'Significant safety concerns detected. Immediate attention recommended.'}
                {analysis.riskLevel === 'critical' && 'Critical safety concerns detected. Immediate action required.'}
              </p>
            </div>
          )}

          {/* Warnings */}
          {analysis.warnings && analysis.warnings.length > 0 && (
            <div className="warnings-section">
              <h3>Safety Warnings</h3>
              <div className="warnings-list">
                {analysis.warnings.map((warning, index) => (
                  <div key={index} className="warning-item">
                    <AlertTriangle size={16} className="warning-icon" />
                    <div className="warning-content">
                      <p className="warning-message">{warning.message}</p>
                      <div className="warning-details">
                        <span className="warning-object">Object: {warning.object}</span>
                        <span className="warning-confidence">
                          Confidence: {Math.round(warning.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detected Objects */}
          {analysis.detectedObjects && analysis.detectedObjects.length > 0 && (
            <div className="objects-section">
              <h3>Detected Objects</h3>
              <div className="objects-grid">
                {analysis.detectedObjects.map((object, index) => (
                  <div key={index} className="object-item">
                    <span className="object-name">{object}</span>
                    {analysis.confidenceScores && analysis.confidenceScores[index] && (
                      <span className="confidence-score">
                        {Math.round(analysis.confidenceScores[index] * 100)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analysis Metadata */}
          {analysis.metadata && (
            <div className="metadata-section">
              <h3>Image Information</h3>
              <div className="metadata-grid">
                <div className="metadata-item">
                  <span className="metadata-label">Dimensions:</span>
                  <span className="metadata-value">
                    {analysis.metadata.width} × {analysis.metadata.height}
                  </span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Format:</span>
                  <span className="metadata-value">{analysis.metadata.format}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Analysis Time:</span>
                  <span className="metadata-value">
                    {new Date(analysis.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {analysis.errorMessage && (
            <div className="error-section">
              <h3>Analysis Error</h3>
              <div className="error-message">
                <XCircle size={16} />
                <span>{analysis.errorMessage}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageAnalysis;