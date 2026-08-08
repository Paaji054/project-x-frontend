import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, Type, Sparkles, Image as ImageIcon, Camera, Loader2, UserPlus, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../assets/logo.svg";
import { storyService } from "../services/storyService";
import { uploadService } from "../services/uploadService";
import { userService } from "../services";
import { useUserProfile } from "../hooks/useUserProfile";
import { toast } from "react-hot-toast";

const STORY_RECENTS_KEY = "storyRecents";
const MAX_RECENTS = 10;

export default function AddStory() {
  const navigate = useNavigate();
  const { username } = useUserProfile();
  const [step, setStep] = useState("select");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [mediaType, setMediaType] = useState("image");
  const [showFilters, setShowFilters] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [textValue, setTextValue] = useState("");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 });
  const [textDragging, setTextDragging] = useState(false);
  const [stickerOverlays, setStickerOverlays] = useState([]);
  const [filter, setFilter] = useState("none");
  const [isUploading, setIsUploading] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [taggedPeople, setTaggedPeople] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [showRecentsDropdown, setShowRecentsDropdown] = useState(false);
  const [recents, setRecents] = useState([]);
  const imageInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const previewContainerRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const filters = [
    { id: "none", name: "Normal" },
    { id: "vintage", name: "Vintage" },
    { id: "blackwhite", name: "B&W" },
    { id: "warm", name: "Warm" },
    { id: "cool", name: "Cool" },
    { id: "dramatic", name: "Dramatic" },
  ];

  const textColors = [
    "#FFFFFF", "#000000", "#FF0000", "#00FF00",
    "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF",
    "#FFA500", "#FF69B4", "#800080", "#FFC0CB",
  ];

  const stickers = ["❤️", "🔥", "😍", "😎", "💯", "⭐", "🎉", "👑", "💪", "✨", "🙌", "🎊"];

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORY_RECENTS_KEY);
      const list = raw ? JSON.parse(raw) : [];
      setRecents(Array.isArray(list) ? list.slice(0, MAX_RECENTS) : []);
    } catch {
      setRecents([]);
    }
  }, [step]);

  const addToRecents = (url) => {
    if (!url || typeof url !== "string") return;
    setRecents((prev) => {
      const next = [url, ...prev.filter((u) => u !== url)].slice(0, MAX_RECENTS);
      try {
        localStorage.setItem(STORY_RECENTS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const fetchFollowing = async () => {
    if (followingList.length > 0) return; // Already loaded
    if (!username) {
      toast.error('Please login to tag people');
      return;
    }
    setLoadingFollowing(true);
    try {
      const response = await userService.getUserFollowing(username);
      setFollowingList(response?.following || []);
    } catch (error) {
      console.error('Failed to fetch following:', error);
      toast.error('Failed to load following list');
    } finally {
      setLoadingFollowing(false);
    }
  };

  const handleImageSelect = (image) => {
    setSelectedImage(image);
    setImagePreview(image.url);
    setMediaType(image.mediaType || "image");
    setStep("edit");
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const isVideo = type === "video" || file.type.startsWith("video/");
    const reader = new FileReader();
    reader.onloadend = () => {
      const url = reader.result;
      const imageData = { id: Date.now(), url, mediaType: isVideo ? "video" : "image" };
      setSelectedImage(imageData);
      setImagePreview(url);
      setMediaType(isVideo ? "video" : "image");
      setStep("edit");
      addToRecents(url);
    };
    if (isVideo) reader.readAsDataURL(file);
    else reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCameraClick = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        cameraStreamRef.current = stream;
        setIsCameraOpen(true);
        // Attach stream after the modal renders
        requestAnimationFrame(() => {
          if (cameraVideoRef.current) {
            cameraVideoRef.current.srcObject = stream;
          }
        });
        return;
      } catch {
        // getUserMedia denied or unsupported — fall back to native file input
      }
    }
    imageInputRef.current?.click();
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const handleCapturePhoto = () => {
    const video = cameraVideoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    stopCamera();
    const imageData = { id: Date.now(), url: dataUrl, mediaType: "image" };
    setSelectedImage(imageData);
    setImagePreview(dataUrl);
    setMediaType("image");
    addToRecents(dataUrl);
    setStep("edit");
  };

  // CSS filter values mapped to canvas filter strings
  const FILTER_CSS_MAP = {
    none: "",
    vintage: "brightness(90%) contrast(125%) saturate(150%) sepia(30%)",
    blackwhite: "grayscale(100%)",
    warm: "brightness(110%) contrast(110%) saturate(125%) sepia(20%)",
    cool: "brightness(95%) contrast(110%) saturate(80%) hue-rotate(15deg)",
    dramatic: "brightness(75%) contrast(150%) saturate(150%)",
  };

  // Bake filter into image; optionally include text/sticker overlays
  const composeImageWithEnhancements = async (imageUrl, filterOnly = false) => {
    const CANVAS_W = 1080;
    const CANVAS_H = 1920;
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext("2d");

    // Black background (for letterbox areas)
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Load image
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });

    // Apply CSS filter to canvas context
    const cssFilter = FILTER_CSS_MAP[filter] || "";
    if (cssFilter) ctx.filter = cssFilter;

    // Draw image with object-contain (letterboxed)
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = CANVAS_W / CANVAS_H;
    let dw, dh, dx, dy;
    if (imgAspect > canvasAspect) {
      dw = CANVAS_W;
      dh = CANVAS_W / imgAspect;
      dx = 0;
      dy = (CANVAS_H - dh) / 2;
    } else {
      dh = CANVAS_H;
      dw = CANVAS_H * imgAspect;
      dx = (CANVAS_W - dw) / 2;
      dy = 0;
    }
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.filter = "none";

    // Draw text overlay (skip when filter-only — rendered in StoryViewer from saved overlays)
    if (!filterOnly && textValue.trim()) {
      const fontSize = Math.round(CANVAS_W * 0.065);
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      const tx = (textPosition.x / 100) * CANVAS_W;
      const ty = (textPosition.y / 100) * CANVAS_H;
      const lines = textValue.split("\n");
      const lineH = fontSize * 1.3;
      lines.forEach((line, i) => {
        ctx.fillText(line, tx, ty + (i - (lines.length - 1) / 2) * lineH);
      });
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    }

    // Draw sticker overlays (skip when filter-only — rendered in StoryViewer from saved overlays)
    if (!filterOnly && stickerOverlays.length > 0) {
      const emojiSize = Math.round(CANVAS_W * 0.09);
      ctx.font = `${emojiSize}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const s of stickerOverlays) {
        ctx.fillText(s.emoji, (s.x / 100) * CANVAS_W, (s.y / 100) * CANVAS_H);
      }
    }

    return canvas.toDataURL("image/jpeg", 0.92);
  };

  const handleGalleryClick = () => {
    galleryInputRef.current?.click();
  };

  const handleVideoClick = () => {
    videoInputRef.current?.click();
  };

  const getFilterClass = (filterId) => {
    const filterClasses = {
      none: "",
      vintage: "brightness-90 contrast-125 saturate-150 sepia-30",
      blackwhite: "grayscale",
      warm: "brightness-110 contrast-110 saturate-125 sepia-20",
      cool: "brightness-95 contrast-110 saturate-80 hue-rotate-15",
      dramatic: "brightness-75 contrast-150 saturate-150",
    };
    return filterClasses[filterId] || "";
  };

  const handleShare = async () => {
    if (!selectedImage || isUploading) return;

    setIsUploading(true);
    try {
      let sourceUrl = selectedImage.url;

      // For images, bake only the filter; text/emojis are stored as overlays and rendered in StoryViewer
      if (mediaType === "image" && filter !== "none") {
        sourceUrl = await composeImageWithEnhancements(sourceUrl, true);
      }

      let mediaUrl = sourceUrl;
      if (sourceUrl.startsWith("data:")) {
        const uploadResponse = await uploadService.uploadFromBase64(sourceUrl, "stories");
        if (!uploadResponse?.url) throw new Error("Failed to upload media");
        mediaUrl = uploadResponse.url;
      }

      const overlays = [];
      if (textValue.trim()) {
        overlays.push({
          type: "text",
          content: textValue,
          x: textPosition.x,
          y: textPosition.y,
          color: textColor,
        });
      }
      stickerOverlays.forEach((sticker) => {
        overlays.push({
          type: "emoji",
          content: sticker.emoji,
          x: sticker.x,
          y: sticker.y,
        });
      });

      const storyResponse = await storyService.createStory({
        mediaUrl,
        mediaType: mediaType || "image",
        caption: textValue || "",
        overlays,
        textColor,
        textPosition,
        taggedUsers: taggedPeople.map((p) => (typeof p === "object" ? p.uid || p._id || p.username : p)).filter(Boolean),
      });

      if (!storyResponse) throw new Error("Failed to create story");

      toast.success("Story shared successfully!");
      handleClose();
      navigate("/home");
    } catch (error) {
      console.error("Share story error:", error);
      toast.error(error.message || "Failed to share story");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setStep("select");
    setSelectedImage(null);
    setImagePreview(null);
    setMediaType("image");
    setShowFilters(false);
    setShowText(false);
    setShowStickers(false);
    setShowTagModal(false);
    setTaggedPeople([]);
    setTextValue("");
    setTextColor("#FFFFFF");
    setTextPosition({ x: 50, y: 50 });
    setStickerOverlays([]);
    setFilter("none");
  };

  // Select step - show image grid
  if (step === "select") {
    return (
      <div className="min-h-screen w-full bg-[#0b0b0b]">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-[#0b0b0b]/95 backdrop-blur-sm border-b border-gray-800">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/home')}
                className="p-2 hover:bg-gray-800 rounded-full transition"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
              <img src={logo} alt="Logo" className="h-6 md:h-8" />
            </div>
            <h1 className="text-xl font-semibold text-white">Add to Story</h1>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>

          {/* Recents Dropdown */}
          <div className="px-4 pb-3 relative">
            <button
              type="button"
              onClick={() => setShowRecentsDropdown(!showRecentsDropdown)}
              className="flex items-center gap-1 text-white text-sm hover:text-primary transition"
            >
              <span>Recents</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showRecentsDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowRecentsDropdown(false)} aria-hidden="true" />
                <div className="absolute left-4 right-4 top-full mt-1 z-50 bg-gray-900 border border-gray-700 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                  {recents.length === 0 ? (
                    <p className="p-4 text-gray-400 text-sm">No recent items</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-1 p-2">
                      {recents.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            handleImageSelect({ id: i, url, mediaType: url.startsWith("data:video") ? "video" : "image" });
                            setShowRecentsDropdown(false);
                          }}
                          className="aspect-square rounded-lg overflow-hidden border border-gray-700 hover:border-primary"
                        >
                          {url.startsWith("data:video") ? (
                            <video src={url} className="w-full h-full object-cover" muted />
                          ) : (
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Image/Video Grid */}
        <div className="p-4">
          <div className="grid grid-cols-3 gap-1">
            {/* Camera - opens device camera on mobile */}
            <button
              type="button"
              onClick={handleCameraClick}
              className="aspect-square bg-gray-800 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-gray-700 transition border border-gray-700"
            >
              <Camera className="w-8 h-8 text-white" />
              <span className="text-xs text-gray-400">Camera</span>
            </button>

            {/* Gallery - pick from library (no capture) */}
            <button
              type="button"
              onClick={handleGalleryClick}
              className="aspect-square bg-gray-800 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-gray-700 transition border border-gray-700"
            >
              <ImageIcon className="w-8 h-8 text-white" />
              <span className="text-xs text-gray-400">Gallery</span>
            </button>

            {/* Video - pick or capture video */}
            <button
              type="button"
              onClick={handleVideoClick}
              className="aspect-square bg-gray-800 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-gray-700 transition border border-gray-700"
            >
              <Video className="w-8 h-8 text-white" />
              <span className="text-xs text-gray-400">Video</span>
            </button>
          </div>
        </div>

        {/* Camera input (capture = camera on mobile) */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => { handleFileUpload(e, "image"); }}
          className="hidden"
        />
        {/* Gallery input (no capture = file picker) */}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => { handleFileUpload(e, "image"); }}
          className="hidden"
        />
        {/* Video input */}
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          onChange={(e) => { handleFileUpload(e, "video"); }}
          className="hidden"
        />

        {/* Camera capture modal (getUserMedia) */}
        {isCameraOpen && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 shrink-0">
              <button
                type="button"
                onClick={stopCamera}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              <span className="text-white font-semibold">Camera</span>
              <div className="w-10" />
            </div>

            <div className="flex-1 relative overflow-hidden">
              <video
                ref={(el) => {
                  cameraVideoRef.current = el;
                  if (el && cameraStreamRef.current) el.srcObject = cameraStreamRef.current;
                }}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center justify-center py-8 shrink-0">
              <button
                type="button"
                onClick={handleCapturePhoto}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/10 hover:bg-white/20 transition active:scale-95"
                aria-label="Capture photo"
              >
                <div className="w-14 h-14 rounded-full bg-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Edit step - show editing interface
  return (
    <div className="fixed inset-0 w-full bg-black flex flex-col" style={{ height: '100dvh' }}>
      {/* Header with Close & Share */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 z-50">
        <button
          onClick={handleClose}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={handleShare}
          disabled={isUploading}
          className="px-5 py-2 bg-primary hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full text-white font-medium transition flex items-center gap-2"
        >
          {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isUploading ? 'Sharing...' : 'Share'}
        </button>
      </div>

      {/* Image/Video Preview with Filter */}
      <div
        ref={previewContainerRef}
        className="flex-1 min-h-0 flex items-center justify-center bg-black relative overflow-hidden select-none"
        onMouseMove={(e) => {
          if (!textDragging || !previewContainerRef.current) return;
          const rect = previewContainerRef.current.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          setTextPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
        }}
        onMouseUp={() => setTextDragging(false)}
        onMouseLeave={() => setTextDragging(false)}
        onTouchMove={(e) => {
          if (!textDragging || !previewContainerRef.current || !e.touches[0]) return;
          const rect = previewContainerRef.current.getBoundingClientRect();
          const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
          const y = ((e.touches[0].clientY - rect.top) / rect.height) * 100;
          setTextPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
        }}
        onTouchEnd={() => setTextDragging(false)}
      >
        {mediaType === "video" ? (
          <video
            src={imagePreview}
            className={`max-w-full max-h-full object-contain ${getFilterClass(filter)}`}
            loop
            muted
            playsInline
            autoPlay
          />
        ) : (
          <img
            src={imagePreview}
            alt="Story preview"
            className={`max-w-full max-h-full object-contain ${getFilterClass(filter)}`}
          />
        )}

        {/* Draggable Text Overlay */}
        {textValue && (
          <div
            className="absolute cursor-move pointer-events-auto flex items-center justify-center"
            style={{
              left: `${textPosition.x}%`,
              top: `${textPosition.y}%`,
              transform: "translate(-50%, -50%)",
              color: textColor,
            }}
            onMouseDown={(e) => { e.preventDefault(); setTextDragging(true); }}
            onTouchStart={(e) => { setTextDragging(true); }}
          >
            <p className="text-3xl md:text-4xl font-bold drop-shadow-2xl text-center px-4 whitespace-pre-wrap">
              {textValue}
            </p>
          </div>
        )}

        {/* Sticker overlays (positioned, optionally draggable) */}
        {stickerOverlays.map((s, index) => (
          <div
            key={s.id}
            className="absolute cursor-move pointer-events-auto text-4xl select-none"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              transform: "translate(-50%, -50%)",
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const rect = previewContainerRef.current?.getBoundingClientRect();
              if (!rect) return;
              const startPageX = e.clientX;
              const startPageY = e.clientY;
              const startSx = s.x;
              const startSy = s.y;
              const onMove = (ev) => {
                const dx = ((ev.clientX - startPageX) / rect.width) * 100;
                const dy = ((ev.clientY - startPageY) / rect.height) * 100;
                setStickerOverlays((prev) =>
                  prev.map((o, i) =>
                    i === index
                      ? { ...o, x: Math.max(5, Math.min(95, startSx + dx)), y: Math.max(5, Math.min(95, startSy + dy)) }
                      : o
                  )
                );
              };
              const onUp = () => {
                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("mouseup", onUp);
              };
              window.addEventListener("mousemove", onMove);
              window.addEventListener("mouseup", onUp);
            }}
          >
            {s.emoji}
          </div>
        ))}
      </div>

      {/* Editing Tools */}
      <div className="flex-shrink-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent pb-[max(1rem,env(safe-area-inset-bottom))]">
        {/* Tool Icons */}
        <div className="flex items-center justify-center gap-4 px-4 py-3">
          {/* Text Tool */}
          <button
            onClick={() => {
              setShowText(!showText);
              setShowFilters(false);
              setShowStickers(false);
            }}
            className={`p-3 rounded-full transition ${showText ? "bg-primary" : "bg-white/20 hover:bg-white/30"
              }`}
          >
            <Type className="w-6 h-6 text-white" />
          </button>

          {/* Filters Tool */}
          <button
            onClick={() => {
              setShowFilters(!showFilters);
              setShowText(false);
              setShowStickers(false);
            }}
            className={`p-3 rounded-full transition ${showFilters ? "bg-primary" : "bg-white/20 hover:bg-white/30"
              }`}
          >
            <ImageIcon className="w-6 h-6 text-white" />
          </button>

          {/* Stickers Tool */}
          <button
            onClick={() => {
              setShowStickers(!showStickers);
              setShowText(false);
              setShowFilters(false);
              setShowTagModal(false);
            }}
            className={`p-3 rounded-full transition ${showStickers ? "bg-primary" : "bg-white/20 hover:bg-white/30"
              }`}
          >
            <Sparkles className="w-6 h-6 text-white" />
          </button>

          {/* Tag People Tool */}
          <button
            onClick={() => {
              setShowTagModal(!showTagModal);
              setShowStickers(false);
              setShowText(false);
              setShowFilters(false);
              if (!showTagModal) {
                fetchFollowing();
              }
            }}
            className={`p-3 rounded-full transition ${showTagModal ? "bg-primary" : "bg-white/20 hover:bg-white/30"
              }`}
          >
            <UserPlus className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Text Editor */}
        <AnimatePresence>
          {showText && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="px-4 pb-4"
            >
              <input
                type="text"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder="Type something..."
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary mb-3"
              />
              <div className="flex gap-2 flex-wrap">
                {textColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setTextColor(color)}
                    className={`w-10 h-10 rounded-full border-2 transition ${textColor === color ? "border-white scale-110" : "border-gray-700"
                      }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="px-4 pb-4"
            >
              <div className="flex gap-3 overflow-x-auto pb-2">
                {filters.map((filterOption) => (
                  <button
                    key={filterOption.id}
                    onClick={() => setFilter(filterOption.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition ${filter === filterOption.id
                        ? "bg-primary text-white"
                        : "bg-white/20 text-white hover:bg-white/30"
                      }`}
                  >
                    {filterOption.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stickers - Add Emoji: insert into text when text panel open, else add as overlay on canvas */}
        <AnimatePresence>
          {showStickers && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="px-4 pb-4"
            >
              <div className="flex gap-3 overflow-x-auto pb-2">
                {stickers.map((sticker, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      if (showText) {
                        setTextValue((prev) => prev + sticker);
                      } else {
                        setStickerOverlays((prev) => [
                          ...prev,
                          {
                            id: Date.now() + index,
                            emoji: sticker,
                            x: 30 + (prev.length % 3) * 20,
                            y: 40 + Math.floor(prev.length / 3) * 15,
                          },
                        ]);
                      }
                    }}
                    className="flex-shrink-0 w-12 h-12 text-2xl hover:scale-110 transition"
                  >
                    {sticker}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tag People Modal */}
        <AnimatePresence>
          {showTagModal && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="px-4 pb-4"
            >
              <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-4 max-h-60 overflow-y-auto">
                <h3 className="text-white font-semibold mb-3">Tag People</h3>
                
                {/* Tagged People */}
                {taggedPeople.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {taggedPeople.map((person, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-gray-800 rounded-full px-3 py-1"
                      >
                        <span className="text-sm text-white">{person.username || person}</span>
                        <button
                          onClick={() => setTaggedPeople(taggedPeople.filter((_, i) => i !== index))}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Following List */}
                {loadingFollowing ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                ) : followingList.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">
                    Follow people to tag them in your stories
                  </p>
                ) : (
                  <div className="space-y-2">
                    {followingList.map((user) => {
                      const isTagged = taggedPeople.some(t => 
                        (typeof t === 'object' ? (t.uid || t._id || t.username) : t) === (user.uid || user._id || user.username)
                      );
                      return (
                        <button
                          key={user.uid || user._id || user.username}
                          onClick={() => {
                            if (isTagged) {
                              setTaggedPeople(taggedPeople.filter(t => 
                                (typeof t === 'object' ? (t.uid || t._id || t.username) : t) !== (user.uid || user._id || user.username)
                              ));
                            } else {
                              setTaggedPeople([...taggedPeople, user]);
                            }
                          }}
                          className="w-full flex items-center gap-3 p-2 hover:bg-gray-800 rounded-lg transition"
                        >
                          <img
                            src={user.profilePhoto || user.avatar || '/default-avatar.png'}
                            alt={user.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="flex-1 text-left">
                            <p className="text-white text-sm font-medium">{user.username}</p>
                            <p className="text-gray-400 text-xs">{user.displayName || user.username}</p>
                          </div>
                          {isTagged && (
                            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}