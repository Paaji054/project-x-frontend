import React, { useState, useRef, useEffect } from "react";

/**
 * LiveBanner — plays uploaded community banner video automatically (muted, looping).
 * Falls back to the static image if there is no video or it fails to load.
 */
export default function LiveBanner({
  imageSrc,
  videoSrc,
  alt = "Banner",
  className = "",
  maxDuration = 10
}) {
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);
  const timeoutRef = useRef(null);

  const canPlay = Boolean(videoSrc) && !hasError;

  useEffect(() => {
    const video = videoRef.current;
    if (!canPlay || !video) return undefined;

    const restart = () => {
      video.currentTime = 0;
      video.play().catch(() => setHasError(true));
    };

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          timeoutRef.current = setInterval(restart, maxDuration * 1000);
        })
        .catch(() => setHasError(true));
    }

    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
        timeoutRef.current = null;
      }
      video.pause();
    };
  }, [canPlay, videoSrc, maxDuration]);

  const displayImage = imageSrc || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3C/svg%3E';

  return (
    <div className={`relative ${className}`}>
      <img
        src={displayImage}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${canPlay ? "opacity-0 absolute inset-0" : "opacity-100"}`}
        loading="lazy"
        decoding="async"
        onError={(e) => {
          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3C/svg%3E';
        }}
      />

      {canPlay && (
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-cover"
          muted
          playsInline
          autoPlay
          loop
          preload="auto"
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
}
