import React from "react";
import { Link } from "react-router-dom";

const sections = [
  {
    title: "Recommended age",
    body: [
      "Radian is intended for users aged 13 and older (or the minimum digital consent age in your country, if higher).",
      "We do not knowingly collect personal information from children under 13. Accounts that appear to belong to underage users may be restricted or removed.",
    ],
  },
  {
    title: "Why this age range",
    body: [
      "Radian is a social networking app. Users can create profiles, post photos and videos, share stories, comment, message others, join communities, and use optional AI creative tools.",
      "Because the app includes user-generated content and social interaction, parental guidance is recommended for younger teens.",
    ],
  },
  {
    title: "Content users may encounter",
    body: [
      "User-generated posts, stories, comments, and messages created by other people.",
      "Profile photos, display names, and community discussions.",
      "Optional AI-generated images, captions, bios, or themes when a user chooses those features.",
    ],
  },
  {
    title: "What Radian is not designed for",
    body: [
      "Radian is not directed at children under 13.",
      "We do not offer gambling, alcohol sales, or adult content as core product features.",
      "Users must follow our Terms of Service and community expectations; abusive or illegal content can be reported and may lead to enforcement action.",
    ],
  },
  {
    title: "Safety and controls",
    body: [
      "Users can block or report others and contact support for help.",
      "Account and privacy settings are available in the app.",
      "Parents and guardians should review device-level Screen Time / parental controls if a teen uses the app.",
    ],
  },
  {
    title: "More information",
    body: [
      "Privacy Policy: https://theradianapp.com/privacy",
      "Terms of Service: https://theradianapp.com/terms",
      "Support: https://theradianapp.com/support",
      "Support email: theradianapp@gmail.com",
    ],
  },
];

export default function AgeSuitabilityPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-200">
      <div className="max-w-3xl mx-auto px-6 md:px-12 py-10 md:py-14">
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <Link to="/support" className="text-orange-500 hover:underline inline-block">
            ← Support
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
          Age Suitability
        </h1>
        <p className="text-sm text-gray-400 mb-8">
          Information for parents, guardians, and app store reviewers · Last updated:
          August 9, 2026
        </p>

        <div className="mb-10 p-5 rounded-2xl border border-orange-500/30 bg-orange-500/10">
          <p className="text-white font-semibold text-lg mb-1">
            Suitable for ages 13+
          </p>
          <p className="text-gray-300 leading-relaxed">
            Social networking with user-generated content. Not intended for children
            under 13.
          </p>
        </div>

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
          Public URL:{" "}
          <span className="text-gray-300">
            https://theradianapp.com/age-suitability
          </span>
        </p>
      </div>
    </div>
  );
}
