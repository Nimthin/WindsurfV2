import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import * as FaIcons from 'react-icons/fa';
import * as AiIcons from 'react-icons/ai';
import * as BsIcons from 'react-icons/bs';
import * as BiIcons from 'react-icons/bi';
import InstagramEngagementCard from './InstagramEngagementCard';
import TikTokEngagementCard from './TikTokEngagementCard';
import * as MdIcons from 'react-icons/md';
import { useSocialData } from '../../context/SocialDataContext';
import { 
  formatNumber,
  generateInstagramEngagementChart,
  generateTikTokEngagementChart,
  generateInstagramEngagementTimeChart,
  generateTikTokEngagementRateChart,
  generateTopHashtagsChart,
  generateUnifiedHashtagChart,
  generateTikTokFollowersChart,
  generateEngagementRateChart
} from '../../utils/chartUtils';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import Sentiment from 'sentiment';
import SentimentAnalysis from './SentimentAnalysis';
import EngagementSection from './EngagementSection';
import ReachSection from './ReachSection';
import HashtagSection from './HashtagSection';
import { Brand, InstagramPost, TikTokPost } from '../../types';
import { ToggleButton, ToggleButtonGroup, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  RadialLinearScale
} from 'chart.js';

// Initialize sentiment analyzer
const sentimentAnalyzer = new Sentiment();

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  RadialLinearScale
);

const DashboardOverview: React.FC = () => {
  const { socialData, isLoading, error, selectedBrands, filterOptions, setFilterOptions, darkMode } = useSocialData();
  
  // Define state hooks at the top level of the component (before any conditionals)
  const [activeSentimentBrand, setActiveSentimentBrand] = useState<Brand>('Nordstrom');
  const [activeTab, setActiveTab] = useState<'overview' | 'sentiment'>('overview');
  const [activePlatform, setActivePlatform] = useState<'Instagram' | 'TikTok'>('Instagram');
  const [selectedCompetitor, setSelectedCompetitor] = useState<Brand>('Macys');
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Loading dashboard data...</h2>
          <p className="text-gray-500 mt-2">Please wait while we load data from Excel files</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center bg-red-50 p-6 rounded-lg max-w-md">
          <BiIcons.BiErrorCircle className="text-red-500 text-5xl mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700">Error Loading Data</h2>
          <p className="text-gray-700 mt-2">{error.message || 'There was an error loading the dashboard data from Excel files'}</p>
          <p className="text-gray-500 mt-4 text-sm">Please check that all Excel files are correctly placed in the public/Data folder</p>
        </div>
      </div>
    );
  }
  // Define Word type for word cloud data
  interface Word {
    text: string;
    value: number;
  }

  // Card variants for animation
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
      },
    }),
  };

  // Calculate total metrics
  const calculateTotalMetrics = () => {
    // Nordstrom metrics
    let totalInstagramLikes = 0;
    let totalInstagramComments = 0;
    let totalInstagramPosts = 0;
    let totalTikTokViews = 0;
    let totalTikTokLikes = 0;
    let totalTikTokShares = 0;
    let totalTikTokPosts = 0;
    
    // Competitor metrics
    let competitorInstagramLikes = 0;
    let competitorInstagramComments = 0;
    let competitorInstagramPosts = 0;
    let competitorTikTokViews = 0;
    let competitorTikTokLikes = 0;
    let competitorTikTokShares = 0;
    let competitorTikTokPosts = 0;
    
    // Track engagement by month for trend analysis
    const monthlyEngagement: Record<string, { instagram: number, tiktok: number }> = {};
    
    // For calculating averages - Nordstrom
    let avgInstagramLikes = 0;
    let avgInstagramComments = 0;
    let instagramEngagementRate = 0;
    let avgTikTokViews = 0;
    let avgTikTokLikes = 0;
    let avgTikTokShares = 0;
    let tikTokEngagementRate = 0;
    
    // For calculating averages - Competitor
    let competitorAvgInstagramLikes = 0;
    let competitorAvgInstagramComments = 0;
    let competitorInstagramEngagementRate = 0;
    let competitorAvgTikTokViews = 0;
    let competitorAvgTikTokLikes = 0;
    let competitorAvgTikTokShares = 0;
    let competitorTikTokEngagementRate = 0;

    try {
      selectedBrands.forEach(brand => {
        // Instagram metrics
        const instagramData = socialData.instagram[brand];
        if (instagramData && instagramData.posts && Array.isArray(instagramData.posts)) {
          // Separate Nordstrom and competitor data
          if (brand === 'Nordstrom') {
            instagramData.posts.forEach(post => {
              if (post) {
                // Add basic metrics for Nordstrom
                totalInstagramLikes += post.likesCount || 0;
                totalInstagramComments += post.commentsCount || 0;
                
                // Track monthly engagement
                if (post.timestamp) {
                  try {
                    const date = new Date(post.timestamp);
                    const month = date.toLocaleString('default', { month: 'long' });
                    
                    if (!monthlyEngagement[month]) {
                      monthlyEngagement[month] = { instagram: 0, tiktok: 0 };
                    }
                    
                    monthlyEngagement[month].instagram += (post.likesCount || 0) + (post.commentsCount || 0);
                  } catch (e) {
                    console.error('Error processing Instagram post date:', e);
                  }
                }
              }
            });
            totalInstagramPosts += instagramData.posts.length;
          } else if (brand === selectedCompetitor) {
            // Add metrics for the selected competitor
            instagramData.posts.forEach(post => {
              if (post) {
                competitorInstagramLikes += post.likesCount || 0;
                competitorInstagramComments += post.commentsCount || 0;
              }
            });
            competitorInstagramPosts += instagramData.posts.length;
          }
        }

        // TikTok metrics
        const tiktokData = socialData.tiktok[brand];
        if (tiktokData && tiktokData.posts && Array.isArray(tiktokData.posts)) {
          // Separate Nordstrom and competitor data
          if (brand === 'Nordstrom') {
            tiktokData.posts.forEach(post => {
              if (post) {
                // Add basic metrics for Nordstrom
                totalTikTokViews += post.playCount || 0;
                totalTikTokLikes += post.diggCount || 0;
                totalTikTokShares += post.shareCount || 0;
                
                // Track monthly engagement
                if (post.createTime) {
                  try {
                    let date: Date;
                    
                    // Handle different date formats
                    if (typeof post.createTime === 'string') {
                      date = new Date(post.createTime);
                    } else if (typeof post.createTime === 'number') {
                      date = new Date(post.createTime * 1000); // Convert Unix timestamp to milliseconds
                    } else {
                      throw new Error('Invalid date format');
                    }
                    
                    const month = date.toLocaleString('default', { month: 'long' });
                    
                    if (!monthlyEngagement[month]) {
                      monthlyEngagement[month] = { instagram: 0, tiktok: 0 };
                    }
                    
                    monthlyEngagement[month].tiktok += (post.diggCount || 0) + (post.commentCount || 0) + (post.shareCount || 0);
                  } catch (e) {
                    console.error('Error processing TikTok post date:', e);
                  }
                }
              }
            });
            totalTikTokPosts += tiktokData.posts.length;
          } else if (brand === selectedCompetitor) {
            // Add metrics for the selected competitor
            tiktokData.posts.forEach(post => {
              if (post) {
                competitorTikTokViews += post.playCount || 0;
                competitorTikTokLikes += post.diggCount || 0;
                competitorTikTokShares += post.shareCount || 0;
              }
            });
            competitorTikTokPosts += tiktokData.posts.length;
          }
        }
      });
    } catch (error) {
      console.error('Error calculating metrics:', error);
    }

    // Calculate averages and rates for Nordstrom
    if (totalInstagramPosts > 0) {
      avgInstagramLikes = totalInstagramLikes / totalInstagramPosts;
      avgInstagramComments = totalInstagramComments / totalInstagramPosts;
      instagramEngagementRate = ((totalInstagramLikes + totalInstagramComments) / totalInstagramPosts) / 100;
    }
    
    if (totalTikTokPosts > 0) {
      avgTikTokViews = totalTikTokViews / totalTikTokPosts;
      avgTikTokLikes = totalTikTokLikes / totalTikTokPosts;
      avgTikTokShares = totalTikTokShares / totalTikTokPosts;
      tikTokEngagementRate = ((totalTikTokLikes + totalTikTokShares) / totalTikTokPosts) / 100;
    }
    
    // Calculate averages and rates for competitor
    if (competitorInstagramPosts > 0) {
      competitorAvgInstagramLikes = competitorInstagramLikes / competitorInstagramPosts;
      competitorAvgInstagramComments = competitorInstagramComments / competitorInstagramPosts;
      competitorInstagramEngagementRate = ((competitorInstagramLikes + competitorInstagramComments) / competitorInstagramPosts) / 100;
    }
    
    if (competitorTikTokPosts > 0) {
      competitorAvgTikTokViews = competitorTikTokViews / competitorTikTokPosts;
      competitorAvgTikTokLikes = competitorTikTokLikes / competitorTikTokPosts;
      competitorAvgTikTokShares = competitorTikTokShares / competitorTikTokPosts;
      competitorTikTokEngagementRate = ((competitorTikTokLikes + competitorTikTokShares) / competitorTikTokPosts) / 100;
    }
    
    return {
      // Nordstrom metrics
      totalInstagramLikes,
      totalInstagramComments,
      totalInstagramPosts,
      totalTikTokViews,
      totalTikTokLikes,
      totalTikTokShares,
      totalTikTokPosts,
      avgInstagramLikes,
      avgInstagramComments,
      instagramEngagementRate,
      avgTikTokViews,
      avgTikTokLikes,
      avgTikTokShares,
      tikTokEngagementRate,
      
      // Competitor metrics
      competitorInstagramLikes,
      competitorInstagramComments,
      competitorInstagramPosts,
      competitorTikTokViews,
      competitorTikTokLikes,
      competitorTikTokShares,
      competitorTikTokPosts,
      competitorAvgInstagramLikes,
      competitorAvgInstagramComments,
      competitorInstagramEngagementRate,
      competitorAvgTikTokViews,
      competitorAvgTikTokLikes,
      competitorAvgTikTokShares,
      competitorTikTokEngagementRate,
      
      // Other metrics
      monthlyEngagement,
      selectedCompetitor,
      
      // Calculate which platform has better engagement
      bestPlatform: totalInstagramPosts && totalTikTokPosts ? 
        instagramEngagementRate > tikTokEngagementRate ? 'Instagram' : 'TikTok' : 'Unknown',
    };
  };

  const metrics = calculateTotalMetrics();



  // Prepare chart data
  const instagramEngagementChart = generateInstagramEngagementChart(socialData.instagram, selectedBrands);
  const tiktokEngagementChart = generateTikTokEngagementChart(socialData.tiktok, selectedBrands);
  
  // Function to check if chart data is empty
  const isChartDataEmpty = (chartData: any) => {
    if (!chartData || !chartData.datasets || chartData.datasets.length === 0) return true;
    
    // Check if all datasets have empty or zero data
    return chartData.datasets.every((dataset: any) => {
      if (!dataset.data || dataset.data.length === 0) return true;
      return dataset.data.every((value: any) => value === 0 || value === null || value === undefined);
    });
  };
  
  // Fallback UI component for empty charts
  const EmptyChartFallback = ({ message = 'No data available for the selected brands' }: { message?: string }) => (
    <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
      <BiIcons.BiBarChartAlt2 className="text-gray-400 text-5xl mb-3" />
      <p className="text-gray-500 text-center px-4">{message}</p>
      <p className="text-gray-400 text-sm mt-2">Try selecting different brands or check that Excel files exist</p>
    </div>
  );
  
  // Prepare engagement rate chart data based on active platform
  const engagementRateChart = generateEngagementRateChart(
    socialData.instagram, 
    socialData.tiktok, 
    selectedBrands,
    activePlatform,
    filterOptions.selectedMonth
  );

  // Function to calculate sentiment scores for brand posts
  const calculateSentiment = (brand: Brand) => {
    try {
      const instagramData = socialData.instagram[brand];
      const tiktokData = socialData.tiktok[brand];
      
      let totalScore = 0;
      let totalPosts = 0;
      let positiveCount = 0;
      let negativeCount = 0;
      let neutralCount = 0;
      let topPositivePost = { text: '', score: 0, platform: '' };
      let topNegativePost = { text: '', score: 0, platform: '' };
      
      // Track sentiment by month for trend analysis
      const monthlySentiment: Record<string, { score: number, count: number }> = {};
      
      // Calculate Instagram sentiment
      if (instagramData && instagramData.posts && Array.isArray(instagramData.posts)) {
        instagramData.posts.forEach(post => {
          if (post && post.caption) {
            const result = sentimentAnalyzer.analyze(post.caption);
            totalScore += result.score;
            totalPosts++;
            
            // Count sentiment categories
            if (result.score > 0) positiveCount++;
            else if (result.score < 0) negativeCount++;
            else neutralCount++;
            
            // Track top posts
            if (result.score > topPositivePost.score) {
              topPositivePost = { text: post.caption, score: result.score, platform: 'Instagram' };
            }
            if (result.score < topNegativePost.score) {
              topNegativePost = { text: post.caption, score: result.score, platform: 'Instagram' };
            }
            
            // Track monthly sentiment
            if (post.timestamp) {
              try {
                const date = new Date(post.timestamp);
                const month = date.toLocaleString('default', { month: 'long' });
                
                if (!monthlySentiment[month]) {
                  monthlySentiment[month] = { score: 0, count: 0 };
                }
                
                monthlySentiment[month].score += result.score;
                monthlySentiment[month].count++;
              } catch (e) {
                console.error('Error processing Instagram post date for sentiment:', e);
              }
            }
          }
        });
      }
      
      // Calculate TikTok sentiment
      if (tiktokData && tiktokData.posts && Array.isArray(tiktokData.posts)) {
        tiktokData.posts.forEach(post => {
          if (post && post.text) {
            const result = sentimentAnalyzer.analyze(post.text);
            totalScore += result.score;
            totalPosts++;
            
            // Count sentiment categories
            if (result.score > 0) positiveCount++;
            else if (result.score < 0) negativeCount++;
            else neutralCount++;
            
            // Track top posts
            if (result.score > topPositivePost.score) {
              topPositivePost = { text: post.text, score: result.score, platform: 'TikTok' };
            }
            if (result.score < topNegativePost.score) {
              topNegativePost = { text: post.text, score: result.score, platform: 'TikTok' };
            }
            
            // Track monthly sentiment
            if (post.createTime) {
              try {
                let date: Date;
                if (!isNaN(parseFloat(post.createTime))) {
                  date = new Date(parseFloat(post.createTime) * 1000);
                } else {
                  date = new Date(post.createTime);
                }
                
                if (!isNaN(date.getTime())) {
                  const month = date.toLocaleString('default', { month: 'long' });
                  
                  if (!monthlySentiment[month]) {
                    monthlySentiment[month] = { score: 0, count: 0 };
                  }
                  
                  monthlySentiment[month].score += result.score;
                  monthlySentiment[month].count++;
                }
              } catch (e) {
                console.error('Error processing TikTok post date for sentiment:', e);
              }
            }
          }
        });
      }
      
      // Calculate average sentiment by month
      const monthlyAverageSentiment: Record<string, number> = {};
      Object.keys(monthlySentiment).forEach(month => {
        const { score, count } = monthlySentiment[month];
        monthlyAverageSentiment[month] = count > 0 ? score / count : 0;
      });
      
      // Determine sentiment trend (improving, declining, stable)
      const months = Object.keys(monthlyAverageSentiment).sort((a, b) => {
        const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return monthOrder.indexOf(a) - monthOrder.indexOf(b);
      });
      
      let trend = 'stable';
      if (months.length >= 2) {
        const firstMonth = months[0];
        const lastMonth = months[months.length - 1];
        const difference = monthlyAverageSentiment[lastMonth] - monthlyAverageSentiment[firstMonth];
        
        if (difference > 1) trend = 'improving';
        else if (difference < -1) trend = 'declining';
      }
      
      const averageSentiment = totalPosts > 0 ? totalScore / totalPosts : 0;
      
      return totalPosts > 0 ? {
        average: averageSentiment,
        status: averageSentiment > 0 ? 'Positive' : averageSentiment < 0 ? 'Negative' : 'Neutral',
        positiveCount,
        negativeCount,
        neutralCount,
        topPositivePost: topPositivePost.score > 0 ? topPositivePost : null,
        topNegativePost: topNegativePost.score < 0 ? topNegativePost : null,
        monthlySentiment: monthlyAverageSentiment,
        trend,
        totalPosts
      } : { 
        average: 0, 
        status: 'Neutral', 
        positiveCount: 0, 
        negativeCount: 0, 
        neutralCount: 0,
        topPositivePost: null,
        topNegativePost: null,
        monthlySentiment: {},
        trend: 'stable',
        totalPosts: 0
      };
    } catch (error) {
      console.error('Error calculating sentiment:', error);
      return { 
        average: 0, 
        status: 'Neutral', 
        positiveCount: 0, 
        negativeCount: 0, 
        neutralCount: 0,
        topPositivePost: null,
        topNegativePost: null,
        monthlySentiment: {},
        trend: 'stable',
        totalPosts: 0
      };
    }
  };

  // Function to analyze brand hashtags
  const analyzeHashtags = (brand: Brand) => {
    const instagramData = socialData.instagram[brand];
    const tiktokData = socialData.tiktok[brand];
    
    const hashtagCounts: Record<string, number> = {};
    
    // Process Instagram hashtags
    if (instagramData && instagramData.posts.length) {
      instagramData.posts.forEach(post => {
        if (post.hashtags && post.hashtags.length) {
          post.hashtags.forEach(tag => {
            if (tag) {
              hashtagCounts[tag.toLowerCase()] = (hashtagCounts[tag.toLowerCase()] || 0) + 1;
            }
          });
        }
      });
    }
    
    // Process TikTok hashtags
    if (tiktokData && tiktokData.posts.length) {
      tiktokData.posts.forEach(post => {
        if (post.hashtags && post.hashtags.length) {
          post.hashtags.forEach(tag => {
            if (tag.name) {
              hashtagCounts[tag.name.toLowerCase()] = (hashtagCounts[tag.name.toLowerCase()] || 0) + 1;
            }
          });
        }
      });
    }
    
    // Sort hashtags by count
    return Object.entries(hashtagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Return top 10 hashtags
  };

  // Engagement rate chart data is now generated above

  // Function to generate hashtag chart data (not using useMemo directly)
  const generateHashtagChartData = () => {
    // Always return a valid chart data object, even if data is missing
    return (!socialData || !selectedBrands) 
      ? { labels: [], datasets: [] }
      : generateUnifiedHashtagChart(
          socialData.instagram || {},
          socialData.tiktok || {},
          selectedBrands,
          activePlatform
        );
  };
  
  // Generate unified hashtag chart data
  const unifiedHashtagChartData = generateHashtagChartData();

  // Format chart options with dark mode support
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: darkMode ? 'white' : 'black',
          font: {
            size: 12
          }
        },
      },
      title: {
        display: false,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-900' : 'bg-red-100'} text-center`}>
          <h3 className="text-xl font-bold mb-2">Error Loading Data</h3>
          <p>{'message' in (error as any) ? String((error as any).message) : 'Failed to load data'}</p>
          <button
            className={`mt-4 px-4 py-2 rounded ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Platform selection toggle
  const handlePlatformChange = (event: React.MouseEvent<HTMLElement>, newPlatform: 'Instagram' | 'TikTok') => {
    if (newPlatform !== null) {
      setActivePlatform(newPlatform);
      // Update filter options in context
      setFilterOptions({ ...filterOptions, platform: newPlatform });
    }
  };

  // Error handling in render method
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-900' : 'bg-red-100'} text-center`}>
          <h3 className="text-xl font-bold mb-2">Error Loading Data</h3>
          <p>{'message' in (error as any) ? String((error as any).message) : 'Failed to load data'}</p>
          <button
            className={`mt-4 px-4 py-2 rounded ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards Section */}
      <div className="mt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md p-4`}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              <BiIcons.BiStats className="inline-block mr-2 text-purple-500" />
              Key Performance Indicators
            </h2>
            
            <FormControl variant="outlined" size="small" className="min-w-[200px]" sx={{
              '& .MuiInputLabel-root': {
                color: darkMode ? 'rgba(255, 255, 255, 0.7)' : undefined
              },
              '& .MuiOutlinedInput-root': {
                color: darkMode ? 'white' : undefined,
                '& fieldset': {
                  borderColor: darkMode ? 'rgba(255, 255, 255, 0.23)' : undefined
                },
                '&:hover fieldset': {
                  borderColor: darkMode ? 'rgba(255, 255, 255, 0.5)' : undefined
                }
              },
              '& .MuiSelect-icon': {
                color: darkMode ? 'rgba(255, 255, 255, 0.7)' : undefined
              }
            }}>
              <InputLabel id="competitor-select-label">Compare with</InputLabel>
              <Select
                labelId="competitor-select-label"
                id="competitor-select"
                value={selectedCompetitor}
                onChange={(e) => setSelectedCompetitor(e.target.value as Brand)}
                label="Compare with"
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: darkMode ? 'rgb(45, 45, 45)' : undefined,
                      color: darkMode ? 'white' : undefined,
                      '& .MuiMenuItem-root:hover': {
                        bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : undefined
                      }
                    }
                  }
                }}
              >
                {selectedBrands.filter(brand => brand !== 'Nordstrom').map((brand) => (
                  <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Instagram KPIs */}
            {activePlatform === 'Instagram' && (
              <>
                {/* Total Posts */}
                <motion.div
                  custom={0}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white shadow-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium opacity-80">Total Posts</p>
                      <h3 className="text-2xl font-bold mt-1">{formatNumber(metrics.totalInstagramPosts)}</h3>
                    </div>
                    <FaIcons.FaInstagram className="text-3xl opacity-80" />
                  </div>
                  <div className="mt-3 text-sm">
                    <div className="flex justify-between">
                      <p className="opacity-80">Nordstrom</p>
                      <p className="font-medium">{formatNumber(metrics.totalInstagramPosts)}</p>
                    </div>
                    <div className="flex justify-between mt-1">
                      <p className="opacity-80">{metrics.selectedCompetitor}</p>
                      <p className="font-medium">{formatNumber(metrics.competitorInstagramPosts)}</p>
                    </div>
                    {metrics.totalInstagramPosts > 0 && metrics.competitorInstagramPosts > 0 && (
                      <div className="mt-2 text-xs">
                        <p className="opacity-90">
                          {metrics.totalInstagramPosts > metrics.competitorInstagramPosts 
                            ? `Nordstrom has ${formatNumber(metrics.totalInstagramPosts - metrics.competitorInstagramPosts)} more posts`
                            : metrics.totalInstagramPosts < metrics.competitorInstagramPosts
                              ? `${metrics.selectedCompetitor} has ${formatNumber(metrics.competitorInstagramPosts - metrics.totalInstagramPosts)} more posts`
                              : 'Equal number of posts'}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
                
                {/* Total Likes */}
                <motion.div
                  custom={1}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white shadow-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium opacity-80">Instagram Likes</p>
                      <h3 className="text-2xl font-bold mt-1">{formatNumber(metrics.totalInstagramLikes)}</h3>
                    </div>
                    <AiIcons.AiFillHeart className="text-3xl opacity-80" />
                  </div>
                  <div className="mt-3 text-sm">
                    <div className="flex justify-between">
                      <p className="opacity-80">Nordstrom Avg</p>
                      <p className="font-medium">{formatNumber(metrics.avgInstagramLikes)}</p>
                    </div>
                    <div className="flex justify-between mt-1">
                      <p className="opacity-80">{metrics.selectedCompetitor} Avg</p>
                      <p className="font-medium">{formatNumber(metrics.competitorAvgInstagramLikes)}</p>
                    </div>
                    {metrics.avgInstagramLikes > 0 && metrics.competitorAvgInstagramLikes > 0 && (
                      <div className="mt-2 text-xs">
                        <p className="opacity-90">
                          {metrics.avgInstagramLikes > metrics.competitorAvgInstagramLikes 
                            ? `Nordstrom gets ${formatNumber(metrics.avgInstagramLikes - metrics.competitorAvgInstagramLikes)} more likes per post`
                            : metrics.avgInstagramLikes < metrics.competitorAvgInstagramLikes
                              ? `${metrics.selectedCompetitor} gets ${formatNumber(metrics.competitorAvgInstagramLikes - metrics.avgInstagramLikes)} more likes per post`
                              : 'Equal average likes per post'}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
                
                {/* Total Comments */}
                <motion.div
                  custom={2}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white shadow-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium opacity-80">Instagram Comments</p>
                      <h3 className="text-2xl font-bold mt-1">{formatNumber(metrics.totalInstagramComments)}</h3>
                    </div>
                    <FaIcons.FaComments className="text-3xl opacity-80" />
                  </div>
                  <div className="mt-3 text-sm">
                    <div className="flex justify-between">
                      <p className="opacity-80">Nordstrom Avg</p>
                      <p className="font-medium">{formatNumber(metrics.avgInstagramComments)}</p>
                    </div>
                    <div className="flex justify-between mt-1">
                      <p className="opacity-80">{metrics.selectedCompetitor} Avg</p>
                      <p className="font-medium">{formatNumber(metrics.competitorAvgInstagramComments)}</p>
                    </div>
                    {metrics.avgInstagramComments > 0 && metrics.competitorAvgInstagramComments > 0 && (
                      <div className="mt-2 text-xs">
                        <p className="opacity-90">
                          {metrics.avgInstagramComments > metrics.competitorAvgInstagramComments 
                            ? `Nordstrom gets ${formatNumber(metrics.avgInstagramComments - metrics.competitorAvgInstagramComments)} more comments per post`
                            : metrics.avgInstagramComments < metrics.competitorAvgInstagramComments
                              ? `${metrics.selectedCompetitor} gets ${formatNumber(metrics.competitorAvgInstagramComments - metrics.avgInstagramComments)} more comments per post`
                              : 'Equal average comments per post'}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
                
                {/* Instagram Engagement Rate */}
                <InstagramEngagementCard
                  instagramEngagementRate={metrics.instagramEngagementRate}
                  competitorInstagramEngagementRate={metrics.competitorInstagramEngagementRate}
                  selectedCompetitor={metrics.selectedCompetitor}
                  cardVariants={cardVariants}
                />
              </>
            )}
            
            {/* TikTok KPIs */}
            {activePlatform === 'TikTok' && (
              <>
                {/* Total Posts */}
                <motion.div
                  custom={0}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-gradient-to-r from-black to-gray-800 rounded-lg p-4 text-white shadow-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium opacity-80">Total Posts</p>
                      <h3 className="text-2xl font-bold mt-1">{formatNumber(metrics.totalTikTokPosts)}</h3>
                    </div>
                    <FaIcons.FaTiktok className="text-3xl opacity-80" />
                  </div>
                  <div className="mt-3 text-sm">
                    <div className="flex justify-between">
                      <p className="opacity-80">Nordstrom</p>
                      <p className="font-medium">{formatNumber(metrics.totalTikTokPosts)}</p>
                    </div>
                    <div className="flex justify-between mt-1">
                      <p className="opacity-80">{metrics.selectedCompetitor}</p>
                      <p className="font-medium">{formatNumber(metrics.competitorTikTokPosts)}</p>
                    </div>
                    {metrics.totalTikTokPosts > 0 && metrics.competitorTikTokPosts > 0 && (
                      <div className="mt-2 text-xs">
                        <p className="opacity-90">
                          {metrics.totalTikTokPosts > metrics.competitorTikTokPosts 
                            ? `Nordstrom has ${formatNumber(metrics.totalTikTokPosts - metrics.competitorTikTokPosts)} more posts`
                            : metrics.totalTikTokPosts < metrics.competitorTikTokPosts
                              ? `${metrics.selectedCompetitor} has ${formatNumber(metrics.competitorTikTokPosts - metrics.totalTikTokPosts)} more posts`
                              : 'Equal number of posts'}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
                
                {/* Total Views */}
                <motion.div
                  custom={1}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg p-4 text-white shadow-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium opacity-80">TikTok Views</p>
                      <h3 className="text-2xl font-bold mt-1">{formatNumber(metrics.totalTikTokViews)}</h3>
                    </div>
                    <AiIcons.AiOutlineEye className="text-3xl opacity-80" />
                  </div>
                  <div className="mt-3 text-sm">
                    <div className="flex justify-between">
                      <p className="opacity-80">Nordstrom Avg</p>
                      <p className="font-medium">{formatNumber(metrics.avgTikTokViews)}</p>
                    </div>
                    <div className="flex justify-between mt-1">
                      <p className="opacity-80">{metrics.selectedCompetitor} Avg</p>
                      <p className="font-medium">{formatNumber(metrics.competitorAvgTikTokViews)}</p>
                    </div>
                    {metrics.avgTikTokViews > 0 && metrics.competitorAvgTikTokViews > 0 && (
                      <div className="mt-2 text-xs">
                        <p className="opacity-90">
                          {metrics.avgTikTokViews > metrics.competitorAvgTikTokViews 
                            ? `Nordstrom gets ${formatNumber(metrics.avgTikTokViews - metrics.competitorAvgTikTokViews)} more views per post`
                            : metrics.avgTikTokViews < metrics.competitorAvgTikTokViews
                              ? `${metrics.selectedCompetitor} gets ${formatNumber(metrics.competitorAvgTikTokViews - metrics.avgTikTokViews)} more views per post`
                              : 'Equal average views per post'}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
                
                {/* Total Likes */}
                <motion.div
                  custom={2}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white shadow-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium opacity-80">TikTok Likes</p>
                      <h3 className="text-2xl font-bold mt-1">{formatNumber(metrics.totalTikTokLikes)}</h3>
                    </div>
                    <AiIcons.AiFillHeart className="text-3xl opacity-80" />
                  </div>
                  <div className="mt-3 text-sm">
                    <div className="flex justify-between">
                      <p className="opacity-80">Nordstrom Avg</p>
                      <p className="font-medium">{formatNumber(metrics.avgTikTokLikes)}</p>
                    </div>
                    <div className="flex justify-between mt-1">
                      <p className="opacity-80">{metrics.selectedCompetitor} Avg</p>
                      <p className="font-medium">{formatNumber(metrics.competitorAvgTikTokLikes)}</p>
                    </div>
                    {metrics.avgTikTokLikes > 0 && metrics.competitorAvgTikTokLikes > 0 && (
                      <div className="mt-2 text-xs">
                        <p className="opacity-90">
                          {metrics.avgTikTokLikes > metrics.competitorAvgTikTokLikes 
                            ? `Nordstrom gets ${formatNumber(metrics.avgTikTokLikes - metrics.competitorAvgTikTokLikes)} more likes per post`
                            : metrics.avgTikTokLikes < metrics.competitorAvgTikTokLikes
                              ? `${metrics.selectedCompetitor} gets ${formatNumber(metrics.competitorAvgTikTokLikes - metrics.avgTikTokLikes)} more likes per post`
                              : 'Equal average likes per post'}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
                
                {/* Total Shares */}
                <motion.div
                  custom={3}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white shadow-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium opacity-80">TikTok Shares</p>
                      <h3 className="text-2xl font-bold mt-1">{formatNumber(metrics.totalTikTokShares)}</h3>
                    </div>
                    <FaIcons.FaShare className="text-3xl opacity-80" />
                  </div>
                  <div className="mt-3 text-sm">
                    <div className="flex justify-between">
                      <p className="opacity-80">Nordstrom Avg</p>
                      <p className="font-medium">{formatNumber(metrics.avgTikTokShares)}</p>
                    </div>
                    <div className="flex justify-between mt-1">
                      <p className="opacity-80">{metrics.selectedCompetitor} Avg</p>
                      <p className="font-medium">{formatNumber(metrics.competitorAvgTikTokShares)}</p>
                    </div>
                    {metrics.avgTikTokShares > 0 && metrics.competitorAvgTikTokShares > 0 && (
                      <div className="mt-2 text-xs">
                        <p className="opacity-90">
                          {metrics.avgTikTokShares > metrics.competitorAvgTikTokShares 
                            ? `Nordstrom gets ${formatNumber(metrics.avgTikTokShares - metrics.competitorAvgTikTokShares)} more shares per post`
                            : metrics.avgTikTokShares < metrics.competitorAvgTikTokShares
                              ? `${metrics.selectedCompetitor} gets ${formatNumber(metrics.competitorAvgTikTokShares - metrics.avgTikTokShares)} more shares per post`
                              : 'Equal average shares per post'}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* TikTok Engagement Rate */}
                <TikTokEngagementCard
                  tikTokEngagementRate={metrics.tikTokEngagementRate}
                  competitorTikTokEngagementRate={metrics.competitorTikTokEngagementRate}
                  selectedCompetitor={metrics.selectedCompetitor}
                  cardVariants={cardVariants}
                />
              </>
            )}
          </div>
        </motion.div>
      </div>
      
      {/* Platform Toggle */}
      <div className={`flex justify-center mb-6 p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <ToggleButtonGroup
          value={activePlatform}
          exclusive
          onChange={handlePlatformChange}
          aria-label="platform"
          color="primary"
          sx={{ 
            '& .MuiToggleButton-root': {
              color: darkMode ? 'white' : 'inherit',
              borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)'
            },
            '& .Mui-selected': {
              backgroundColor: darkMode ? 'rgba(25, 118, 210, 0.5)' : 'rgba(25, 118, 210, 0.1)',
              '&:hover': {
                backgroundColor: darkMode ? 'rgba(25, 118, 210, 0.6)' : 'rgba(25, 118, 210, 0.2)'
              }
            }
          }}
        >
          <ToggleButton value="Instagram" aria-label="Instagram">
            <FaIcons.FaInstagram className="mr-2" /> Instagram
          </ToggleButton>
          <ToggleButton value="TikTok" aria-label="TikTok">
            <FaIcons.FaTiktok className="mr-2" /> TikTok
          </ToggleButton>
        </ToggleButtonGroup>
      </div>

      {/* Sentiment Analysis Section */}
      <div className="mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className={`rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold">
              <FaIcons.FaChartPie className="inline-block mr-2 text-blue-500" />
              Sentiment Analysis
            </h2>
            <div className="flex space-x-2">
              <ToggleButtonGroup
                value={activePlatform}
                exclusive
                onChange={(e, newPlatform) => {
                  if (newPlatform) setActivePlatform(newPlatform);
                }}
                size="small"
                aria-label="platform selection"
              >
                <ToggleButton value="Instagram" aria-label="Instagram">
                  <FaIcons.FaInstagram className="mr-1" /> Instagram
                </ToggleButton>
                <ToggleButton value="TikTok" aria-label="TikTok">
                  <FaIcons.FaTiktok className="mr-1" /> TikTok
                </ToggleButton>
              </ToggleButtonGroup>
            </div>
          </div>
          
          {/* Instagram Sentiment Analysis */}
          {activePlatform === 'Instagram' && (
            <SentimentAnalysis 
              platform="Instagram" 
              selectedBrands={selectedBrands} 
              posts={selectedBrands.reduce((acc, brand) => {
                acc[brand] = socialData.instagram[brand]?.posts || [];
                return acc;
              }, {} as Record<Brand, InstagramPost[] | TikTokPost[]>)}
            />
          )}
          
          {/* TikTok Sentiment Analysis */}
          {activePlatform === 'TikTok' && (
            <SentimentAnalysis 
              platform="TikTok" 
              selectedBrands={selectedBrands} 
              posts={selectedBrands.reduce((acc, brand) => {
                acc[brand] = socialData.tiktok[brand]?.posts || [];
                return acc;
              }, {} as Record<Brand, InstagramPost[] | TikTokPost[]>)}
            />
          )}
        </motion.div>
      </div>
      
      {/* Followers Section removed as per user request */}
      
      {/* Engagement Section */}
      <div className="mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className={`rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold">
              <AiIcons.AiOutlineInteraction className="inline-block mr-2 text-green-500" />
              Engagement Analytics
            </h2>
            <div className="flex space-x-2">
              <ToggleButtonGroup
                value={activePlatform}
                exclusive
                onChange={(e, newPlatform) => {
                  if (newPlatform) setActivePlatform(newPlatform);
                }}
                size="small"
                aria-label="platform selection"
              >
                <ToggleButton value="Instagram" aria-label="Instagram">
                  <FaIcons.FaInstagram className="mr-1" /> Instagram
                </ToggleButton>
                <ToggleButton value="TikTok" aria-label="TikTok">
                  <FaIcons.FaTiktok className="mr-1" /> TikTok
                </ToggleButton>
              </ToggleButtonGroup>
            </div>
          </div>
          
          {/* Instagram Engagement Analytics */}
          {activePlatform === 'Instagram' && (
            <EngagementSection 
              platform="Instagram" 
              selectedBrands={selectedBrands} 
              posts={selectedBrands.reduce((acc, brand) => {
                acc[brand] = socialData.instagram[brand]?.posts || [];
                return acc;
              }, {} as Record<Brand, InstagramPost[] | TikTokPost[]>)}
            />
          )}
          
          {/* TikTok Engagement Analytics */}
          {activePlatform === 'TikTok' && (
            <EngagementSection 
              platform="TikTok" 
              selectedBrands={selectedBrands} 
              posts={selectedBrands.reduce((acc, brand) => {
                acc[brand] = socialData.tiktok[brand]?.posts || [];
                return acc;
              }, {} as Record<Brand, InstagramPost[] | TikTokPost[]>)}
            />
          )}
        </motion.div>
      </div>
      
      {/* Reach Section */}
      <div className="mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className={`rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold">
              <MdIcons.MdOutlineWifiTethering className="inline-block mr-2 text-amber-500" />
              Reach Analytics
            </h2>
            <div className="flex space-x-2">
              <ToggleButtonGroup
                value={activePlatform}
                exclusive
                onChange={(e, newPlatform) => {
                  if (newPlatform) setActivePlatform(newPlatform);
                }}
                size="small"
                aria-label="platform selection"
              >
                <ToggleButton value="Instagram" aria-label="Instagram">
                  <FaIcons.FaInstagram className="mr-1" /> Instagram
                </ToggleButton>
                <ToggleButton value="TikTok" aria-label="TikTok">
                  <FaIcons.FaTiktok className="mr-1" /> TikTok
                </ToggleButton>
              </ToggleButtonGroup>
            </div>
          </div>
          
          {/* Instagram Reach Analytics */}
          {activePlatform === 'Instagram' && (
            <ReachSection 
              platform="Instagram" 
              selectedBrands={selectedBrands} 
              posts={selectedBrands.reduce((acc, brand) => {
                acc[brand] = socialData.instagram[brand]?.posts || [];
                return acc;
              }, {} as Record<Brand, InstagramPost[] | TikTokPost[]>)}
            />
          )}
          
          {/* TikTok Reach Analytics */}
          {activePlatform === 'TikTok' && (
            <ReachSection 
              platform="TikTok" 
              selectedBrands={selectedBrands} 
              posts={selectedBrands.reduce((acc, brand) => {
                acc[brand] = socialData.tiktok[brand]?.posts || [];
                return acc;
              }, {} as Record<Brand, InstagramPost[] | TikTokPost[]>)}
            />
          )}
        </motion.div>
      </div>
      
      {/* Hashtag Section */}
      <div className="mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className={`rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold">
              <FaIcons.FaHashtag className="inline-block mr-2 text-blue-500" />
              Hashtag Analytics
            </h2>
            <div className="flex space-x-2">
              <ToggleButtonGroup
                value={activePlatform}
                exclusive
                onChange={(e, newPlatform) => {
                  if (newPlatform) setActivePlatform(newPlatform);
                }}
                size="small"
                aria-label="platform selection"
              >
                <ToggleButton value="Instagram" aria-label="Instagram">
                  <FaIcons.FaInstagram className="mr-1" /> Instagram
                </ToggleButton>
                <ToggleButton value="TikTok" aria-label="TikTok">
                  <FaIcons.FaTiktok className="mr-1" /> TikTok
                </ToggleButton>
              </ToggleButtonGroup>
            </div>
          </div>
          
          {/* Instagram Hashtag Analytics */}
          {activePlatform === 'Instagram' && (
            <HashtagSection 
              platform="Instagram" 
              selectedBrands={selectedBrands} 
              posts={selectedBrands.reduce((acc, brand) => {
                acc[brand] = socialData.instagram[brand]?.posts || [];
                return acc;
              }, {} as Record<Brand, InstagramPost[] | TikTokPost[]>)}
            />
          )}
          
          {/* TikTok Hashtag Analytics */}
          {activePlatform === 'TikTok' && (
            <HashtagSection 
              platform="TikTok" 
              selectedBrands={selectedBrands} 
              posts={selectedBrands.reduce((acc, brand) => {
                acc[brand] = socialData.tiktok[brand]?.posts || [];
                return acc;
              }, {} as Record<Brand, InstagramPost[] | TikTokPost[]>)}
            />
          )}
        </motion.div>
      </div>

      {/* Quick Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {/* Nordstrom Instagram Stats Card */}
        {activePlatform === 'Instagram' && (
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className={`rounded-lg p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md border-l-4 border-blue-500`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Nordstrom Instagram</p>
                <h3 className="text-xl font-bold mt-1">
                  {formatNumber(
                    socialData.instagram['Nordstrom'] && socialData.instagram['Nordstrom']?.posts
                      ? socialData.instagram['Nordstrom']?.posts.reduce((sum, post) => sum + post.likesCount + post.commentsCount, 0) 
                      : 0
                  )}
                </h3>
                <div className="flex flex-col">
                  <p className="text-sm mt-2">
                    <span className="text-green-500">↑ {
                      socialData.instagram['Nordstrom'] && socialData.instagram['Nordstrom']?.posts && socialData.instagram['Nordstrom']?.posts.length > 0 
                        ? formatNumber(Math.round(
                            socialData.instagram['Nordstrom']?.posts.reduce((sum, post) => sum + post.likesCount, 0) 
                            / socialData.instagram['Nordstrom']?.posts.length
                          )) 
                        : 0
                    }</span> avg. likes per post
                  </p>
                </div>
              </div>
              <div className={`p-3 rounded-full ${darkMode ? 'bg-purple-900' : 'bg-purple-100'}`}>
                <span className="text-xl text-purple-500">📷</span>
              </div>
            </div>
          </motion.div>
        )}

      </div>

      {/* Engagement Rate Section */}
      <div className="grid grid-cols-1 gap-6 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`rounded-lg p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
        >
          <h3 className="text-lg font-semibold mb-4">{activePlatform} Engagement Rate by Brand</h3>
          <div className="h-96">
            {isChartDataEmpty(engagementRateChart) ? (
              <EmptyChartFallback message={`No ${activePlatform} engagement data available for the selected brands`} />
            ) : (
              <Line 
                data={engagementRateChart} 
                options={{
                  ...chartOptions,
                  scales: {
                    ...chartOptions.scales,
                    y: {
                      ...chartOptions.scales.y,
                      title: {
                        display: true,
                        text: activePlatform === 'TikTok' ? 'Engagement Rate (%)' : 'Engagement',
                        color: darkMode ? 'white' : 'black',
                      }
                    }
                  },
                  plugins: {
                    ...chartOptions.plugins,
                    tooltip: {
                      ...chartOptions.plugins.tooltip,
                      callbacks: {
                        label: function(context) {
                          const label = context.dataset.label || '';
                          const value = context.raw as number;
                          if (label.includes('Video') || activePlatform === 'TikTok') {
                            return `${label}: ${value.toFixed(2)}%`;
                          } else {
                            return `${label}: ${formatNumber(value)}`;
                          }
                        }
                      }
                    }
                  }
                }}
              />
            )}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            <p>
              {activePlatform === 'Instagram' ? 
                'For Instagram, image post engagement is measured by likes + comments, while video post engagement rate is calculated as ((likes + comments) / views) * 100%.' : 
                'For TikTok, engagement rate is calculated as ((likes + comments + shares + collects) / views) * 100%.'
              }
            </p>
          </div>
        </motion.div>
      </div>
      
      {/* Social Platform Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Instagram Engagement Chart */}
        {filterOptions.platform === 'Instagram' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`rounded-lg p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
          >
            <h3 className="text-lg font-semibold mb-4">Instagram Engagement by Brand</h3>
            <div className="h-80">
              {isChartDataEmpty(instagramEngagementChart) ? (
                <EmptyChartFallback message="No Instagram engagement data available for the selected brands" />
              ) : (
                <Bar data={instagramEngagementChart} options={chartOptions} />
              )}
            </div>
          </motion.div>
        )}

        {/* Instagram Reach Chart */}
        {filterOptions.platform === 'Instagram' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className={`rounded-lg p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
          >
            <h3 className="text-lg font-semibold mb-4">Instagram Reach by Brand</h3>
            <div className="h-80">
              {/* Create Instagram Reach chart data */}
              {(() => {


                // Define the chart data
                const reachChartData = {
                  labels: selectedBrands,
                  datasets: [
                    {
                      label: 'Instagram Reach',
                      data: selectedBrands.map(brand => {
                        const brandData = socialData.instagram[brand];
                        if (!brandData?.posts) return 0;

                        return brandData.posts.reduce((sum, post) => {
                          const videoViews = Number(post?.videoViewCount || 0);
                          const likes = Number(post?.likesCount || 0);
                          const comments = Number(post?.commentsCount || 0);

                          if (videoViews > 0) {
                            return sum + videoViews; // Use actual video views for videos
                          } else {
                            return sum + (likes + comments); // Estimate reach for images
                          }
                        }, 0);
                      }),
                      backgroundColor: 'rgba(156, 39, 176, 0.5)',
                      borderColor: 'rgba(156, 39, 176, 1)',
                      borderWidth: 1,
                    }
                  ]
                };
                
                // Return the appropriate component based on data availability
                if (isChartDataEmpty(reachChartData)) {
                  return <EmptyChartFallback message="No Instagram reach data available for the selected brands" />;
                } else {
                  return <Bar data={reachChartData} options={chartOptions} />;
                }
              })()}
            </div>
          </motion.div>
        )}

        {/* TikTok Engagement Chart */}
        {filterOptions.platform === 'TikTok' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className={`rounded-lg p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
          >
            <h3 className="text-lg font-semibold mb-4">TikTok Engagement by Brand</h3>
            <div className="h-80">
              {isChartDataEmpty(tiktokEngagementChart) ? (
                <EmptyChartFallback message="No TikTok engagement data available for the selected brands" />
              ) : (
                <Bar data={tiktokEngagementChart} options={chartOptions} />
              )}
            </div>
          </motion.div>
        )}
        
        {/* TikTok Reach Chart - NEW */}
        {filterOptions.platform === 'TikTok' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className={`rounded-lg p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
          >
            <h3 className="text-lg font-semibold mb-4">TikTok Reach by Brand</h3>
            <div className="h-80">
              {/* Generate TikTok Reach chart data */}
              {(() => {
                // Create the chart data object
                const tiktokReachData = {
                  labels: selectedBrands,
                  datasets: [
                    {
                      label: 'TikTok Reach',
                      data: selectedBrands.map(brand => {
                        const brandData = socialData.tiktok[brand];
                        if (!brandData?.posts) return 0;

                        return brandData.posts.reduce((sum, post) => {
                          const views = Number(post?.playCount || 0);
                          return sum + views;
                        }, 0);
                      }),
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      borderColor: 'rgba(0, 0, 0, 1)',
                      borderWidth: 1,
                    }
                  ]
                };
                
                // Check if data is empty and render appropriate component
                if (isChartDataEmpty(tiktokReachData)) {
                  return <EmptyChartFallback message="No TikTok reach data available for the selected brands" />;
                } else {
                  return <Bar data={tiktokReachData} options={chartOptions} />;
                }
              })()}
            </div>
          </motion.div>
        )}
        
        {/* TikTok Followers Chart - NEW */}
        {filterOptions.platform === 'TikTok' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className={`rounded-lg p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
          >
            <h3 className="text-lg font-semibold mb-4">TikTok Followers by Brand</h3>
            <div className="h-80">
              {(() => {
                const followersChartData = generateTikTokFollowersChart(socialData.tiktok, selectedBrands);
                return isChartDataEmpty(followersChartData) ? (
                  <EmptyChartFallback message="No TikTok followers data available for the selected brands" />
                ) : (
                  <Bar 
                    data={followersChartData}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        title: {
                          display: true,
                          text: 'TikTok Followers by Brand',
                          color: darkMode ? 'white' : 'black',
                        },
                        tooltip: {
                          ...chartOptions.plugins.tooltip,
                          callbacks: {
                            label: function(context) {
                              return `Followers: ${formatNumber(context.raw as number)}`;
                            }
                          }
                        }
                      }
                    }}
                  />
                )
              })()}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
export default DashboardOverview;
