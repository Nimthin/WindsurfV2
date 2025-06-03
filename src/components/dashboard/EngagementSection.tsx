import React, { useMemo, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  ChartOptions
} from 'chart.js';
import { Brand, InstagramPost, TikTokPost, SocialPlatform } from '../../types';
import EmptyChartFallback from '../common/EmptyChartFallback';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useSocialData } from '../../context/SocialDataContext';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

type EngagementSectionProps = {
  platform: SocialPlatform;
  selectedBrands: Brand[];
  posts: Record<Brand, (InstagramPost | TikTokPost)[]>;
};

const EngagementSection: React.FC<EngagementSectionProps> = ({ 
  platform, 
  selectedBrands, 
  posts 
}) => {
  // Get dark mode from context
  const { darkMode } = useSocialData();
  
  // Vibrant color palette - more visible than pastel
  const vibrantColors = [
    'rgba(66, 133, 244, 0.8)',   // Google Blue
    'rgba(219, 68, 55, 0.8)',    // Google Red
    'rgba(244, 180, 0, 0.8)',    // Google Yellow
    'rgba(15, 157, 88, 0.8)',    // Google Green
    'rgba(171, 71, 188, 0.8)',   // Purple
    'rgba(255, 112, 67, 0.8)',   // Deep Orange
    'rgba(3, 169, 244, 0.8)',    // Light Blue
    'rgba(0, 188, 212, 0.8)',    // Cyan
    'rgba(139, 195, 74, 0.8)',   // Light Green
    'rgba(255, 193, 7, 0.8)',    // Amber
    'rgba(121, 85, 72, 0.8)',    // Brown
    'rgba(96, 125, 139, 0.8)',   // Blue Grey
  ];

  // Nordstrom is our main brand
  const mainBrand: Brand = 'Nordstrom';
  
  // State for competitor brand selection
  const [selectedCompetitor, setSelectedCompetitor] = useState<Brand>('Macys');

  // Check if we have data
  const hasData = useMemo(() => {
    return selectedBrands.some(brand => (posts[brand]?.length || 0) > 0);
  }, [selectedBrands, posts]);

  // Handle competitor brand change
  const handleCompetitorChange = (event: any) => {
    setSelectedCompetitor(event.target.value as Brand);
  };

  // Instagram Image Engagement Data
  const instagramImageEngagementData = useMemo(() => {
    if (platform !== 'Instagram' || !hasData) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Filter for image posts (IMAGE or CAROUSEL_ALBUM)
    const brandData = selectedBrands.map((brand, index) => {
      const brandPosts = posts[brand] || [];
      const imagePosts = brandPosts.filter(post => {
        const instagramPost = post as InstagramPost;
        return instagramPost.mediaType === 'Image' || instagramPost.mediaType === 'Sidecar';
      });

      // Skip competitor brands if not selected
      if (brand !== mainBrand && brand !== selectedCompetitor) {
        return null;
      }

      // Calculate engagement metrics
      const totalLikes = imagePosts.reduce((sum, post) => sum + ((post as InstagramPost).likesCount || 0), 0);
      const totalComments = imagePosts.reduce((sum, post) => sum + ((post as InstagramPost).commentsCount || 0), 0);
      const avgLikes = imagePosts.length > 0 ? totalLikes / imagePosts.length : 0;
      const avgComments = imagePosts.length > 0 ? totalComments / imagePosts.length : 0;
      
      // Calculate engagement rate for image posts (likes + comments)
      const engagementRate = totalLikes + totalComments;

      return {
        brand,
        avgLikes,
        avgComments,
        engagementRate,
        postCount: imagePosts.length
      };
    }).filter(Boolean); // Remove null entries

    // Create chart data
    return {
      labels: brandData.map(data => data?.brand),
      datasets: [
        {
          label: 'Avg. Likes per Image Post',
          data: brandData.map(data => data?.avgLikes),
          backgroundColor: vibrantColors[0],
          borderColor: vibrantColors[0].replace('0.8', '1'),
          borderWidth: 1,
        },
        {
          label: 'Avg. Comments per Image Post',
          data: brandData.map(data => data?.avgComments),
          backgroundColor: vibrantColors[1],
          borderColor: vibrantColors[1].replace('0.8', '1'),
          borderWidth: 1,
        },
        {
          label: 'Image Engagement Rate',
          data: brandData.map(data => data?.engagementRate),
          backgroundColor: vibrantColors[2],
          borderColor: vibrantColors[2].replace('0.8', '1'),
          borderWidth: 1,
        }
      ]
    };
  }, [platform, selectedBrands, posts, hasData, mainBrand, selectedCompetitor, vibrantColors]);

  // Instagram Video & TikTok Engagement Data
  const videoEngagementData = useMemo(() => {
    if (!hasData) {
      return {
        labels: [],
        datasets: []
      };
    }

    // For Instagram, filter for video posts
    // For TikTok, use all posts
    const brandData = selectedBrands.map((brand, index) => {
      const brandPosts = posts[brand] || [];
      let filteredPosts = brandPosts;
      
      if (platform === 'Instagram') {
        // Filter for video posts only
        filteredPosts = brandPosts.filter(post => {
          const instagramPost = post as InstagramPost;
          return instagramPost.mediaType === 'Video';
        });

        // Skip competitor brands if not selected
        if (brand !== mainBrand && brand !== selectedCompetitor) {
          return null;
        }
      }

      // Calculate metrics based on platform
      if (platform === 'Instagram') {
        // Instagram video metrics
        const totalLikes = filteredPosts.reduce((sum, post) => sum + ((post as InstagramPost).likesCount || 0), 0);
        const totalComments = filteredPosts.reduce((sum, post) => sum + ((post as InstagramPost).commentsCount || 0), 0);
        const totalViews = filteredPosts.reduce((sum, post) => sum + ((post as InstagramPost).videoViewCount || 0), 0);
        const avgLikes = filteredPosts.length > 0 ? totalLikes / filteredPosts.length : 0;
        const avgComments = filteredPosts.length > 0 ? totalComments / filteredPosts.length : 0;
        
        // Calculate video engagement rate: ((likes + comments) / views) * 100
        const engagementRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;

        return {
          brand,
          metrics: [
            { label: 'Avg. Likes', value: avgLikes },
            { label: 'Avg. Comments', value: avgComments },
            { label: 'Engagement Rate (%)', value: engagementRate }
          ],
          postCount: filteredPosts.length
        };
      } else {
        // TikTok metrics
        // Log TikTok data for debugging
        console.log(`TikTok data for ${brand}:`, filteredPosts);
        
        const totalLikes = filteredPosts.reduce((sum, post) => {
          const tiktokPost = post as TikTokPost;
          return sum + (tiktokPost.diggCount || 0);
        }, 0);
        
        const totalComments = filteredPosts.reduce((sum, post) => {
          const tiktokPost = post as TikTokPost;
          return sum + (tiktokPost.commentCount || 0);
        }, 0);
        
        const totalShares = filteredPosts.reduce((sum, post) => {
          const tiktokPost = post as TikTokPost;
          return sum + (tiktokPost.shareCount || 0);
        }, 0);
        
        const totalViews = filteredPosts.reduce((sum, post) => {
          const tiktokPost = post as TikTokPost;
          return sum + (tiktokPost.playCount || 0);
        }, 0);
        
        const avgLikes = filteredPosts.length > 0 ? totalLikes / filteredPosts.length : 0;
        const avgComments = filteredPosts.length > 0 ? totalComments / filteredPosts.length : 0;
        const avgShares = filteredPosts.length > 0 ? totalShares / filteredPosts.length : 0;
        
        // Calculate engagement rate: ((likes + comments + shares) / views) * 100
        const engagementRate = totalViews > 0 ? ((totalLikes + totalComments + totalShares) / totalViews) * 100 : 0;

        return {
          brand,
          metrics: [
            { label: 'Avg. Likes', value: avgLikes },
            { label: 'Avg. Comments', value: avgComments },
            { label: 'Avg. Shares', value: avgShares },
            { label: 'Engagement Rate (%)', value: engagementRate }
          ],
          postCount: filteredPosts.length
        };
      }
    }).filter(Boolean); // Remove null entries

    // Create datasets based on platform
    if (platform === 'Instagram') {
      return {
        labels: brandData.map(data => data?.brand),
        datasets: [
          {
            label: 'Avg. Likes per Video Post',
            data: brandData.map(data => data?.metrics[0].value),
            backgroundColor: vibrantColors[2],
            borderColor: vibrantColors[2].replace('0.8', '1'),
            borderWidth: 1,
          },
          {
            label: 'Avg. Comments per Video Post',
            data: brandData.map(data => data?.metrics[1].value),
            backgroundColor: vibrantColors[3],
            borderColor: vibrantColors[3].replace('0.8', '1'),
            borderWidth: 1,
          },
          {
            label: 'Video Engagement Rate (%)',
            data: brandData.map(data => data?.metrics[2].value),
            backgroundColor: vibrantColors[4],
            borderColor: vibrantColors[4].replace('0.8', '1'),
            borderWidth: 1,
          }
        ]
      };
    } else {
      return {
        labels: brandData.map(data => data?.brand),
        datasets: [
          {
            label: 'Avg. Likes',
            data: brandData.map(data => data?.metrics[0].value),
            backgroundColor: vibrantColors[0],
            borderColor: vibrantColors[0].replace('0.8', '1'),
            borderWidth: 1,
          },
          {
            label: 'Avg. Comments',
            data: brandData.map(data => data?.metrics[1].value),
            backgroundColor: vibrantColors[1],
            borderColor: vibrantColors[1].replace('0.8', '1'),
            borderWidth: 1,
          },
          {
            label: 'Avg. Shares',
            data: brandData.map(data => data?.metrics[2].value),
            backgroundColor: vibrantColors[2],
            borderColor: vibrantColors[2].replace('0.8', '1'),
            borderWidth: 1,
          },
          {
            label: 'Engagement Rate (%)',
            data: brandData.map(data => data?.metrics[3].value),
            backgroundColor: vibrantColors[3],
            borderColor: vibrantColors[3].replace('0.8', '1'),
            borderWidth: 1,
          }
        ]
      };
    }
  }, [platform, selectedBrands, posts, hasData, mainBrand, selectedCompetitor, vibrantColors]);

  // Engagement Type Distribution
  const engagementDistributionData = useMemo(() => {
    if (!hasData) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Calculate total engagement by type
    const engagementTypes: Record<string, number> = {};
    
    if (platform === 'Instagram') {
      // Only use main brand for distribution
      const brandPosts = posts[mainBrand] || [];
      
      let totalLikes = 0;
      let totalComments = 0;
      
      brandPosts.forEach(post => {
        const instagramPost = post as InstagramPost;
        totalLikes += instagramPost.likesCount || 0;
        totalComments += instagramPost.commentsCount || 0;
      });
      
      engagementTypes['Likes'] = totalLikes;
      engagementTypes['Comments'] = totalComments;
    } else {
      // Only use main brand for distribution
      const brandPosts = posts[mainBrand] || [];
      
      let totalLikes = 0;
      let totalComments = 0;
      let totalShares = 0;
      
      brandPosts.forEach(post => {
        const tiktokPost = post as TikTokPost;
        totalLikes += tiktokPost.diggCount || 0;
        totalComments += tiktokPost.commentCount || 0;
        totalShares += tiktokPost.shareCount || 0;
      });
      
      engagementTypes['Likes'] = totalLikes;
      engagementTypes['Comments'] = totalComments;
      engagementTypes['Shares'] = totalShares;
    }

    // Create pie chart data
    return {
      labels: Object.keys(engagementTypes),
      datasets: [
        {
          data: Object.values(engagementTypes),
          backgroundColor: vibrantColors.slice(0, Object.keys(engagementTypes).length),
          borderColor: vibrantColors.slice(0, Object.keys(engagementTypes).length).map(color => color.replace('0.8', '1')),
          borderWidth: 1,
        }
      ]
    };
  }, [platform, posts, hasData, mainBrand, vibrantColors]);

  // Chart options
  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: darkMode ? 'rgba(255, 255, 255, 0.8)' : undefined
        }
      },
      title: {
        display: false
      },
      tooltip: {
        titleColor: darkMode ? 'rgba(255, 255, 255, 0.9)' : undefined,
        bodyColor: darkMode ? 'rgba(255, 255, 255, 0.9)' : undefined,
        backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.8)' : undefined
      }
    },
    scales: {
      x: {
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : undefined
        },
        ticks: {
          color: darkMode ? 'rgba(255, 255, 255, 0.7)' : undefined
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : undefined
        },
        ticks: {
          color: darkMode ? 'rgba(255, 255, 255, 0.7)' : undefined
        }
      }
    }
  };

  const pieOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: darkMode ? 'rgba(255, 255, 255, 0.8)' : undefined
        }
      },
      tooltip: {
        titleColor: darkMode ? 'rgba(255, 255, 255, 0.9)' : undefined,
        bodyColor: darkMode ? 'rgba(255, 255, 255, 0.9)' : undefined,
        backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.8)' : undefined
      }
    }
  };

  return (
    <div className="p-4">
      {platform === 'Instagram' && (
        <div className="mb-6">
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
            <InputLabel id="competitor-select-label">Competitor Brand</InputLabel>
            <Select
              labelId="competitor-select-label"
              id="competitor-select"
              value={selectedCompetitor}
              onChange={handleCompetitorChange}
              label="Competitor Brand"
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
              {selectedBrands.filter(brand => brand !== mainBrand).map((brand) => (
                <MenuItem key={brand} value={brand}>{brand}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Instagram Image Engagement Chart */}
        {platform === 'Instagram' && (
          <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} lg:col-span-2`}>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Instagram Image Post Engagement
            </h3>
            <div className="h-80">
              {!hasData || instagramImageEngagementData.labels.length === 0 ? (
                <EmptyChartFallback message="No image post data available" />
              ) : (
                <Bar data={instagramImageEngagementData} options={barOptions} />
              )}
            </div>
          </div>
        )}
        
        {/* Video Engagement Chart (Instagram or TikTok) */}
        <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} ${platform === 'Instagram' ? 'lg:col-span-2' : 'lg:col-span-2'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {platform === 'Instagram' ? 'Instagram Video Post Engagement' : 'TikTok Engagement'}
          </h3>
          <div className="h-80">
            {!hasData || videoEngagementData.labels.length === 0 ? (
              <EmptyChartFallback message={`No ${platform === 'Instagram' ? 'video post' : 'TikTok'} data available`} />
            ) : (
              <Bar data={videoEngagementData} options={barOptions} />
            )}
          </div>
        </div>
        
        {/* Engagement Distribution Pie Chart */}
        <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {platform} Engagement Distribution
          </h3>
          <div className="h-80">
            {!hasData || engagementDistributionData.labels.length === 0 ? (
              <EmptyChartFallback message="No engagement data available" />
            ) : (
              <Pie data={engagementDistributionData} options={pieOptions} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngagementSection;
