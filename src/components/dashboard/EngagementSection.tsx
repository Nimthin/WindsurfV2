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
import { getColorByBrand, generateColors } from '../../utils/chartUtils';

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
  // Get dark mode and filterOptions from context
  const { darkMode = false, filterOptions } = useSocialData() || {};
  
  // Removed local vibrantColors array, will use generateColors or getColorByBrand from chartUtils

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
    avgEngagementRate?: number; // For Bar chart (All Months)
    engagementRatesOverTime?: { date: string; rate: number }[]; // For Line chart (Single Month)
    postCount: number;
  };

  // Video Engagement Data (Instagram: Line chart, TikTok: Bar or Line chart)
  const videoEngagementData = useMemo(() => {
    if (!hasData) {
      return { labels: [], datasets: [] };
    }

    if (platform === 'Instagram') {
      const processedBrandData = selectedBrands.map(brand => {
        const brandPosts = (posts[brand] || []) as InstagramPost[];
        const videoPosts = brandPosts.filter(post => post.mediaType === 'Video');

        if (videoPosts.length === 0) return null;

        const totalLikes = videoPosts.reduce((sum, post) => sum + (post.likesCount || 0), 0);
        const totalComments = videoPosts.reduce((sum, post) => sum + (post.commentsCount || 0), 0);
        const totalViews = videoPosts.reduce((sum, post) => sum + (post.videoViewCount || 0), 0);
        const rate = totalViews > 0 ? parseFloat((((totalLikes + totalComments) / totalViews) * 100).toFixed(1)) : 0;
        return { brandName: brand, engagementRate: rate, postCount: videoPosts.length };
      }).filter(Boolean) as InstagramBrandData[];
      
      return {
        labels: processedBrandData.map(data => data.brandName),
        datasets: [
          {
            label: 'Video Engagement Rate (%)',
            data: processedBrandData.map(data => data.engagementRate),
            borderColor: '#004170',
            backgroundColor: 'rgba(0, 65, 112, 0.1)',
            fill: true,
            tension: 0.4,
          },
        ],
      };
    } else { // TikTok
      if (filterOptions && filterOptions.selectedMonth && filterOptions.selectedMonth.toLowerCase().includes('all')) {
        // "All Months" View: Bar Chart of Average Engagement Rates
        const avgEngagementRates = selectedBrands.map(brand => {
          const brandTikTokPosts = (posts[brand] || []) as TikTokPost[];
          if (brandTikTokPosts.length === 0) {
            return { brandName: brand, avgEngagementRate: 0, postCount: 0 };
          }
          const totalEngagementRateSum = brandTikTokPosts.reduce((sum, post) => sum + (post.engagementRate || 0), 0);
          return {
            brandName: brand,
            avgEngagementRate: parseFloat((totalEngagementRateSum / brandTikTokPosts.length).toFixed(2)),
            postCount: brandTikTokPosts.length
          };
        });

        return {
          labels: avgEngagementRates.map(data => data.brandName),
          datasets: [
            {
              label: 'Average Engagement Rate (%)',
              data: avgEngagementRates.map(data => data.avgEngagementRate),
              backgroundColor: generateColors(selectedBrands), // Use generateColors from chartUtils
              borderColor: generateColors(selectedBrands), // Use the same array of colors for border
              borderWidth: 1,
            },
          ],
        };
      } else {
        // Single Month View: Line Chart of Engagement Rates Over Time
        let allDates = new Set<string>();
        selectedBrands.forEach(brand => {
          const brandTikTokPosts = (posts[brand] || []) as TikTokPost[];
          brandTikTokPosts.forEach(post => {
            if (post.createTime) {
              try {
                const date = new Date(post.createTime); // Assumes createTime is a valid date string or number
                if (!isNaN(date.getTime())) {
                   allDates.add(date.toISOString().split('T')[0]);
                }
              } catch (e) {
                console.error("Error parsing date for TikTok post:", post.createTime, e);
              }
            }
          });
        });
        const sortedDates = Array.from(allDates).sort((a,b) => new Date(a).getTime() - new Date(b).getTime());

        const datasets = selectedBrands.map((brand, index) => {
          const brandTikTokPosts = (posts[brand] || []) as TikTokPost[];
          const ratesByDate: { [date: string]: number[] } = {};

          brandTikTokPosts.forEach(post => {
            if (post.createTime && typeof post.engagementRate === 'number') {
               try {
                const date = new Date(post.createTime);
                if (!isNaN(date.getTime())) {
                  const dateStr = date.toISOString().split('T')[0];
                  if (!ratesByDate[dateStr]) ratesByDate[dateStr] = [];
                  ratesByDate[dateStr].push(post.engagementRate);
                }
              } catch (e) {
                 console.error("Error parsing date for TikTok post:", post.createTime, e);
              }
            }
          });

          const dataForChart = sortedDates.map(dateStr => {
            const rates = ratesByDate[dateStr];
            if (rates && rates.length > 0) {
              return parseFloat((rates.reduce((s, r) => s + r, 0) / rates.length).toFixed(2)); // Average ER for the day if multiple posts
            }
            return null; // Use null for days with no data to create gaps in the line
          });

          return {
            label: `${brand} Engagement Rate (%)`,
            data: dataForChart,
            borderColor: getColorByBrand(brand, index), // Use getColorByBrand
            backgroundColor: getColorByBrand(brand, index), // Use getColorByBrand
            fill: false,
            tension: 0.1,
          };
        });

        return {
          labels: sortedDates.map(dateStr => { // Format date for display
            try {
              return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } catch (e) { return dateStr; }
          }),
          datasets,
        };
      }
    }
  }, [platform, selectedBrands, posts, hasData, filterOptions]);

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
          backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.8)' : undefined,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y.toFixed(2) + '%';
              }
              return label;
            }
          }
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
            color: darkMode ? 'rgba(255, 255, 255, 0.7)' : undefined,
            callback: function(value) {
              return value + '%';
            }
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

  // Determine which chart type to render for TikTok based on month filter
  const TikTokChartComponent = (filterOptions && filterOptions.selectedMonth && filterOptions.selectedMonth.toLowerCase().includes('all')) ? Bar : Line;

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
            {platform === 'Instagram' ? 'Instagram Video Engagement Rate' :
             (filterOptions && filterOptions.selectedMonth && filterOptions.selectedMonth.toLowerCase().includes('all')) ? 'TikTok Average Engagement Rate' : 'TikTok Engagement Rate Trend'}
          </h3>
          <div className="h-80">
            {!hasData || videoEngagementData.labels.length === 0 ? (
              <EmptyChartFallback message={`No ${platform === 'Instagram' ? 'video post' : 'TikTok'} data available`} />
            ) : (
              platform === 'Instagram' ?
                <Line data={videoEngagementData as ChartData<'line'>} options={commonChartOptions as ChartOptions<'line'>} /> :
                <TikTokChartComponent data={videoEngagementData as ChartData<any>} options={commonChartOptions as ChartOptions<any>} />
            )}
          </div>
        </div>
        
        {/* Engagement Distribution Pie Chart Removed */}
      </div>
    </div>
  );
};

export default EngagementSection;