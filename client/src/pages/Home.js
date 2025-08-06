import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Upload, Shield, Eye, Zap, Users } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showUpload, setShowUpload] = useState(false);

  const features = [
    {
      icon: <Shield size={48} />,
      title: 'AI-Powered Safety Detection',
      description: 'Advanced computer vision technology identifies potential hazards in images of children and environments.'
    },
    {
      icon: <Eye size={48} />,
      title: 'Real-time Analysis',
      description: 'Instant detection of dangerous objects, situations, and environmental risks with detailed warnings.'
    },
    {
      icon: <Zap size={48} />,
      title: 'Continuous Monitoring',
      description: 'Background processing ensures all uploaded images are automatically analyzed for safety concerns.'
    },
    {
      icon: <Users size={48} />,
      title: 'Family-Focused Design',
      description: 'Built with families in mind, featuring a friendly interface and comprehensive safety insights.'
    }
  ];

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Protect Your Children with AI-Powered Safety Detection</h1>
            <p className="hero-description">
              AlwaysCare uses advanced computer vision technology to identify potential dangers 
              in images of children and environments. Upload photos to get instant safety analysis 
              and peace of mind.
            </p>
            <div className="hero-actions">
              <button onClick={handleGetStarted} className="btn btn-primary btn-large">
                Get Started Now
              </button>
              {isAuthenticated && (
                <button 
                  onClick={() => setShowUpload(true)} 
                  className="btn btn-secondary btn-large"
                >
                  <Upload size={20} />
                  Upload Image
                </button>
              )}
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-illustration">
              <div className="safety-shield">
                <Shield size={120} />
              </div>
              <div className="floating-elements">
                <div className="floating-icon icon-1">🛡️</div>
                <div className="floating-icon icon-2">👶</div>
                <div className="floating-icon icon-3">🏠</div>
                <div className="floating-icon icon-4">🔒</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Why Choose AlwaysCare?</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Upload Image</h3>
              <p>Upload a photo of your child or their environment through our secure platform.</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>AI Analysis</h3>
              <p>Our advanced AI scans the image for potential hazards and safety concerns.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Get Results</h3>
              <p>Receive detailed analysis with risk levels and specific safety recommendations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Keep Your Children Safe?</h2>
            <p>Join thousands of families who trust AlwaysCare for their child safety needs.</p>
            <button onClick={handleGetStarted} className="btn btn-primary btn-large">
              Start Protecting Today
            </button>
          </div>
        </div>
      </section>

      {/* Image Upload Modal */}
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
              <ImageUpload onClose={() => setShowUpload(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;