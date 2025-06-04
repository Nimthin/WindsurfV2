import React, { useMemo } from 'react'; // Removed useState
import { Bar, Line } from 'react-chartjs-2'; // Removed Pie
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, // Added for Line chart
  LineElement,  // Added for Line chart
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  Filler, // Added for Line chart fill
  ChartOptions,
  ChartData
} from 'chart.js';
import { Brand, InstagramPost, TikTokPost, SocialPlatform } from '../../types';
import EmptyChartFallback from '../common/EmptyChartFallback';
// FormControl, InputLabel, MenuItem, Select removed as competitor selection is removed
import { useSocialData } from '../../context/SocialDataContext';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement, // Added for Line chart
  LineElement,  // Added for Line chart
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler // Added for Line chart fill
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
  const { darkMode = false } = useSocialData() || {};
  
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

  // Removed mainBrand and selectedCompetitor state

  const hasData = useMemo(() => {
    return selectedBrands.some(brand => (posts[brand]?.length || 0) > 0);
  }, [selectedBrands, posts]);

  // Removed handleCompetitorChange

  // Instagram Image Engagement Data - now a Line chart processing all selectedBrands
  const instagramImageEngagementData = useMemo(() => {
    if (platform !== 'Instagram' || !hasData) {
      return { labels: [], datasets: [] };
    }

    const processedBrandData = selectedBrands.map(brand => {
      const brandPosts = posts[brand] || [];
      const imagePosts = brandPosts.filter(post => {
        const instagramPost = post as InstagramPost;
        return instagramPost.mediaType === 'Image' || instagramPost.mediaType === 'Sidecar';
      });
      const totalLikes = imagePosts.reduce((sum, post) => sum + ((post as InstagramPost).likesCount || 0), 0);
      const totalComments = imagePosts.reduce((sum, post) => sum + ((post as InstagramPost).commentsCount || 0), 0);
      return {
        brandName: brand,
        engagementValue: totalLikes + totalComments,
        postCount: imagePosts.length
      };
    }).filter(data => data.postCount > 0);

    return {
      labels: processedBrandData.map(data => data.brandName),
      datasets: [
        {
          label: 'Image Engagement (Likes + Comments)',
          data: processedBrandData.map(data => data.engagementValue),
          borderColor: '#004170', // Nordstrom Blue
          backgroundColor: 'rgba(0, 65, 112, 0.1)', // Light Nordstrom Blue fill
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [platform, selectedBrands, posts, hasData]);

  // Define types for processed data
  type InstagramBrandData = {
    brandName: Brand;
    engagementRate: number;
    postCount: number;
  };

  type TikTokBrandData = {
    brandName: Brand;
    metrics: Array<{ label: string; value: number }>;
    postCount: number;
  };

  // Video Engagement Data (Instagram: Line chart, TikTok: Bar chart)
  const videoEngagementData = useMemo(() => {
    if (!hasData) {
      return { labels: [], datasets: [] };
    }

    const processedBrandData = selectedBrands.map(brand => {
      const brandPosts = posts[brand] || [];
      let filteredPosts = brandPosts;

      if (platform === 'Instagram') {
        filteredPosts = brandPosts.filter(post => (post as InstagramPost).mediaType === 'Video');
      }

      if (filteredPosts.length === 0) return null; // Skip brands with no relevant posts

      if (platform === 'Instagram') {
        const totalLikes = filteredPosts.reduce((sum, post) => sum + ((post as InstagramPost).likesCount || 0), 0);
        const totalComments = filteredPosts.reduce((sum, post) => sum + ((post as InstagramPost).commentsCount || 0), 0);
        const totalViews = filteredPosts.reduce((sum, post) => sum + ((post as InstagramPost).videoViewCount || 0), 0);
        const rate = totalViews > 0 ? parseFloat((((totalLikes + totalComments) / totalViews) * 100).toFixed(1)) : 0;
        return { brandName: brand, engagementRate: rate, postCount: filteredPosts.length };
      } else { // TikTok
        const totalLikes = filteredPosts.reduce((sum, post) => sum + ((post as TikTokPost).diggCount || 0), 0);
        const totalComments = filteredPosts.reduce((sum, post) => sum + ((post as TikTokPost).commentCount || 0), 0);
        const totalShares = filteredPosts.reduce((sum, post) => sum + ((post as TikTokPost).shareCount || 0), 0);
        const totalViews = filteredPosts.reduce((sum, post) => sum + ((post as TikTokPost).playCount || 0), 0);
        const engagementRate = totalViews > 0 ? parseFloat((((totalLikes + totalComments + totalShares) / totalViews) * 100).toFixed(1)) : 0;
        return {
          brandName: brand,
          metrics: [ // For TikTok Bar chart
            { label: 'Avg. Likes', value: filteredPosts.length > 0 ? totalLikes / filteredPosts.length : 0 },
            { label: 'Avg. Comments', value: filteredPosts.length > 0 ? totalComments / filteredPosts.length : 0 },
            { label: 'Avg. Shares', value: filteredPosts.length > 0 ? totalShares / filteredPosts.length : 0 },
            { label: 'Engagement Rate (%)', value: engagementRate }
          ],
          postCount: filteredPosts.length
        };
      }
    }).filter(Boolean);

    // Safe type casting after filtering out null values
    const typedBrandData = processedBrandData as (InstagramBrandData | TikTokBrandData)[];
    
    if (platform === 'Instagram') {
      // Type guard to ensure we're working with Instagram data
      const instagramData = typedBrandData.filter((data): data is InstagramBrandData => 
        'engagementRate' in data && !('metrics' in data)
      );
      
      return {
        labels: instagramData.map(data => data.brandName),
        datasets: [
          {
            label: 'Video Engagement Rate (%)',
            data: instagramData.map(data => data.engagementRate),
            borderColor: '#004170',
            backgroundColor: 'rgba(0, 65, 112, 0.1)',
            fill: true,
            tension: 0.4,
          },
        ],
      };
    } else { // TikTok
      // Type guard to ensure we're working with TikTok data
      const tiktokData = typedBrandData.filter((data): data is TikTokBrandData => 
        'metrics' in data
      );
      
      return {
        labels: tiktokData.map(data => data.brandName),
        datasets: [ // Assuming original structure for TikTok bar chart is preferred
          {
            label: 'Avg. Likes',
            data: tiktokData.map(data => data.metrics[0].value),
            backgroundColor: vibrantColors[0],
            borderColor: vibrantColors[0].replace('0.8', '1'),
            borderWidth: 1,
          },
          {
            label: 'Avg. Comments',
            data: tiktokData.map(data => data.metrics[1].value),
            backgroundColor: vibrantColors[1],
            borderColor: vibrantColors[1].replace('0.8', '1'),
            borderWidth: 1,
          },
          {
            label: 'Avg. Shares',
            data: tiktokData.map(data => data.metrics[2].value),
            backgroundColor: vibrantColors[2],
            borderColor: vibrantColors[2].replace('0.8', '1'),
            borderWidth: 1,
          },
          {
            label: 'Engagement Rate (%)',
            data: tiktokData.map(data => data.metrics[3].value),
            backgroundColor: vibrantColors[3],
            borderColor: vibrantColors[3].replace('0.8', '1'),
            borderWidth: 1,
          },
        ],
      };
    }
  }, [platform, selectedBrands, posts, hasData, vibrantColors]);

  // Removed engagementDistributionData useMemo hook

  // Chart options (can be common for Line and Bar, or split if needed)
  const commonChartOptions = useMemo(() => {
    const options: ChartOptions<'bar' | 'line'> = {
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
    return options;
  }, [darkMode]);

  const pieOptions = useMemo(() => {
    const options: ChartOptions<'pie'> = {
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
    return options;
  }, [darkMode]);

  return (
    // Removed p-4 from root, padding is handled by parent card in DashboardOverview
    <div>
      {/* Competitor selection dropdown removed */}
      
      <div className="grid grid-cols-1 gap-6">
        {/* Instagram Image Engagement Chart */}
        {platform === 'Instagram' && (
          <div className={`p-4 rounded-lg shadow ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} w-full`}>
            <h3 className={`text-md font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Instagram Image Engagement
            </h3>
            <div className="h-80">
              {!hasData || instagramImageEngagementData.labels.length === 0 ? (
                <EmptyChartFallback message="No image post data available" />
              ) : (
                <Line data={instagramImageEngagementData as ChartData<'line'>} options={commonChartOptions as ChartOptions<'line'>} />
              )}
            </div>
          </div>
        )}
        
        {/* Video Engagement Chart (Instagram or TikTok) */}
        <div className={`p-4 rounded-lg shadow ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} w-full`}>
          <h3 className={`text-md font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            {platform === 'Instagram' ? 'Instagram Video Engagement Rate' : 'TikTok Engagement'}
          </h3>
          <div className="h-80">
            {!hasData || videoEngagementData.labels.length === 0 ? (
              <EmptyChartFallback message={`No ${platform === 'Instagram' ? 'video post' : 'TikTok'} data available`} />
            ) : (
              platform === 'Instagram' ?
                <Line data={videoEngagementData as ChartData<'line'>} options={commonChartOptions as ChartOptions<'line'>} /> :
                <Bar data={videoEngagementData as ChartData<'bar'>} options={commonChartOptions as ChartOptions<'bar'>} />
            )}
          </div>
        </div>
        
        {/* Engagement Distribution Pie Chart Removed */}
      </div>
    </div>
  );
};

export default EngagementSection;