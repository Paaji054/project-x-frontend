/**
 * Only return a real live-PFP URL. Never fall back to a sample video —
 * that hid people's actual profile photos behind Big Buck Bunny.
 */
export const getProfileVideoUrl = (...args) => {
  for (const arg of args) {
    if (!arg || typeof arg !== 'object') continue;
    const video = arg.profileVideo;
    if (typeof video === 'string' && video.trim() && /^https?:\/\//i.test(video.trim())) {
      return video.trim();
    }
  }
  return null;
};
