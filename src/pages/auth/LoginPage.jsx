import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [resetOTP, setResetOTP] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const particlesRef = useRef(null);
  const backgroundElementsRef = useRef(null);
  const gridBackgroundRef = useRef(null);
  const scanLineRef = useRef(null);

  // Handle OAuth callback errors (e.g. user cancelled Google sign-in)
  useEffect(() => {
    const authError = searchParams.get('auth_error');
    if (authError) {
      const messages = {
        access_denied: "You cancelled sign in. Try again when you're ready.",
        unauthorized: "Sign in was not authorized. Please try again.",
        server_error: "Something went wrong. Please try again.",
      };
      setError(messages[authError] || "Sign in did not complete. Please try again.");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Create floating particles
  useEffect(() => {
    const createParticles = () => {
      if (!particlesRef.current) return;
      particlesRef.current.innerHTML = "";
      const particleCount = 25;

      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement("div");
        particle.className = "particle";

        const size = Math.random() * 12 + 5;
        const left = Math.random() * 100;
        const animationDuration = Math.random() * 20 + 10;
        const animationDelay = Math.random() * 5;
        const hue = Math.random() * 30 + 15;

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${left}%`;
        particle.style.animationDuration = `${animationDuration}s`;
        particle.style.animationDelay = `${animationDelay}s`;
        particle.style.background = `rgba(255, ${87 - hue}, ${34 - hue / 2}, 0.6)`;

        particlesRef.current.appendChild(particle);
      }
    };

    createParticles();
  }, []);

  // Create background elements
  useEffect(() => {
    // Removed floating elements that appear at top - keeping only bottom-to-top particles
  }, []);

  // Create grid background
  useEffect(() => {
    const createGridBackground = () => {
      if (!gridBackgroundRef.current) return;
      gridBackgroundRef.current.innerHTML = "";

      // Create horizontal lines
      for (let i = 0; i < 20; i++) {
        const line = document.createElement("div");
        line.className = "grid-line horizontal";
        line.style.top = `${i * 50}px`;
        line.style.animationDelay = `${Math.random() * 5}s`;
        gridBackgroundRef.current.appendChild(line);
      }

      // Create vertical lines
      for (let i = 0; i < 20; i++) {
        const line = document.createElement("div");
        line.className = "grid-line vertical";
        line.style.left = `${i * 50}px`;
        line.style.animationDelay = `${Math.random() * 5}s`;
        gridBackgroundRef.current.appendChild(line);
      }

      // Create pulse circles (match signup background style)
      for (let i = 0; i < 5; i++) {
        const circle = document.createElement("div");
        circle.className = "pulse-circle";

        const size = Math.random() * 200 + 100;
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const animationDuration = Math.random() * 10 + 5;
        const animationDelay = Math.random() * 5;

        circle.style.width = `${size}px`;
        circle.style.height = `${size}px`;
        circle.style.left = `${left}%`;
        circle.style.top = `${top}%`;
        circle.style.animationDuration = `${animationDuration}s`;
        circle.style.animationDelay = `${animationDelay}s`;

        gridBackgroundRef.current.appendChild(circle);
      }

      // Soft translucent circles (match signup look)
      for (let i = 0; i < 10; i++) {
        const soft = document.createElement("div");
        soft.className = "soft-circle";

        const size = Math.random() * 220 + 140; // 140-360px
        const left = Math.random() * 90;
        const top = Math.random() * 90;
        const opacity = Math.random() * 0.10 + 0.08; // 0.08 - 0.18

        soft.style.width = `${size}px`;
        soft.style.height = `${size}px`;
        soft.style.left = `${left}%`;
        soft.style.top = `${top}%`;
        soft.style.opacity = opacity.toFixed(2);

        gridBackgroundRef.current.appendChild(soft);
      }
    };

    createGridBackground();
  }, []);

  // Scan line animation
  useEffect(() => {
    const createScanLine = () => {
      if (!scanLineRef.current) return;
      const interval = setInterval(() => {
        scanLineRef.current.style.animation = "none";
        setTimeout(() => {
          scanLineRef.current.style.animation = "scan 4s linear infinite";
        }, 10);
      }, 4000);

      return () => clearInterval(interval);
    };

    const cleanup = createScanLine();
    return cleanup;
  }, []);

  // D-pad button interactions
  useEffect(() => {
    const dpadButtons = document.querySelectorAll(".d-pad-btn");

    const handleMouseDown = (e) => {
      e.target.style.transform = "scale(0.95)";
      e.target.style.background = "#ff5722";
    };

    const handleMouseUp = (e) => {
      e.target.style.transform = "scale(1.08)";
      setTimeout(() => {
        e.target.style.background = "#555";
      }, 150);
    };

    const handleMouseLeave = (e) => {
      e.target.style.transform = "scale(1)";
      e.target.style.background = "#555";
    };

    dpadButtons.forEach((button) => {
      button.addEventListener("mousedown", handleMouseDown);
      button.addEventListener("mouseup", handleMouseUp);
      button.addEventListener("mouseleave", handleMouseLeave);
    });

    return () => {
      dpadButtons.forEach((button) => {
        button.removeEventListener("mousedown", handleMouseDown);
        button.removeEventListener("mouseup", handleMouseUp);
        button.removeEventListener("mouseleave", handleMouseLeave);
      });
    };
  }, []);

  // Action button interactions
  useEffect(() => {
    const actionButtons = document.querySelectorAll(".action-btn");

    const handleMouseDown = (e) => {
      e.target.style.transform = "scale(0.9)";
    };

    const handleMouseUp = (e) => {
      e.target.style.transform = "scale(1.15)";
    };

    const handleMouseLeave = (e) => {
      e.target.style.transform = "scale(1)";
    };

    actionButtons.forEach((button) => {
      button.addEventListener("mousedown", handleMouseDown);
      button.addEventListener("mouseup", handleMouseUp);
      button.addEventListener("mouseleave", handleMouseLeave);
    });

    return () => {
      actionButtons.forEach((button) => {
        button.removeEventListener("mousedown", handleMouseDown);
        button.removeEventListener("mouseup", handleMouseUp);
        button.removeEventListener("mouseleave", handleMouseLeave);
      });
    };
  }, []);

  // Input focus effects
  useEffect(() => {
    const inputFields = document.querySelectorAll(".input-field");

    const handleFocus = (e) => {
      let label = e.target.parentElement.querySelector("label");
      // For password fields with nested structure, check parent's parent
      if (!label && e.target.parentElement.parentElement) {
        label = e.target.parentElement.parentElement.querySelector("label");
      }
      if (label) {
        label.style.color = "#ff5722";
        label.style.transform = "translateY(-5px) scale(0.9)";
      }
    };

    const handleBlur = (e) => {
      if (!e.target.value) {
        let label = e.target.parentElement.querySelector("label");
        // For password fields with nested structure, check parent's parent
        if (!label && e.target.parentElement.parentElement) {
          label = e.target.parentElement.parentElement.querySelector("label");
        }
        if (label) {
          label.style.color = "#ccc";
          label.style.transform = "translateY(0) scale(1)";
        }
      }
    };

    inputFields.forEach((input) => {
      input.addEventListener("focus", handleFocus);
      input.addEventListener("blur", handleBlur);
    });

    return () => {
      inputFields.forEach((input) => {
        input.removeEventListener("focus", handleFocus);
        input.removeEventListener("blur", handleBlur);
      });
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Please enter your username or email");
      triggerErrorAnimation();
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password");
      triggerErrorAnimation();
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      triggerErrorAnimation();
      return;
    }

    // Show loading state
    setIsLoading(true);
    const controller = document.querySelector(".controller");
    if (controller) {
      controller.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      controller.style.opacity = "0.8";
      controller.style.transform = "scale(0.98)";
    }

    try {
      // Call API login - backend expects 'username' field
      const response = await login({
        username: username,
        password: password,
      });

      if (response.success) {
        createSuccessParticles();
        // Redirect to the page the user was trying to visit (e.g. after session expiry), or home
        const from = location.state?.from?.pathname;
        const isValidFrom = typeof from === 'string' && from !== '' && from !== '/login' && from.startsWith('/');
        const redirectTo = isValidFrom ? from : '/home';
        const redirectState = location.state?.from?.state;
        setTimeout(() => {
          navigate(redirectTo, { replace: true, state: redirectState });
        }, 500);
      } else {
        setError(response.message || "Login failed. Please try again.");
        triggerErrorAnimation();
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || "Invalid credentials. Please try again.");
      triggerErrorAnimation();
    } finally {
      setIsLoading(false);
      if (controller) {
        controller.style.opacity = "1";
        controller.style.transform = "scale(1)";
      }
    }
  };

  const triggerErrorAnimation = () => {
    const controller = document.querySelector(".controller");
    if (controller) {
      controller.style.animation = "shake 0.5s";
      setTimeout(() => {
        controller.style.animation = "controllerFloat 8s ease-in-out infinite";
      }, 500);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setShowForgotPassword(true);
    setResetStep(1);
    setForgotPasswordError("");
    setForgotPasswordSuccess(false);
    setForgotPasswordEmail("");
    setResetOTP("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotPasswordError("");
    setForgotPasswordSuccess(false);

    if (resetStep === 1) {
      // Step 1: Send OTP to email
      if (!forgotPasswordEmail.trim()) {
        setForgotPasswordError("Please enter your email address");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(forgotPasswordEmail)) {
        setForgotPasswordError("Please enter a valid email address");
        return;
      }

      setIsSendingReset(true);

      try {
        await authService.forgotPassword(forgotPasswordEmail);
        setForgotPasswordSuccess(true);
        setForgotPasswordError("");
        setTimeout(() => {
          setResetStep(2);
          setForgotPasswordSuccess(false);
        }, 1500);
      } catch (err) {
        console.error('Forgot password error:', err);
        setForgotPasswordError(err.message || "Failed to send OTP. Please try again.");
        setForgotPasswordSuccess(false);
      } finally {
        setIsSendingReset(false);
      }
    } else if (resetStep === 2) {
      // Step 2: Verify OTP
      if (!resetOTP.trim()) {
        setForgotPasswordError("Please enter the OTP code");
        return;
      }

      if (resetOTP.length !== 6) {
        setForgotPasswordError("OTP must be 6 digits");
        return;
      }

      setIsSendingReset(true);

      try {
        await authService.verifyOTP(forgotPasswordEmail, resetOTP);
        setForgotPasswordSuccess(true);
        setForgotPasswordError("");
        setTimeout(() => {
          setResetStep(3);
          setForgotPasswordSuccess(false);
        }, 1000);
      } catch (err) {
        console.error('Verify OTP error:', err);
        setForgotPasswordError(err.message || "Invalid OTP. Please try again.");
        setForgotPasswordSuccess(false);
      } finally {
        setIsSendingReset(false);
      }
    } else if (resetStep === 3) {
      // Step 3: Reset password
      if (!newPassword.trim()) {
        setForgotPasswordError("Please enter a new password");
        return;
      }

      if (newPassword.length < 6) {
        setForgotPasswordError("Password must be at least 6 characters");
        return;
      }

      if (newPassword !== confirmPassword) {
        setForgotPasswordError("Passwords do not match");
        return;
      }

      setIsSendingReset(true);

      try {
        await authService.resetPassword(forgotPasswordEmail, resetOTP, newPassword);
        setForgotPasswordSuccess(true);
        setForgotPasswordError("");
        setTimeout(() => {
          closeForgotPasswordModal();
        }, 2000);
      } catch (err) {
        console.error('Reset password error:', err);
        setForgotPasswordError(err.message || "Failed to reset password. Please try again.");
        setForgotPasswordSuccess(false);
      } finally {
        setIsSendingReset(false);
      }
    }
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPassword(false);
    setResetStep(1);
    setForgotPasswordEmail("");
    setResetOTP("");
    setNewPassword("");
    setConfirmPassword("");
    setForgotPasswordError("");
    setForgotPasswordSuccess(false);
  };

  // Handle Enter key press and Escape key for modal
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "Enter" && (e.target.tagName === "INPUT") && !showForgotPassword) {
        const form = document.getElementById("loginForm");
        if (form) {
          form.requestSubmit();
        }
      }
      // Close forgot password modal on Escape key
      if (e.key === "Escape" && showForgotPassword) {
        closeForgotPasswordModal();
      }
    };

    document.addEventListener("keypress", handleKeyPress);
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keypress", handleKeyPress);
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [showForgotPassword]);

  const createSuccessParticles = () => {
    const controller = document.querySelector(".controller");
    if (!controller) return;

    const rect = controller.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 15; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.position = "fixed";
      particle.style.zIndex = "100";

      const size = Math.random() * 8 + 4;
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 100 + 50;
      const duration = Math.random() * 1 + 0.5;
      const endX = Math.cos(angle) * distance;
      const endY = Math.sin(angle) * distance;

      // Create unique animation for each particle
      const animationName = `successParticle${i}`;
      const style = document.createElement("style");
      style.textContent = `
        @keyframes ${animationName} {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(${endX}px, ${endY}px) scale(0);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);

      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${centerX}px`;
      particle.style.top = `${centerY}px`;
      particle.style.background = `rgba(255, 215, 0, 0.8)`;
      particle.style.animation = `${animationName} ${duration}s ease-out forwards`;

      document.body.appendChild(particle);

      setTimeout(() => {
        particle.remove();
        style.remove();
      }, duration * 1000);
    }
  };

  const handleSignupClick = () => {
    const controller = document.querySelector(".controller");
    if (controller) {
      controller.style.transition = "opacity 0.4s ease, transform 0.4s ease";
      controller.style.opacity = "0";
      controller.style.transform = "scale(0.95)";
      setTimeout(() => {
        navigate('/register');
      }, 400);
    } else {
      navigate('/register');
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to Google OAuth endpoint
    const googleAuthURL = authService.getGoogleLoginURL();
    window.location.href = googleAuthURL;
  };

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .login-page-body {
          background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          color: #fff;
          padding: 20px;
          overflow: hidden;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .controller-container {
          width: 100%;
          max-width: 450px;
          perspective: 1000px;
          position: relative;
          z-index: 10;
        }

        @media (max-width: 480px) {
          .login-page-body {
            padding: 60px 25px;
          }

          .controller-container {
            max-width: 320px;
            transform: scale(0.75);
            transform-origin: center;
          }
        }

        .controller {
          background: linear-gradient(145deg, #2d2d2d, #3a3a3a);
          border-radius: 20px;
          padding: 35px;
          box-shadow:
            0 15px 35px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transform-style: preserve-3d;
          transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
          animation: controllerFloat 8s ease-in-out infinite;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        @keyframes controllerFloat {
          0%, 100% {
            transform: translateY(0) rotateY(0) rotateX(0);
          }
          25% {
            transform: translateY(-10px) rotateY(2deg) rotateX(1deg);
          }
          50% {
            transform: translateY(-5px) rotateY(-1deg) rotateX(-1deg);
          }
          75% {
            transform: translateY(-8px) rotateY(1deg) rotateX(0.5deg);
          }
        }

        .controller:hover {
          transform: rotateY(5deg) rotateX(5deg) scale(1.02);
          animation-play-state: paused;
        }

        .controller::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
          transform: rotate(30deg);
          animation: shine 10s linear infinite;
        }

        @keyframes shine {
          0% { transform: rotate(30deg) translateX(-100%); }
          100% { transform: rotate(30deg) translateX(100%); }
        }

        .controller::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(119, 5, 36,0.05) 0%, transparent 50%);
          border-radius: 20px;
          z-index: -1;
        }

        .logo {
          text-align: center;
          margin-bottom: 35px;
          position: relative;
        }

        .logo h1 {
          font-size: 32px;
          color: #ff5722;
          text-shadow:
            0 0 10px rgba(119, 5, 36, 0.5),
            0 0 20px rgba(119, 5, 36, 0.3);
          letter-spacing: 3px;
          animation: logoGlow 3s ease-in-out infinite alternate;
          position: relative;
          display: inline-block;
        }

        .logo h1::after {
          content: '';
          position: absolute;
          bottom: -5px;
          left: 10%;
          width: 80%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #ff5722, transparent);
          animation: logoLine 3s ease-in-out infinite;
        }

        @keyframes logoGlow {
          0% {
            text-shadow: 0 0 10px rgba(119, 5, 36, 0.5);
          }
          100% {
            text-shadow:
              0 0 20px rgba(119, 5, 36, 0.8),
              0 0 30px rgba(119, 5, 36, 0.6),
              0 0 40px rgba(119, 5, 36, 0.4);
          }
        }

        @keyframes logoLine {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        .input-group {
          margin-bottom: 20px;
          position: relative;
        }

        .input-group:last-of-type {
          margin-bottom: 5px;
        }

        .input-group label {
          display: block;
          margin-bottom: 8px;
          color: #ccc;
          font-size: 14px;
          transition: all 0.4s ease;
          transform-origin: left;
        }

        .input-field {
          width: 100%;
          padding: 14px 18px;
          background: rgba(255, 255, 255, 0.08);
          border: 2px solid rgba(68, 68, 68, 0.7);
          border-radius: 10px;
          color: #fff;
          font-size: 16px;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          backdrop-filter: blur(5px);
        }

        .input-field:-webkit-autofill,
        .input-field:-webkit-autofill:hover,
        .input-field:-webkit-autofill:focus {
          -webkit-text-fill-color: #fff;
          -webkit-box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 0.08) inset;
          transition: background-color 5000s ease-in-out 0s;
        }

        .input-field:focus {
          outline: none;
          border-color: #ff5722;
          box-shadow:
            0 0 15px rgba(119, 5, 36, 0.4),
            inset 0 0 10px rgba(119, 5, 36, 0.1);
          transform: translateY(-3px);
          background: rgba(255, 255, 255, 0.12);
        }

        .input-field:focus + .input-focus-line {
          width: 100%;
          opacity: 1;
        }

        .input-focus-line {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #ff5722, #ff9800);
          transition: all 0.4s ease;
          opacity: 0;
          box-shadow: 0 0 10px rgba(119, 5, 36, 0.7);
        }

        .password-input-wrapper {
          position: relative;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: #ccc;
          cursor: pointer;
          padding: 5px 10px;
          font-size: 11px;
          font-weight: bold;
          transition: all 0.3s ease;
          z-index: 1;
          border-radius: 4px;
          opacity: 0.8;
        }

        .password-toggle:hover {
          color: #ff5722;
          background: rgba(119, 5, 36, 0.1);
        }

        .password-toggle:active {
          transform: translateY(-50%) scale(0.95);
        }

        .error-message {
          color: #ff5722;
          font-size: 12px;
          margin-top: 8px;
          display: block;
          animation: errorFadeIn 0.3s ease;
          text-shadow: 0 0 8px rgba(119, 5, 36, 0.5);
          position: relative;
          padding-left: 20px;
        }

        .error-message::before {
          content: '⚠';
          position: absolute;
          left: 0;
          font-size: 14px;
        }

        @keyframes errorFadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none !important;
        }

        .login-btn.loading {
          position: relative;
        }

        .login-btn.loading span {
          opacity: 0;
        }

        .login-btn.loading::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        .login-btn:disabled:not(.loading) {
          opacity: 0.5;
        }

        .input-field:invalid:not(:placeholder-shown) {
          border-color: rgba(119, 5, 36, 0.5);
        }

        .input-field::placeholder {
          color: rgba(255, 255, 255, 0.35);
          transition: opacity 0.3s;
        }

        .input-field:focus::placeholder {
          opacity: 0.5;
        }

        .input-field:invalid:not(:placeholder-shown):not(:focus) {
          border-color: rgba(119, 5, 36, 0.6);
        }

        .input-group.has-error .input-field {
          border-color: rgba(119, 5, 36, 0.7);
          animation: inputError 0.3s ease;
        }

        @keyframes inputError {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }

        .button-group {
          display: flex;
          justify-content: space-between;
          margin-top: 35px;
          gap: 15px;
        }

        .btn {
          padding: 14px 25px;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          text-transform: uppercase;
          letter-spacing: 1px;
          position: relative;
          overflow: hidden;
          z-index: 1;
        }

        .btn:focus-visible {
          outline: 2px solid #ff5722;
          outline-offset: 2px;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.1);
          transform: scaleX(0);
          transform-origin: right;
          transition: transform 0.4s ease;
          z-index: -1;
        }

        .btn:hover::before {
          transform: scaleX(1);
          transform-origin: left;
        }

        .btn::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
          z-index: -1;
        }

        .btn:active::after {
          width: 300px;
          height: 300px;
        }

        .login-btn {
          background: linear-gradient(45deg, #ff5722, #ff9800);
          color: white;
          flex: 1;
          box-shadow: 0 5px 15px rgba(119, 5, 36, 0.4);
        }

        .login-btn:hover {
          background: linear-gradient(45deg, #e64a19, #f57c00);
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(119, 5, 36, 0.6);
        }

        .signup-btn {
          background: transparent;
          color: #ff5722;
          border: 2px solid #ff5722;
          flex: 1;
        }

        .signup-btn:hover {
          background: rgba(119, 5, 36, 0.1);
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(119, 5, 36, 0.3);
        }

        /* Divider */
        .divider {
          display: flex;
          align-items: center;
          margin: 25px 0;
          gap: 15px;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(119, 5, 36, 0.3), transparent);
        }

        .divider span {
          color: rgba(255, 255, 255, 0.5);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 2px;
          text-shadow: 0 0 10px rgba(119, 5, 36, 0.3);
        }

        /* Google Button */
        .google-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
          border: 2px solid rgba(66, 133, 244, 0.3);
          border-radius: 8px;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 1.5px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          position: relative;
          overflow: hidden;
          margin-bottom: 20px;
        }

        .google-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(66, 133, 244, 0.1), transparent);
          transition: left 0.5s ease;
        }

        .google-btn:hover:not(:disabled)::before {
          left: 100%;
        }

        .google-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #222 0%, #1a1a1a 100%);
          border-color: rgba(66, 133, 244, 0.6);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(66, 133, 244, 0.2);
        }

        .google-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 4px 15px rgba(66, 133, 244, 0.1);
        }

        .google-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .google-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .controller-buttons {
          display: flex;
          justify-content: space-between;
          margin-top: 30px;
          align-items: center;
        }

        .d-pad {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(3, 1fr);
          gap: 6px;
          width: 110px;
          height: 110px;
          position: relative;
        }

        .d-pad::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80%;
          height: 80%;
          background: #222;
          border-radius: 50%;
          z-index: 0;
        }

        .d-pad-btn {
          background: #555;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
          z-index: 1;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }

        .d-pad-btn::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(119, 5, 36, 0.7), rgba(255, 152, 0, 0.7));
          transform: scale(0);
          transition: transform 0.3s;
          border-radius: 8px;
          z-index: -1;
        }

        .d-pad-btn:active::after {
          transform: scale(1);
        }

        .d-pad-btn:hover {
          background: #666;
          transform: scale(1.08);
          box-shadow: 0 6px 10px rgba(0, 0, 0, 0.4);
        }

        .d-pad-up {
          grid-column: 2;
          grid-row: 1;
        }

        .d-pad-left {
          grid-column: 1;
          grid-row: 2;
        }

        .d-pad-center {
          grid-column: 2;
          grid-row: 2;
          background: #333;
          box-shadow: none;
          cursor: default;
        }

        .d-pad-center:hover {
          transform: none;
          background: #333;
        }

        .d-pad-right {
          grid-column: 3;
          grid-row: 2;
        }

        .d-pad-down {
          grid-column: 2;
          grid-row: 3;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 110px;
          gap: 10px;
        }

        .action-btn {
          width: 55px;
          height: 55px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, #ff5722, #ff9800);
          color: white;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow:
            0 5px 15px rgba(119, 5, 36, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-btn::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.2);
          transform: scale(0);
          transition: transform 0.4s;
          border-radius: 50%;
        }

        .action-btn:active::after {
          transform: scale(1);
        }

        .action-btn:hover {
          transform: scale(1.15);
          box-shadow:
            0 8px 20px rgba(119, 5, 36, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .forgot-password {
          text-align: center;
          margin-top: 25px;
        }

        .forgot-password a {
          color: #ff9800;
          text-decoration: none;
          font-size: 14px;
          position: relative;
          transition: all 0.3s ease;
          padding: 5px 10px;
          border-radius: 5px;
        }

        .forgot-password a::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1px;
          background: #ff9800;
          transition: width 0.3s ease;
        }

        .forgot-password a:hover {
          background: rgba(255, 152, 0, 0.1);
        }

        .forgot-password a:hover::after {
          width: 100%;
        }

        .particles {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          background: rgba(119, 5, 36, 0.6);
          border-radius: 50%;
          animation: float 15s infinite linear;
          box-shadow: 0 0 10px rgba(119, 5, 36, 0.5);
          transform: translateY(100vh);
          opacity: 0;
          animation-fill-mode: both;
        }

        @keyframes float {
          0% {
            transform: translateY(100vh) rotate(0deg) scale(0.8);
            opacity: 0;
          }
          15% {
            opacity: 1;
            transform: translateY(80vh) rotate(36deg) scale(1);
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-120px) rotate(360deg) scale(0.8);
            opacity: 0;
          }
        }

        @keyframes successParticle {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(50px, -50px) scale(0);
            opacity: 0;
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px) rotate(-1deg); }
          20%, 40%, 60%, 80% { transform: translateX(5px) rotate(1deg); }
        }

        .grid-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
          opacity: 0.28;
          pointer-events: none;
        }

        .grid-line {
          position: absolute;
          background: rgba(255, 255, 255, 0.1);
        }

        .grid-line.horizontal {
          width: 100%;
          height: 1px;
          left: 0;
          animation: gridMoveHorizontal 20s linear infinite;
        }

        .grid-line.vertical {
          width: 1px;
          height: 100%;
          top: 0;
          animation: gridMoveVertical 15s linear infinite;
        }

        @keyframes gridMoveHorizontal {
          0% { transform: translateY(0); }
          100% { transform: translateY(100px); }
        }

        @keyframes gridMoveVertical {
          0% { transform: translateX(0); }
          100% { transform: translateX(100px); }
        }

        .pulse-circle {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.25);
          background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%);
          animation: pulse 8s infinite ease-in-out;
        }

        .soft-circle {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 70%);
          filter: blur(2px);
          pointer-events: none;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.3;
          }
        }

        .scan-line {
          position: absolute;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(119, 5, 36, 0.5), transparent);
          animation: scan 4s linear infinite;
          z-index: 2;
          pointer-events: none;
        }

        @keyframes scan {
          0% {
            top: 0;
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }

        @media (max-width: 480px) {
          .controller {
            padding: 18px;
            border-radius: 16px;
          }

          .logo {
            margin-bottom: 25px;
          }

          .logo h1 {
            font-size: 24px;
            letter-spacing: 2px;
          }

          .controller h2 {
            font-size: 24px;
            margin-bottom: 20px;
          }

          .input-group {
            margin-bottom: 16px;
          }

          .input-field {
            padding: 12px 14px;
            font-size: 14px;
          }

          .input-group label {
            font-size: 12px;
          }

          .button-group {
            flex-direction: column;
            margin-top: 25px;
            gap: 12px;
          }

          .login-btn, .signup-btn {
            margin: 0;
            width: 100%;
            padding: 12px 20px;
            font-size: 14px;
          }

          .controller-buttons {
            flex-direction: column;
            gap: 15px;
            margin-top: 20px;
          }

          .d-pad {
            width: 90px;
            height: 90px;
            gap: 5px;
            margin: 0 auto;
          }

          .action-buttons {
            flex-direction: row;
            height: auto;
            width: 100%;
            justify-content: center;
            gap: 15px;
          }

          .action-btn {
            width: 45px;
            height: 45px;
            font-size: 12px;
          }

          .forgot-password {
            margin-top: 18px;
          }

          .forgot-password a {
            font-size: 12px;
          }
        }

        /* Forgot Password Modal Styles */
        .forgot-password-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .forgot-password-modal {
          background: #0f0f0f;
          border: 1px solid #262626;
          border-radius: 16px;
          padding: 32px;
          max-width: 420px;
          width: 90%;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          position: relative;
          animation: modalSlideIn 0.3s ease-out;
        }

        @keyframes modalSlideIn {
          from {
            transform: translateY(20px) scale(0.96);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .modal-header h2 {
          color: #ffffff;
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }

        .modal-close-btn {
          background: transparent;
          border: none;
          color: #9ca3af;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          font-size: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          line-height: 1;
          padding: 0;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }

        .modal-close-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
        }

        .modal-close-btn:active {
          transform: scale(0.95);
        }

        .forgot-password-modal .input-group {
          margin-bottom: 20px;
        }

        .forgot-password-modal .input-group label {
          color: #d1d5db;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 8px;
          display: block;
        }

        .forgot-password-modal .input-field {
          width: 100%;
          padding: 12px 16px;
          background: #1a1a1a;
          border: 1px solid #262626;
          border-radius: 8px;
          color: #ffffff;
          font-size: 15px;
          transition: all 0.2s ease;
          -webkit-appearance: none;
          touch-action: manipulation;
        }

        .forgot-password-modal .input-field:focus {
          outline: none;
          border-color: #ae1e46;
          background: #1f1f1f;
        }

        .forgot-password-modal .input-field::placeholder {
          color: #6b7280;
        }

        .forgot-password-modal .input-field:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .forgot-password-modal .error-message {
          color: #ef4444;
          font-size: 13px;
          margin-top: 8px;
          padding-left: 20px;
          padding-right: 0;
          position: relative;
          display: block;
          animation: errorFadeIn 0.3s ease;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .forgot-password-modal .error-message::before {
          content: '⚠';
          position: absolute;
          left: 0;
          font-size: 14px;
          top: 0;
          line-height: 1.5;
          width: 18px;
          flex-shrink: 0;
        }

        @keyframes errorFadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .forgot-password-modal .success-message {
          color: #10b981;
          font-size: 13px;
          margin-top: 8px;
          padding-left: 20px;
          padding-right: 0;
          position: relative;
          display: block;
          animation: slideDown 0.3s ease;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .forgot-password-modal .success-message::before {
          content: "✓";
          position: absolute;
          left: 0;
          top: 0;
          color: #10b981;
          font-weight: bold;
          font-size: 14px;
          line-height: 1.5;
          width: 18px;
          flex-shrink: 0;
          display: inline-block;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .forgot-password-modal .button-group {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .otp-input {
          text-align: center !important;
          font-size: 24px !important;
          letter-spacing: 8px !important;
          font-weight: bold !important;
        }

        .resend-link {
          text-align: center;
          margin-top: 15px;
        }

        .forgot-password-modal .btn {
          padding: 14px 25px;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          text-transform: uppercase;
          letter-spacing: 1px;
          position: relative;
          overflow: hidden;
          z-index: 1;
          width: 100%;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          min-height: 48px;
        }

        .forgot-password-modal .btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 0;
          height: 100%;
          background: rgba(255, 255, 255, 0.1);
          transition: transform 0.4s ease;
          z-index: -1;
        }

        .forgot-password-modal .btn:hover::before {
          transform: scaleX(1);
          transform-origin: left;
        }

        .forgot-password-modal .btn::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
          z-index: -1;
        }

        .forgot-password-modal .btn:active::after {
          width: 300px;
          height: 300px;
        }

        .forgot-password-modal .btn.login-btn {
          background: linear-gradient(45deg, #ff5722, #ff9800);
          color: white;
          box-shadow: 0 5px 15px rgba(119, 5, 36, 0.4);
        }

        .forgot-password-modal .btn.login-btn:hover {
          background: linear-gradient(45deg, #e64a19, #f57c00);
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(119, 5, 36, 0.6);
        }

        .forgot-password-modal .btn.signup-btn {
          background: transparent;
          color: #ff5722;
          border: 2px solid #ff5722;
        }

        .forgot-password-modal .btn.signup-btn:hover {
          background: rgba(119, 5, 36, 0.1);
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(119, 5, 36, 0.3);
        }

        .forgot-password-modal .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none !important;
        }

        .forgot-password-modal .btn.login-btn:disabled:not(.loading) {
          opacity: 0.5;
        }

        .forgot-password-modal .btn.login-btn.loading {
          position: relative;
        }

        .forgot-password-modal .btn.login-btn.loading span {
          opacity: 0;
        }

        .forgot-password-modal .btn.login-btn.loading::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          background: transparent;
        }

        @keyframes spin {
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @media (max-width: 768px) {
          .forgot-password-modal {
            padding: 30px 25px;
            max-width: 95%;
          }

          .modal-header h2 {
            font-size: 20px;
          }

          .modal-close-btn {
            width: 30px;
            height: 30px;
            font-size: 20px;
          }
        }

        @media (max-width: 480px) {
          .forgot-password-modal {
            padding: 25px 20px;
            border-radius: 15px;
          }

          .modal-header {
            margin-bottom: 20px;
            padding-bottom: 12px;
          }

          .modal-header h2 {
            font-size: 18px;
            letter-spacing: 1px;
          }

          .forgot-password-modal .input-field {
            padding: 12px 14px;
            font-size: 16px;
          }

          .forgot-password-modal .button-group {
            margin-top: 20px;
            gap: 10px;
          }
        }
      `}</style>

      <div className="login-page-body">
        <div className="grid-background" ref={gridBackgroundRef}></div>
        <div className="background-elements" ref={backgroundElementsRef}></div>
        <div className="particles" ref={particlesRef}></div>
        <div className="scan-line" ref={scanLineRef}></div>

        <div className="controller-container">
          <div className="controller">
            <div className="logo">
              <h1>Radian</h1>
            </div>

            <form id="loginForm" onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="username">USERNAME</label>
                <input
                  type="text"
                  id="username"
                  className="input-field"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                  }}
                  autoComplete="username"
                  required
                  aria-describedby={error ? "username-error" : undefined}
                />
              </div>

              <div className={`input-group ${error ? "has-error" : ""}`}>
                <label htmlFor="password">PASSWORD</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="input-field"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    autoComplete="current-password"
                    required
                    aria-describedby={error ? "password-error" : undefined}
                    style={{ paddingRight: "60px" }}
                  />
                  {password && (
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "HIDE" : "SHOW"}
                    </button>
                  )}
                </div>
                {error && (
                  <span className="error-message" role="alert" id="password-error">
                    {error}
                  </span>
                )}
              </div>

              <div className="button-group">
                <button
                  type="submit"
                  className={`btn login-btn ${isLoading ? "loading" : ""}`}
                  disabled={isLoading || !username.trim() || !password.trim()}
                  aria-busy={isLoading}
                >
                  <span>{isLoading ? "LOGGING IN..." : "LOGIN"}</span>
                </button>
                <button
                  type="button"
                  className="btn signup-btn"
                  onClick={handleSignupClick}
                  disabled={isLoading}
                >
                  SIGN UP
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="divider">
              <span>OR</span>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              className="btn google-btn"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>LOGIN WITH GOOGLE</span>
            </button>

            <div className="controller-buttons">
              <div className="d-pad">
                <button className="d-pad-btn d-pad-up"></button>
                <button className="d-pad-btn d-pad-left"></button>
                <div className="d-pad-center"></div>
                <button className="d-pad-btn d-pad-right"></button>
                <button className="d-pad-btn d-pad-down"></button>
              </div>
              <div className="action-buttons">
                <button className="action-btn">A</button>
                <button className="action-btn">B</button>
              </div>
            </div>

            <div className="forgot-password">
              <a
                href="#"
                onClick={handleForgotPassword}
                tabIndex={0}
              >
                FORGOT PASSWORD?
              </a>
            </div>
          </div>
        </div>

        {/* Forgot Password Modal - 3 Steps */}
        {showForgotPassword && (
          <div className="forgot-password-modal-overlay" onClick={closeForgotPasswordModal}>
            <div className="forgot-password-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Reset Password - Step {resetStep}/3</h2>
                <button className="modal-close-btn" onClick={closeForgotPasswordModal} aria-label="Close">
                  ×
                </button>
              </div>

              <form onSubmit={handleForgotPasswordSubmit}>
                {/* Step 1: Email */}
                {resetStep === 1 && (
                  <div className="input-group">
                    <label htmlFor="reset-email">Email Address</label>
                    <input
                      id="reset-email"
                      type="email"
                      className="input-field"
                      placeholder="Enter your email"
                      value={forgotPasswordEmail}
                      onChange={(e) => {
                        setForgotPasswordEmail(e.target.value);
                        setForgotPasswordError("");
                      }}
                      autoFocus
                      disabled={isSendingReset}
                    />
                    {forgotPasswordError && (
                      <div className="error-message" role="alert">
                        {forgotPasswordError}
                      </div>
                    )}
                    {forgotPasswordSuccess && (
                      <div className="success-message" role="alert">
                        OTP sent to your email!
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: OTP */}
                {resetStep === 2 && (
                  <>
                    <div className="input-group">
                      <label htmlFor="reset-otp">Enter OTP Code</label>
                      <input
                        id="reset-otp"
                        type="text"
                        className="input-field otp-input"
                        placeholder="000000"
                        value={resetOTP}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setResetOTP(value);
                          setForgotPasswordError("");
                        }}
                        autoFocus
                        disabled={isSendingReset}
                        maxLength={6}
                      />
                      {forgotPasswordError && (
                        <div className="error-message" role="alert">
                          {forgotPasswordError}
                        </div>
                      )}
                      {forgotPasswordSuccess && (
                        <div className="success-message" role="alert">
                          OTP verified!
                        </div>
                      )}
                    </div>
                    <div className="resend-link">
                      <button
                        type="button"
                        onClick={() => {
                          setResetStep(1);
                          setResetOTP("");
                          setForgotPasswordError("");
                        }}
                        disabled={isSendingReset}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ff9800',
                          cursor: 'pointer',
                          fontSize: '14px',
                          textDecoration: 'underline',
                          padding: '5px 10px',
                          borderRadius: '5px',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        Didn't receive OTP? Resend
                      </button>
                    </div>
                  </>
                )}

                {/* Step 3: New Password */}
                {resetStep === 3 && (
                  <>
                    <div className="input-group">
                      <label htmlFor="new-password">New Password</label>
                      <div className="password-input-wrapper">
                        <input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          className="input-field"
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value);
                            setForgotPasswordError("");
                          }}
                          autoFocus
                          disabled={isSendingReset}
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          tabIndex={-1}
                        >
                          {showNewPassword ? "HIDE" : "SHOW"}
                        </button>
                      </div>
                    </div>

                    <div className="input-group">
                      <label htmlFor="confirm-password">Confirm Password</label>
                      <div className="password-input-wrapper">
                        <input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          className="input-field"
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setForgotPasswordError("");
                          }}
                          disabled={isSendingReset}
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? "HIDE" : "SHOW"}
                        </button>
                      </div>
                      {forgotPasswordError && (
                        <div className="error-message" role="alert">
                          {forgotPasswordError}
                        </div>
                      )}
                      {forgotPasswordSuccess && (
                        <div className="success-message" role="alert">
                          Password reset successful!
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="button-group">
                  <button
                    type="submit"
                    className={`btn login-btn ${isSendingReset ? "loading" : ""}`}
                    disabled={
                      isSendingReset ||
                      (resetStep === 1 && !forgotPasswordEmail.trim()) ||
                      (resetStep === 2 && resetOTP.length !== 6) ||
                      (resetStep === 3 && (!newPassword.trim() || !confirmPassword.trim()))
                    }
                    aria-busy={isSendingReset}
                  >
                    <span>
                      {isSendingReset
                        ? resetStep === 1 ? "SENDING..." : resetStep === 2 ? "VERIFYING..." : "RESETTING..."
                        : resetStep === 1 ? "SEND OTP" : resetStep === 2 ? "VERIFY OTP" : "RESET PASSWORD"}
                    </span>
                  </button>
                  {resetStep > 1 && (
                    <button
                      type="button"
                      className="btn signup-btn"
                      onClick={() => setResetStep(resetStep - 1)}
                      disabled={isSendingReset}
                    >
                      BACK
                    </button>
                  )}
                  {resetStep === 1 && (
                    <button
                      type="button"
                      className="btn signup-btn"
                      onClick={closeForgotPasswordModal}
                      disabled={isSendingReset}
                    >
                      CANCEL
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}