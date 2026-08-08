import { useState, useEffect } from 'react';
import { analyticsService } from '../services';
import { FiTrendingUp, FiHeart, FiMessageCircle, FiEye, FiUsers } from 'react-icons/fi';

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsData, engagementData] = await Promise.all([
        analyticsService.getUserAnalytics(),
        analyticsService.getEngagementMetrics()
      ]);
      setAnalytics(analyticsData?.analytics || analyticsData);
      setEngagement(engagementData);
    } catch (err) {
      setError('Failed to load analytics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400 text-xl mb-4">{error}</p>
          <button
            onClick={loadAnalytics}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Analytics Dashboard
        </h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<FiEye className="w-6 h-6" />}
            title="Total Posts"
            value={analytics?.posts?.total || 0}
            trend=""
            color="blue"
          />
          <StatCard
            icon={<FiHeart className="w-6 h-6" />}
            title="Total Likes"
            value={analytics?.posts?.totalLikes || 0}
            trend={`Avg: ${analytics?.posts?.averageLikes || 0}`}
            color="red"
          />
          <StatCard
            icon={<FiMessageCircle className="w-6 h-6" />}
            title="Total Comments"
            value={analytics?.posts?.totalComments || 0}
            trend=""
            color="green"
          />
          <StatCard
            icon={<FiTrendingUp className="w-6 h-6" />}
            title="Total Shares"
            value={analytics?.posts?.totalShares || 0}
            trend=""
            color="purple"
          />
        </div>

        {/* Engagement Metrics */}
        {engagement?.metrics && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <FiTrendingUp className="mr-2" />
              Engagement Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <MetricItem
                label="Posts Created"
                value={engagement.metrics.postsCreated || 0}
              />
              <MetricItem
                label="Total Engagement"
                value={engagement.metrics.totalEngagement || 0}
              />
              <MetricItem
                label="Best Post Engagement"
                value={engagement.metrics.bestPost?.engagement || 0}
              />
            </div>
            {engagement.metrics.bestPost && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Best Post Metrics</h3>
                <div className="flex gap-4 items-start p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  {engagement.metrics.bestPost.imageUrl ? (
                    <img
                      src={engagement.metrics.bestPost.imageUrl}
                      alt="Best post"
                      className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-500 p-2 text-center flex-shrink-0">
                      {(engagement.metrics.bestPost.caption || 'Untitled').slice(0, 40)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white line-clamp-2">
                      {engagement.metrics.bestPost.caption?.trim() || 'Untitled post'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {engagement.metrics.bestPost.likesCount || 0} likes ·{' '}
                      {engagement.metrics.bestPost.commentsCount || 0} comments ·{' '}
                      {engagement.metrics.bestPost.sharesCount || 0} shares
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Activity */}
        {analytics?.recentActivity && analytics.recentActivity.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h2>
            <div className="space-y-3">
              {analytics.recentActivity.map((activity, index) => (
                <ActivityItem key={index} activity={activity} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, trend, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300',
    red: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300',
    green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300',
    purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className={`inline-flex p-3 rounded-lg ${colorClasses[color]} mb-4`}>
        {icon}
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {value.toLocaleString()}
      </p>
      {trend && (
        <p className="text-green-500 text-sm mt-2">
          {trend} from last month
        </p>
      )}
    </div>
  );
};

const MetricItem = ({ label, value }) => (
  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
    <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{label}</p>
    <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
  </div>
);

const ActivityItem = ({ activity }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
    <div>
      <p className="text-gray-900 dark:text-white font-medium">{activity.type}</p>
      <p className="text-gray-500 dark:text-gray-400 text-sm">{activity.description}</p>
    </div>
    <p className="text-gray-500 dark:text-gray-400 text-sm">
      {new Date(activity.createdAt).toLocaleDateString()}
    </p>
  </div>
);

export default AnalyticsDashboard;
