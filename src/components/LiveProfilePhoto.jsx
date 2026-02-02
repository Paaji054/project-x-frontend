import React, { useState, useRef, useEffect } from "react";

/**
 * LiveProfilePhoto Component
 * Shows a static image by default, plays a video on hover (up to 10 seconds)
 * 
 * @param {string} imageSrc - Static image source (required)
 * @param {string} videoSrc - Video source (optional, falls back to static image if not provided)
 * @param {string} alt - Alt text for the image
 * @param {string} className - Additional CSS classes
 * @param {number} maxDuration - Maximum video duration in seconds (default: 10)
 */
export default function LiveProfilePhoto({
  imageSrc,
  videoSrc,
  alt = "Profile",
  className = "",
  maxDuration = 10
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);
  const timeoutRef = useRef(null);

  // Reset video on hover state change
  useEffect(() => {
    if (isHovered && videoRef.current && videoSrc && !hasError) {
      // Play video on hover
      const video = videoRef.current;
      video.currentTime = 0;

      // Try to play the video
      const playPromise = video.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Set timeout to stop video after maxDuration seconds
            timeoutRef.current = setTimeout(() => {
              if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
              }
              setIsHovered(false);
            }, maxDuration * 1000);
          })
          .catch(() => {
            // Auto-play was prevented or video failed to load
            setHasError(true);
            setIsHovered(false);
          });
      }
    } else if (!isHovered && videoRef.current) {
      // Reset video when not hovering
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      const video = videoRef.current;
      video.pause();
      video.currentTime = 0;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isHovered, videoSrc, hasError, maxDuration]);

  const handleMouseEnter = () => {
    if (videoSrc && !hasError) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleVideoError = () => {
    setHasError(true);
    setIsHovered(false);
  };

  const handleVideoEnded = () => {
    setIsHovered(false);
  };

  // If no video source or error occurred, just show static image
  const showVideo = isHovered && videoSrc && !hasError;
  
  // Use imageSrc directly without default fallback - backend will provide the photo
  const displayImage = imageSrc;

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Static Image - Always visible as fallback */}
      {displayImage && (
        <img
          src={displayImage}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${showVideo ? "opacity-0 absolute inset-0" : "opacity-100"
            }`}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            console.error('Failed to load profile image:', displayImage);
          }}
        />
      )}

      {/* Video - Only shown on hover */}
      {videoSrc && (
        <video
          ref={videoRef}
          src={videoSrc}
          className={`w-full h-full object-cover transition-opacity duration-300 ${showVideo ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"
            }`}
          muted
          playsInline
          loop={false}
          preload="metadata"
          onError={handleVideoError}
          onEnded={handleVideoEnded}
          style={{ display: showVideo ? "block" : "none" }}
        />
      )}
    </div>
  );
}