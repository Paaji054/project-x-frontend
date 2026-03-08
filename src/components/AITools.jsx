import { useState, useEffect } from 'react';
import { aiService, userService } from '../services';
import { FiImage, FiMessageSquare, FiUser, FiGrid, FiCircle, FiZap } from 'react-icons/fi';

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
      setCreditCosts(costs);
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
    } catch (err) {
      alert('Failed to generate image: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCaption = async () => {
    if (!captionImageUrl) return;
    
    try {
      setLoading(true);
      const data = await aiService.generateCaption(captionImageUrl, captionContext);
      setResult({ type: 'caption', data });
      await loadInitialData();
    } catch (err) {
      alert('Failed to generate caption: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBio = async () => {
    if (!bioDescription) return;
    
    try {
      setLoading(true);
      const data = await aiService.generateBio(bioDescription);
      setResult({ type: 'bio', data });
      await loadInitialData();
    } catch (err) {
      alert('Failed to generate bio: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTheme = async () => {
    if (!themePrompt) return;
    
    try {
      setLoading(true);
      const data = await aiService.generateTheme({ prompt: themePrompt });
      setResult({ type: 'theme', data });
      await loadInitialData();
    } catch (err) {
      alert('Failed to generate theme: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAvatar = async () => {
    if (!avatarConfig.description) return;
    
    try {
      setLoading(true);
      const data = await aiService.generateAvatar(avatarConfig);
      setResult({ type: 'avatar', data });
      await loadInitialData();
    } catch (err) {
      alert('Failed to generate avatar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCommunityIcon = async () => {
    if (!communityName) return;
    
    try {
      setLoading(true);
      const data = await aiService.generateCommunityIcon(communityName, communityDescription);
      setResult({ type: 'communityIcon', data });
      await loadInitialData();
    } catch (err) {
      alert('Failed to generate community icon: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <FiZap className="mr-3 text-yellow-500" />
            AI Tools
          </h1>
          <div className="bg-white dark:bg-gray-800 px-6 py-3 rounded-lg shadow-md">
            <p className="text-sm text-gray-500 dark:text-gray-400">Available Credits</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {userCredits.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto mb-6 space-x-2 bg-white dark:bg-gray-800 p-2 rounded-lg">
          <TabButton active={activeTab === 'image'} onClick={() => setActiveTab('image')} icon={<FiImage />}>
            Image Generation
          </TabButton>
          <TabButton active={activeTab === 'caption'} onClick={() => setActiveTab('caption')} icon={<FiMessageSquare />}>
            Caption
          </TabButton>
          <TabButton active={activeTab === 'bio'} onClick={() => setActiveTab('bio')} icon={<FiUser />}>
            Bio
          </TabButton>
          <TabButton active={activeTab === 'theme'} onClick={() => setActiveTab('theme')} icon={<FiGrid />}>
            Theme
          </TabButton>
          <TabButton active={activeTab === 'avatar'} onClick={() => setActiveTab('avatar')} icon={<FiCircle />}>
            Avatar
          </TabButton>
          <TabButton active={activeTab === 'community'} onClick={() => setActiveTab('community')} icon={<FiCircle />}>
            Community Icon
          </TabButton>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {activeTab === 'image' && 'Generate Image'}
              {activeTab === 'caption' && 'Generate Caption'}
              {activeTab === 'bio' && 'Generate Bio'}
              {activeTab === 'theme' && 'Generate Theme'}
              {activeTab === 'avatar' && 'Generate Avatar'}
              {activeTab === 'community' && 'Generate Community Icon'}
            </h2>

            {activeTab === 'image' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Image Prompt
                  </label>
                  <textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="1:1">1:1</option>
                      <option value="4:5">4:5</option>
                      <option value="16:9">16:9</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleGenerateImage}
                  disabled={loading || !imagePrompt.trim()}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Generating...' : `Generate (${creditCosts.generateImage ?? 0} credits)`}
                </button>
              </div>
            )}

            {activeTab === 'caption' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={captionImageUrl}
                    onChange={(e) => setCaptionImageUrl(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Context (Optional)
                  </label>
                  <input
                    type="text"
                    value={captionContext}
                    onChange={(e) => setCaptionContext(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Add context for better captions"
                  />
                </div>
                <button
                  onClick={handleGenerateCaption}
                  disabled={loading || !captionImageUrl}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Generating...' : `Generate (${creditCosts.generateCaption || 0} credits)`}
                </button>
              </div>
            )}

            {activeTab === 'bio' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Describe Yourself
                  </label>
                  <textarea
                    value={bioDescription}
                    onChange={(e) => setBioDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows="4"
                    placeholder="Tell us about yourself, your interests, profession..."
                  />
                </div>
                <button
                  onClick={handleGenerateBio}
                  disabled={loading || !bioDescription}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Generating...' : `Generate (${creditCosts.generateBio || 0} credits)`}
                </button>
              </div>
            )}

            {activeTab === 'theme' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Theme Description
                  </label>
                  <textarea
                    value={themePrompt}
                    onChange={(e) => setThemePrompt(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows="4"
                    placeholder="Describe the theme you want (e.g., dark ocean, sunset vibes)..."
                  />
                </div>
                <button
                  onClick={handleGenerateTheme}
                  disabled={loading || !themePrompt}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Generating...' : `Generate (${creditCosts.generateTheme || 0} credits)`}
                </button>
              </div>
            )}

            {activeTab === 'avatar' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Avatar Style
                  </label>
                  <select
                    value={avatarConfig.style}
                    onChange={(e) => setAvatarConfig({ ...avatarConfig, style: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="realistic">Realistic</option>
                    <option value="cartoon">Cartoon</option>
                    <option value="anime">Anime</option>
                    <option value="abstract">Abstract</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={avatarConfig.description}
                    onChange={(e) => setAvatarConfig({ ...avatarConfig, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows="3"
                    placeholder="Describe your desired avatar..."
                  />
                </div>
                <button
                  onClick={handleGenerateAvatar}
                  disabled={loading || !avatarConfig.description}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Generating...' : `Generate (${creditCosts.generateAvatar || 0} credits)`}
                </button>
              </div>
            )}

            {activeTab === 'community' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Community Name
                  </label>
                  <input
                    type="text"
                    value={communityName}
                    onChange={(e) => setCommunityName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter community name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={communityDescription}
                    onChange={(e) => setCommunityDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows="3"
                    placeholder="Describe your community..."
                  />
                </div>
                <button
                  onClick={handleGenerateCommunityIcon}
                  disabled={loading || !communityName}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Generating...' : `Generate (${creditCosts.generateCommunityIcon || 0} credits)`}
                </button>
              </div>
            )}
          </div>

          {/* Result Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Result</h2>
            {result ? (
              <div className="space-y-4">
                {(result.type === 'image' || result.type === 'avatar' || result.type === 'communityIcon') && (result.data?.imageUrl || result.data?.avatarUrl || result.data?.iconUrl || result.data?.url) && (
                  <div className="space-y-2">
                    <img
                      src={result.data.imageUrl || result.data.avatarUrl || result.data.iconUrl || result.data.url}
                      alt="Generated"
                      className="w-full rounded-lg max-h-[480px] object-contain bg-gray-100 dark:bg-gray-700"
                    />
                    {(result.data.creditsUsed != null || result.data.remainingCredits != null) && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Used {result.data.creditsUsed ?? 0} credits · {result.data.remainingCredits ?? 0} remaining
                      </p>
                    )}
                  </div>
                )}
                {(result.type === 'caption' || result.type === 'bio') && (result.data?.caption ?? result.data?.bio ?? result.data?.text) && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                      {result.data.caption ?? result.data.bio ?? result.data.text}
                    </p>
                  </div>
                )}
                {result.type === 'theme' && result.data?.theme && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
                    {Object.entries(result.data.theme).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">{key}:</span>
                        <span className="font-mono text-gray-900 dark:text-white">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-600">
                Your generated content will appear here
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
      active
        ? 'bg-blue-600 text-white'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`}
  >
    <span className="mr-2">{icon}</span>
    {children}
  </button>
);

export default AITools;
