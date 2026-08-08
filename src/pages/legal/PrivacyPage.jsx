import React from "react";
import { Link } from "react-router-dom";

const sections = [
  {
    title: "1. Introduction",
    body: [
      "Radian (also referred to as “Project X”, “we”, “us”, or “our”), operated by Spazor Labs, provides a social platform with posts, stories, messaging, communities, analytics, credits, and AI-assisted creative tools.",
      "This Privacy Policy explains what information we collect, how we use it, how we share it, and the choices you have. By creating an account or using Radian, you agree to this policy.",
    ],
  },
  {
    title: "2. Information We Collect",
    body: [
      "Account information: name, username, email address, password (stored as a secure hash), profile photo/video, bio, and similar profile details you choose to provide.",
      "Sign-in providers: if you use Google or Apple Sign In, we receive an identifier and, when available, your name and email (including Apple’s Hide My Email relay address). Apple may only share your name on the first authorization.",
      "Content you create: posts, captions, comments, stories (including overlays such as text or emoji), messages, community content, bookmarks, and related metadata.",
      "Media: photos and videos you upload. Media may be processed and stored by our cloud media provider.",
      "Usage and device data: approximate activity logs, feature usage, IP address, browser or app type, device identifiers, and diagnostic information needed to operate and secure the service.",
      "Payments and credits: purchase history, credit balance, and transaction records when you buy credit packages. Payment card details are handled by our payment processor; we do not store full card numbers.",
      "AI feature inputs: prompts, images, or other content you submit to AI tools (for example captions, bios, avatars, or themes), which are processed to generate results and may be sent to third-party AI providers.",
    ],
  },
  {
    title: "3. How We Use Your Information",
    body: [
      "Provide, maintain, and improve Radian — including feed, stories, messaging, communities, notifications, analytics, and shop features.",
      "Authenticate you, keep your session secure, and prevent fraud or abuse.",
      "Personalize your experience and show relevant content or recommendations.",
      "Process AI requests you initiate and display generated results in the app or website.",
      "Process credit purchases and manage your credit balance.",
      "Communicate with you about your account, security alerts, and service updates.",
      "Comply with legal obligations and enforce our Terms of Service.",
    ],
  },
  {
    title: "4. How We Share Information",
    body: [
      "We do not sell your personal information.",
      "Service providers: we use trusted vendors for hosting, databases, media storage (for example Cloudinary), email delivery, analytics infrastructure, authentication (Google / Apple), AI processing (for example OpenAI, Replicate, or DeepAI), and payments (for example Razorpay). They process data only as needed to provide their services.",
      "Other users: content you post publicly (or within communities according to your settings) can be seen by other users. Your username, display name, and profile media are visible according to your account privacy settings.",
      "Legal requirements: we may disclose information if required by law, court order, or to protect the rights, safety, or security of Radian, our users, or the public.",
      "Business transfers: if we are involved in a merger, acquisition, or asset sale, your information may be transferred as part of that transaction with appropriate notice where required.",
    ],
  },
  {
    title: "5. Cookies and Similar Technologies",
    body: [
      "On the website, we use cookies and similar storage (including authentication cookies and local storage) to keep you signed in, remember preferences, and maintain security.",
      "You can control cookies through your browser settings. Disabling essential cookies may prevent login or core features from working.",
    ],
  },
  {
    title: "6. Data Security",
    body: [
      "We use industry-standard safeguards, including encrypted connections (HTTPS), hashed passwords, access controls, and secure token-based sessions.",
      "No method of transmission or storage is 100% secure. Please use a strong unique password and protect access to your devices.",
    ],
  },
  {
    title: "7. Data Retention",
    body: [
      "We retain account and content data for as long as your account is active or as needed to provide the service.",
      "If you delete your account, we will delete or anonymize personal data associated with your account within a reasonable period, except where we must retain certain records for legal, security, or accounting purposes (for example payment records).",
      "Backups may temporarily retain residual copies until rotated under our normal backup schedule.",
    ],
  },
  {
    title: "8. Your Rights and Choices",
    body: [
      "Access and update profile information in Settings.",
      "Delete content you control (posts, comments on your posts where permitted, stories after expiry, etc.).",
      "Delete your account through the in-app or website account deletion flow, which removes your profile and associated personal data subject to Section 7.",
      "Manage notification preferences in Settings.",
      "Opt out of optional AI features by simply not using them; AI tools are only invoked when you request them and may consume credits.",
      "Depending on your location, you may have additional rights (access, correction, deletion, portability, or objection). Contact us to exercise those rights.",
    ],
  },
  {
    title: "9. Children’s Privacy",
    body: [
      "Radian is not directed to children under 13 (or the minimum age required in your country). We do not knowingly collect personal information from children under that age.",
      "If you believe a child has provided us personal information, contact us and we will take steps to delete it.",
    ],
  },
  {
    title: "10. International Processing",
    body: [
      "We and our service providers may process data in countries other than where you live. Where we do so, we take steps designed to protect your information in accordance with this policy and applicable law.",
    ],
  },
  {
    title: "11. Changes to This Policy",
    body: [
      "We may update this Privacy Policy from time to time. The “Last updated” date at the top will change when we do.",
      "Material changes may be communicated through the app, website, or email. Continued use of Radian after an update means you accept the revised policy.",
    ],
  },
  {
    title: "12. Contact Us",
    body: [
      "If you have questions about this Privacy Policy or your data, contact Spazor Labs at:",
      "Email: privacy@spazorlabs.com",
      "Product: Radian (Project X)",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-200">
      <div className="max-w-3xl mx-auto px-6 md:px-12 py-10 md:py-14">
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <Link
            to="/register"
            className="text-orange-500 hover:underline inline-block"
          >
            ← Back to Sign up
          </Link>
          <Link to="/terms" className="text-gray-400 hover:text-white text-sm">
            Terms of Service
          </Link>
          <Link to="/login" className="text-gray-400 hover:text-white text-sm">
            Login
          </Link>
        </div>

        <p className="text-orange-500/90 text-sm font-semibold tracking-wide mb-2">
          RADIAN
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: August 8, 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-white mb-3">
                {section.title}
              </h2>
              <div className="space-y-3">
                {section.body.map((paragraph, index) => (
                  <p key={`${section.title}-${index}`}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-12 pt-6 border-t border-white/10 text-sm text-gray-500">
          This page is publicly available at{" "}
          <span className="text-gray-300">/privacy</span>.
        </p>
      </div>
    </div>
  );
}
