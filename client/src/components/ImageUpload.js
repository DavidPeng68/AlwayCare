import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import './ImageUpload.css';

const ImageUpload = ({ onClose, onUploadSuccess }) => {
  const { isAuthenticated } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!isAuthenticated) {
      toast.error('Please login to upload images');
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setUploadedImage(null);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post('/api/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { image } = response.data;
      setUploadedImage(image);
      toast.success('Image uploaded successfully! Analysis in progress...');

      // Start polling for analysis results
      pollForAnalysisResults(image.id);

    } catch (error) {
      console.error('Upload error:', error);
      const message = error.response?.data?.error || 'Upload failed';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }, [isAuthenticated]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    disabled: uploading || !isAuthenticated
  });

  const pollForAnalysisResults = async (imageId) => {
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await axios.get(`/api/analysis/${imageId}`);
        const { status, riskLevel, detectedObjects, warnings } = response.data;

        if (status === 'completed') {
          setAnalysisResult(response.data);
          toast.success('Analysis completed!');
          if (onUploadSuccess) {
            onUploadSuccess(response.data);
          }
          return;
        } else if (status === 'failed') {
          toast.error('Analysis failed. Please try again.');
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        } else {
          toast.error('Analysis is taking longer than expected. Please check back later.');
        }
      } catch (error) {
        console.error('Polling error:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000);
        }
      }
    };

    setTimeout(poll, 5000); // Start polling after 5 seconds
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
        return <AlertCircle size={20} />;
      default:
        return null;
    }
  };

  return (
    <div className="image-upload">
      {!uploadedImage ? (
        <div className="upload-section">
          <div
            {...getRootProps()}
            className={`dropzone ${isDragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="dropzone-content">
              {uploading ? (
                <div className="uploading-content">
                  <div className="spinner"></div>
                  <p>Uploading image...</p>
                </div>
              ) : (
                <>
                  <Upload size={48} className="upload-icon" />
                  <h3>Upload Image for Safety Analysis</h3>
                  <p>
                    {isDragActive
                      ? 'Drop the image here...'
                      : 'Drag & drop an image here, or click to select'}
                  </p>
                  <div className="upload-requirements">
                    <p>Supported formats: JPEG, PNG, GIF, WebP</p>
                    <p>Maximum file size: 10MB</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="upload-result">
          <div className="result-header">
            <h3>Analysis Results</h3>
            <button onClick={onClose} className="close-btn">
              <X size={20} />
            </button>
          </div>

          <div className="result-content">
            {analysisResult ? (
              <>
                <div className="risk-summary">
                  <div className="risk-level-indicator">
                    <span className="risk-level" style={{ backgroundColor: getRiskLevelColor(analysisResult.riskLevel) }}>
                      {getRiskLevelIcon(analysisResult.riskLevel)}
                      {analysisResult.riskLevel.toUpperCase()} RISK
                    </span>
                  </div>

                  {analysisResult.warnings && analysisResult.warnings.length > 0 && (
                    <div className="warnings-section">
                      <h4>Safety Warnings</h4>
                      {analysisResult.warnings.map((warning, index) => (
                        <div key={index} className="warning-item">
                          <AlertCircle size={16} />
                          <span>{warning.message}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {analysisResult.detectedObjects && analysisResult.detectedObjects.length > 0 && (
                    <div className="detected-objects">
                      <h4>Detected Objects</h4>
                      <div className="objects-grid">
                        {analysisResult.detectedObjects.map((object, index) => (
                          <div key={index} className="object-item">
                            <span className="object-name">{object}</span>
                            {analysisResult.confidenceScores[index] && (
                              <span className="confidence-score">
                                {Math.round(analysisResult.confidenceScores[index] * 100)}%
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="analysis-loading">
                <div className="spinner"></div>
                <p>Analyzing image for safety concerns...</p>
                <p className="loading-note">This may take a few moments</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;