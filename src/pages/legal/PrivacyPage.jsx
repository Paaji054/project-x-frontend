import React from "react";
import { Link } from "react-router-dom";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-200 p-6 md:p-12 max-w-3xl mx-auto">
      <Link to="/register" className="text-orange-500 hover:underline mb-6 inline-block">← Back to Sign up</Link>
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-4">Last updated: March 2025</p>
      <div className="space-y-4 text-gray-300">
        <p>
          Project X respects your privacy. This policy describes how we collect, use, and protect your information.
        </p>
        <h2 className="text-lg font-semibold text-white mt-6">1. Information We Collect</h2>
        <p>We collect information you provide when you register (name, username, email, password), profile data, and content you post. We may also collect usage data and device information.</p>
        <h2 className="text-lg font-semibold text-white mt-6">2. How We Use Your Information</h2>
        <p>We use your information to provide and improve the service, personalize your experience, communicate with you, and ensure security and compliance.</p>
        <h2 className="text-lg font-semibold text-white mt-6">3. Data Security</h2>
        <p>We use industry-standard measures to protect your data, including encryption and secure storage. Passwords are hashed and not stored in plain text.</p>
        <h2 className="text-lg font-semibold text-white mt-6">4. Third Parties</h2>
        <p>We may use third-party services (e.g., authentication, hosting). These providers have their own privacy policies governing their use of your data.</p>
        <h2 className="text-lg font-semibold text-white mt-6">5. Your Rights</h2>
        <p>You may access, update, or delete your account and data through the service or by contacting us.</p>
      </div>
    </div>
  );
}
