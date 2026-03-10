import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiService, userService } from '../services';
import { FiImage, FiMessageSquare, FiUser, FiGrid, FiCircle, FiZap, FiCopy } from 'react-icons/fi';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AITools = () => {
  const [loading, setLoading] = useState(false);
  const [creditCosts, setCreditCosts] = useState({});
  const [userCredits, setUserCredits] = useState(0);
  const [activeTab, setActiveTab] = useState('image');
  const [result, setResult] = useState(null);

  // Form states
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageStyle, setImageStyle] = useState('realistic');
  const [imageRatio, setImageRatio] = useState('1:1');
  const [captionImageUrl, setCaptionImageUrl] = useState('');
  const [captionContext, setCaptionContext] = useState('');
  const [bioDescription, setBioDescription] = useState('');
  const [themePrompt, setThemePrompt] = useState('');
  const [avatarConfig, setAvatarConfig] = useState({ style: 'realistic', description: '' });
  const [communityName, setCommunityName] = useState('');
  const [communityDescription, setCommunityDescription] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [costs, balance] = await Promise.all([
        aiService.getCreditCosts(),
        userService.getCreditsBalance()
      ]);
      setCreditCosts(costs?.costs || costs || {});
      setUserCredits(balance.credits || 0);
    } catch (err) {
      console.error('Failed to load AI tools data:', err);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    try {
      setLoading(true);
      setResult(null);
      const data = await aiService.generateImage(imagePrompt.trim(), {
        style: imageStyle,
        ratio: imageRatio,
      });
      setResult({ type: 'image', data });
      await loadInitialData();
      toast.success('Image generated!');
    } catch (err) {
      toast.error(err.message || 'Failed to generate image');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCaption = async () => {
    if (!captionImageUrl && !captionContext) return;
    try {
      setLoading(true);
      const data = await aiService.generateCaption(captionImageUrl || undefined, captionContext);
      setResult({ type: 'caption', data });
      await loadInitialData();
      toast.success('Caption generated!');
    } catch (err) {
      toast.error(err.message || 'Failed to generate caption');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBio = async () => {
    if (!bioDescription) return;
    try {
      setLoading(true);
      const interests = bioDescription.split(/[,.]/).map(s => s.trim()).filter(Boolean);
      const data = await aiService.generateBio(interests, 'casual');
      setResult({ type: 'bio', data });
      await loadInitialData();
      toast.success('Bio generated!');
    } catch (err) {
      toast.error(err.message || 'Failed to generate bio');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTheme = async () => {
    if (!themePrompt) return;
    try {
      setLoading(true);
      const data = await aiService.generateTheme(themePrompt);
      setResult({ type: 'theme', data });
      await loadInitialData();
      toast.success('Theme generated!');
    } catch (err) {
      toast.error(err.message || 'Failed to generate theme');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAvatar = async () => {
    if (!avatarConfig.description) return;
    try {
      setLoading(true);
      const data = await aiService.generateAvatar(avatarConfig.description);
      setResult({ type: 'avatar', data });
      await loadInitialData();
      toast.success('Avatar generated!');
    } catch (err) {
      toast.error(err.message || 'Failed to generate avatar');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCommunityIcon = async () => {
    if (!communityName || !communityDescription || communityDescription.length < 3) {
      toast.error('Community name and description (min 3 chars) are required');
      return;
    }
    try {
      setLoading(true);
      const data = await aiService.generateCommunityIcon(communityName, communityDescription);
      setResult({ type: 'communityIcon', data });
      await loadInitialData();
      toast.success('Community icon generated!');
    } catch (err) {
      toast.error(err.message || 'Failed to generate community icon');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'image', label: 'Image', icon: <FiImage /> },
    { key: 'caption', label: 'Caption', icon: <FiMessageSquare /> },
    { key: 'bio', label: 'Bio', icon: <FiUser /> },
    { key: 'theme', label: 'Theme', icon: <FiGrid /> },
    { key: 'avatar', label: 'Avatar', icon: <FiCircle /> },
    { key: 'community', label: 'Community', icon: <FiCircle /> },
  ];

  const costMap = {
    image: creditCosts.AI_IMAGE,
    caption: creditCosts.AI_CAPTION,
    bio: creditCosts.AI_BIO,
    theme: creditCosts.AI_THEME,
    avatar: creditCosts.AI_AVATAR,
    community: creditCosts.AI_COMMUNITY_ICON,
  };

  const getResultContent = () => {
    if (!result) return null;
    const { type, data } = result;

    if (type === 'image' && data?.imageUrl) {
      return <img src={data.imageUrl} alt="Generated" className="w-full rounded-xl" />;
    }
    if (type === 'avatar' && data?.avatarUrl) {
      return <img src={data.avatarUrl} alt="Avatar" className="w-full rounded-xl" />;
    }
    if (type === 'communityIcon' && data?.iconUrl) {
      return <img src={data.iconUrl} alt="Community Icon" className="w-full rounded-xl" />;
    }
    if (type === 'caption' && data?.caption) {
      return (
        <div className="p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-gray-700">
          <p className="text-black dark:text-white whitespace-pre-wrap leading-relaxed">{data.caption}</p>
          <button
            onClick={() => { navigator.clipboard.writeText(data.caption); toast.success('Copied!'); }}
            className="mt-3 flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            <FiCopy className="w-4 h-4" /> Copy
          </button>
        </div>
      );
    }
    if (type === 'bio' && data?.bio) {
      return (
        <div className="p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-gray-700">
          <p className="text-black dark:text-white whitespace-pre-wrap leading-relaxed">{data.bio}</p>
          <button
            onClick={() => { navigator.clipboard.writeText(data.bio); toast.success('Copied!'); }}
            className="mt-3 flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            <FiCopy className="w-4 h-4" /> Copy
          </button>
        </div>
      );
    }
    if (type === 'theme' && data?.theme) {
      return (
        <div className="space-y-3">
          {Object.entries(data.theme).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400 text-sm capitalize">{key}</span>
              <div className="flex items-center gap-2">
                {typeof value === 'string' && value.startsWith('#') && (
                  <div className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600" style={{ backgroundColor: value }} />
                )}
                <span className="font-mono text-sm text-black dark:text-white">{value}</span>
              </div>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const inputClass = "w-full px-4 py-3 border border-black/20 dark:border-gray-700 rounded-xl bg-white dark:bg-black/50 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-red-500 dark:focus:border-red-500 transition-colors";

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-black dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-red-600 via-red-700 to-red-800">
              <FiZap className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            AI Tools
          </h1>
          <div className="px-4 py-2 md:px-6 md:py-3 rounded-2xl bg-[#fffcfa] dark:bg-[#0f0f0f] border border-black/10 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">Credits</p>
            <p className="text-lg md:text-xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
              {userCredits.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto mb-6 gap-2 p-1.5 rounded-2xl bg-[#fffcfa] dark:bg-[#0f0f0f] border border-black/10 dark:border-gray-800 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setResult(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white shadow-lg shadow-red-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Input Panel */}
          <div className="rounded-2xl bg-[#fffcfa] dark:bg-[#0f0f0f] border border-black/10 dark:border-gray-800 p-5 md:p-6">
            <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
              {activeTab === 'image' && 'Generate Image'}
              {activeTab === 'caption' && 'Generate Caption'}
              {activeTab === 'bio' && 'Generate Bio'}
              {activeTab === 'theme' && 'Generate Theme'}
              {activeTab === 'avatar' && 'Generate Avatar'}
              {activeTab === 'community' && 'Generate Community Icon'}
            </h2>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'image' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Image Prompt</label>
                      <textarea
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        className={`${inputClass} resize-none`}
                        rows="4"
                        placeholder="Describe the image you want to generate..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Style</label>
                        <select
                          value={imageStyle}
                          onChange={(e) => setImageStyle(e.target.value)}
                          className={inputClass}
                        >
                          <option value="realistic">Realistic</option>
                          <option value="art">Art</option>
                          <option value="anime">Anime</option>
                          <option value="3d">3D</option>
                          <option value="abstract">Abstract</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ratio</label>
                        <select
                          value={imageRatio}
                          onChange={(e) => setImageRatio(e.target.value)}
                          className={inputClass}
                        >
                          <option value="1:1">1:1</option>
                          <option value="4:5">4:5</option>
                          <option value="16:9">16:9</option>
                        </select>
                      </div>
                    </div>
                    <ActionButton onClick={handleGenerateImage} loading={loading} disabled={!imagePrompt.trim()} cost={costMap.image} />
                  </div>
                )}

                {activeTab === 'caption' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Image URL</label>
                      <input
                        type="url"
                        value={captionImageUrl}
                        onChange={(e) => setCaptionImageUrl(e.target.value)}
                        className={inputClass}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Context <span className="text-gray-400">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={captionContext}
                        onChange={(e) => setCaptionContext(e.target.value)}
                        className={inputClass}
                        placeholder="Add context for better captions"
                      />
                    </div>
                    <ActionButton onClick={handleGenerateCaption} loading={loading} disabled={!captionImageUrl && !captionContext} cost={costMap.caption} />
                  </div>
                )}

                {activeTab === 'bio' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Describe Yourself</label>
                      <textarea
                        value={bioDescription}
                        onChange={(e) => setBioDescription(e.target.value)}
                        className={`${inputClass} resize-none`}
                        rows="4"
                        placeholder="Tell us about yourself, your interests, profession..."
                      />
                    </div>
                    <ActionButton onClick={handleGenerateBio} loading={loading} disabled={!bioDescription} cost={costMap.bio} />
                  </div>
                )}

                {activeTab === 'theme' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme Description</label>
                      <textarea
                        value={themePrompt}
                        onChange={(e) => setThemePrompt(e.target.value)}
                        className={`${inputClass} resize-none`}
                        rows="4"
                        placeholder="Describe the theme you want (e.g., dark ocean, sunset vibes)..."
                      />
                    </div>
                    <ActionButton onClick={handleGenerateTheme} loading={loading} disabled={!themePrompt} cost={costMap.theme} />
                  </div>
                )}

                {activeTab === 'avatar' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Avatar Style</label>
                      <select
                        value={avatarConfig.style}
                        onChange={(e) => setAvatarConfig({ ...avatarConfig, style: e.target.value })}
                        className={inputClass}
                      >
                        <option value="realistic">Realistic</option>
                        <option value="cartoon">Cartoon</option>
                        <option value="anime">Anime</option>
                        <option value="abstract">Abstract</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                      <textarea
                        value={avatarConfig.description}
                        onChange={(e) => setAvatarConfig({ ...avatarConfig, description: e.target.value })}
                        className={`${inputClass} resize-none`}
                        rows="3"
                        placeholder="Describe your desired avatar..."
                      />
                    </div>
                    <ActionButton onClick={handleGenerateAvatar} loading={loading} disabled={!avatarConfig.description} cost={costMap.avatar} />
                  </div>
                )}

                {activeTab === 'community' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Community Name</label>
                      <input
                        type="text"
                        value={communityName}
                        onChange={(e) => setCommunityName(e.target.value)}
                        className={inputClass}
                        placeholder="Enter community name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                      <textarea
                        value={communityDescription}
                        onChange={(e) => setCommunityDescription(e.target.value)}
                        className={`${inputClass} resize-none`}
                        rows="3"
                        placeholder="Describe your community (min 3 characters)..."
                      />
                    </div>
                    <ActionButton onClick={handleGenerateCommunityIcon} loading={loading} disabled={!communityName || !communityDescription || communityDescription.length < 3} cost={costMap.community} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Result Panel */}
          <div className="rounded-2xl bg-[#fffcfa] dark:bg-[#0f0f0f] border border-black/10 dark:border-gray-800 p-5 md:p-6">
            <h2 className="text-lg font-semibold text-black dark:text-white mb-4">Result</h2>
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Generating...</p>
              </div>
            ) : getResultContent() ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                {getResultContent()}
                {result?.data?.creditsUsed != null && (
                  <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
                    {result.data.creditsUsed} credits used &middot; {result.data.remainingCredits?.toLocaleString()} remaining
                  </p>
                )}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-600">
                <FiZap className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">Your generated content will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({ onClick, loading, disabled, cost }) => (
  <button
    onClick={onClick}
    disabled={loading || disabled}
    className="w-full px-6 py-3 bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
  >
    {loading ? (
      <>
        <Loader2 className="w-4 h-4 animate-spin" />
        Generating...
      </>
    ) : (
      `Generate${cost ? ` (${cost} credits)` : ''}`
    )}
  </button>
);

export default AITools;
