import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bar, Pie } from 'react-chartjs-2';
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
import { Brand, InstagramPost } from '../../types';
import { extractInstagramHashtags, calculateSponsoredPostRatio } from '../../utils/chartUtils';
import { format } from 'date-fns';

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

const InstagramAnalytics: React.FC = () => {
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

  // Generate likes vs comments chart
  const generateLikesCommentsChart = () => {
    const filteredBrands = selectedBrands.filter(brand => socialData.instagram[brand] !== null);
    
    const labels = filteredBrands;
    const likesData = filteredBrands.map(brand => {
      const data = socialData.instagram[brand];
      if (!data) return 0;
      
      const totalLikes = data.posts.reduce((sum, post) => sum + post.likesCount, 0);
      return data.posts.length ? Math.round(totalLikes / data.posts.length) : 0;
    });
    
    const commentsData = filteredBrands.map(brand => {
      const data = socialData.instagram[brand];
      if (!data) return 0;
      
      const totalComments = data.posts.reduce((sum, post) => sum + post.commentsCount, 0);
      return data.posts.length ? Math.round(totalComments / data.posts.length) : 0;
    });
    
    return {
      labels,
      datasets: [
        {
          label: 'Avg. Likes',
          data: likesData,
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        },
        {
          label: 'Avg. Comments',
          data: commentsData,
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  // Generate most used hashtags chart
  const generateHashtagsChart = () => {
    const hashtagCounts = extractInstagramHashtags(socialData.instagram, selectedBrands);
    
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

  // Generate sponsored post ratio chart
  const sponsoredChart = calculateSponsoredPostRatio(socialData.instagram, selectedBrands);

  // Get posts for the selected brand
  const getSelectedBrandPosts = (): InstagramPost[] => {
    if (!selectedBrand) return [];
    
    const brandData = socialData.instagram[selectedBrand];
    return brandData ? brandData.posts : [];
  };

  // Calculate locations distribution
  const calculateLocations = () => {
    const locationCounts: Record<string, number> = {};
    
    selectedBrands.forEach(brand => {
      const data = socialData.instagram[brand];
      if (!data) return;
      
      data.posts.forEach(post => {
        if (post.locationName) {
          locationCounts[post.locationName] = (locationCounts[post.locationName] || 0) + 1;
        }
      });
    });
    
    // Sort locations by count and take top 5
    return Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
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
        <span className="text-2xl text-purple-500 mr-2">📷</span>
        <h2 className="text-2xl font-bold">Instagram Analytics</h2>
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
                  ? (darkMode ? 'bg-purple-700 text-white' : 'bg-purple-600 text-white')
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
        {/* Likes vs Comments Chart */}
        <motion.div
          variants={itemVariants}
          className={`p-5 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
        >
          <h3 className="text-lg font-semibold mb-4">Likes vs Comments per Brand</h3>
          <div className="h-80">
            <Bar data={generateLikesCommentsChart()} options={chartOptions} />
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

        {/* Sponsored Post Ratio */}
        <motion.div
          variants={itemVariants}
          className={`p-5 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
        >
          <h3 className="text-lg font-semibold mb-4">Sponsored Post Ratio</h3>
          <div className="h-80">
            <Pie 
              data={sponsoredChart} 
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

        {/* Geo Distribution */}
        <motion.div
          variants={itemVariants}
          className={`p-5 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
        >
          <h3 className="text-lg font-semibold mb-4">Top Locations</h3>
          <div className="h-80 overflow-y-auto">
            {calculateLocations().length > 0 ? (
              <div className="space-y-4">
                {calculateLocations().map(([location, count]) => (
                  <div key={location} className="flex items-center">
                    <div className="mr-4">
                      <span className="text-red-500">📍</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{location}</span>
                        <span className="text-sm text-gray-500">{count} posts</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${(count / calculateLocations()[0][1]) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No location data available</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Posts List for Selected Brand */}
      {selectedBrand && (
        <motion.div
          variants={itemVariants}
          className={`p-5 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
        >
          <h3 className="text-lg font-semibold mb-4">Recent Posts for {selectedBrand}</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Caption</th>
                  <th className="pb-3">Likes</th>
                  <th className="pb-3">Comments</th>
                  <th className="pb-3">Sponsored</th>
                </tr>
              </thead>
              <tbody>
                {getSelectedBrandPosts().slice(0, 5).map((post) => (
                  <tr key={post.id} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="py-3">
                      <div className="flex items-center">
                        <span className="mr-2 text-gray-500">📅</span>
                        {format(new Date(post.timestamp), 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="py-3 max-w-xs truncate">{post.caption}</td>
                    <td className="py-3">{formatNumber(post.likesCount)}</td>
                    <td className="py-3">{formatNumber(post.commentsCount)}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          post.isSponsored
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {post.isSponsored ? 'Sponsored' : 'Organic'}
                      </span>
                    </td>
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

export default InstagramAnalytics;
