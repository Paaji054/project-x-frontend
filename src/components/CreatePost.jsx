import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown, ChevronUp, MapPin, UserPlus, Smile, X, Music, Type, Filter, Edit3, Crop, Sun, Contrast, Droplet, Thermometer, Circle } from "lucide-react";
import EmojiPickerReact from 'emoji-picker-react';
import { useUserProfile } from "../hooks/useUserProfile";
import { useAuth } from "../context/AuthContext";
import uploadIcon from "../assets/upload.svg";
import { uploadService } from "../services/uploadService";
import { postService } from "../services/postService";
import { userService } from "../services/userService";

export default function CreatePost({ setActiveView, isOpen, onClose, onPostCreated, communityId }) {
  const [step, setStep] = useState("upload"); // "upload", "crop", "edit", "final"
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [editedImage, setEditedImage] = useState(null);
  // For community posts, default to original aspect ratio to prevent auto-crop
  const [aspectRatio, setAspectRatio] = useState(communityId ? "original" : "9:16");
  const [cropData, setCropData] = useState({ x: 0, y: 0, zoom: 1 });
  const [imageDimensions, setImageDimensions] = useState({ width: 1000, height: 1000 });
  const [containerDimensions, setContainerDimensions] = useState({ width: 600, height: 600 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState("filters"); // "filters" or "adjustments"
  const [selectedFilter, setSelectedFilter] = useState("original");
  const [adjustments, setAdjustments] = useState({
    brightness: 0,
    contrast: 0,
    fade: 0,
    saturation: 0,
    temperature: 0,
    vignette: 0
  });
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("general"); // Add category state
  const [taggedPeople, setTaggedPeople] = useState([]);
  const [location, setLocation] = useState("");
  const [collaborators, setCollaborators] = useState([]);
  const [hideLikeCounts, setHideLikeCounts] = useState(false);
  const [turnOffCommenting, setTurnOffCommenting] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showTagPeopleModal, setShowTagPeopleModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [collabSearch, setCollabSearch] = useState("");

  // Mobile-specific states
  const [mobileStep, setMobileStep] = useState("gallery"); // "gallery", "edit", "filters", "adjustments", "final", "crop"
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingColor, setDrawingColor] = useState("#FFFFFF");
  const [drawingSize, setDrawingSize] = useState(5);
  const [drawingPaths, setDrawingPaths] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [textOverlays, setTextOverlays] = useState([]);
  const [draggingText, setDraggingText] = useState(null);
  const [dragTextStart, setDragTextStart] = useState({ x: 0, y: 0 });
  const [activeAdjustment, setActiveAdjustment] = useState(null);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [finalEditedImage, setFinalEditedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Following users for tagging
  const [followingUsers, setFollowingUsers] = useState([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);

  const fileInputRef = useRef(null);
  const cropContainerRef = useRef(null);
  const imageRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const drawingCanvasRef = useRef(null);
  const mobileImageRef = useRef(null);
  const { username, profilePhoto } = useUserProfile();
  const { user } = useAuth();

  const filters = [
    { name: "aden", label: "Aden" },
    { name: "clarendon", label: "Clarendon" },
    { name: "crema", label: "Crema" },
    { name: "gingham", label: "Gingham" },
    { name: "juno", label: "Juno" },
    { name: "lark", label: "Lark" },
    { name: "ludwig", label: "Ludwig" },
    { name: "moon", label: "Moon" },
    { name: "original", label: "Original" },
    { name: "perpetua", label: "Perpetua" },
    { name: "reyes", label: "Reyes" },
    { name: "slumber", label: "Slumber" },
  ];

  const aspectRatios = [
    { label: "Original", value: "original" },
    { label: "1:1", value: "1:1" },
    { label: "4:3", value: "4:3" },
    { label: "16:9", value: "16:9" },
    { label: "9:16", value: "9:16" },
  ];

  // Derived crop box dimensions based on current image size and aspect ratio
  const cropBoxDims = calculateCropDimensions(
    imageDimensions.width || 1000,
    imageDimensions.height || 1000,
    aspectRatio
  );

  // Calculate display aspect ratio value
  const displayAspectRatio = useMemo(() => {
    if (aspectRatio === "original") {
      if (imageDimensions.width && imageDimensions.height) {
        return `${imageDimensions.width} / ${imageDimensions.height}`;
      }
      return "1 / 1";
    }
    return aspectRatio.replace(':', ' / ');
  }, [aspectRatio, imageDimensions.width, imageDimensions.height]);

  // Calculate image display size to cover container while maintaining aspect ratio
  const imageDisplaySize = useMemo(() => {
    if (!imageDimensions.width || !imageDimensions.height || !containerDimensions.width || !containerDimensions.height) {
      return { width: '100%', height: '100%' };
    }
    
    const imageAspectRatio = imageDimensions.width / imageDimensions.height;
    const containerAspectRatio = containerDimensions.width / containerDimensions.height;
    
    // Calculate size to fit image within container (not cover)
    // This prevents excessive zooming - ensure image is fully visible
    let width, height;
    
    if (imageAspectRatio > containerAspectRatio) {
      // Image is wider - width determines size
      width = containerDimensions.width;
      height = containerDimensions.width / imageAspectRatio;
    } else {
      // Image is taller - height determines size
      width = containerDimensions.height * imageAspectRatio;
      height = containerDimensions.height;
    }
    
    // Ensure minimum size to prevent too small display
    const minSize = Math.min(containerDimensions.width, containerDimensions.height);
    if (width < minSize * 0.8 && height < minSize * 0.8) {
      const scale = (minSize * 0.8) / Math.max(width, height);
      width *= scale;
      height *= scale;
    }
    
    return {
      width: `${width}px`,
      height: `${height}px`
    };
  }, [imageDimensions.width, imageDimensions.height, containerDimensions.width, containerDimensions.height]);

  // Update container dimensions when it resizes
  useEffect(() => {
    if (step !== "crop" || !cropContainerRef.current) return;
    
    const updateContainerSize = () => {
      if (cropContainerRef.current) {
        const rect = cropContainerRef.current.getBoundingClientRect();
        setContainerDimensions({
          width: rect.width,
          height: rect.height
        });
      }
    };
    
    updateContainerSize();
    
    // Use ResizeObserver if available, otherwise use window resize
    let resizeObserver;
    if (window.ResizeObserver && cropContainerRef.current) {
      resizeObserver = new ResizeObserver(updateContainerSize);
      resizeObserver.observe(cropContainerRef.current);
    }
    
    window.addEventListener('resize', updateContainerSize);
    
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', updateContainerSize);
    };
  }, [step, aspectRatio]);

  // Get filter style for thumbnails
  const getFilterStyle = (filterName) => {
    const filterMap = {
      original: "",
      aden: "contrast(0.9) brightness(1.2) saturate(0.85)",
      clarendon: "contrast(1.2) saturate(1.35)",
      crema: "contrast(0.9) brightness(1.1)",
      gingham: "contrast(1.05) brightness(1.05)",
      juno: "contrast(1.15) saturate(1.2)",
      lark: "contrast(1.1) brightness(1.1) saturate(1.1)",
      ludwig: "contrast(1.05) brightness(1.05)",
      moon: "grayscale(1) contrast(1.1)",
      perpetua: "contrast(0.9) brightness(1.1) saturate(0.9)",
      reyes: "contrast(0.85) brightness(1.15) saturate(0.75)",
      slumber: "contrast(0.9) brightness(0.95) saturate(0.85)",
    };
    return filterMap[filterName] || "";
  };

  const handleFileSelect = (file) => {
    if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        // For community posts, skip crop step and go directly to edit
        // Desktop goes to crop (or edit for community), mobile stays in gallery
        if (window.innerWidth >= 768) {
          if (communityId) {
            // Community posts: skip crop, go to edit with original image
            setCroppedImage(reader.result);
            setStep("edit");
          } else {
            // Regular posts: go to crop
            setStep("crop");
          }
        } else {
          setMobileStep("gallery");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle image dragging in crop
  const handleImageMouseDown = (e) => {
    setIsDraggingImage(true);
    setDragStart({
      x: e.clientX - cropData.x,
      y: e.clientY - cropData.y
    });
  };

  const handleImageMouseMove = (e) => {
    if (isDraggingImage) {
      setCropData({
        ...cropData,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleImageMouseUp = () => {
    setIsDraggingImage(false);
  };

  const handleImageTouchMove = (e) => {
    if (isDraggingImage && e.touches.length > 0) {
      const deltaX = e.touches[0].clientX - dragStart.x;
      const deltaY = e.touches[0].clientY - dragStart.y;
      setCropData({
        ...cropData,
        x: deltaX,
        y: deltaY
      });
    }
  };

  const handleImageTouchEnd = () => {
    setIsDraggingImage(false);
  };

  useEffect(() => {
    if (isDraggingImage) {
      document.addEventListener('mousemove', handleImageMouseMove);
      document.addEventListener('mouseup', handleImageMouseUp);
      document.addEventListener('touchmove', handleImageTouchMove);
      document.addEventListener('touchend', handleImageTouchEnd);
      return () => {
        document.removeEventListener('mousemove', handleImageMouseMove);
        document.removeEventListener('mouseup', handleImageMouseUp);
        document.removeEventListener('touchmove', handleImageTouchMove);
        document.removeEventListener('touchend', handleImageTouchEnd);
      };
    }
  }, [isDraggingImage, dragStart, cropData]);

  // Calculate crop dimensions based on aspect ratio (hoisted function declaration)
  function calculateCropDimensions(imgWidth, imgHeight, targetAspectRatio) {
    if (targetAspectRatio === "original") {
      return { width: imgWidth, height: imgHeight, x: 0, y: 0 };
    }

    const [ratioW, ratioH] = targetAspectRatio.split(':').map(Number);
    const targetRatio = ratioW / ratioH;
    const currentRatio = imgWidth / imgHeight;

    let cropWidth, cropHeight;

    if (currentRatio > targetRatio) {
      // Image is wider, crop width
      cropHeight = imgHeight;
      cropWidth = cropHeight * targetRatio;
    } else {
      // Image is taller, crop height
      cropWidth = imgWidth;
      cropHeight = cropWidth / targetRatio;
    }

    const x = (imgWidth - cropWidth) / 2;
    const y = (imgHeight - cropHeight) / 2;

    return {
      width: cropWidth,
      height: cropHeight,
      x: Math.max(0, x),
      y: Math.max(0, y)
    };
  }

  // Crop image properly using canvas with zoom and position
  const cropImage = (imageSrc, callback) => {
    const img = new Image();
    // Set crossOrigin to allow external images
    if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.onerror = () => {
      // If image fails to load (CORS issue), just use the original URL
      console.warn('Image failed to load, using original URL');
      callback(imageSrc);
    };
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Calculate crop area based on aspect ratio
      const cropDims = calculateCropDimensions(img.width, img.height, aspectRatio);

      // The canvas will be the final cropped size
      canvas.width = Math.round(cropDims.width);
      canvas.height = Math.round(cropDims.height);

      // Calculate source rectangle considering zoom and drag position
      const zoom = cropData.zoom;
      const dragX = cropData.x || 0;
      const dragY = cropData.y || 0;

      // When zoomed, we see less of the image (smaller source area)
      const sourceWidth = cropDims.width / zoom;
      const sourceHeight = cropDims.height / zoom;

      // Center point of the crop area
      const cropCenterX = cropDims.x + cropDims.width / 2;
      const cropCenterY = cropDims.y + cropDims.height / 2;

      // Apply drag offset (inverse - dragging right shows more left side)
      const sourceCenterX = cropCenterX - dragX / zoom;
      const sourceCenterY = cropCenterY - dragY / zoom;

      // Calculate source top-left corner
      let sourceX = sourceCenterX - sourceWidth / 2;
      let sourceY = sourceCenterY - sourceHeight / 2;

      // Clamp to image boundaries
      sourceX = Math.max(0, Math.min(sourceX, img.width - sourceWidth));
      sourceY = Math.max(0, Math.min(sourceY, img.height - sourceHeight));

      // Ensure we don't exceed boundaries
      if (sourceX + sourceWidth > img.width) {
        sourceX = img.width - sourceWidth;
      }
      if (sourceY + sourceHeight > img.height) {
        sourceY = img.height - sourceHeight;
      }

      // Draw the cropped and zoomed portion
      ctx.drawImage(
        img,
        Math.max(0, sourceX),
        Math.max(0, sourceY),
        Math.min(sourceWidth, img.width - sourceX),
        Math.min(sourceHeight, img.height - sourceY),
        0,
        0,
        canvas.width,
        canvas.height
      );

      callback(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.src = imageSrc;
  };

  const handleCropNext = () => {
    // Crop the image first
    cropImage(imagePreview, (croppedDataUrl) => {
      setImagePreview(croppedDataUrl); // keep preview in sync with crop
      setCroppedImage(croppedDataUrl);
      setStep("edit");
    });
  };

  // Apply all filters and adjustments to create final edited image
  const applyAllEdits = (imageSrc, callback) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      // Apply filters first (base filter effects)
      const filterMap = {
        original: { contrast: 1, brightness: 1, saturate: 1, grayscale: 0 },
        aden: { contrast: 0.9, brightness: 1.2, saturate: 0.85, grayscale: 0 },
        clarendon: { contrast: 1.2, brightness: 1, saturate: 1.35, grayscale: 0 },
        crema: { contrast: 0.9, brightness: 1.1, saturate: 1, grayscale: 0 },
        gingham: { contrast: 1.05, brightness: 1.05, saturate: 1, grayscale: 0 },
        juno: { contrast: 1.15, brightness: 1, saturate: 1.2, grayscale: 0 },
        lark: { contrast: 1.1, brightness: 1.1, saturate: 1.1, grayscale: 0 },
        ludwig: { contrast: 1.05, brightness: 1.05, saturate: 1, grayscale: 0 },
        moon: { contrast: 1.1, brightness: 1, saturate: 0, grayscale: 1 },
        perpetua: { contrast: 0.9, brightness: 1.1, saturate: 0.9, grayscale: 0 },
        reyes: { contrast: 0.85, brightness: 1.15, saturate: 0.75, grayscale: 0 },
        slumber: { contrast: 0.9, brightness: 0.95, saturate: 0.85, grayscale: 0 },
      };

      const filter = filterMap[selectedFilter] || filterMap.original;

      // Combine filter and adjustment values
      const finalBrightness = filter.brightness * (1 + adjustments.brightness / 100);
      const finalContrast = filter.contrast * (1 + adjustments.contrast / 100);
      const finalSaturation = filter.saturate * (1 + adjustments.saturation / 100);
      const finalFade = 1 - Math.abs(adjustments.fade) / 100;

      // Apply adjustments using CSS filter (since canvas filters are limited)
      // For production, you'd want to use proper image processing libraries
      // For now, we'll use CSS filters which work well for most cases
      callback(imageSrc);
    };
    img.src = imageSrc;
  };

  const handleEditNext = () => {
    // The edits are applied via CSS filters, so we can proceed
    setStep("final");
  };

  const handleShare = async () => {
    try {
      setIsUploading(true);
      setUploadError(null);

      // Determine the final image to upload
      let imageToUpload = finalEditedImage || croppedImage || imagePreview;
      
      if (!imageToUpload) {
        setUploadError('No image selected');
        return;
      }

      // Always apply filters and adjustments if they exist
      if (selectedFilter !== "original" || Object.values(adjustments).some(v => v !== 0)) {
        // Create canvas to apply filters and adjustments
        imageToUpload = await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            // Apply CSS filters via canvas
            const filterMap = {
              original: '',
              aden: 'contrast(0.9) brightness(1.2) saturate(0.85)',
              clarendon: 'contrast(1.2) brightness(1) saturate(1.35)',
              crema: 'contrast(0.9) brightness(1.1) saturate(1)',
              gingham: 'contrast(1.05) brightness(1.05) saturate(1)',
              juno: 'contrast(1.15) brightness(1) saturate(1.2)',
              lark: 'contrast(1.1) brightness(1.1) saturate(1.1)',
              ludwig: 'contrast(1.05) brightness(1.05) saturate(1)',
              moon: 'contrast(1.1) grayscale(1)',
              perpetua: 'contrast(0.9) brightness(1.1) saturate(0.9)',
              reyes: 'contrast(0.85) brightness(1.15) saturate(0.75)',
              slumber: 'contrast(0.9) brightness(0.95) saturate(0.85)',
            };
            
            let filterString = filterMap[selectedFilter] || '';
            
            // Add adjustments
            if (adjustments.brightness !== 0) {
              filterString += ` brightness(${1 + adjustments.brightness / 100})`;
            }
            if (adjustments.contrast !== 0) {
              filterString += ` contrast(${1 + adjustments.contrast / 100})`;
            }
            if (adjustments.saturation !== 0) {
              filterString += ` saturate(${1 + adjustments.saturation / 100})`;
            }
            if (adjustments.fade !== 0) {
              filterString += ` opacity(${1 - Math.abs(adjustments.fade) / 100})`;
            }
            
            ctx.filter = filterString;
            ctx.drawImage(img, 0, 0);
            ctx.filter = 'none';
            
            resolve(canvas.toDataURL('image/jpeg', 0.95));
          };
          img.src = imageToUpload;
        });
      }

      // Determine if it's a video or image
      const isVideo = selectedFile?.type?.startsWith('video/');
      
      // Upload media to backend
      const uploadResponse = await uploadService.uploadFromBase64(imageToUpload, 'posts');

      if (!uploadResponse?.url) {
        throw new Error('Failed to upload media');
      }

      // Create post data
      const postData = {
        imageUrl: uploadResponse.url,
        mediaType: isVideo ? 'video' : 'image',
        caption: caption,
        category: category,
        taggedUsers: taggedPeople.map(p => (typeof p === 'object' ? (p.uid || p.username) : p)).filter(Boolean),
        location: location,
        collaborators: collaborators.map(c => (typeof c === 'object' ? (c.uid || c.username) : c)).filter(Boolean),
        hideLikeCounts: hideLikeCounts,
        turnOffCommenting: turnOffCommenting,
      };

      // Add communityId if posting to a community
      if (communityId) {
        postData.communityId = communityId;
      }

      // Create post via API
      const response = await postService.createPost(postData);
      const newPost = response?.post || response;

      if (!newPost) {
        throw new Error('Failed to create post');
      }

      // Dispatch event for local updates
      window.dispatchEvent(
        new CustomEvent("newPostCreated", { detail: newPost })
      );

      if (onPostCreated) {
        onPostCreated(newPost);
      }

      handleClose();
    } catch (error) {
      console.error('Error creating post:', error);
      setUploadError(error.message || 'Failed to create post. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setStep("upload");
    setMobileStep("gallery");
    setSelectedFile(null);
    setImagePreview(null);
    setCroppedImage(null);
    setEditedImage(null);
    setSelectedGalleryImage(null);
    setAspectRatio("9:16");
    setCropData({ x: 0, y: 0, zoom: 1 });
    setSelectedFilter("original");
    setAdjustments({
      brightness: 0,
      contrast: 0,
      fade: 0,
      saturation: 0,
      temperature: 0,
      vignette: 0
    });
    setCaption("");
    setCategory("general");
    setTaggedPeople([]);
    setLocation("");
    setCollaborators([]);
    setHideLikeCounts(false);
    setTurnOffCommenting(false);
    setShowAdvancedSettings(false);
    setIsDrawing(false);
    setDrawingPaths([]);
    setCurrentPath([]);
    setSelectedMusic(null);
    setTextOverlays([]);
    setActiveAdjustment(null);
    setFinalEditedImage(null);
    if (onClose) {
      onClose();
    }
  };

  // Initialize mobile step when modal opens
  useEffect(() => {
    if (isOpen && window.innerWidth < 768) {
      setMobileStep("gallery");
      setStep("upload");
    }
  }, [isOpen]);

  // Fetch following users when modal opens
  useEffect(() => {
    const fetchFollowingUsers = async () => {
      if (isOpen && user?.username && followingUsers.length === 0) {
        try {
          setLoadingFollowing(true);
          const response = await userService.getUserFollowing(user.username, 1, 100);
          const following = response?.following || response || [];
          setFollowingUsers(Array.isArray(following) ? following : []);
        } catch (error) {
          console.error("Error fetching following users:", error);
          setFollowingUsers([]);
        } finally {
          setLoadingFollowing(false);
        }
      }
    };
    fetchFollowingUsers();
  }, [isOpen, user?.username, followingUsers.length]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojiPicker]);

  // Calculate filter and adjustment styles with accurate adjustments
  const getImageStyle = () => {
    // Base filter styles
    const filterMap = {
      original: { contrast: 1, brightness: 1, saturate: 1, grayscale: 0 },
      aden: { contrast: 0.9, brightness: 1.2, saturate: 0.85, grayscale: 0 },
      clarendon: { contrast: 1.2, brightness: 1, saturate: 1.35, grayscale: 0 },
      crema: { contrast: 0.9, brightness: 1.1, saturate: 1, grayscale: 0 },
      gingham: { contrast: 1.05, brightness: 1.05, saturate: 1, grayscale: 0 },
      juno: { contrast: 1.15, brightness: 1, saturate: 1.2, grayscale: 0 },
      lark: { contrast: 1.1, brightness: 1.1, saturate: 1.1, grayscale: 0 },
      ludwig: { contrast: 1.05, brightness: 1.05, saturate: 1, grayscale: 0 },
      moon: { contrast: 1.1, brightness: 1, saturate: 0, grayscale: 1 },
      perpetua: { contrast: 0.9, brightness: 1.1, saturate: 0.9, grayscale: 0 },
      reyes: { contrast: 0.85, brightness: 1.15, saturate: 0.75, grayscale: 0 },
      slumber: { contrast: 0.9, brightness: 0.95, saturate: 0.85, grayscale: 0 },
    };

    const baseFilter = filterMap[selectedFilter] || filterMap.original;

    // Combine base filter with adjustments
    const brightness = baseFilter.brightness * (1 + adjustments.brightness / 100);
    const contrast = baseFilter.contrast * (1 + adjustments.contrast / 100);
    const saturation = baseFilter.saturate * (1 + adjustments.saturation / 100);
    const grayscale = baseFilter.grayscale;

    // Fade: Reduces opacity (0-100 means 100% to 0% opacity)
    const fade = 1 - (adjustments.fade / 100); // fade: 0 = no change, 100 = fully faded

    // Temperature: Warm (positive) shifts to orange/red, Cool (negative) shifts to blue
    // More accurate temperature simulation using sepia for warm and hue-rotate for cool
    const tempValue = adjustments.temperature;
    let tempFilters = [];
    if (tempValue > 0) {
      // Warm: Add orange/yellow tint using sepia
      const sepiaAmount = Math.min(tempValue / 150, 0.6);
      tempFilters.push(`sepia(${sepiaAmount})`);
      if (sepiaAmount > 0.2) {
        tempFilters.push(`saturate(${1 + sepiaAmount * 0.3})`);
      }
    } else if (tempValue < 0) {
      // Cool: Shift hue towards blue/cyan
      const coolAmount = Math.abs(tempValue);
      // Negative hue-rotate shifts towards blue
      tempFilters.push(`hue-rotate(${-coolAmount * 1.2}deg)`);
      // Slight desaturation for cool tones
      if (coolAmount > 30) {
        tempFilters.push(`saturate(${Math.max(0.7, 1 - coolAmount / 300)})`);
      }
    }
    const tempFilter = tempFilters.join(' ');

    // Build filter string
    let filterParts = [];
    if (brightness !== 1) filterParts.push(`brightness(${brightness})`);
    if (contrast !== 1) filterParts.push(`contrast(${contrast})`);
    if (saturation !== 1) filterParts.push(`saturate(${saturation})`);
    if (grayscale > 0) filterParts.push(`grayscale(${grayscale})`);
    if (tempFilter) filterParts.push(tempFilter);

    const filterStyle = filterParts.join(' ');
    const opacityStyle = fade !== 1 ? fade : 1;

    // Vignette effect using box-shadow
    const vignetteStyle = adjustments.vignette !== 0
      ? {
        boxShadow: `inset 0 0 ${100 + Math.abs(adjustments.vignette) * 2}px ${Math.abs(adjustments.vignette) * 0.5}px rgba(0, 0, 0, ${Math.abs(adjustments.vignette) / 100})`
      }
      : {};

    return {
      filter: filterStyle || 'none',
      opacity: opacityStyle,
      ...vignetteStyle
    };
  };

  // Get vignette style (needs to be applied as box-shadow or overlay)
  const getVignetteStyle = () => {
    if (adjustments.vignette === 0) return null;
    const intensity = Math.abs(adjustments.vignette) / 100;
    return {
      boxShadow: `inset 0 0 ${100 + intensity * 200}px ${intensity * 50}px rgba(0, 0, 0, ${intensity})`
    };
  };

  // Handle caption change with 2200 limit
  const handleCaptionChange = (e) => {
    const value = e.target.value;
    if (value.length <= 2200) {
      setCaption(value);
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setCaption(prev => {
      const newCaption = prev + emoji;
      return newCaption.length <= 2200 ? newCaption : prev;
    });
  };

  // Mock gallery images for mobile
  const galleryImages = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    url: `https://i.pravatar.cc/400?img=${i + 1}`,
    type: 'image',
    timestamp: i < 5 ? 'Today' : i < 10 ? 'Yesterday' : '2 days ago'
  }));

  // Sample music tracks
  const musicTracks = [
    { id: 1, title: "Still Beating", artist: "Mac DeMarco", thumbnail: "https://via.placeholder.com/60/FFD700/000000?text=SB" },
    { id: 2, title: "Dracula", artist: "Tame Impala", thumbnail: "https://via.placeholder.com/60/000000/FFFFFF?text=D" },
    { id: 3, title: "Good Life", artist: "T-Pain", thumbnail: "https://via.placeholder.com/60/FF6B6B/FFFFFF?text=GL" },
    { id: 4, title: "Weston Road Flow", artist: "Drake", thumbnail: "https://via.placeholder.com/60/4ECDC4/FFFFFF?text=WRF" },
  ];

  // Get image bounds within container for drawing
  const getImageBounds = () => {
    const container = drawingCanvasRef.current?.parentElement;
    if (!container) return null;

    const img = mobileImageRef.current || container.querySelector('img');
    if (!img) return null;

    const containerRect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();

    return {
      left: imgRect.left - containerRect.left,
      top: imgRect.top - containerRect.top,
      width: imgRect.width,
      height: imgRect.height,
      containerWidth: containerRect.width,
      containerHeight: containerRect.height
    };
  };

  // Drawing functionality
  const startDrawing = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    e.stopPropagation();

    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    const bounds = getImageBounds();
    if (!bounds) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const containerRect = canvas.parentElement.getBoundingClientRect();

    const x = clientX - containerRect.left - bounds.left;
    const y = clientY - containerRect.top - bounds.top;

    // Check if point is within image bounds
    if (x < 0 || x > bounds.width || y < 0 || y > bounds.height) {
      return;
    }

    setCurrentPath([{ x, y }]);
  };

  const draw = (e) => {
    if (!isDrawing || currentPath.length === 0) return;
    e.preventDefault();
    e.stopPropagation();

    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    const bounds = getImageBounds();
    if (!bounds) return;

    const ctx = canvas.getContext('2d');
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const containerRect = canvas.parentElement.getBoundingClientRect();

    const x = clientX - containerRect.left - bounds.left;
    const y = clientY - containerRect.top - bounds.top;

    // Check if point is within image bounds
    if (x < 0 || x > bounds.width || y < 0 || y > bounds.height) {
      stopDrawing();
      return;
    }

    setCurrentPath(prev => {
      const newPath = [...prev, { x, y }];

      // Draw immediately to canvas
      if (newPath.length > 1) {
        const prevPoint = newPath[newPath.length - 2];
        ctx.strokeStyle = drawingColor;
        ctx.lineWidth = drawingSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      return newPath;
    });
  };

  const stopDrawing = () => {
    if (currentPath.length > 0) {
      setDrawingPaths(prev => [...prev, { path: currentPath, color: drawingColor, size: drawingSize }]);
      setCurrentPath([]);
    }
    // Don't set isDrawing to false here - keep drawing mode active
    // Drawing mode will only be disabled when user clicks Draw button again or Done
  };

  // Initialize and update drawing canvas to match image bounds
  const updateDrawingCanvas = useCallback(() => {
    if (!drawingCanvasRef.current || mobileStep !== "edit") return;

    const bounds = getImageBounds();
    if (!bounds || bounds.width === 0 || bounds.height === 0) {
      return;
    }

    const canvas = drawingCanvasRef.current;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = bounds.width * dpr;
    canvas.height = bounds.height * dpr;
    canvas.style.width = bounds.width + 'px';
    canvas.style.height = bounds.height + 'px';
    canvas.style.left = bounds.left + 'px';
    canvas.style.top = bounds.top + 'px';
    canvas.style.position = 'absolute';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, bounds.width, bounds.height);

    // Redraw all saved paths
    drawingPaths.forEach(({ path, color, size }) => {
      if (path.length > 1) {
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();
      }
    });

    // Also draw current path if drawing
    if (currentPath.length > 1) {
      ctx.strokeStyle = drawingColor;
      ctx.lineWidth = drawingSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
      ctx.stroke();
    }
  }, [mobileStep, drawingPaths, currentPath, drawingColor, drawingSize]);

  // Initialize canvas when edit step is active
  useEffect(() => {
    if (mobileStep !== "edit") return;

    const initCanvas = () => {
      const img = mobileImageRef.current;
      if (!img) {
        setTimeout(initCanvas, 100);
        return;
      }

      if (img.complete && img.naturalWidth > 0) {
        setTimeout(updateDrawingCanvas, 50);
      } else {
        img.addEventListener('load', () => setTimeout(updateDrawingCanvas, 50), { once: true });
      }
    };

    initCanvas();
  }, [mobileStep, updateDrawingCanvas]);

  // Update canvas when paths change
  useEffect(() => {
    if (mobileStep === "edit") {
      updateDrawingCanvas();
    }
  }, [drawingPaths, currentPath, mobileStep, updateDrawingCanvas]);

  // Mobile handlers
  const handleMobileGallerySelect = (image) => {
    setSelectedGalleryImage(image);
    setImagePreview(image.url);
    setCroppedImage(null);
  };

  const handleMobileEditNext = () => {
    const baseImage = croppedImage || imagePreview;
    if (!baseImage) {
      setMobileStep("final");
      return;
    }

    // Check if we have any edits to merge
    const hasEdits = drawingPaths.length > 0 || textOverlays.length > 0;

    if (!hasEdits) {
      // No drawings or text, just proceed to final
      setMobileStep("final");
      return;
    }

    // Merge drawings and text into final image
    const canvas = document.createElement('canvas');
    const img = new Image();

    // Set crossOrigin for external images
    if (baseImage.startsWith('http://') || baseImage.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }

    img.onerror = () => {
      // If image fails to load, just proceed with original
      console.warn('Image failed to load, proceeding without merge');
      setMobileStep("final");
    };

    img.onload = () => {
      try {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        // Draw base image
        ctx.drawImage(img, 0, 0);

        // Get image display dimensions from the ref if available
        const imgElement = mobileImageRef.current;
        let displayWidth = img.width;
        let displayHeight = img.height;

        if (imgElement) {
          const imgRect = imgElement.getBoundingClientRect();
          displayWidth = imgRect.width;
          displayHeight = imgRect.height;
        }

        // Calculate scale factors
        const scaleX = img.width / displayWidth;
        const scaleY = img.height / displayHeight;
        const scale = Math.min(scaleX, scaleY) || 1;

        // Add drawings if any
        if (drawingPaths.length > 0) {
          drawingPaths.forEach(({ path, color, size }) => {
            if (path.length > 1) {
              ctx.strokeStyle = color;
              ctx.lineWidth = size * scale;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              ctx.beginPath();
              ctx.moveTo(path[0].x * scaleX, path[0].y * scaleY);
              for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i].x * scaleX, path[i].y * scaleY);
              }
              ctx.stroke();
            }
          });
        }

        // Add text overlays
        if (textOverlays.length > 0) {
          textOverlays.forEach((overlay) => {
            ctx.fillStyle = 'white';
            const fontSize = Math.max(24, (48 * scale));
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
              overlay.text,
              (overlay.x / 100) * img.width,
              (overlay.y / 100) * img.height
            );
          });
        }

        const finalDataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setFinalEditedImage(finalDataUrl);
        setMobileStep("final");
      } catch (error) {
        console.error('Error merging image:', error);
        // Proceed anyway
        setMobileStep("final");
      }
    };

    img.src = baseImage;
  };

  const handleMobileCropNext = () => {
    if (imagePreview) {
      cropImage(imagePreview, (croppedDataUrl) => {
        setImagePreview(croppedDataUrl); // keep preview in sync with crop
        setCroppedImage(croppedDataUrl);
        setMobileStep("adjustments");
      });
    } else {
      setMobileStep("adjustments");
    }
  };

  const handleMobileAdjustmentSelect = (type) => {
    setActiveAdjustment(type);
  };

  if (!isOpen) return null;

  // Desktop-only modal (mobile will be handled separately later)
  return (
    <AnimatePresence>
      <div className="hidden md:flex fixed inset-0 z-[100] items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/80"
        />

        {/* Modal Content - Dark Theme */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`relative bg-[#0f0f0f] rounded-lg shadow-2xl ${step === "final" ? "overflow-visible" : "overflow-hidden"} max-w-5xl w-full max-h-[90vh] flex flex-col border border-gray-800`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Step 1: Upload */}
          {step === "upload" && (
            <div className="flex flex-col items-center justify-center p-12 min-h-[600px]">
              <h2 className="text-xl font-semibold mb-8 text-white">Create new post</h2>

              <div
                className={`w-full max-w-md border-2 border-dashed rounded-lg p-16 text-center cursor-pointer transition-colors ${isDragging
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-gray-600 hover:border-gray-500"
                  }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-4">
                  {/* Upload icon from assets */}
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <img
                      src={uploadIcon}
                      alt="Upload"
                      className="w-20 h-20 invert"
                    />
        </div>

                  <p className="text-gray-300 text-lg">Drag photos and videos here</p>
                  <button
                    className="px-6 py-2 bg-[#A855F7] text-white rounded-lg font-semibold hover:bg-[#9333EA] transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Select From Computer
                  </button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          )}

          {/* Step 2: Crop */}
          {step === "crop" && imagePreview && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <button
                  onClick={() => {
                    setStep("upload");
                    setImagePreview(null);
                  }}
                  className="text-blue-500 font-semibold hover:text-blue-400"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-base font-semibold text-white">Crop</h2>
                <button
                  onClick={handleCropNext}
                  className="text-blue-500 font-semibold hover:text-blue-400"
                >
                  Next
                </button>
              </div>

              {/* Crop Content */}
              <div className="flex-1 flex">
                <div className="flex-1 bg-black flex items-center justify-center p-8 relative overflow-hidden">
                  {/* Grid lines */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30"></div>
                    <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30"></div>
                    <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30"></div>
                    <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30"></div>
                  </div>

                  {/* Image with crop overlay - draggable */}
                  <div
                    ref={cropContainerRef}
                    className="relative"
                    style={{
                      width: 'min(600px, calc(100vw - 400px))',
                      maxHeight: 'calc(100vh - 200px)',
                      aspectRatio: displayAspectRatio,
                      minWidth: '300px',
                      minHeight: '300px'
                    }}
                  >
                    {/* Grid lines - constrained to crop area */}
                    <div className="absolute inset-0 pointer-events-none z-10">
                      <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30"></div>
                      <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30"></div>
                      <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30"></div>
                      <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30"></div>
                      {/* Border around crop area */}
                      <div className="absolute inset-0 border-2 border-white/50"></div>
                    </div>

                    {/* Image with crop overlay - draggable */}
                    <div className="absolute inset-0 overflow-hidden cursor-move">
                      <img
                        ref={imageRef}
                        src={imagePreview}
                        alt="Crop preview"
                        className="absolute top-1/2 left-1/2 select-none"
                        style={{
                          transform: `translate(-50%, -50%) translate(${cropData.x}px, ${cropData.y}px) scale(${cropData.zoom})`,
                          cursor: isDraggingImage ? 'grabbing' : 'grab',
                          maxWidth: 'none',
                          maxHeight: 'none',
                          width: imageDisplaySize.width,
                          height: imageDisplaySize.height,
                          objectFit: 'none'
                        }}
                        onMouseDown={handleImageMouseDown}
                        onLoad={(e) => {
                          const img = e.target;
                          setImageDimensions({
                            width: img.naturalWidth || imageDimensions.width,
                            height: img.naturalHeight || imageDimensions.height
                          });
                          // Update container size after image loads
                          if (cropContainerRef.current) {
                            const rect = cropContainerRef.current.getBoundingClientRect();
                            setContainerDimensions({
                              width: rect.width,
                              height: rect.height
                            });
                          }
                        }}
                        draggable={false}
                      />
                    </div>
                  </div>
                </div>

                {/* Sidebar - Aspect Ratio and Zoom */}
                <div className="w-80 bg-[#1a1a1a] border-l border-gray-800 p-4 space-y-6 overflow-y-auto">
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Aspect Ratio</h3>
                    <div className="space-y-2">
                      {aspectRatios.map((ratio) => (
                        <button
                          key={ratio.value}
                          onClick={() => {
                            setAspectRatio(ratio.value);
                            // Reset crop position when aspect ratio changes
                            setCropData({ x: 0, y: 0, zoom: 1 });
                          }}
                          className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${aspectRatio === ratio.value
                              ? "bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/50"
                              : "text-gray-300 hover:bg-gray-800"
                            }`}
                        >
                          {ratio.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Zoom</h3>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.1"
                      value={cropData.zoom}
                      onChange={(e) =>
                        setCropData({ ...cropData, zoom: parseFloat(e.target.value) })
                      }
                      className="w-full"
                    />
                    <div className="text-xs text-gray-400 mt-1 text-center">
                      {Math.round(cropData.zoom * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Edit (Filters & Adjustments) */}
          {step === "edit" && (croppedImage || imagePreview) && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <button
                  onClick={() => setStep("crop")}
                  className="text-blue-500 font-semibold hover:text-blue-400"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-base font-semibold text-white">Edit</h2>
                <button
                  onClick={handleEditNext}
                  className="text-blue-500 font-semibold hover:text-blue-400"
                >
                  Next
                </button>
              </div>

              {/* Edit Content */}
              <div className="flex-1 flex">
                {/* Image Preview */}
                <div className="flex-1 bg-black flex items-center justify-center p-8 relative">
                  <img
                    src={croppedImage || imagePreview}
                    alt="Edit preview"
                    className="max-w-full max-h-full object-contain rounded-lg relative z-10"
                    style={getImageStyle()}
                  />
                  {getVignetteStyle() && (
                    <div
                      className="absolute inset-0 pointer-events-none z-20 rounded-lg"
                      style={getVignetteStyle()}
                    />
                  )}
                </div>

                {/* Filters/Adjustments Sidebar */}
                <div className="w-80 bg-[#1a1a1a] border-l border-gray-800 flex flex-col">
                  {/* Tabs */}
                  <div className="flex border-b border-gray-800">
                    <button
                      onClick={() => setActiveTab("filters")}
                      className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === "filters"
                          ? "text-purple-400 border-b-2 border-purple-400"
                          : "text-gray-400 hover:text-gray-300"
                        }`}
                    >
                      Filters
                    </button>
                    <button
                      onClick={() => setActiveTab("adjustments")}
                      className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === "adjustments"
                          ? "text-purple-400 border-b-2 border-purple-400"
                          : "text-gray-400 hover:text-gray-300"
                        }`}
                    >
                      Adjustments
                    </button>
                  </div>

                  {/* Filters Grid */}
                  {activeTab === "filters" && (
                    <div className="flex-1 overflow-y-auto p-4">
                      <div className="grid grid-cols-3 gap-3">
                        {filters.map((filter) => (
                          <button
                            key={filter.name}
                            onClick={() => setSelectedFilter(filter.name)}
                            className="flex flex-col items-center gap-2"
                          >
                            <div
                              className={`w-20 h-20 rounded border-2 overflow-hidden ${selectedFilter === filter.name
                                  ? "border-blue-500"
                                  : "border-transparent"
                                }`}
                            >
                              <img
                                src={croppedImage || imagePreview}
                                alt={filter.label}
                                className="w-full h-full object-cover"
                                style={{ filter: getFilterStyle(filter.name) }}
                              />
                            </div>
                            <span
                              className={`text-xs ${selectedFilter === filter.name
                                  ? "text-blue-400 font-semibold"
                                  : "text-gray-400"
                                }`}
                            >
                              {filter.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Adjustments */}
                  {activeTab === "adjustments" && (
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                      {Object.entries(adjustments).map(([key, value]) => (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm text-gray-300 capitalize">
                              {key}
                            </label>
                            <span className="text-sm text-gray-400">{value}</span>
                          </div>
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            value={value}
                            onChange={(e) =>
                              setAdjustments({
                                ...adjustments,
                                [key]: parseInt(e.target.value),
                              })
                            }
                            className="w-full"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Final Create Post */}
          {step === "final" && (editedImage || croppedImage || imagePreview) && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <button
                  onClick={() => setStep("edit")}
                  className="text-blue-500 font-semibold hover:text-blue-400"
                  disabled={isUploading}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center">
                  <h2 className="text-base font-semibold text-white">Create new post</h2>
                  {uploadError && (
                    <p className="text-xs text-red-500 mt-1">{uploadError}</p>
                  )}
                </div>
                <button
                  onClick={handleShare}
                  disabled={isUploading}
                  className="text-blue-500 font-semibold hover:text-blue-400 disabled:text-gray-600 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Sharing...' : 'Share'}
                </button>
              </div>

              {/* Final Content */}
              <div className="flex-1 flex overflow-hidden relative">
                {/* Image Preview */}
                <div className="flex-1 bg-black flex items-center justify-center relative">
                  <img
                    src={croppedImage || imagePreview}
                    alt="Post preview"
                    className="max-w-full max-h-full object-contain cursor-pointer relative z-10"
                    style={getImageStyle()}
                    onClick={() => setShowTagPeopleModal(true)}
                  />
                  {getVignetteStyle() && (
                    <div
                      className="absolute inset-0 pointer-events-none z-20"
                      style={getVignetteStyle()}
                    />
                  )}
                  {taggedPeople.length > 0 && (
                    <div className="absolute top-4 left-4 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {taggedPeople.length} {taggedPeople.length === 1 ? "person" : "people"} tagged
                    </div>
                  )}
                  <div
                    className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-2 rounded cursor-pointer hover:bg-black/90"
                    onClick={() => setShowTagPeopleModal(true)}
                  >
                    Click photo to tag people
                  </div>
                </div>

                {/* Settings Sidebar */}
                <div className="w-96 bg-[#1a1a1a] border-l border-gray-800 flex flex-col overflow-visible relative">
                  {/* User Profile */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
                    <img
                      src={profilePhoto}
                      alt={username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="text-sm font-semibold text-white">{username}</span>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto overflow-x-visible relative" style={{ overflow: 'visible' }}>
                    {/* Caption */}
                    <div className="px-4 py-3 border-b border-gray-800 relative" style={{ overflow: 'visible' }}>
                      <textarea
                        placeholder="Write a caption..."
                        value={caption}
                        onChange={handleCaptionChange}
                        className="w-full resize-none outline-none text-sm text-white placeholder-gray-500 bg-transparent"
                        rows={10}
                        maxLength={2200}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <div className="relative overflow-visible" ref={emojiPickerRef}>
                          <Smile
                            className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-300"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          />
                          {showEmojiPicker && (
                            <AnimatePresence>
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className="absolute bottom-full left-0 mb-2 z-[150]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="rounded-lg shadow-2xl overflow-hidden">
                                  <EmojiPickerReact
                                    onEmojiClick={(emojiData) => {
                                      handleEmojiSelect(emojiData.emoji);
                                      setShowEmojiPicker(false);
                                    }}
                                    theme="dark"
                                    width={350}
                                    height={400}
                                    previewConfig={{
                                      showPreview: false
                                    }}
                                    skinTonesDisabled
                                    searchDisabled={false}
                                    lazyLoadEmojis={true}
                                  />
                                </div>
                              </motion.div>
                            </AnimatePresence>
                          )}
                        </div>
                        <span className={`text-xs ${caption.length >= 2200 ? 'text-red-400' : 'text-gray-400'}`}>
                          {caption.length}/2,200
                        </span>
                      </div>
                    </div>

                    {/* Add Location */}
                    <button
                      onClick={() => setShowLocationModal(true)}
                      className="w-full px-4 py-3 border-b border-gray-800 flex items-center justify-between hover:bg-gray-900 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-white" />
                        <span className="text-sm text-white">
                          {location || "Add location"}
                        </span>
                      </div>
                    </button>

                    {/* Add Collaborators */}
                    <button
                      onClick={() => setShowCollaboratorsModal(true)}
                      className="w-full px-4 py-3 border-b border-gray-800 flex items-center justify-between hover:bg-gray-900 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <UserPlus className="w-5 h-5 text-white" />
                        <span className="text-sm text-white">
                          {collaborators.length > 0
                            ? `Add collaborators (${collaborators.length})`
                            : "Add collaborators"}
                        </span>
                      </div>
                    </button>

                    {/* Advanced Settings */}
                    <div className="border-b border-gray-800">
                      <button
                        onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-900 transition-colors"
                      >
                        <span className="text-sm text-white">Advanced Settings</span>
                        {showAdvancedSettings ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      {showAdvancedSettings && (
                        <div className="px-4 pb-4 space-y-4">
                          {/* Hide like and view counts */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-white">
                                Hide like and view counts on this post
                              </span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={hideLikeCounts}
                                  onChange={(e) => setHideLikeCounts(e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                              </label>
                            </div>
                            <p className="text-xs text-gray-400">
                              Only you will see the total number of likes and views on this post. You can change this later by going to the ... menu at the top of the post. To hide like counts on other people's posts, go to your account settings. Learn more
                            </p>
                          </div>

                          {/* Turn off commenting */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-white">
                                Turn off commenting
                              </span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={turnOffCommenting}
                                  onChange={(e) => setTurnOffCommenting(e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                              </label>
                            </div>
                            <p className="text-xs text-gray-400">
                              You can change this later by going to the ... menu at the top of your post.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Small Popup Modals - Centered in Modal */}
          {/* Tag People Popup */}
          <AnimatePresence>
            {showTagPeopleModal && (
              <>
                <div
                  className="absolute inset-0 bg-black/60 z-[110]"
                  onClick={() => setShowTagPeopleModal(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-2xl z-[111] w-96 max-h-[500px] flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                    <h2 className="text-base font-semibold text-white">Tag people</h2>
                    <button
                      onClick={() => setShowTagPeopleModal(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
        <input
          type="text"
                      placeholder="Search for people..."
                      value={tagSearch}
                      onChange={(e) => setTagSearch(e.target.value)}
                      className="w-full px-4 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg mb-4 outline-none focus:border-blue-500 text-white placeholder-gray-500"
                    />
                    {taggedPeople.length > 0 && (
                      <div className="space-y-2 mb-4">
                        <p className="text-sm font-semibold text-white">Tagged:</p>
                        {taggedPeople.map((tag, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-[#0f0f0f] rounded"
                          >
                            <div className="flex items-center gap-2">
                              {tag.avatar && (
                                <img src={tag.avatar || tag.profilePhoto} alt="" className="w-6 h-6 rounded-full" />
                              )}
                              <span className="text-sm text-white">{tag.username || tag}</span>
                            </div>
                            <button
                              onClick={() =>
                                setTaggedPeople(taggedPeople.filter((_, i) => i !== index))
                              }
                              className="text-red-400 text-sm hover:text-red-300"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Following Users List */}
                    {loadingFollowing ? (
                      <div className="text-center py-4 text-gray-400">Loading...</div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-white mb-2">Following:</p>
                        {followingUsers
                          .filter(user => {
                            const searchLower = tagSearch.toLowerCase();
                            const username = user.username?.toLowerCase() || '';
                            const displayName = user.displayName?.toLowerCase() || '';
                            return username.includes(searchLower) || displayName.includes(searchLower);
                          })
                          .map((user, index) => {
                            const isTagged = taggedPeople.some(t => 
                              (typeof t === 'object' && t.username === user.username) || 
                              (typeof t === 'string' && t === user.username)
                            );
                            return (
                              <button
                                key={user.uid || user.id || index}
                                onClick={() => {
                                  if (!isTagged) {
                                    setTaggedPeople([...taggedPeople, user]);
                                  }
                                }}
                                disabled={isTagged}
                                className={`w-full flex items-center justify-between p-2 rounded hover:bg-[#2a2a2a] transition-colors ${
                                  isTagged ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <img 
                                    src={user.profilePhoto || user.avatar || '/default-avatar.png'} 
                                    alt={user.username}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                  <div className="text-left">
                                    <p className="text-sm text-white">{user.username}</p>
                                    {user.displayName && (
                                      <p className="text-xs text-gray-400">{user.displayName}</p>
                                    )}
                                  </div>
                                </div>
                                {isTagged && (
                                  <span className="text-xs text-gray-400">Tagged</span>
                                )}
                              </button>
                            );
                          })}
                        {followingUsers.length === 0 && (
                          <p className="text-sm text-gray-400 text-center py-4">
                            No following users found
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Location Popup */}
          <AnimatePresence>
            {showLocationModal && (
              <>
                <div
                  className="absolute inset-0 bg-black/60 z-[110]"
                  onClick={() => {
                    setShowLocationModal(false);
                    setLocationSearch("");
                  }}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-2xl z-[111] w-96 max-h-[400px] flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                    <h2 className="text-base font-semibold text-white">Add location</h2>
                    <button
                      onClick={() => {
                        setShowLocationModal(false);
                        setLocationSearch("");
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    <input
                      type="text"
                      placeholder="Search for a location..."
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      className="w-full px-4 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg mb-4 outline-none focus:border-blue-500 text-white placeholder-gray-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (locationSearch.trim()) {
                            setLocation(locationSearch.trim());
                          }
                          setShowLocationModal(false);
                          setLocationSearch("");
                        }}
                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Done
                      </button>
                      {location && (
                        <button
                          onClick={() => {
                            setLocation("");
                            setLocationSearch("");
                          }}
                          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Collaborators Popup */}
          <AnimatePresence>
            {showCollaboratorsModal && (
              <>
                <div
                  className="absolute inset-0 bg-black/60 z-[110]"
                  onClick={() => setShowCollaboratorsModal(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-2xl z-[111] w-96 max-h-[500px] flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                    <h2 className="text-base font-semibold text-white">Add collaborators</h2>
                    <button
                      onClick={() => setShowCollaboratorsModal(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    <input
                      type="text"
                      placeholder="Search for people..."
                      value={collabSearch}
                      onChange={(e) => setCollabSearch(e.target.value)}
                      className="w-full px-4 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg mb-4 outline-none focus:border-blue-500 text-white placeholder-gray-500"
                    />
                    {collaborators.length > 0 && (
                      <div className="space-y-2 mb-4">
                        <p className="text-sm font-semibold text-white">Collaborators:</p>
                        {collaborators.map((collab, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-[#0f0f0f] rounded"
                          >
                            <div className="flex items-center gap-2">
                              {(collab.avatar || collab.profilePhoto) && (
                                <img src={collab.avatar || collab.profilePhoto} alt="" className="w-6 h-6 rounded-full" />
                              )}
                              <span className="text-sm text-white">{collab.username || collab}</span>
                            </div>
                            <button
                              onClick={() =>
                                setCollaborators(collaborators.filter((_, i) => i !== index))
                              }
                              className="text-red-400 text-sm hover:text-red-300"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Following Users List */}
                    {loadingFollowing ? (
                      <div className="text-center py-4 text-gray-400">Loading...</div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-white mb-2">Following:</p>
                        {followingUsers
                          .filter(user => {
                            const searchLower = collabSearch.toLowerCase();
                            const username = user.username?.toLowerCase() || '';
                            const displayName = user.displayName?.toLowerCase() || '';
                            return username.includes(searchLower) || displayName.includes(searchLower);
                          })
                          .map((user, index) => {
                            const isAdded = collaborators.some(c => 
                              (typeof c === 'object' && c.username === user.username) || 
                              (typeof c === 'string' && c === user.username)
                            );
                            return (
                              <button
                                key={user.uid || user.id || index}
                                onClick={() => {
                                  if (!isAdded) {
                                    setCollaborators([...collaborators, user]);
                                  }
                                }}
                                disabled={isAdded}
                                className={`w-full flex items-center justify-between p-2 rounded hover:bg-[#2a2a2a] transition-colors ${
                                  isAdded ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <img 
                                    src={user.profilePhoto || user.avatar || '/default-avatar.png'} 
                                    alt={user.username}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                  <div className="text-left">
                                    <p className="text-sm text-white">{user.username}</p>
                                    {user.displayName && (
                                      <p className="text-xs text-gray-400">{user.displayName}</p>
                                    )}
                                  </div>
                                </div>
                                {isAdded && (
                                  <span className="text-xs text-gray-400">Added</span>
                                )}
                              </button>
                            );
                          })}
                        {followingUsers.length === 0 && (
                          <p className="text-sm text-gray-400 text-center py-4">
                            No following users found
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Mobile Version */}
      <div className="md:hidden fixed inset-0 z-[100] bg-black">
        <AnimatePresence mode="wait">
          {/* Mobile Step 1: Gallery */}
          {mobileStep === "gallery" && (
            <motion.div
              key="mobile-gallery"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full flex flex-col bg-black"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <button
                  onClick={handleClose}
                  className="text-white"
                >
                  <X className="w-6 h-6" />
                </button>
                <h2 className="text-base font-semibold text-white">New post</h2>
                <button
                  onClick={() => {
                    const imageUrl = imagePreview || selectedGalleryImage?.url;
                    if (!imageUrl) return;
                    if (!imagePreview && selectedGalleryImage?.url) {
                      setImagePreview(selectedGalleryImage.url);
                    }
                    // For community posts, set cropped image to skip crop step
                    if (communityId) {
                      setCroppedImage(imageUrl);
                    }
                    setMobileStep("edit");
                  }}
                  className={`font-semibold transition-colors ${(selectedGalleryImage || imagePreview)
                      ? 'text-blue-500 hover:text-blue-400 cursor-pointer'
                      : 'text-gray-600 cursor-not-allowed opacity-50'
                    }`}
                  disabled={!selectedGalleryImage && !imagePreview}
                >
                  Next
                </button>
              </div>

              {/* Preview */}
              {(selectedGalleryImage || imagePreview) && (
                <div className="w-full h-64 bg-black flex items-center justify-center border-b border-gray-800">
                  <img
                    src={imagePreview || selectedGalleryImage?.url}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}

              {/* Gallery Grid */}
              <div className="flex-1 overflow-y-auto p-2">
                <div className="flex items-center justify-between px-2 mb-2">
                  <span className="text-sm text-gray-400">Recents</span>
                  <button
                    className="text-gray-400"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {/* Camera button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square bg-gray-900 border border-gray-800 rounded flex items-center justify-center"
                  >
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  {galleryImages.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => handleMobileGallerySelect(img)}
                      className={`aspect-square overflow-hidden rounded transition-all ${selectedGalleryImage?.id === img.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                    >
                      <img
                        src={img.url}
                        alt={`Gallery ${img.id}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </motion.div>
          )}

          {/* Mobile Step 2: Edit (Doodle, Music, Text, Filters, Edits) */}
          {mobileStep === "edit" && (croppedImage || imagePreview) && (
            <motion.div
              key="mobile-edit"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="h-full flex flex-col bg-black"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <button
                  onClick={() => setMobileStep("gallery")}
                  className="text-white"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-base font-semibold text-white">New post</h2>
                <button
                  onClick={handleMobileEditNext}
                  className="text-blue-500 font-semibold"
                >
                  Next
                </button>
              </div>

              {/* Image with Drawing Canvas */}
              <div
                className="flex-1 relative bg-black overflow-hidden"
                onMouseMove={(e) => {
                  if (draggingText !== null) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - dragTextStart.x) / rect.width) * 100;
                    const y = ((e.clientY - dragTextStart.y) / rect.height) * 100;
                    setTextOverlays(textOverlays.map(overlay =>
                      overlay.id === draggingText
                        ? { ...overlay, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
                        : overlay
                    ));
                  }
                }}
                onMouseUp={() => setDraggingText(null)}
                onTouchMove={(e) => {
                  if (draggingText !== null && e.touches.length > 0) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.touches[0].clientX - dragTextStart.x) / rect.width) * 100;
                    const y = ((e.touches[0].clientY - dragTextStart.y) / rect.height) * 100;
                    setTextOverlays(textOverlays.map(overlay =>
                      overlay.id === draggingText
                        ? { ...overlay, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
                        : overlay
                    ));
                  }
                }}
                onTouchEnd={() => setDraggingText(null)}
              >
                <img
                  ref={mobileImageRef}
                  src={croppedImage || imagePreview}
                  alt="Edit"
                  className="w-full h-full object-contain"
                  style={getImageStyle()}
                  onLoad={() => {
                    setTimeout(() => {
                      updateDrawingCanvas();
                    }, 50);
                  }}
                />
                {/* Vignette Overlay */}
                {getVignetteStyle() && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ ...getVignetteStyle(), zIndex: 15 }}
                  />
                )}
                {/* Text Overlays - Draggable */}
                {textOverlays.map((overlay) => (
                  <div
                    key={overlay.id}
                    className="absolute text-white text-2xl font-bold cursor-move select-none"
                    style={{
                      left: `${overlay.x}%`,
                      top: `${overlay.y}%`,
                      transform: 'translate(-50%, -50%)',
                      zIndex: 10
                    }}
                    onMouseDown={(e) => {
                      setDraggingText(overlay.id);
                      const rect = e.currentTarget.parentElement.getBoundingClientRect();
                      setDragTextStart({
                        x: e.clientX - (overlay.x * rect.width / 100),
                        y: e.clientY - (overlay.y * rect.height / 100)
                      });
                    }}
                    onTouchStart={(e) => {
                      setDraggingText(overlay.id);
                      const rect = e.currentTarget.parentElement.getBoundingClientRect();
                      setDragTextStart({
                        x: e.touches[0].clientX - (overlay.x * rect.width / 100),
                        y: e.touches[0].clientY - (overlay.y * rect.height / 100)
                      });
                    }}
                  >
                    {overlay.text}
                  </div>
                ))}
                {/* Drawing Canvas - Positioned over image only */}
                <canvas
                  ref={drawingCanvasRef}
                  style={{
                    position: 'absolute',
                    pointerEvents: isDrawing ? 'auto' : 'none',
                    touchAction: isDrawing ? 'none' : 'auto',
                    zIndex: 5,
                    cursor: isDrawing ? 'crosshair' : 'default'
                  }}
                  onMouseDown={(e) => {
                    if (isDrawing) {
                      startDrawing(e);
                    }
                  }}
                  onMouseMove={(e) => {
                    if (isDrawing && currentPath.length > 0) {
                      draw(e);
                    }
                  }}
                  onMouseUp={(e) => {
                    if (isDrawing) {
                      stopDrawing();
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isDrawing) {
                      stopDrawing();
                    }
                  }}
                  onTouchStart={(e) => {
                    if (isDrawing) {
                      e.preventDefault();
                      e.stopPropagation();
                      startDrawing(e);
                    }
                  }}
                  onTouchMove={(e) => {
                    if (isDrawing && currentPath.length > 0) {
                      e.preventDefault();
                      e.stopPropagation();
                      draw(e);
                    }
                  }}
                  onTouchEnd={(e) => {
                    if (isDrawing) {
                      e.preventDefault();
                      e.stopPropagation();
                      stopDrawing();
                    }
                  }}
                  onTouchCancel={(e) => {
                    if (isDrawing) {
                      e.preventDefault();
                      stopDrawing();
                    }
                  }}
                />
              </div>

              {/* Bottom Toolbar */}
              <div className="border-t border-gray-800 bg-black">
                <div className="flex items-center justify-around py-3 px-2">
                  <button
                    onClick={() => {
                      setIsDrawing(!isDrawing);
                      if (isDrawing) {
                        stopDrawing();
                      }
                    }}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${isDrawing ? 'bg-gray-800' : ''
                      }`}
                  >
                    <Edit3 className={`w-6 h-6 ${isDrawing ? 'text-blue-500' : 'text-gray-400'}`} />
                    <span className={`text-xs ${isDrawing ? 'text-blue-500' : 'text-gray-400'}`}>Draw</span>
                  </button>
                  <button
                    onClick={() => setShowMusicModal(true)}
                    className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg"
                  >
                    <Music className={`w-6 h-6 ${selectedMusic ? 'text-blue-500' : 'text-gray-400'}`} />
                    <span className={`text-xs ${selectedMusic ? 'text-blue-500' : 'text-gray-400'}`}>Music</span>
                  </button>
                  <button
                    onClick={() => setShowTextModal(true)}
                    className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg"
                  >
                    <Type className={`w-6 h-6 ${textOverlays.length > 0 ? 'text-blue-500' : 'text-gray-400'}`} />
                    <span className={`text-xs ${textOverlays.length > 0 ? 'text-blue-500' : 'text-gray-400'}`}>Text</span>
                  </button>
                  <button
                    onClick={() => setMobileStep("filters")}
                    className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg"
                  >
                    <Filter className={`w-6 h-6 ${selectedFilter !== "original" ? 'text-blue-500' : 'text-gray-400'}`} />
                    <span className={`text-xs ${selectedFilter !== "original" ? 'text-blue-500' : 'text-gray-400'}`}>Filter</span>
                  </button>
                  <button
                    onClick={() => setMobileStep("adjustments")}
                    className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg"
                  >
                    <Edit3 className={`w-6 h-6 ${Object.values(adjustments).some(v => v !== 0) ? 'text-blue-500' : 'text-gray-400'}`} />
                    <span className={`text-xs ${Object.values(adjustments).some(v => v !== 0) ? 'text-blue-500' : 'text-gray-400'}`}>Edit</span>
                  </button>
                </div>

                {/* Drawing Controls */}
                {isDrawing && (
                  <div className="border-t border-gray-800 px-4 py-3">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-xs text-gray-400 mb-1 block">Size</label>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          value={drawingSize}
                          onChange={(e) => setDrawingSize(parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      <div className="flex gap-2">
                        {['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'].map((color) => (
                          <button
                            key={color}
                            onClick={() => setDrawingColor(color)}
                            className={`w-8 h-8 rounded-full border-2 ${drawingColor === color ? 'border-white' : 'border-gray-600'
                              }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Mobile Step 3: Filters */}
          {mobileStep === "filters" && (croppedImage || imagePreview) && (
            <motion.div
              key="mobile-filters"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="h-full flex flex-col bg-black"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <button
                  onClick={() => setMobileStep("edit")}
                  className="text-white"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-base font-semibold text-white">Filter</h2>
                <button
                  onClick={() => setMobileStep("edit")}
                  className="text-blue-500 font-semibold"
                >
                  Done
                </button>
              </div>

              {/* Image Preview */}
              <div className="flex-1 bg-black flex items-center justify-center p-4 relative">
                <img
                  src={croppedImage || imagePreview}
                  alt="Filter preview"
                  className="max-w-full max-h-full object-contain"
                  style={getImageStyle()}
                />
                {getVignetteStyle() && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ ...getVignetteStyle(), zIndex: 20 }}
                  />
                )}
              </div>

              {/* Filter Scroll */}
              <div className="border-t border-gray-800 bg-black pb-4">
                <div className="overflow-x-auto px-4 py-3">
                  <div className="flex gap-3">
                    {filters.map((filter) => (
                      <button
                        key={filter.name}
                        onClick={() => setSelectedFilter(filter.name)}
                        className="flex flex-col items-center gap-2 flex-shrink-0"
                      >
                        <div
                          className={`w-20 h-20 rounded border-2 overflow-hidden ${selectedFilter === filter.name
                              ? "border-blue-500"
                              : "border-gray-700"
                            }`}
                        >
                          <img
                            src={croppedImage || imagePreview}
                            alt={filter.label}
                            className="w-full h-full object-cover"
                            style={{ filter: getFilterStyle(filter.name) }}
                          />
                        </div>
                        <span
                          className={`text-xs ${selectedFilter === filter.name
                              ? "text-blue-500 font-semibold"
                              : "text-gray-400"
                            }`}
                        >
                          {filter.label}
          </span>
        </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Mobile Step: Crop */}
          {mobileStep === "crop" && (croppedImage || imagePreview) && (
            <motion.div
              key="mobile-crop"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="h-full flex flex-col bg-black"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <button
                  onClick={() => setMobileStep("adjustments")}
                  className="text-white"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-base font-semibold text-white">Crop</h2>
                <button
                  onClick={handleMobileCropNext}
                  className="text-blue-500 font-semibold"
                >
                  Done
                </button>
        </div>

              {/* Crop Area */}
              <div className="flex-1 relative bg-black overflow-hidden flex items-center justify-center p-4">
                <div
                  ref={cropContainerRef}
                  className="relative w-full max-w-full max-h-full flex items-center justify-center"
                  style={{
                    width: `${cropBoxDims.width}px`,
                    height: `${cropBoxDims.height}px`,
                    maxWidth: "90vw",
                    maxHeight: "80vh"
                  }}
                >
                  {/* Grid Lines - constrained to crop area */}
                  <div className="absolute inset-0 pointer-events-none z-10">
                    <div className="absolute inset-0 border-2 border-white/50" />
                    <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
                    <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
                    <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
                    <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
                  </div>

                  {/* Image container - draggable */}
                  <div className="absolute inset-0 overflow-hidden cursor-move">
                    <img
                      ref={imageRef}
                      src={imagePreview || croppedImage}
                      alt="Crop"
                      className="absolute top-1/2 left-1/2 select-none"
                      draggable={false}
                      style={{
                        transform: `translate(-50%, -50%) scale(${cropData.zoom}) translate(${cropData.x / cropData.zoom}px, ${cropData.y / cropData.zoom}px)`,
                        cursor: isDraggingImage ? 'grabbing' : 'grab',
                        maxWidth: 'none',
                        height: '100%',
                        width: 'auto'
                      }}
                      onMouseDown={handleImageMouseDown}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        setIsDraggingImage(true);
                        setDragStart({
                          x: e.touches[0].clientX - cropData.x,
                          y: e.touches[0].clientY - cropData.y
                        });
                      }}
                      onLoad={(e) => setImageDimensions({
                        width: e.target.naturalWidth || imageDimensions.width,
                        height: e.target.naturalHeight || imageDimensions.height
                      })}
                      onTouchMove={(e) => {
                        if (isDraggingImage) {
                          e.preventDefault();
                          handleImageTouchMove(e);
                        }
                      }}
                      onTouchEnd={(e) => {
                        if (isDraggingImage) {
                          e.preventDefault();
                          handleImageTouchEnd();
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Crop Controls */}
              <div className="border-t border-gray-800 bg-black p-4">
                <div className="mb-4">
                  <label className="text-sm text-gray-400 mb-2 block">Aspect Ratio</label>
                  <div className="flex gap-2 overflow-x-auto">
                    {aspectRatios.map((ratio) => (
                      <button
                        key={ratio.value}
                        onClick={() => setAspectRatio(ratio.value)}
                        className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${aspectRatio === ratio.value
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-800 text-gray-300'
                          }`}
                      >
                        {ratio.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Zoom: {cropData.zoom.toFixed(2)}x</label>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={cropData.zoom}
                    onChange={(e) => setCropData({ ...cropData, zoom: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Mobile Step 4: Adjustments */}
          {mobileStep === "adjustments" && (croppedImage || imagePreview) && (
            <motion.div
              key="mobile-adjustments"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="h-full flex flex-col bg-black"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <button
                  onClick={() => {
                    setMobileStep("edit");
                    setActiveAdjustment(null);
                  }}
                  className="text-white"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-base font-semibold text-white">
                  {activeAdjustment ? activeAdjustment.charAt(0).toUpperCase() + activeAdjustment.slice(1) : "Edit"}
                </h2>
                <button
                  onClick={() => {
                    setMobileStep("edit");
                    setActiveAdjustment(null);
                  }}
                  className="text-blue-500 font-semibold"
                >
                  Done
                </button>
              </div>

              {/* Image Preview */}
              <div className="flex-1 bg-black flex items-center justify-center p-4 relative">
                <img
                  src={croppedImage || imagePreview}
                  alt="Edit preview"
                  className="max-w-full max-h-full object-contain"
                  style={getImageStyle()}
                />
                {getVignetteStyle() && (
                  <div
                    className="absolute inset-0 pointer-events-none z-20"
                    style={getVignetteStyle()}
                  />
                )}
              </div>

              {/* Adjustment Options */}
              {!activeAdjustment ? (
                <div className="border-t border-gray-800 bg-black">
                  <div className="grid grid-cols-4 gap-2 p-4">
                    <button
                      onClick={() => setMobileStep("crop")}
                      className="flex flex-col items-center gap-2 py-3 rounded-lg bg-gray-900"
                    >
                      <Crop className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-400">Crop</span>
                    </button>
                    <button
                      onClick={() => handleMobileAdjustmentSelect("brightness")}
                      className="flex flex-col items-center gap-2 py-3 rounded-lg bg-gray-900"
                    >
                      <Sun className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-400">Brightness</span>
                    </button>
                    <button
                      onClick={() => handleMobileAdjustmentSelect("contrast")}
                      className="flex flex-col items-center gap-2 py-3 rounded-lg bg-gray-900"
                    >
                      <Contrast className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-400">Contrast</span>
                    </button>
                    <button
                      onClick={() => handleMobileAdjustmentSelect("saturation")}
                      className="flex flex-col items-center gap-2 py-3 rounded-lg bg-gray-900"
                    >
                      <Droplet className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-400">Saturation</span>
                    </button>
                    <button
                      onClick={() => handleMobileAdjustmentSelect("temperature")}
                      className="flex flex-col items-center gap-2 py-3 rounded-lg bg-gray-900"
                    >
                      <Thermometer className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-400">Temperature</span>
                    </button>
                    <button
                      onClick={() => handleMobileAdjustmentSelect("fade")}
                      className="flex flex-col items-center gap-2 py-3 rounded-lg bg-gray-900"
                    >
                      <Circle className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-400">Fade</span>
                    </button>
                    <button
                      onClick={() => handleMobileAdjustmentSelect("vignette")}
                      className="flex flex-col items-center gap-2 py-3 rounded-lg bg-gray-900"
                    >
                      <Circle className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-400">Vignette</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-gray-800 bg-black px-4 py-6">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold capitalize">{activeAdjustment}</span>
                      <span className="text-gray-400">{adjustments[activeAdjustment]}</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={adjustments[activeAdjustment]}
                      onChange={(e) =>
                        setAdjustments({
                          ...adjustments,
                          [activeAdjustment]: parseInt(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Mobile Step 5: Final */}
          {mobileStep === "final" && (croppedImage || imagePreview) && (
            <motion.div
              key="mobile-final"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="h-full flex flex-col bg-black"
              style={{ overflow: 'visible' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <button
                  onClick={() => setMobileStep("edit")}
                  className="text-white"
                  disabled={isUploading}
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex flex-col items-center">
                  <h2 className="text-base font-semibold text-white">New post</h2>
                  {uploadError && (
                    <p className="text-xs text-red-500 mt-1">{uploadError}</p>
                  )}
                </div>
                <button
                  onClick={handleShare}
                  disabled={isUploading}
                  className="text-blue-500 font-semibold disabled:text-gray-600 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Sharing...' : 'Share'}
                </button>
              </div>

              {/* Image Preview */}
              <div className="w-full aspect-square bg-black flex items-center justify-center relative z-0">
                <img
                  src={finalEditedImage || croppedImage || imagePreview}
                  alt="Post preview"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Options */}
              <div className="flex-1 bg-black relative" style={{ overflowY: 'auto', overflowX: 'visible' }}>
                {/* Caption */}
                <div className="px-4 py-3 border-b border-gray-800 relative" style={{ overflow: 'visible' }}>
                  <textarea
                    placeholder="Add a caption..."
                    value={caption}
                    onChange={handleCaptionChange}
                    className="w-full resize-none outline-none text-sm text-white placeholder-gray-500 bg-transparent"
                    rows={4}
                    maxLength={2200}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <div className="relative" ref={emojiPickerRef} style={{ overflow: 'visible', zIndex: 200 }}>
                      <Smile
                        className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-300"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      />
                      <AnimatePresence>
                        {showEmojiPicker && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute bottom-full left-0 mb-2"
                            style={{
                              zIndex: 200,
                              position: 'absolute',
                              maxHeight: '70vh',
                              maxWidth: '90vw'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="rounded-lg shadow-2xl overflow-hidden bg-[#1a1a1a]">
                              <EmojiPickerReact
                                onEmojiClick={(emojiData) => {
                                  handleEmojiSelect(emojiData.emoji);
                                  setShowEmojiPicker(false);
                                }}
                                theme="dark"
                                width={Math.min(350, typeof window !== 'undefined' ? window.innerWidth * 0.9 : 350)}
                                height={Math.min(400, typeof window !== 'undefined' ? window.innerHeight * 0.7 : 400)}
                                previewConfig={{ showPreview: false }}
                                skinTonesDisabled
                                searchDisabled={false}
                                lazyLoadEmojis={true}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <span className={`text-xs ${caption.length >= 2200 ? 'text-red-400' : 'text-gray-400'}`}>
                      {caption.length}/2,200
                    </span>
                  </div>
                </div>

                {/* Category Selection - Available for all posts */}
                <div className="px-4 py-3 border-b border-gray-800">
                  <label className="text-sm text-gray-400 mb-2 block">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                  >
                    <option value="general">General</option>
                    <option value="fashion">Fashion</option>
                    <option value="food">Food & Drink</option>
                    <option value="travel">Travel</option>
                    <option value="fitness">Fitness & Health</option>
                    <option value="tech">Technology</option>
                    <option value="art">Art & Design</option>
                    <option value="music">Music</option>
                    <option value="gaming">Gaming</option>
                    <option value="education">Education</option>
                    <option value="business">Business</option>
                    <option value="lifestyle">Lifestyle</option>
                  </select>
                </div>

                {/* Add Audio */}
                <button
                  onClick={() => setShowMusicModal(true)}
                  className="w-full px-4 py-3 border-b border-gray-800 flex items-center justify-between hover:bg-gray-900"
                >
                  <div className="flex items-center gap-3">
                    <Music className="w-5 h-5 text-white" />
                    <span className="text-sm text-white">Add audio</span>
                  </div>
                  {selectedMusic && (
                    <div className="flex items-center gap-2">
                      <img src={selectedMusic.thumbnail} alt={selectedMusic.title} className="w-8 h-8 rounded" />
                      <span className="text-xs text-gray-400">{selectedMusic.title}</span>
                    </div>
                  )}
                </button>

                {/* Tag People */}
                <button
                  onClick={() => setShowTagPeopleModal(true)}
                  className="w-full px-4 py-3 border-b border-gray-800 flex items-center justify-between hover:bg-gray-900"
                >
                  <div className="flex items-center gap-3">
                    <UserPlus className="w-5 h-5 text-white" />
                    <span className="text-sm text-white">Tag people</span>
                  </div>
                </button>

                {/* Add Location */}
                <button
                  onClick={() => setShowLocationModal(true)}
                  className="w-full px-4 py-3 border-b border-gray-800 flex items-center justify-between hover:bg-gray-900"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-white" />
                    <span className="text-sm text-white">{location || "Add location"}</span>
                  </div>
                </button>

                {/* Advanced Settings */}
                <div className="border-b border-gray-800">
                  <button
                    onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-900"
                  >
                    <span className="text-sm text-white">Advanced Settings</span>
                    {showAdvancedSettings ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {showAdvancedSettings && (
                    <div className="px-4 pb-4 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-white">Hide like and view counts</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={hideLikeCounts}
                              onChange={(e) => setHideLikeCounts(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
        </label>
      </div>
    </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-white">Turn off commenting</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={turnOffCommenting}
                              onChange={(e) => setTurnOffCommenting(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Music Modal */}
        <AnimatePresence>
          {showMusicModal && (
            <>
              <div
                className="absolute inset-0 bg-black/60 z-[110]"
                onClick={() => setShowMusicModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="absolute bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-gray-800 rounded-t-lg z-[111] max-h-[60vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                  <h2 className="text-base font-semibold text-white">Add audio</h2>
                  <button
                    onClick={() => setShowMusicModal(false)}
                    className="text-gray-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-2">
                    {musicTracks.map((track) => (
                      <button
                        key={track.id}
                        onClick={() => {
                          setSelectedMusic(track);
                          setShowMusicModal(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        <img src={track.thumbnail} alt={track.title} className="w-12 h-12 rounded" />
                        <div className="flex-1 text-left">
                          <p className="text-sm text-white font-medium">{track.title}</p>
                          <p className="text-xs text-gray-400">{track.artist}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile Text Modal */}
        <AnimatePresence>
          {showTextModal && (
            <>
              <div
                className="absolute inset-0 bg-black/60 z-[110]"
                onClick={() => setShowTextModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="absolute bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-gray-800 rounded-t-lg z-[111] max-h-[40vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                  <h2 className="text-base font-semibold text-white">Add text</h2>
                  <button
                    onClick={() => setShowTextModal(false)}
                    className="text-gray-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4">
                  <input
                    type="text"
                    placeholder="Tap to add text"
                    className="w-full px-4 py-3 bg-[#0f0f0f] border border-gray-700 rounded-lg text-white placeholder-gray-500 outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        setTextOverlays([...textOverlays, {
                          id: Date.now(),
                          text: e.target.value,
                          x: 50,
                          y: 50
                        }]);
                        e.target.value = '';
                        setShowTextModal(false);
                      }
                    }}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile Tag People Modal */}
        <AnimatePresence>
          {showTagPeopleModal && (
            <>
              <div
                className="absolute inset-0 bg-black/60 z-[110]"
                onClick={() => setShowTagPeopleModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="absolute bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-gray-800 rounded-t-lg z-[111] max-h-[60vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                  <h2 className="text-base font-semibold text-white">Tag people</h2>
                  <button
                    onClick={() => setShowTagPeopleModal(false)}
                    className="text-gray-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <input
                    type="text"
                    placeholder="Search for people..."
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg mb-4 outline-none focus:border-blue-500 text-white placeholder-gray-500"
                  />
                  {taggedPeople.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <p className="text-sm font-semibold text-white">Tagged:</p>
                      {taggedPeople.map((tag, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-[#0f0f0f] rounded"
                        >
                          <div className="flex items-center gap-2">
                            {(tag.avatar || tag.profilePhoto) && (
                              <img src={tag.avatar || tag.profilePhoto} alt="" className="w-6 h-6 rounded-full" />
                            )}
                            <span className="text-sm text-white">{tag.username || tag}</span>
                          </div>
                          <button
                            onClick={() =>
                              setTaggedPeople(taggedPeople.filter((_, i) => i !== index))
                            }
                            className="text-red-400 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Following Users List */}
                  {loadingFollowing ? (
                    <div className="text-center py-4 text-gray-400">Loading...</div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-white mb-2">Following:</p>
                      {followingUsers
                        .filter(user => {
                          const searchLower = tagSearch.toLowerCase();
                          const username = user.username?.toLowerCase() || '';
                          const displayName = user.displayName?.toLowerCase() || '';
                          return username.includes(searchLower) || displayName.includes(searchLower);
                        })
                        .map((user, index) => {
                          const isTagged = taggedPeople.some(t => 
                            (typeof t === 'object' && t.username === user.username) || 
                            (typeof t === 'string' && t === user.username)
                          );
                          return (
                            <button
                              key={user.uid || user.id || index}
                              onClick={() => {
                                if (!isTagged) {
                                  setTaggedPeople([...taggedPeople, user]);
                                }
                              }}
                              disabled={isTagged}
                              className={`w-full flex items-center justify-between p-2 rounded hover:bg-[#2a2a2a] transition-colors ${
                                isTagged ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <img 
                                  src={user.profilePhoto || user.avatar || '/default-avatar.png'} 
                                  alt={user.username}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                                <div className="text-left">
                                  <p className="text-sm text-white">{user.username}</p>
                                  {user.displayName && (
                                    <p className="text-xs text-gray-400">{user.displayName}</p>
                                  )}
                                </div>
                              </div>
                              {isTagged && (
                                <span className="text-xs text-gray-400">Tagged</span>
                              )}
                            </button>
                          );
                        })}
                      {followingUsers.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-4">
                          No following users found
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile Location Modal */}
        <AnimatePresence>
          {showLocationModal && (
            <>
              <div
                className="absolute inset-0 bg-black/60 z-[110]"
                onClick={() => {
                  setShowLocationModal(false);
                  setLocationSearch("");
                }}
              />
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="absolute bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-gray-800 rounded-t-lg z-[111] max-h-[50vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                  <h2 className="text-base font-semibold text-white">Add location</h2>
                  <button
                    onClick={() => {
                      setShowLocationModal(false);
                      setLocationSearch("");
                    }}
                    className="text-gray-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <input
                    type="text"
                    placeholder="Search for a location..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg mb-4 outline-none focus:border-blue-500 text-white placeholder-gray-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (locationSearch.trim()) {
                          setLocation(locationSearch.trim());
                        }
                        setShowLocationModal(false);
                        setLocationSearch("");
                      }}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Done
                    </button>
                    {location && (
                      <button
                        onClick={() => {
                          setLocation("");
                          setLocationSearch("");
                        }}
                        className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
}