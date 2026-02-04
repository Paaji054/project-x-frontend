import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, Type, Sparkles, Image as ImageIcon, Camera, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../assets/logo.svg";
import { storyService } from "../services/storyService";
import { uploadService } from "../services/uploadService";
import { toast } from "react-hot-toast";

export default function AddStory() {
  const navigate = useNavigate();
  const [step, setStep] = useState("select"); // "select", "edit"
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [textValue, setTextValue] = useState("");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [filter, setFilter] = useState("none");
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef(null);

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

  const handleImageSelect = (image) => {
    setSelectedImage(image);
    setImagePreview(image.url);
    setStep("edit");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = { id: Date.now(), url: reader.result };
        setSelectedImage(imageData);
        setImagePreview(reader.result);
        setStep("edit");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraClick = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
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
      // Upload image if it's a local file
      let mediaUrl = selectedImage.url;
      
      if (selectedImage.url.startsWith('data:')) {
        const uploadResponse = await uploadService.uploadBase64(selectedImage.url, 'stories');
        if (!uploadResponse || !uploadResponse.url) {
          throw new Error('Failed to upload image');
        }
        mediaUrl = uploadResponse.url;
      }

      // Create story
      await storyService.createStory({
        mediaUrl,
        mediaType: 'image',
        caption: textValue || ''
      });

      toast.success('Story shared successfully!');
      handleClose();
      navigate('/home');
    } catch (error) {
      console.error('Share story error:', error);
      toast.error(error.message || 'Failed to share story');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setStep("select");
    setSelectedImage(null);
    setImagePreview(null);
    setShowFilters(false);
    setShowText(false);
    setShowStickers(false);
    setTextValue("");
    setTextColor("#FFFFFF");
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
          <div className="px-4 pb-3">
            <button className="flex items-center gap-1 text-white text-sm hover:text-primary transition">
              <span>Recents</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Image Grid */}
        <div className="p-4">
          <div className="grid grid-cols-3 gap-1">
            {/* Camera Button */}
            <button
              onClick={handleCameraClick}
              className="aspect-square bg-gray-800 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-gray-700 transition border border-gray-700"
            >
              <Camera className="w-8 h-8 text-white" />
              <span className="text-xs text-gray-400">Camera</span>
            </button>

            {/* File Upload Button */}
            <button
              onClick={() => imageInputRef.current?.click()}
              className="aspect-square bg-gray-800 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-gray-700 transition border border-gray-700"
            >
              <ImageIcon className="w-8 h-8 text-white" />
              <span className="text-xs text-gray-400">Gallery</span>
            </button>
          </div>
        </div>

        {/* Hidden file input for camera */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    );
  }

  // Edit step - show editing interface
  return (
    <div className="min-h-screen w-full bg-black relative">
      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-4 left-4 z-50 p-2 bg-black/50 hover:bg-black/70 rounded-full transition backdrop-blur-sm"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Share Button */}
      <button
        onClick={handleShare}
        disabled={isUploading}
        className="absolute top-4 right-4 z-50 px-4 py-2 bg-primary hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full text-white font-medium transition flex items-center gap-2"
      >
        {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
        {isUploading ? 'Sharing...' : 'Share'}
      </button>

      {/* Image Preview with Filter */}
      <div className="w-full h-screen flex items-center justify-center bg-black relative">
        <img
          src={imagePreview}
          alt="Story preview"
          className={`w-full h-full object-contain ${getFilterClass(filter)}`}
        />

        {/* Text Overlay */}
        {textValue && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ color: textColor }}
          >
            <p className="text-3xl md:text-4xl font-bold drop-shadow-2xl text-center px-4">
              {textValue}
            </p>
          </div>
        )}
      </div>

      {/* Editing Tools */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent pb-4">
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
            }}
            className={`p-3 rounded-full transition ${showStickers ? "bg-primary" : "bg-white/20 hover:bg-white/30"
              }`}
          >
            <Sparkles className="w-6 h-6 text-white" />
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

        {/* Stickers */}
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
                    onClick={() => {
                      // Add sticker to image - placeholder
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
      </div>
    </div>
  );
}