import React, { useState } from "react";
import { Link } from "react-router-dom";

const SUPPORT_EMAIL = "theradianapp@gmail.com";

const faqs = [
  {
    q: "How do I create an account?",
    a: "Open Radian and tap Sign up. You can register with email and password, or use Google or Apple Sign In. New social accounts may ask you to choose a username before you continue.",
  },
  {
    q: "I forgot my password. How do I reset it?",
    a: "On the login screen, tap Forgot password, enter your email, and follow the OTP / reset steps sent to your inbox. Check spam if you do not see the message within a few minutes.",
  },
  {
    q: "How do Sign in with Google or Apple work?",
    a: "Choose Login / Sign up with Google or Apple. We only receive the identity details you approve (such as email and name). Apple may hide your email behind a private relay address. Name from Apple is usually only shared the first time you authorize.",
  },
  {
    q: "How do credits and AI features work?",
    a: "AI tools (captions, bios, avatars, themes, and similar) may consume credits from your balance. You can buy credit packages in the Shop. Credits are used only when you start an AI action.",
  },
  {
    q: "Why did my purchase or credit buy fail?",
    a: "Confirm you are signed in, your network is stable, and the selected package is valid. If payment succeeds but credits do not appear, email us with your username, approximate time of purchase, and any order / payment reference.",
  },
  {
    q: "How do I delete my account or data?",
    a: "You can delete your account from Profile / Settings when signed in. That removes your profile and associated personal data subject to our Privacy Policy retention rules (for example payment records we must keep). You can also email us to request help.",
  },
  {
    q: "Posts, stories, or uploads are failing. What should I try?",
    a: "Check your connection, try a smaller photo/video or a lower upload quality, and make sure the file is a supported image or video type. Very large videos may be rejected. If it still fails, tell us your device, app version, and what you were uploading.",
  },
  {
    q: "How do I report abuse or a bug?",
    a: `Email ${SUPPORT_EMAIL} with a short description, screenshots if possible, the username involved (for reports), and steps to reproduce (for bugs). We review support mail as quickly as we can.`,
  },
  {
    q: "Where can I read the Privacy Policy and Terms?",
    a: "Privacy Policy: /privacy. Terms of Service: /terms. Both are also linked from the sign-up screen.",
  },
];

function FaqItem({ item, open, onToggle }) {
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.03]">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 text-left px-4 py-4 md:px-5"
        aria-expanded={open}
      >
        <span className="font-semibold text-white">{item.q}</span>
        <span className="text-orange-500 text-xl leading-none shrink-0">
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 md:px-5 text-gray-300 leading-relaxed border-t border-white/5 pt-3">
          {item.a}
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-200">
      <div className="max-w-3xl mx-auto px-6 md:px-12 py-10 md:py-14">
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <Link to="/login" className="text-orange-500 hover:underline inline-block">
            ← Back to Login
          </Link>
          <Link to="/privacy" className="text-gray-400 hover:text-white text-sm">
            Privacy Policy
          </Link>
          <Link to="/terms" className="text-gray-400 hover:text-white text-sm">
            Terms of Service
          </Link>
        </div>

        <p className="text-orange-500/90 text-sm font-semibold tracking-wide mb-2">
          RADIAN
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Support
        </h1>
        <p className="text-gray-400 mb-10 leading-relaxed">
          Need help with your account, uploads, credits, or the app? Browse common
          questions below or contact our team directly.
        </p>

        <section className="mb-12 p-5 md:p-6 rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-transparent">
          <h2 className="text-xl font-semibold text-white mb-2">Contact us</h2>
          <p className="text-gray-300 mb-4 leading-relaxed">
            Email our support team and we will get back to you as soon as possible.
            Include your username and a clear description of the issue.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=Radian%20Support`}
            className="inline-flex items-center gap-2 text-lg font-semibold text-orange-400 hover:text-orange-300 break-all"
          >
            {SUPPORT_EMAIL}
          </a>
          <p className="text-sm text-gray-500 mt-3">
            Typical topics: account access, billing / credits, content reports, bugs,
            privacy requests.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {faqs.map((item, index) => (
              <FaqItem
                key={item.q}
                item={item}
                open={openIndex === index}
                onToggle={() =>
                  setOpenIndex((current) => (current === index ? -1 : index))
                }
              />
            ))}
          </div>
        </section>

        <p className="mt-12 pt-6 border-t border-white/10 text-sm text-gray-500">
          This page is publicly available at{" "}
          <span className="text-gray-300">https://theradianapp.com/support</span>
          .
        </p>
      </div>
    </div>
  );
}
