import React, { useState, useEffect } from "react";
import axios from "axios";

const FileUpload = () => {
  const [resume, setResume] = useState(null);
  const [jd, setJD] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("analysis");
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [multipleResumes, setMultipleResumes] = useState([]);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [dragOver, setDragOver] = useState({ resume: false, jd: false });

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // ===== ENHANCED RESPONSIVE STYLES =====
  const styles = {
    app: {
      width: "100vw",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      overflow: "auto",
    },
    
    container: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "280px 1fr",
      minHeight: "100vh",
      width: "100vw",
      position: "relative",
    },

    // Mobile Overlay
    mobileOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.5)",
      zIndex: 998,
      display: sidebarOpen ? "block" : "none",
    },

    // Enhanced Professional Sidebar
    sidebar: {
      background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
      borderRight: "1px solid #334155",
      padding: isMobile ? "4rem 1.5rem 2rem" : "2rem 1.5rem",
      display: "flex",
      flexDirection: "column",
      position: isMobile ? "fixed" : "relative",
      top: 0,
      left: 0,
      bottom: 0,
      width: isMobile ? "280px" : "auto",
      zIndex: 999,
      transform: isMobile && !sidebarOpen ? "translateX(-100%)" : "translateX(0)",
      transition: "transform 0.3s ease",
      boxShadow: "0 0 40px rgba(0, 0, 0, 0.3)",
    },

    // Enhanced Mobile Header
    mobileHeader: {
      background: "linear-gradient(90deg, #1e293b 0%, #0f172a 100%)",
      padding: "1rem 1.5rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 997,
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
    },

    mobileMenuButton: {
      background: "rgba(255, 255, 255, 0.1)",
      border: "none",
      color: "#ffffff",
      fontSize: "1.25rem",
      cursor: "pointer",
      padding: "0.5rem",
      borderRadius: "8px",
      backdropFilter: "blur(10px)",
    },

    logo: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      marginBottom: "3rem",
      fontSize: isMobile ? "1.1rem" : "1.25rem",
      fontWeight: "700",
      color: "#ffffff",
      padding: "1rem",
      background: "rgba(255, 255, 255, 0.1)",
      borderRadius: "12px",
      backdropFilter: "blur(10px)",
    },

    logoAccent: {
      color: "#60a5fa",
      textShadow: "0 0 20px rgba(96, 165, 250, 0.5)",
    },

    nav: {
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      flex: 1,
    },

    navItem: {
      padding: isMobile ? "1.25rem 1.5rem" : "1rem 1.25rem",
      borderRadius: "12px",
      border: "none",
      background: "transparent",
      cursor: "pointer",
      fontSize: isMobile ? "1rem" : "0.9rem",
      fontWeight: "500",
      color: "#94a3b8",
      textAlign: "left",
      transition: "all 0.3s ease",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      backdropFilter: "blur(10px)",
    },

    navItemActive: {
      background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
      color: "#ffffff",
      boxShadow: "0 8px 25px rgba(59, 130, 246, 0.3)",
      transform: "translateX(5px)",
    },

    // Main Content Area
    main: {
      padding: "0",
      background: "#f8fafc",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      marginTop: isMobile ? "60px" : "0",
      minHeight: isMobile ? "calc(100vh - 60px)" : "100vh",
    },

    header: {
      background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
      padding: isMobile ? "1.5rem 1.5rem" : "2rem 2.5rem",
      borderBottom: "1px solid #e2e8f0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
    },

    headerTitle: {
      fontSize: isMobile ? "1.5rem" : "2rem",
      fontWeight: "700",
      background: "linear-gradient(135deg, #1e293b 0%, #475569 100%)",
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      margin: 0,
    },

    headerActions: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
    },

    userProfile: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      padding: "0.75rem 1rem",
      borderRadius: "12px",
      cursor: "pointer",
      background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
      color: "white",
      fontWeight: "600",
      boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
    },

    userAvatar: {
      width: "36px",
      height: "36px",
      borderRadius: "50%",
      background: "rgba(255, 255, 255, 0.2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#ffffff",
      fontWeight: "600",
      fontSize: "0.875rem",
      backdropFilter: "blur(10px)",
    },

    content: {
      flex: 1,
      padding: isMobile ? "2rem 1rem" : "3rem 2.5rem",
      overflowY: "auto",
      background: "linear-gradient(135deg, #f1f5f9 0%, #f8fafc 100%)",
    },

    // Enhanced Cards
    card: {
      background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
      borderRadius: "20px",
      padding: isMobile ? "2rem 1.5rem" : "3rem",
      marginBottom: "2rem",
      border: "1px solid #e2e8f0",
      boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
      backdropFilter: "blur(10px)",
    },

    cardHeader: {
      marginBottom: "2rem",
      textAlign: "center",
    },

    cardTitle: {
      fontSize: isMobile ? "1.5rem" : "2rem",
      fontWeight: "700",
      background: "linear-gradient(135deg, #1e293b 0%, #475569 100%)",
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      margin: "0 0 1rem 0",
    },

    cardSubtitle: {
      fontSize: isMobile ? "1rem" : "1.1rem",
      color: "#64748b",
      lineHeight: "1.6",
    },

    // Enhanced Upload Section
    uploadGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : comparisonMode ? "1fr 1fr" : "1fr 1fr",
      gap: isMobile ? "1.5rem" : "2rem",
      marginBottom: "2rem",
    },

    uploadCard: {
      border: "3px dashed #cbd5e1",
      borderRadius: "16px",
      padding: isMobile ? "2.5rem 1.5rem" : "3rem 2rem",
      textAlign: "center",
      background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
      cursor: "pointer",
      transition: "all 0.4s ease",
      minHeight: isMobile ? "200px" : "280px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
      overflow: "hidden",
    },

    uploadCardActive: {
      borderColor: "#3b82f6",
      background: "linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)",
      boxShadow: "0 15px 40px rgba(59, 130, 246, 0.15)",
      transform: "translateY(-5px)",
    },

    uploadCardDragOver: {
      borderColor: "#10b981",
      background: "linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%)",
      boxShadow: "0 20px 50px rgba(16, 185, 129, 0.2)",
      transform: "scale(1.02)",
    },

    uploadIcon: {
      fontSize: isMobile ? "3rem" : "4rem",
      marginBottom: "1.5rem",
      opacity: "0.8",
      transition: "all 0.3s ease",
    },

    uploadTitle: {
      fontSize: isMobile ? "1.2rem" : "1.5rem",
      fontWeight: "600",
      color: "#1e293b",
      marginBottom: "0.75rem",
    },

    uploadSubtitle: {
      fontSize: isMobile ? "0.9rem" : "1rem",
      color: "#64748b",
      marginBottom: "1.5rem",
      lineHeight: "1.5",
    },

    // Enhanced Buttons
    buttonGroup: {
      display: "flex",
      gap: "1rem",
      flexDirection: isMobile ? "column" : "row",
      justifyContent: "center",
      alignItems: "center",
    },

    buttonPrimary: {
      background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
      color: "#ffffff",
      border: "none",
      padding: isMobile ? "1.25rem 2rem" : "1rem 2rem",
      borderRadius: "12px",
      fontWeight: "600",
      cursor: "pointer",
      fontSize: isMobile ? "1.1rem" : "1rem",
      transition: "all 0.3s ease",
      width: isMobile ? "100%" : "auto",
      boxShadow: "0 8px 25px rgba(59, 130, 246, 0.3)",
      position: "relative",
      overflow: "hidden",
    },

    buttonPrimaryHover: {
      transform: "translateY(-2px)",
      boxShadow: "0 15px 35px rgba(59, 130, 246, 0.4)",
    },

    buttonSecondary: {
      background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
      color: "#475569",
      border: "2px solid #e2e8f0",
      padding: isMobile ? "1.25rem 2rem" : "1rem 2rem",
      borderRadius: "12px",
      fontWeight: "600",
      cursor: "pointer",
      fontSize: isMobile ? "1.1rem" : "1rem",
      transition: "all 0.3s ease",
      width: isMobile ? "100%" : "auto",
      boxShadow: "0 4px 15px rgba(0, 0, 0, 0.05)",
    },

    buttonSuccess: {
      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      color: "#ffffff",
      border: "none",
      padding: isMobile ? "1.25rem 2rem" : "1rem 2rem",
      borderRadius: "12px",
      fontWeight: "600",
      cursor: "pointer",
      fontSize: isMobile ? "1.1rem" : "1rem",
      transition: "all 0.3s ease",
      width: isMobile ? "100%" : "auto",
      boxShadow: "0 8px 25px rgba(16, 185, 129, 0.3)",
    },

    buttonDisabled: {
      opacity: "0.6",
      cursor: "not-allowed",
      transform: "none !important",
      boxShadow: "none !important",
    },

    // Enhanced File Info
    fileInfo: {
      marginTop: "1.5rem",
      textAlign: "center",
      padding: "1rem",
      background: "rgba(255, 255, 255, 0.8)",
      borderRadius: "12px",
      border: "1px solid #e2e8f0",
    },

    fileName: {
      fontWeight: "600",
      color: "#059669",
      fontSize: isMobile ? "0.9rem" : "1rem",
    },

    fileSize: {
      fontSize: isMobile ? "0.8rem" : "0.875rem",
      color: "#64748b",
      marginTop: "0.25rem",
    },

    // Enhanced Results
    resultsGrid: {
      display: "grid",
      gap: "2rem",
    },

    scoreCard: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      alignItems: "center",
      gap: isMobile ? "2rem" : "3rem",
      padding: isMobile ? "2.5rem 1.5rem" : "3rem",
      background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
      borderRadius: "20px",
      border: "1px solid #e2e8f0",
      textAlign: isMobile ? "center" : "left",
      boxShadow: "0 15px 40px rgba(0, 0, 0, 0.08)",
    },

    scoreCircle: {
      width: isMobile ? "140px" : "160px",
      height: isMobile ? "140px" : "160px",
      borderRadius: "50%",
      background: analysisData ? `conic-gradient(#10b981 0%, #10b981 ${analysisData.match_score}%, #e2e8f0 ${analysisData.match_score}%, #e2e8f0 100%)` : "#e2e8f0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
      position: "relative",
    },

    scoreInner: {
      background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
      width: isMobile ? "110px" : "130px",
      height: isMobile ? "110px" : "130px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      border: "2px solid #f1f5f9",
      boxShadow: "0 5px 15px rgba(0, 0, 0, 0.05)",
    },

    scoreValue: {
      fontSize: isMobile ? "1.75rem" : "2.25rem",
      fontWeight: "700",
      color: "#059669",
    },

    scoreLabel: {
      fontSize: isMobile ? "0.75rem" : "0.875rem",
      color: "#64748b",
      marginTop: "0.5rem",
      fontWeight: "600",
    },

    scoreContent: {
      flex: 1,
    },

    scoreTitle: {
      fontSize: isMobile ? "1.5rem" : "2rem",
      fontWeight: "700",
      background: "linear-gradient(135deg, #1e293b 0%, #475569 100%)",
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      marginBottom: "1rem",
    },

    scoreDescription: {
      fontSize: isMobile ? "1rem" : "1.1rem",
      color: "#64748b",
      marginBottom: "2rem",
      lineHeight: "1.6",
    },

    metricsGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
      gap: isMobile ? "1.5rem" : "2rem",
      marginTop: "1rem",
    },

    metric: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      padding: "1.5rem 1rem",
      background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
      borderRadius: "12px",
      border: "1px solid #e2e8f0",
    },

    metricLabel: {
      fontSize: isMobile ? "0.8rem" : "0.875rem",
      color: "#64748b",
      marginBottom: "0.5rem",
      fontWeight: "500",
    },

    metricValue: {
      fontSize: isMobile ? "1.25rem" : "1.5rem",
      fontWeight: "700",
      color: "#1e293b",
    },

    // Enhanced Analysis Sections
    analysisGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: "2rem",
    },

    analysisCard: {
      background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
      borderRadius: "16px",
      padding: isMobile ? "1.5rem" : "2rem",
      border: "1px solid #e2e8f0",
      boxShadow: "0 8px 25px rgba(0, 0, 0, 0.05)",
      transition: "all 0.3s ease",
    },

    analysisCardHover: {
      transform: "translateY(-5px)",
      boxShadow: "0 15px 35px rgba(0, 0, 0, 0.1)",
    },

    analysisTitle: {
      fontSize: isMobile ? "1.1rem" : "1.25rem",
      fontWeight: "600",
      color: "#1e293b",
      marginBottom: "1.5rem",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
    },

    // Enhanced Skills
    skillsSection: {
      marginTop: "1.5rem",
    },

    skillsGrid: {
      display: "flex",
      flexWrap: "wrap",
      gap: "0.75rem",
      marginTop: "1rem",
      justifyContent: isMobile ? "center" : "flex-start",
    },

    skillTag: {
      background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
      color: "#ffffff",
      padding: isMobile ? "0.6rem 0.9rem" : "0.75rem 1rem",
      borderRadius: "8px",
      fontSize: isMobile ? "0.8rem" : "0.875rem",
      fontWeight: "500",
      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
    },

    skillTagMatched: {
      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
    },

    skillTagMissing: {
      background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
    },

    // Enhanced Suggestions
    suggestionsList: {
      listStyle: "none",
      padding: 0,
      margin: 0,
    },

    suggestionItem: {
      padding: "1rem",
      borderBottom: "1px solid #e2e8f0",
      fontSize: isMobile ? "0.9rem" : "1rem",
      color: "#475569",
      display: "flex",
      alignItems: "flex-start",
      gap: "0.75rem",
      transition: "all 0.2s ease",
    },

    suggestionItemHover: {
      background: "#f8fafc",
      transform: "translateX(5px)",
    },

    suggestionIcon: {
      color: "#3b82f6",
      flexShrink: 0,
      marginTop: "0.125rem",
      fontSize: "1.1rem",
    },

    // Enhanced Comparison Results
    comparisonTable: {
      width: "100%",
      borderCollapse: "separate",
      borderSpacing: "0",
      borderRadius: "12px",
      overflow: "hidden",
      boxShadow: "0 8px 25px rgba(0, 0, 0, 0.05)",
    },

    tableHeader: {
      background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
      fontWeight: "600",
      textAlign: "left",
      color: "#ffffff",
    },

    tableCell: {
      padding: "1rem",
      borderBottom: "1px solid #e2e8f0",
      fontSize: isMobile ? "0.8rem" : "0.9rem",
      background: "#ffffff",
    },

    bestMatch: {
      background: "linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%)",
      fontWeight: "600",
    },

    // Enhanced History
    historyItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: isMobile ? "1.25rem 1rem" : "1.5rem",
      borderBottom: "1px solid #e2e8f0",
      cursor: "pointer",
      transition: "all 0.3s ease",
      background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
      borderRadius: "12px",
      marginBottom: "0.75rem",
      boxShadow: "0 4px 15px rgba(0, 0, 0, 0.05)",
    },

    historyItemHover: {
      transform: "translateY(-2px)",
      boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)",
    },

    historyInfo: {
      flex: 1,
    },

    historyName: {
      fontWeight: "600",
      color: "#1e293b",
      fontSize: isMobile ? "0.9rem" : "1rem",
    },

    historyDetails: {
      fontSize: isMobile ? "0.75rem" : "0.875rem",
      color: "#64748b",
      marginTop: "0.25rem",
    },

    historyScore: {
      fontSize: isMobile ? "1.1rem" : "1.25rem",
      fontWeight: "700",
      color: "#059669",
    },

    // Enhanced Status Messages
    statusMessage: {
      padding: "1.5rem",
      borderRadius: "12px",
      marginTop: "1.5rem",
      fontSize: isMobile ? "0.9rem" : "1rem",
      fontWeight: "500",
      textAlign: "center",
      boxShadow: "0 4px 15px rgba(0, 0, 0, 0.05)",
    },

    statusSuccess: {
      background: "linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%)",
      color: "#065f46",
      border: "1px solid #a7f3d0",
    },

    statusError: {
      background: "linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)",
      color: "#991b1b",
      border: "1px solid #fecaca",
    },

    // Enhanced Toggle Switch
    toggleContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "1rem",
      marginBottom: "2rem",
      padding: "1.5rem",
      background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
      borderRadius: "16px",
      border: "1px solid #e2e8f0",
      boxShadow: "0 8px 25px rgba(0, 0, 0, 0.05)",
    },

    toggleLabel: {
      fontSize: isMobile ? "1rem" : "1.1rem",
      fontWeight: "600",
      color: "#1e293b",
    },

    toggleSwitch: {
      position: "relative",
      display: "inline-block",
      width: "60px",
      height: "30px",
    },

    toggleSlider: {
      position: "absolute",
      cursor: "pointer",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "#cbd5e1",
      transition: "0.4s",
      borderRadius: "34px",
      boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
    },

    toggleSliderActive: {
      backgroundColor: "#3b82f6",
      boxShadow: "0 0 10px rgba(59, 130, 246, 0.5)",
    },

    toggleKnob: {
      position: "absolute",
      content: '""',
      height: "24px",
      width: "24px",
      left: "3px",
      bottom: "3px",
      backgroundColor: "white",
      transition: "0.4s",
      borderRadius: "50%",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
    },

    toggleKnobActive: {
      transform: "translateX(30px)",
    },

    // Loading Animation
    loadingSpinner: {
      border: "3px solid #f3f4f6",
      borderTop: "3px solid #3b82f6",
      borderRadius: "50%",
      width: "30px",
      height: "30px",
      animation: "spin 1s linear infinite",
      margin: "0 auto",
    },
  };

  // Add CSS animation for spinner
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // ===== COMPONENT LOGIC =====
  const handleUpload = async () => {
    if (comparisonMode) {
      await handleMultipleResumeComparison();
    } else {
      await handleSingleAnalysis();
    }
  };

  const handleSingleAnalysis = async () => {
    if (!resume || !jd) {
      setMessage("Please select both files to continue");
      return;
    }

    const formData = new FormData();
    formData.append("resume", resume);
    formData.append("jd", jd);

    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post("http://127.0.0.1:8000/match/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000,
      });

      setAnalysisData(res.data);
      setMessage("🎉 Analysis completed successfully!");
      
      // Add to history
      const newAnalysis = {
        id: Date.now(),
        resume: resume.name,
        jd: jd.name,
        score: res.data.match_score,
        date: new Date().toLocaleDateString(),
        session_id: res.data.session_id
      };
      setAnalysisHistory(prev => [newAnalysis, ...prev.slice(0, 4)]);
      
    } catch (err) {
      setMessage("❌ Analysis failed: " + (err.response?.data?.detail || err.message));
      resetResults();
    } finally {
      setLoading(false);
    }
  };

  const handleMultipleResumeComparison = async () => {
    if (!jd || multipleResumes.length < 2) {
      setMessage("Please select a job description and at least 2 resumes");
      return;
    }

    const formData = new FormData();
    formData.append("jd", jd);
    multipleResumes.forEach((resume, index) => {
      formData.append("resumes", resume);
    });

    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post("http://127.0.0.1:8000/compare-multiple/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });

      setComparisonResults(res.data);
      setMessage(`🎯 Comparison completed! Best match: ${res.data.best_match.filename} (${res.data.best_match.match_score}%)`);
      
    } catch (err) {
      setMessage("❌ Comparison failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!analysisData) {
      setMessage("No analysis data available for report generation");
      return;
    }
    
    try {
      setMessage("Generating report...");
      
      // Use fetch API instead of axios for blob response
      const response = await fetch("http://127.0.0.1:8000/generate-report/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(analysisData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Check if blob is valid
      if (blob.size === 0) {
        throw new Error("Received empty PDF file");
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `resume_analysis_report_${Date.now()}.pdf`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setMessage("📄 Report downloaded successfully!");
    } catch (err) {
      console.error("Report download error:", err);
      setMessage("❌ Report download failed: " + (err.message || "Unknown error"));
    }
  };

  const resetForm = () => {
    setResume(null);
    setJD(null);
    setMultipleResumes([]);
    resetResults();
    setMessage("");
  };

  const resetResults = () => {
    setAnalysisData(null);
    setComparisonResults(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    const type = e.currentTarget.dataset.type;
    setDragOver(prev => ({ ...prev, [type]: true }));
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    const type = e.currentTarget.dataset.type;
    setDragOver(prev => ({ ...prev, [type]: false }));
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [type]: false }));
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      if (type === 'resume') {
        comparisonMode ? setMultipleResumes(prev => [...prev, files[0]]) : setResume(files[0]);
      } else {
        setJD(files[0]);
      }
    }
  };

  const removeResume = (index) => {
    setMultipleResumes(prev => prev.filter((_, i) => i !== index));
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#3b82f6";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  };

  // ===== ENHANCED RESPONSIVE COMPONENTS =====
  const FileUploadCard = ({ type, file, onFileSelect, onDrop, isMultiple = false, files = [], onRemoveFile }) => {
    const isResume = type === 'resume';
    const isDragOver = dragOver[type];
    
    return (
      <div 
        style={{ 
          ...styles.uploadCard,
          ...(file && styles.uploadCardActive),
          ...(isDragOver && styles.uploadCardDragOver)
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, type)}
        data-type={type}
      >
        <div style={styles.uploadIcon}>
          {isResume ? (isMultiple ? "📚" : "📄") : "📋"}
        </div>
        <div style={styles.uploadTitle}>
          {isResume 
            ? (isMultiple ? "Upload Resumes" : "Upload Resume")
            : "Upload Job Description"}
        </div>
        <div style={styles.uploadSubtitle}>
          {isMultiple ? "Drag & drop or select multiple PDF/DOCX files" : "Drag & drop or select PDF/DOCX files"}
        </div>
        <input 
          type="file" 
          accept=".pdf,.docx"
          onChange={onFileSelect}
          style={{ display: "none" }}
          id={`${type}-upload`}
          multiple={isMultiple}
        />
        <label 
          htmlFor={`${type}-upload`} 
          style={styles.buttonSecondary}
        >
          {isMultiple ? "📁 Choose Files" : "📁 Choose File"}
        </label>
        
        {isMultiple && files.length > 0 && (
          <div style={styles.fileInfo}>
            <div style={{ fontSize: "0.9rem", color: "#059669", marginBottom: "0.75rem", fontWeight: "600" }}>
              ✅ {files.length} file(s) selected
            </div>
            {files.slice(0, 3).map((file, index) => (
              <div key={index} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", color: "#374151", fontWeight: "500" }}>{file.name}</span>
                <button 
                  onClick={() => onRemoveFile(index)}
                  style={{ 
                    background: "none", 
                    border: "none", 
                    color: "#dc2626", 
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: "bold"
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            {files.length > 3 && (
              <div style={{ fontSize: "0.8rem", color: "#6b7280", fontStyle: "italic" }}>
                +{files.length - 3} more files
              </div>
            )}
          </div>
        )}
        
        {!isMultiple && file && (
          <div style={styles.fileInfo}>
            <div style={styles.fileName}>✅ {file.name}</div>
            <div style={styles.fileSize}>
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
        )}
      </div>
    );
  };

  const ScoreDisplay = () => {
    const score = analysisData?.match_score || 0;
    const scoreColor = getScoreColor(score);
    
    return (
      <div style={styles.scoreCard}>
        <div style={{...styles.scoreCircle, background: `conic-gradient(${scoreColor} 0%, ${scoreColor} ${score}%, #e2e8f0 ${score}%, #e2e8f0 100%)`}}>
          <div style={styles.scoreInner}>
            <div style={{...styles.scoreValue, color: scoreColor}}>{score}%</div>
            <div style={styles.scoreLabel}>MATCH</div>
          </div>
        </div>
        
        <div style={styles.scoreContent}>
          <div style={styles.scoreTitle}>
            {score >= 80 ? "🎉 Excellent Match!" : 
             score >= 60 ? "👍 Good Match" : 
             score >= 40 ? "🤔 Moderate Match" : 
             "⚠️ Needs Improvement"}
          </div>
          <div style={styles.scoreDescription}>
            {analysisData?.message || "Comprehensive analysis based on skills, experience, ATS compatibility, and qualifications."}
          </div>
          <div style={styles.metricsGrid}>
            <div style={styles.metric}>
              <div style={styles.metricLabel}>SKILLS MATCHED</div>
              <div style={styles.metricValue}>
                {analysisData?.breakdown?.skills_matched || 0}/{analysisData?.breakdown?.total_jd_skills || 0}
              </div>
            </div>
            <div style={styles.metric}>
              <div style={styles.metricLabel}>COVERAGE</div>
              <div style={styles.metricValue}>
                {analysisData?.breakdown?.coverage_percentage || 0}%
              </div>
            </div>
            <div style={styles.metric}>
              <div style={styles.metricLabel}>ATS SCORE</div>
              <div style={styles.metricValue}>
                {analysisData?.ats_analysis?.score || 0}%
              </div>
            </div>
            <div style={styles.metric}>
              <div style={styles.metricLabel}>EXPERIENCE</div>
              <div style={styles.metricValue}>
                {analysisData?.experience_years || 0} yrs
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AnalysisBreakdown = () => (
    <div style={styles.analysisGrid}>
      {/* Skills Analysis */}
      <div 
        style={styles.analysisCard}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = styles.analysisCardHover.transform;
          e.currentTarget.style.boxShadow = styles.analysisCardHover.boxShadow;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = styles.analysisCard.boxShadow;
        }}
      >
        <div style={styles.analysisTitle}>🔧 Skills Analysis</div>
        <div style={styles.metricsGrid}>
          <div style={styles.metric}>
            <div style={styles.metricLabel}>MATCHED</div>
            <div style={styles.metricValue}>{analysisData?.matched_keywords?.length || 0}</div>
          </div>
          <div style={styles.metric}>
            <div style={styles.metricLabel}>MISSING</div>
            <div style={styles.metricValue}>{analysisData?.missing_keywords?.length || 0}</div>
          </div>
        </div>
        
        <div style={{ marginTop: "1.5rem" }}>
          <div style={{ fontSize: "0.9rem", fontWeight: "600", marginBottom: "0.75rem", color: "#1e293b" }}>Top Matched Skills:</div>
          <div style={styles.skillsGrid}>
            {analysisData?.matched_keywords?.slice(0, 8).map((skill, index) => (
              <span key={index} style={{...styles.skillTag, ...styles.skillTagMatched}}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ATS & Completeness */}
      <div 
        style={styles.analysisCard}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = styles.analysisCardHover.transform;
          e.currentTarget.style.boxShadow = styles.analysisCardHover.boxShadow;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = styles.analysisCard.boxShadow;
        }}
      >
        <div style={styles.analysisTitle}>📊 Resume Quality</div>
        <div style={styles.metricsGrid}>
          <div style={styles.metric}>
            <div style={styles.metricLabel}>ATS SCORE</div>
            <div style={styles.metricValue}>{analysisData?.ats_analysis?.score || 0}%</div>
          </div>
          <div style={styles.metric}>
            <div style={styles.metricLabel}>COMPLETENESS</div>
            <div style={styles.metricValue}>{analysisData?.completeness_analysis?.score || 0}%</div>
          </div>
        </div>
        
        <div style={{ marginTop: "1.5rem" }}>
          <div style={{ 
            fontSize: "0.9rem", 
            color: analysisData?.ats_analysis?.is_ats_friendly ? "#059669" : "#dc2626", 
            fontWeight: "600",
            padding: "0.75rem",
            background: analysisData?.ats_analysis?.is_ats_friendly ? "#d1fae5" : "#fee2e2",
            borderRadius: "8px",
            textAlign: "center"
          }}>
            {analysisData?.ats_analysis?.is_ats_friendly ? "✅ ATS Friendly Resume" : "⚠️ Needs ATS Improvements"}
          </div>
          {analysisData?.completeness_analysis?.missing_sections?.length > 0 && (
            <div style={{ fontSize: "0.8rem", color: "#dc2626", marginTop: "0.75rem", fontWeight: "500" }}>
              Missing sections: {analysisData.completeness_analysis.missing_sections.join(", ")}
            </div>
          )}
        </div>
      </div>

      {/* Action Verbs & Impact */}
      <div 
        style={styles.analysisCard}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = styles.analysisCardHover.transform;
          e.currentTarget.style.boxShadow = styles.analysisCardHover.boxShadow;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = styles.analysisCard.boxShadow;
        }}
      >
        <div style={styles.analysisTitle}>🚀 Writing Quality</div>
        <div style={styles.metricsGrid}>
          <div style={styles.metric}>
            <div style={styles.metricLabel}>ACTION VERBS</div>
            <div style={styles.metricValue}>{analysisData?.action_verbs_analysis?.score || 0}%</div>
          </div>
          <div style={styles.metric}>
            <div style={styles.metricLabel}>QUANTIFIABLE</div>
            <div style={styles.metricValue}>{analysisData?.quantifiable_impact_analysis?.score || 0}%</div>
          </div>
        </div>
        
        <div style={{ marginTop: "1.5rem" }}>
          <div style={{ fontSize: "0.8rem", color: "#475569", fontWeight: "500" }}>
            <span style={{ color: "#059669" }}>Strong verbs:</span> {analysisData?.action_verbs_analysis?.strong_verbs?.length || 0}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: "0.5rem", fontWeight: "500" }}>
            <span style={{ color: "#3b82f6" }}>Metrics found:</span> {analysisData?.quantifiable_impact_analysis?.count || 0}
          </div>
        </div>
      </div>

      {/* Improvement Suggestions */}
      <div 
        style={styles.analysisCard}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = styles.analysisCardHover.transform;
          e.currentTarget.style.boxShadow = styles.analysisCardHover.boxShadow;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = styles.analysisCard.boxShadow;
        }}
      >
        <div style={styles.analysisTitle}>💡 Improvement Suggestions</div>
        <ul style={styles.suggestionsList}>
          {analysisData?.improvement_suggestions?.slice(0, 5).map((suggestion, index) => (
            <li 
              key={index} 
              style={styles.suggestionItem}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = styles.suggestionItemHover.background;
                e.currentTarget.style.transform = styles.suggestionItemHover.transform;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.transform = "none";
              }}
            >
              <span style={styles.suggestionIcon}>•</span>
              {suggestion}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const ComparisonResults = () => (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.cardTitle}>Comparison Results</div>
        <div style={styles.cardSubtitle}>
          Best match: <strong style={{ color: "#059669" }}>{comparisonResults?.best_match?.filename}</strong> ({comparisonResults?.best_match?.match_score}%)
        </div>
      </div>
      
      <table style={styles.comparisonTable}>
        <thead>
          <tr style={styles.tableHeader}>
            <th style={styles.tableCell}>Resume</th>
            <th style={styles.tableCell}>Match Score</th>
            <th style={styles.tableCell}>Skills Matched</th>
            <th style={styles.tableCell}>ATS Score</th>
            <th style={styles.tableCell}>Completeness</th>
          </tr>
        </thead>
        <tbody>
          {comparisonResults?.results?.map((result, index) => (
            <tr 
              key={index} 
              style={{
                ...styles.tableCell,
                ...(result.filename === comparisonResults.best_match.filename && styles.bestMatch)
              }}
            >
              <td style={styles.tableCell}>{result.filename}</td>
              <td style={styles.tableCell}>
                <strong style={{ color: getScoreColor(result.match_score) }}>
                  {result.match_score}%
                </strong>
              </td>
              <td style={styles.tableCell}>{result.matched_keywords_count}</td>
              <td style={styles.tableCell}>{result.ats_score}%</td>
              <td style={styles.tableCell}>{result.completeness_score}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const ToggleSwitch = ({ isOn, onToggle }) => (
    <div style={styles.toggleSwitch} onClick={onToggle}>
      <div style={{
        ...styles.toggleSlider,
        ...(isOn && styles.toggleSliderActive)
      }}>
        <div style={{
          ...styles.toggleKnob,
          ...(isOn && styles.toggleKnobActive)
        }} />
      </div>
    </div>
  );

  return (
    <div style={styles.app}>
      {/* Mobile Header */}
      {isMobile && (
        <div style={styles.mobileHeader}>
          <button 
            style={styles.mobileMenuButton}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <div style={styles.logo}>
            <span>Resume</span>
            <span style={styles.logoAccent}>Matcher</span>
          </div>
          <div style={{ width: "48px" }}></div>
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobile && (
        <div 
          style={styles.mobileOverlay}
          onClick={closeSidebar}
        />
      )}

      <div style={styles.container}>
        {/* Enhanced Professional Sidebar */}
        <aside style={styles.sidebar}>
          {!isMobile && (
            <div style={styles.logo}>
              <span>Resume</span>
              <span style={styles.logoAccent}>Matcher</span>
            </div>
          )}
          
          <nav style={styles.nav}>
            <button 
              style={{ ...styles.navItem, ...(activeTab === "analysis" && styles.navItemActive) }}
              onClick={() => {
                setActiveTab("analysis");
                if (isMobile) setSidebarOpen(false);
              }}
            >
              <span>📊</span>
              <span>Analysis Dashboard</span>
            </button>
            <button 
              style={{ ...styles.navItem, ...(activeTab === "history" && styles.navItemActive) }}
              onClick={() => {
                setActiveTab("history");
                if (isMobile) setSidebarOpen(false);
              }}
            >
              <span>🕒</span>
              <span>Analysis History</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main style={styles.main}>
          <div style={styles.header}>
            <h1 style={styles.headerTitle}>
              {activeTab === "analysis" ? "Resume Analysis Dashboard" : "Analysis History"}
            </h1>
            <div style={styles.headerActions}>
              <div style={styles.userProfile}>
                <div style={styles.userAvatar}>JD</div>
                <span>Job Dashboard</span>
              </div>
            </div>
          </div>

          <div style={styles.content}>
            {activeTab === "analysis" ? (
              <>
                {/* Enhanced Mode Toggle */}
                <div style={styles.toggleContainer}>
                  <div style={styles.toggleLabel}>
                    {comparisonMode ? "🔍 Multiple Resume Comparison" : "📄 Single Resume Analysis"}
                  </div>
                  <ToggleSwitch 
                    isOn={comparisonMode} 
                    onToggle={() => {
                      setComparisonMode(!comparisonMode);
                      resetForm();
                    }} 
                  />
                </div>

                {/* Enhanced Upload Section */}
                <div style={styles.card}>
                  <div style={styles.cardHeader}>
                    <div style={styles.cardTitle}>
                      {comparisonMode ? "🔍 Compare Multiple Resumes" : "📊 Upload Documents"}
                    </div>
                    <div style={styles.cardSubtitle}>
                      {comparisonMode 
                        ? "Upload one job description and multiple resumes to find the best candidate match"
                        : "Upload your resume and job description to analyze compatibility and get detailed insights"}
                    </div>
                  </div>

                  <div style={styles.uploadGrid}>
                    {comparisonMode ? (
                      <>
                        <FileUploadCard 
                          type="jd" 
                          file={jd} 
                          onFileSelect={(e) => setJD(e.target.files[0])}
                          onDrop={(e) => handleDrop(e, 'jd')}
                        />
                        <FileUploadCard 
                          type="resume" 
                          file={null}
                          files={multipleResumes}
                          onFileSelect={(e) => setMultipleResumes(prev => [...prev, ...Array.from(e.target.files)])}
                          onDrop={(e) => handleDrop(e, 'resume')}
                          isMultiple={true}
                          onRemoveFile={removeResume}
                        />
                      </>
                    ) : (
                      <>
                        <FileUploadCard 
                          type="resume" 
                          file={resume} 
                          onFileSelect={(e) => setResume(e.target.files[0])}
                          onDrop={(e) => handleDrop(e, 'resume')}
                        />
                        <FileUploadCard 
                          type="jd" 
                          file={jd} 
                          onFileSelect={(e) => setJD(e.target.files[0])}
                          onDrop={(e) => handleDrop(e, 'jd')}
                        />
                      </>
                    )}
                  </div>

                  <div style={styles.buttonGroup}>
                    <button 
                      onClick={handleUpload}
                      disabled={loading || (comparisonMode ? (!jd || multipleResumes.length < 2) : (!resume || !jd))}
                      style={{
                        ...styles.buttonPrimary,
                        ...((loading || (comparisonMode ? (!jd || multipleResumes.length < 2) : (!resume || !jd))) && styles.buttonDisabled)
                      }}
                      onMouseEnter={(e) => {
                        if (!loading && (comparisonMode ? (jd && multipleResumes.length >= 2) : (resume && jd))) {
                          e.currentTarget.style.transform = styles.buttonPrimaryHover.transform;
                          e.currentTarget.style.boxShadow = styles.buttonPrimaryHover.boxShadow;
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = styles.buttonPrimary.boxShadow;
                      }}
                    >
                      {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={styles.loadingSpinner}></div>
                          {comparisonMode ? "Comparing..." : "Analyzing..."}
                        </div>
                      ) : (
                        comparisonMode ? "🔍 Compare Resumes" : "📊 Analyze Match"
                      )}
                    </button>
                    
                    {analysisData && !comparisonMode && (
                      <button 
                        onClick={generateReport} 
                        style={styles.buttonSuccess}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = styles.buttonPrimaryHover.transform;
                          e.currentTarget.style.boxShadow = styles.buttonPrimaryHover.boxShadow;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "none";
                          e.currentTarget.style.boxShadow = styles.buttonSuccess.boxShadow;
                        }}
                      >
                        📄 Download Report
                      </button>
                    )}
                    
                    <button 
                      onClick={resetForm} 
                      style={styles.buttonSecondary}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = styles.buttonPrimaryHover.transform;
                        e.currentTarget.style.boxShadow = styles.buttonPrimaryHover.boxShadow;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = styles.buttonSecondary.boxShadow;
                      }}
                    >
                      🗑️ Clear
                    </button>
                  </div>
                </div>

                {/* Enhanced Results Section */}
                {analysisData && !comparisonMode && (
                  <div style={styles.resultsGrid}>
                    <ScoreDisplay />
                    <AnalysisBreakdown />
                  </div>
                )}

                {comparisonResults && comparisonMode && (
                  <ComparisonResults />
                )}

                {/* Enhanced Status Message */}
                {message && (
                  <div style={{
                    ...styles.statusMessage,
                    ...(message.includes("✅") || message.includes("🎉") || message.includes("🎯") || message.includes("📄") ? styles.statusSuccess : styles.statusError)
                  }}>
                    {message}
                  </div>
                )}
              </>
            ) : (
              /* Enhanced History Tab */
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardTitle}>Analysis History</div>
                  <div style={styles.cardSubtitle}>
                    Review your previous resume matching analyses and track improvements over time
                  </div>
                </div>
                
                {analysisHistory.length === 0 ? (
                  <div style={{ 
                    textAlign: "center", 
                    padding: "4rem 2rem", 
                    color: "#64748b",
                    fontSize: isMobile ? "1rem" : "1.1rem"
                  }}>
                    <div style={{ fontSize: "4rem", marginBottom: "2rem", opacity: "0.5" }}>📊</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem", color: "#475569" }}>No analysis history yet</div>
                    <div style={{ lineHeight: "1.6" }}>
                      Complete your first analysis to see your history and track your resume improvements here
                    </div>
                  </div>
                ) : (
                  <div>
                    {analysisHistory.map((item) => (
                      <div 
                        key={item.id}
                        style={styles.historyItem}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = styles.historyItemHover.transform;
                          e.currentTarget.style.boxShadow = styles.historyItemHover.boxShadow;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "none";
                          e.currentTarget.style.boxShadow = styles.historyItem.boxShadow;
                        }}
                      >
                        <div style={styles.historyInfo}>
                          <div style={styles.historyName}>{item.resume}</div>
                          <div style={styles.historyDetails}>
                            vs {item.jd} • Analyzed on {item.date}
                          </div>
                        </div>
                        <div style={{...styles.historyScore, color: getScoreColor(item.score)}}>
                          {item.score}%
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default FileUpload;