import React, { useState, useEffect } from "react";
import {
  FaChartBar,
  FaShieldAlt,
  FaExclamationTriangle,
  FaCheck,
  FaClock,
  FaTimes,
} from "react-icons/fa";
import { motion } from "framer-motion";
import api from "../api";
import toast from "react-hot-toast";
import { getImageUrl } from "../utils/imageUtils";
import "./Analysis.css";

const Analysis = () => {
  const [analyses, setAnalyses] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  // Fetch initial data and start polling
  useEffect(() => {
    fetchAll();
    // Poll every 5 seconds to keep UI fresh as background jobs complete
    const id = setInterval(fetchAll, 5000);
    return () => clearInterval(id);
  }, []);

  const fetchAll = async () => {
    await Promise.all([fetchAnalyses(), fetchStats()]);
  };

  // Fetch completed analyses
  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/analysis/completed");
      // Expecting data.analyses (array). Fallback to [] if not present.
      setAnalyses(data?.analyses || []);
    } catch (error) {
      console.error("Error fetching analyses:", error);
      toast.error("Failed to load analyses");
    } finally {
      setLoading(false);
    }
  };

  // Fetch aggregated analysis statistics
  const fetchStats = async () => {
    try {
      const { data } = await api.get("/api/analysis/stats");
      setStats(data || {});
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Stats are optional; no toast to avoid noise.
    }
  };

  // Map risk level to an icon
  const getRiskLevelIcon = (riskLevel) => {
    switch (riskLevel) {
      case "none":
        return <FaCheck className="risk-icon safe" />;
      case "low":
        return <FaShieldAlt className="risk-icon low" />;
      case "medium":
        return <FaExclamationTriangle className="risk-icon medium" />;
      case "high":
        return <FaExclamationTriangle className="risk-icon high" />;
      default:
        return <FaClock className="risk-icon" />;
    }
  };

  // Safely format timestamps
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? "-" : d.toLocaleString();
  };

  // Normalize analysis object fields (snake_case vs camelCase)
  const normalizeAnalysis = (a) => {
    if (!a) return {};
    return {
      id: a.id ?? a.image_id ?? a.analysis_id,
      filename: a.filename,
      originalFilename:
        a.original_filename ?? a.originalName ?? a.original_filename,
      uploadTimestamp: a.upload_timestamp ?? a.uploadTimestamp,
      riskLevel: a.risk_level ?? a.riskLevel,
      riskDescription: a.risk_description ?? a.riskDescription,
      detectedObjects: a.detectedObjects ?? a.detected_objects ?? [],
      confidenceScores: a.confidenceScores ?? a.confidence_scores ?? null,
    };
  };

  // Render the list of detected objects
  const renderDetectedObjects = (detectedObjects) => {
    const list = detectedObjects || [];
    if (!Array.isArray(list) || list.length === 0) {
      return <p className="no-objects">No objects detected</p>;
    }

    return (
      <div className="detected-objects">
        {list.map((obj, index) => {
          const name = obj?.name ?? "Unknown";
          // Confidence may be 0~1 or already percentage; assume 0~1 and convert
          const conf =
            typeof obj?.confidence === "number"
              ? (obj.confidence * 100).toFixed(1)
              : "0";
          return (
            <div key={`${name}-${index}`} className="detected-object">
              <span className="object-name">{name}</span>
              <span className="object-confidence">{conf}%</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Pull safe numbers from stats with graceful fallbacks
  const getTotalsFromStats = () => {
    const statusDist =
      stats?.statusDistribution || stats?.status_distribution || [];
    const riskDist = stats?.riskDistribution || stats?.risk_distribution || [];

    const totalCompleted =
      statusDist.find((s) => (s.analysis_status ?? s.status) === "completed")
        ?.count || 0;
    const totalPending =
      statusDist.find((s) => (s.analysis_status ?? s.status) === "pending")
        ?.count || 0;

    const safeCount =
      riskDist.find((r) => (r.risk_level ?? r.level) === "none")?.count || 0;
    const hazardsCount = (
      riskDist.filter((r) => (r.risk_level ?? r.level) !== "none") || []
    ).reduce((sum, r) => sum + (r.count || 0), 0);

    return { totalCompleted, totalPending, safeCount, hazardsCount };
  };

  const { totalCompleted, totalPending, safeCount, hazardsCount } =
    getTotalsFromStats();

  return (
    <div className="analysis">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
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
                  <p className="stat-number">{totalCompleted}</p>
                </div>
              </div>

              <div className="stat-card">
                <FaShieldAlt className="stat-icon" />
                <div className="stat-content">
                  <h3>Safe Environments</h3>
                  <p className="stat-number">{safeCount}</p>
                </div>
              </div>

              <div className="stat-card">
                <FaExclamationTriangle className="stat-icon" />
                <div className="stat-content">
                  <h3>Hazards Detected</h3>
                  <p className="stat-number">{hazardsCount}</p>
                </div>
              </div>

              <div className="stat-card">
                <FaClock className="stat-icon" />
                <div className="stat-content">
                  <h3>Pending Analysis</h3>
                  <p className="stat-number">{totalPending}</p>
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
                {analyses.map((raw) => {
                  const a = normalizeAnalysis(raw);
                  return (
                    <motion.div
                      key={a.id}
                      className="analysis-card"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      onClick={() => setSelectedAnalysis(a)}
                    >
                      <div className="analysis-preview">
                        <img
                          src={getImageUrl(`uploads/${a.filename}`)}
                          alt={a.originalFilename}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextSibling.style.display = "flex";
                          }}
                        />
                        <div className="image-placeholder">
                          <FaChartBar />
                        </div>
                      </div>

                      <div className="analysis-info">
                        <h4>{a.originalFilename}</h4>
                        <p className="analysis-time">
                          {formatDate(a.uploadTimestamp)}
                        </p>

                        <div className="risk-assessment">
                          {getRiskLevelIcon(a.riskLevel)}
                          <div className="risk-details">
                            <span
                              className={`risk-level ${
                                a.riskLevel || "unknown"
                              }`}
                            >
                              {(a.riskLevel || "UNKNOWN").toUpperCase()}
                            </span>
                            {a.riskDescription && (
                              <p className="risk-description">
                                {a.riskDescription}
                              </p>
                            )}
                          </div>
                        </div>

                        {Array.isArray(a.detectedObjects) && (
                          <div className="detected-objects-summary">
                            <strong>Detected:</strong>{" "}
                            {a.detectedObjects.length} objects
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Analysis Detail Modal */}
      {selectedAnalysis && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedAnalysis(null)}
        >
          <motion.div
            className="modal-content"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={(e) => e.stopPropagation()} // prevent overlay close on inner click
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
                  alt={selectedAnalysis.originalFilename}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextSibling.style.display = "flex";
                  }}
                />
                <div className="image-placeholder">
                  <FaChartBar />
                </div>
              </div>

              <div className="analysis-details">
                <h3>{selectedAnalysis.originalFilename}</h3>
                <p className="analysis-time">
                  Analyzed on {formatDate(selectedAnalysis.uploadTimestamp)}
                </p>

                <div className="risk-summary">
                  <div className="risk-header">
                    {getRiskLevelIcon(selectedAnalysis.riskLevel)}
                    <span
                      className={`risk-level ${
                        selectedAnalysis.riskLevel || "unknown"
                      }`}
                    >
                      {(selectedAnalysis.riskLevel || "UNKNOWN").toUpperCase()}
                    </span>
                  </div>

                  {selectedAnalysis.riskDescription && (
                    <div className="risk-description-full">
                      {selectedAnalysis.riskDescription}
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
                      {Object.entries(selectedAnalysis.confidenceScores).map(
                        ([object, data]) => {
                          const conf =
                            typeof data?.confidence === "number"
                              ? (data.confidence * 100).toFixed(1)
                              : "0";
                          return (
                            <div key={object} className="confidence-item">
                              <span className="object-name">{object}</span>
                              <span className="confidence-value">{conf}%</span>
                            </div>
                          );
                        }
                      )}
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
