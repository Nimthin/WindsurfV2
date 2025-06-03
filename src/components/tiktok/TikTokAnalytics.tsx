import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bar, Doughnut } from 'react-chartjs-2';
import * as FaIcons from 'react-icons/fa';
import { useSocialData } from '../../context/SocialDataContext';
import { formatNumber } from '../../utils/chartUtils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Brand, TikTokPost } from '../../types';
import { extractTikTokHashtags, generateTikTokEngagementRateChart } from '../../utils/chartUtils';
import { format } from 'date-fns';

// Helper function to validate dates
const isValidDate = (date: Date) => !isNaN(date.getTime());

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const TikTokAnalytics: React.FC = () => {
  const { socialData, isLoading, selectedBrands, darkMode } = useSocialData();
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(selectedBrands[0] || null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  // Chart options with dark mode support
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: darkMode ? 'white' : 'black',
        },
      },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        titleColor: darkMode ? 'white' : 'black',
        bodyColor: darkMode ? 'white' : 'black',
        borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: {
          color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        ticks: {
          color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  // Generate views, likes, shares chart
  const generateEngagementChart = () => {
    const filteredBrands = selectedBrands.filter(brand => socialData.tiktok[brand] !== null);
    
    const labels = filteredBrands;
    const viewsData = filteredBrands.map(brand => {
      const data = socialData.tiktok[brand];
      if (!data) return 0;
      
      const totalViews = data.posts.reduce((sum, post) => sum + post.playCount, 0);
      return data.posts.length ? Math.round(totalViews / data.posts.length) : 0;
    });
    
    const likesData = filteredBrands.map(brand => {
      const data = socialData.tiktok[brand];
      if (!data) return 0;
      
      const totalLikes = data.posts.reduce((sum, post) => sum + post.diggCount, 0);
      return data.posts.length ? Math.round(totalLikes / data.posts.length) : 0;
    });
    
    const sharesData = filteredBrands.map(brand => {
      const data = socialData.tiktok[brand];
      if (!data) return 0;
      
      const totalShares = data.posts.reduce((sum, post) => sum + post.shareCount, 0);
      return data.posts.length ? Math.round(totalShares / data.posts.length) : 0;
    });
    
    return {
      labels,
      datasets: [
        {
          label: 'Avg. Views',
          data: viewsData,
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'Avg. Likes',
          data: likesData,
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        },
        {
          label: 'Avg. Shares',
          data: sharesData,
          backgroundColor: 'rgba(255, 206, 86, 0.7)',
          borderColor: 'rgba(255, 206, 86, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  // Generate top TikTok creators chart
  const generateTopCreatorsChart = () => {
    const creatorStats: Record<string, number> = {};
    
    selectedBrands.forEach(brand => {
      const data = socialData.tiktok[brand];
      if (!data) return;
      
      creatorStats[brand] = data.posts.reduce((max, post) => {
        return Math.max(max, post.authorMeta.fans);
      }, 0);
    });
    
    // Sort creators by fan count and take top 10
    const sortedCreators = Object.entries(creatorStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    const labels = sortedCreators.map(([brand]) => brand);
    const data = sortedCreators.map(([, fans]) => fans);
    
    return {
      labels,
      datasets: [
        {
          label: 'Followers',
          data,
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)',
            'rgba(199, 199, 199, 0.7)',
            'rgba(83, 102, 255, 0.7)',
            'rgba(78, 121, 54, 0.7)',
            'rgba(235, 112, 159, 0.7)'
          ],
          borderColor: 'rgba(255, 255, 255, 0.5)',
          borderWidth: 1
        }
      ]
    };
  };

  // Generate most used hashtags chart
  const generateHashtagsChart = () => {
    const hashtagCounts = extractTikTokHashtags(socialData.tiktok, selectedBrands);
    
    // Sort hashtags by count and take top 10
    const sortedHashtags = Object.entries(hashtagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    const labels = sortedHashtags.map(([tag]) => tag);
    const data = sortedHashtags.map(([, count]) => count);
    
    return {
      labels,
      datasets: [
        {
          label: 'Hashtag Usage',
          data,
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)',
            'rgba(199, 199, 199, 0.7)',
            'rgba(83, 102, 255, 0.7)',
            'rgba(78, 121, 54, 0.7)',
            'rgba(235, 112, 159, 0.7)'
          ],
          borderColor: 'rgba(255, 255, 255, 0.5)',
          borderWidth: 1
        }
      ]
    };
  };

  // Get engagement rate chart
  const engagementRateChart = generateTikTokEngagementRateChart(socialData.tiktok, selectedBrands);

  // Get posts for the selected brand
  const getSelectedBrandPosts = (): TikTokPost[] => {
    if (!selectedBrand) return [];
    
    const brandData = socialData.tiktok[selectedBrand];
    return brandData ? brandData.posts : [];
  };

  // Calculate regions distribution
  const calculateRegions = () => {
    const regionCounts: Record<string, number> = {};
    
    selectedBrands.forEach(brand => {
      const data = socialData.tiktok[brand];
      if (!data) return;
      
      data.posts.forEach(post => {
        if (post.locationMeta?.city) {
          const region = post.locationMeta.city;
          regionCounts[region] = (regionCounts[region] || 0) + 1;
        } else if (post.locationMeta?.countryCode) {
          const region = post.locationMeta.countryCode;
          regionCounts[region] = (regionCounts[region] || 0) + 1;
        }
      });
    });
    
    // Sort regions by count and take top 5
    return Object.entries(regionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex items-center space-x-2">
        <span className="text-2xl mr-2">🎵</span>
        <h2 className="text-2xl font-bold">TikTok Analytics</h2>
      </div>

      {/* Brand Selector */}
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <h3 className="text-lg font-semibold mb-3">Select Brand for Detailed View</h3>
        <div className="flex flex-wrap gap-2">
          {selectedBrands.map(brand => (
            <button
              key={brand}
              onClick={() => setSelectedBrand(brand)}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                selectedBrand === brand
                  ? (darkMode ? 'bg-black text-white' : 'bg-black text-white')
                  : (darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300')
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views, Likes, Shares Chart */}
        <motion.div
          variants={itemVariants}
          className={`p-5 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
        >
          <h3 className="text-lg font-semibold mb-4">Views, Likes & Shares per Brand</h3>
          <div className="h-80">
            <Bar data={generateEngagementChart()} options={chartOptions} />
          </div>
        </motion.div>

        {/* Top TikTok Creators Chart */}
        <motion.div
          variants={itemVariants}
          className={`p-5 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
        >
          <h3 className="text-lg font-semibold mb-4">Top TikTok Creators</h3>
          <div className="h-80">
            <Bar data={generateTopCreatorsChart()} options={chartOptions} />
          </div>
        </motion.div>

        {/* Most Used Hashtags Chart */}
        <motion.div
          variants={itemVariants}
          className={`p-5 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
        >
          <h3 className="text-lg font-semibold mb-4">Most Used Hashtags</h3>
          <div className="h-80">
            <Bar data={generateHashtagsChart()} options={chartOptions} />
          </div>
        </motion.div>

        {/* Engagement Rate Chart */}
        <motion.div
          variants={itemVariants}
          className={`p-5 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
        >
          <h3 className="text-lg font-semibold mb-4">Engagement Rate by Brand</h3>
          <div className="h-80">
            <Doughnut 
              data={engagementRateChart} 
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    ...chartOptions.plugins.legend,
                    position: 'right',
                  },
                },
              }} 
            />
          </div>
        </motion.div>
      </div>

      {/* Region-based Insights */}
      <motion.div
        variants={itemVariants}
        className={`p-5 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
      >
        <h3 className="text-lg font-semibold mb-4">Region-based Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Top Regions</h4>
            {calculateRegions().length > 0 ? (
              <div className="space-y-4">
                {calculateRegions().map(([region, count], index) => (
                  <div key={region} className="flex items-center">
                    <div className="mr-4">
                      <span className="text-blue-500">👥</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{region}</span>
                        <span className="text-sm text-gray-500">{count} posts</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(count / calculateRegions()[0][1]) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No region data available</p>
              </div>
            )}
          </div>

          <div>
            {selectedBrand && (
              <div>
                <h4 className="font-medium mb-3">Content Preview for {selectedBrand}</h4>
                <div className="space-y-3">
                  {getSelectedBrandPosts().slice(0, 3).map(post => (
                    <div key={post.id} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium truncate max-w-xs">{post.text.substring(0, 50)}...</span>
                        <span className="px-2 py-1 rounded-full">
                          {formatNumber(post.playCount)} views
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-1">📅</span>
                        <span>{post.createTime && isValidDate(new Date(post.createTime)) ? format(new Date(post.createTime), 'MMM dd, yyyy') : 'Unknown date'}</span>
                        <span className="mx-2">•</span>
                        <span>{formatNumber(post.diggCount)} likes</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Posts List for Selected Brand */}
      {selectedBrand && (
        <motion.div
          variants={itemVariants}
          className={`p-5 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
        >
          <h3 className="text-lg font-semibold mb-4">Recent TikToks for {selectedBrand}</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Text</th>
                  <th className="pb-3">Views</th>
                  <th className="pb-3">Likes</th>
                  <th className="pb-3">Shares</th>
                </tr>
              </thead>
              <tbody>
                {getSelectedBrandPosts().slice(0, 5).map((post) => (
                  <tr key={post.id} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="py-3">
                      <div className="flex items-center">
                        <span className="mr-2 text-gray-500">📅</span>
                        {post.createTime && isValidDate(new Date(post.createTime)) ? format(new Date(post.createTime), 'MMM dd, yyyy') : 'Unknown date'}
                      </div>
                    </td>
                    <td className="py-3 max-w-xs truncate">{post.text}</td>
                    <td className="py-3">{formatNumber(post.playCount)}</td>
                    <td className="py-3">{formatNumber(post.diggCount)}</td>
                    <td className="py-3">{formatNumber(post.shareCount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TikTokAnalytics;
