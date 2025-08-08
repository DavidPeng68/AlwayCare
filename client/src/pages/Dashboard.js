import React, { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  FaUpload,
  FaImage,
  FaSpinner,
  FaCheck,
  FaExclamationTriangle,
  FaTrash,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import toast from "react-hot-toast";
import API_BASE_URL from "../config";
import { getImageUrl } from "../utils/imageUtils";
import "./Dashboard.css";

const Dashboard = () => {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/images/my-images");
      setUploadedImages(data.images || []);
    } catch (error) {
      console.error("Error fetching images:", error);
      toast.error("Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    setUploading(true);

    try {
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append("image", file);

        const { data } = await api.post("/api/images/upload", formData);

        toast.success(`Image "${file.name}" uploaded successfully!`);

        setUploadedImages((prev) => [
          {
            id: data.imageId,
            filename: data.filename,
            originalName: data.originalName,
            status: "pending",
            uploadTimestamp: new Date().toISOString(),
          },
          ...prev,
        ]);
      }

      fetchImages();
    } catch (error) {
      console.error("Upload error:", error);
      const message = error.response?.data?.error || "Upload failed";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  const deleteImage = async (imageId) => {
    try {
      await api.delete(`/api/images/${imageId}`);
      setUploadedImages((prev) => prev.filter((img) => img.id !== imageId));
      toast.success("Image deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete image");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <FaSpinner className="status-icon pending" />;
      case "processing":
        return <FaSpinner className="status-icon processing" />;
      case "completed":
        return <FaCheck className="status-icon completed" />;
      case "failed":
        return <FaExclamationTriangle className="status-icon failed" />;
      default:
        return <FaImage className="status-icon" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Pending Analysis";
      case "processing":
        return "Analyzing...";
      case "completed":
        return "Analysis Complete";
      case "failed":
        return "Analysis Failed";
      default:
        return "Unknown";
    }
  };

  const getRiskLevelClass = (riskLevel) => {
    switch (riskLevel) {
      case "none":
        return "risk-none";
      case "low":
        return "risk-low";
      case "medium":
        return "risk-medium";
      case "high":
        return "risk-high";
      default:
        return "";
    }
  };

  return (
    <div className="dashboard">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="dashboard-header">
            <h1>Image Upload & Analysis</h1>
            <p>
              Upload images of your child's environment to detect potential
              hazards
            </p>
          </div>

          {/* Upload Area */}
          <div className="upload-section">
            <div
              {...getRootProps()}
              className={`upload-area ${isDragActive ? "drag-active" : ""}`}
            >
              <input {...getInputProps()} />
              <div className="upload-content">
                <FaUpload className="upload-icon" />
                <h3>Drop images here or click to browse</h3>
                <p>Supports JPG, PNG, GIF, WEBP (max 10MB each)</p>
                {uploading && (
                  <div className="upload-progress">
                    <FaSpinner className="loading-spinner" />
                    <span>Uploading...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Images List */}
          <div className="images-section">
            <h2>Your Images</h2>

            {loading ? (
              <div className="loading-container">
                <FaSpinner className="loading-spinner" />
                <span>Loading images...</span>
              </div>
            ) : uploadedImages.length === 0 ? (
              <div className="empty-state">
                <FaImage className="empty-icon" />
                <h3>No images uploaded yet</h3>
                <p>
                  Upload your first image to get started with safety analysis
                </p>
              </div>
            ) : (
              <div className="images-grid">
                <AnimatePresence>
                  {uploadedImages.map((image) => (
                    <motion.div
                      key={image.id}
                      className="image-card"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="image-preview">
                        <img
                          src={getImageUrl(`uploads/${image.filename}`)}
                          alt={image.originalName}
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                        <div className="image-placeholder">
                          <FaImage />
                        </div>
                      </div>

                      <div className="image-info">
                        <h4>{image.originalName}</h4>
                        <p className="upload-time">
                          {new Date(image.uploadTimestamp).toLocaleString()}
                        </p>

                        <div className="image-status">
                          {getStatusIcon(image.status)}
                          <span>{getStatusText(image.status)}</span>
                        </div>

                        {image.riskLevel && (
                          <div
                            className={`risk-level ${getRiskLevelClass(
                              image.riskLevel
                            )}`}
                          >
                            Risk Level: {image.riskLevel.toUpperCase()}
                          </div>
                        )}

                        {image.riskDescription && (
                          <div className="risk-description">
                            {image.riskDescription}
                          </div>
                        )}
                      </div>

                      <div className="image-actions">
                        <button
                          onClick={() => deleteImage(image.id)}
                          className="btn btn-danger"
                          title="Delete image"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
