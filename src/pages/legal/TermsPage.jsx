import React from "react";
import { Link } from "react-router-dom";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-200 p-6 md:p-12 max-w-3xl mx-auto">
      <Link to="/register" className="text-orange-500 hover:underline mb-6 inline-block mr-4">← Back to Sign up</Link>
      <Link to="/support" className="text-gray-400 hover:text-white text-sm mb-6 inline-block">Support</Link>
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">Terms of Service</h1>
      <p className="text-sm text-gray-400 mb-4">Last updated: March 2025</p>
      <div className="space-y-4 text-gray-300">
        <p>
          Welcome to Project X. By creating an account and using our services, you agree to these Terms of Service.
        </p>
        <h2 className="text-lg font-semibold text-white mt-6">1. Acceptance of Terms</h2>
        <p>By accessing or using the platform, you agree to be bound by these terms and our Privacy Policy.</p>
        <h2 className="text-lg font-semibold text-white mt-6">2. Use of Service</h2>
        <p>You agree to use the service only for lawful purposes and in accordance with these terms. You must not misuse the platform, attempt to gain unauthorized access, or harm other users.</p>
        <h2 className="text-lg font-semibold text-white mt-6">3. Account Responsibility</h2>
        <p>You are responsible for maintaining the confidentiality of your account and password and for all activities under your account.</p>
        <h2 className="text-lg font-semibold text-white mt-6">4. Content</h2>
        <p>You retain ownership of content you post. You grant us a license to use, display, and distribute your content in connection with the service.</p>
        <h2 className="text-lg font-semibold text-white mt-6">5. Changes</h2>
        <p>We may update these terms from time to time. Continued use of the service after changes constitutes acceptance.</p>
      </div>
    </div>
  );
}
