import React, { useMemo, useState } from 'react';
import { Bar, Line, Pie, Chart } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend,
  ChartOptions
} from 'chart.js';
import { Brand, InstagramPost, SentimentLabel, TikTokPost } from '../../types';
import EmptyChartFallback from '../../components/common/EmptyChartFallback';
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Register the filler plugin for area charts
ChartJS.register({
  id: 'customFiller',
  beforeDraw: (chart) => {
    // Add shadow to chart
    const ctx = chart.ctx;
    ctx.shadowColor = 'rgba(0,0,0,0.05)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
  }
});

interface SentimentAnalysisProps {
  platform: 'Instagram' | 'TikTok';
  selectedBrands: Brand[];
  posts: Record<Brand, InstagramPost[] | TikTokPost[] | undefined>;
}

const SentimentAnalysis: React.FC<SentimentAnalysisProps> = ({ platform, selectedBrands, posts }) => {
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
  
  // State for selected brand in charts
  const [selectedBrandForSentiment, setSelectedBrandForSentiment] = useState<string>('all');
  const [selectedBrandForVolume, setSelectedBrandForVolume] = useState<string>('all');
  
  // State for competitor brand selection
  const [selectedCompetitor, setSelectedCompetitor] = useState<Brand>('Macys');
  
  // Nordstrom is our main brand
  const mainBrand: Brand = 'Nordstrom';

  // Calculate sentiment distribution by brand
  const sentimentDistributionByBrand = useMemo(() => {
    const labels = selectedBrands;
    const positive: number[] = [];
    const neutral: number[] = [];
    const negative: number[] = [];
    
    selectedBrands.forEach(brand => {
      const brandPosts = posts[brand] || [];
      let posCount = 0;
      let neuCount = 0;
      let negCount = 0;
      
      brandPosts.forEach(post => {
        if (post.sentimentLabel === 'positive') posCount++;
        else if (post.sentimentLabel === 'neutral') neuCount++;
        else if (post.sentimentLabel === 'negative') negCount++;
      });
      
      positive.push(posCount);
      neutral.push(neuCount);
      negative.push(negCount);
    });
    
    return {
      labels,
      datasets: [
        {
          label: 'Positive',
          data: positive,
          backgroundColor: vibrantColors[2], // Yellow for positive
          borderColor: vibrantColors[2].replace('0.8', '1'),
          borderWidth: 1,
        },
        {
          label: 'Neutral',
          data: neutral,
          backgroundColor: vibrantColors[0], // Blue for neutral
          borderColor: vibrantColors[0].replace('0.8', '1'),
          borderWidth: 1,
        },
        {
          label: 'Negative',
          data: negative,
          backgroundColor: vibrantColors[1], // Red for negative
          borderColor: vibrantColors[1].replace('0.8', '1'),
          borderWidth: 1,
        }
      ]
    };
  }, [selectedBrands, posts, vibrantColors]);
  
  // Calculate average sentiment score over time by brand
  const averageSentimentOverTimeByBrand = useMemo(() => {
    // Gather all dates from all brands
    const allDates = new Set<string>();
    const brandScoresByDate: Record<Brand, Record<string, { total: number; count: number }>> = {
      'Nordstrom': {},
      'Macys': {},
      'Saks': {},
      'Bloomingdales': {},
      'Tjmaxx': {},
      'Sephora': {},
      'Ulta': {},
      'Aritzia': {},
      'American Eagle': {},
      'Walmart': {},
      'Amazon Beauty': {},
      'Revolve': {}
    };
    
    selectedBrands.forEach(brand => {
      const brandPosts = posts[brand] || [];
      brandScoresByDate[brand] = {};
      
      brandPosts.forEach(post => {
        const timestamp = platform === 'Instagram' 
          ? (post as InstagramPost).timestamp 
          : (post as TikTokPost).createTime;
        
        if (timestamp && typeof post.sentimentScore === 'number') {
          try {
            const date = new Date(timestamp);
            const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
            allDates.add(dateStr);
            
            if (!brandScoresByDate[brand][dateStr]) {
              brandScoresByDate[brand][dateStr] = { total: 0, count: 0 };
            }
            
            brandScoresByDate[brand][dateStr].total += post.sentimentScore;
            brandScoresByDate[brand][dateStr].count++;
          } catch (e) {
            console.error('Error processing date for sentiment analysis:', e);
          }
        }
      });
    });
    
    // Sort dates
    const dates = Array.from(allDates).sort();
    
    // Filter brands based on selection
    const brandsToShow = selectedBrandForSentiment === 'all' 
      ? selectedBrands 
      : selectedBrands.filter(brand => brand === selectedBrandForSentiment);
    
    // Create datasets for each brand
    const datasets = brandsToShow.map((brand, index) => {
      const averageScores = dates.map(date => {
        const data = brandScoresByDate[brand][date];
        if (!data || data.count === 0) return null; // Use null for missing data points
        return data.total / data.count;
      });
      
      return {
        label: `${brand}`,
        data: averageScores,
        borderColor: vibrantColors[index % vibrantColors.length].replace('0.8', '1'),
        backgroundColor: vibrantColors[index % vibrantColors.length],
        borderWidth: 2,
        tension: 0.4,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6,
      };
    });
    
    return {
      labels: dates,
      datasets
    };
  }, [selectedBrands, posts, platform, selectedBrandForSentiment, vibrantColors]);
  
  // Function to calculate sentiment distribution for a specific brand
  const calculateSentimentDistribution = (brand: Brand) => {
    let positive = 0;
    let neutral = 0;
    let negative = 0;
    
    const brandPosts = posts[brand] || [];
    
    brandPosts.forEach(post => {
      if (post.sentimentLabel === 'positive') positive++;
      else if (post.sentimentLabel === 'neutral') neutral++;
      else if (post.sentimentLabel === 'negative') negative++;
    });
    
    return {
      labels: ['Positive', 'Neutral', 'Negative'],
      datasets: [
        {
          data: [positive, neutral, negative],
          backgroundColor: [
            vibrantColors[2], // Yellow for positive
            vibrantColors[0], // Blue for neutral
            vibrantColors[1]  // Red for negative
          ],
          borderColor: [
            vibrantColors[2].replace('0.8', '1'),
            vibrantColors[0].replace('0.8', '1'),
            vibrantColors[1].replace('0.8', '1')
          ],
          borderWidth: 1,
        }
      ]
    };
  };
  
  // Calculate sentiment distribution for Nordstrom (main brand)
  const nordstromSentimentDistribution = useMemo(() => {
    return calculateSentimentDistribution(mainBrand);
  }, [posts, mainBrand]);
  
  // Calculate sentiment distribution for selected competitor
  const competitorSentimentDistribution = useMemo(() => {
    return calculateSentimentDistribution(selectedCompetitor);
  }, [posts, selectedCompetitor]);
  
  // Function to calculate sentiment over time for a specific brand
  const calculateSentimentOverTime = (brand: Brand) => {
    // Get posts for the specific brand
    const brandPosts = posts[brand] || [];
    
    // Group by date and sentiment
    const countsByDate: Record<string, { positive: number; neutral: number; negative: number }> = {};
    
    brandPosts.forEach(post => {
      const timestamp = platform === 'Instagram' 
        ? (post as InstagramPost).timestamp 
        : (post as TikTokPost).createTime;
      
      if (timestamp && post.sentimentLabel) {
        try {
          const date = new Date(timestamp);
          const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
          
          if (!countsByDate[dateStr]) {
            countsByDate[dateStr] = { positive: 0, neutral: 0, negative: 0 };
          }
          
          if (post.sentimentLabel === 'positive') countsByDate[dateStr].positive++;
          else if (post.sentimentLabel === 'neutral') countsByDate[dateStr].neutral++;
          else if (post.sentimentLabel === 'negative') countsByDate[dateStr].negative++;
        } catch (e) {
          console.error('Error processing date for sentiment analysis:', e);
        }
      }
    });
    
    // Convert to arrays for chart
    const dates = Object.keys(countsByDate).sort();
    const positiveData = dates.map(date => countsByDate[date].positive);
    const neutralData = dates.map(date => countsByDate[date].neutral);
    const negativeData = dates.map(date => countsByDate[date].negative);
    
    return {
      labels: dates,
      datasets: [
        {
          label: 'Positive',
          data: positiveData,
          backgroundColor: vibrantColors[2], // Yellow for positive
          borderColor: vibrantColors[2].replace('0.8', '1'),
          borderWidth: 1,
          fill: 'origin',
          tension: 0.4,
        },
        {
          label: 'Neutral',
          data: neutralData,
          backgroundColor: vibrantColors[0], // Blue for neutral
          borderColor: vibrantColors[0].replace('0.8', '1'),
          borderWidth: 1,
          fill: 'origin',
          tension: 0.4,
        },
        {
          label: 'Negative',
          data: negativeData,
          backgroundColor: vibrantColors[1], // Red for negative
          borderColor: vibrantColors[1].replace('0.8', '1'),
          borderWidth: 1,
          fill: 'origin',
          tension: 0.4,
        }
      ]
    };
  };
  
  // Calculate sentiment over time for Nordstrom (main brand)
  const nordstromSentimentOverTime = useMemo(() => {
    return calculateSentimentOverTime(mainBrand);
  }, [posts, platform, mainBrand, vibrantColors]);
  
  // Calculate sentiment over time for selected competitor
  const competitorSentimentOverTime = useMemo(() => {
    return calculateSentimentOverTime(selectedCompetitor);
  }, [posts, platform, selectedCompetitor, vibrantColors]);
  
  // Check if there's any data to display
  const hasData = useMemo(() => {
    let totalPosts = 0;
    selectedBrands.forEach(brand => {
      totalPosts += (posts[brand]?.length || 0);
    });
    return totalPosts > 0;
  }, [selectedBrands, posts]);
  
  // Check if we're dealing with TikTok data but no sentiments have been calculated
  const checkAndFixTikTokData = useMemo(() => {
    if (platform === 'TikTok') {
      let hasPosts = false;
      let hasSentiment = false;
      
      selectedBrands.forEach(brand => {
        const brandPosts = posts[brand] || [];
        if (brandPosts.length > 0) {
          hasPosts = true;
          // Check if at least one post has sentiment data (either score or label)
          if (brandPosts.some(post => 'sentimentScore' in post || 'sentimentLabel' in post)) {
            hasSentiment = true;
          }
        }
      });
      
      return hasPosts && !hasSentiment; // Return true if there are TikTok posts but no sentiment data
    }
    return false;
  }, [platform, selectedBrands, posts]);
  
  // Common chart options
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${percentage}% (${value})`;
          }
        }
      }
    },
  };

  // Options for stacked area chart (Line type)
  const stackedAreaOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        stacked: true,
        beginAtZero: true,
      },
      x: {
        stacked: true,
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };
  
  // Options specifically for Bar charts
  const stackedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        stacked: true,
        beginAtZero: true,
      },
      x: {
        stacked: true,
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  if (!hasData && !checkAndFixTikTokData) {
    return (
      <div className="mt-8 p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Sentiment Analysis</h2>
        <EmptyChartFallback message={`No ${platform} data available for sentiment analysis`} />
      </div>
    );
  }

  return (
    <div className="mt-8 p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Sentiment Analysis</h2>
      <p className="text-sm text-gray-600 mb-6">
        Sentiment analysis of {platform} posts for selected brands based on post text/captions.
      </p>
      
      {checkAndFixTikTokData ? (
        <div className="p-6 text-center bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-yellow-700 mb-4">
            <strong>Note:</strong> TikTok sentiment analysis requires text data to be properly loaded. 
            Please ensure your TikTok data includes captions or text content.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* Bar Chart - Sentiment Distribution by Brand */}
          <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Sentiment Distribution by Brand</h3>
            <div className="h-80">
              {sentimentDistributionByBrand.datasets[0].data.every(d => d === 0) &&
               sentimentDistributionByBrand.datasets[1].data.every(d => d === 0) &&
               sentimentDistributionByBrand.datasets[2].data.every(d => d === 0) ? (
                <EmptyChartFallback message="No sentiment data available" />
              ) : (
                <Bar data={sentimentDistributionByBrand} options={stackedBarOptions} />
              )}
            </div>
          </div>
          
          {/* Line Chart - Average Sentiment Score Over Time - Side by Side Comparison */}
          <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Average Sentiment Score Over Time</h3>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="competitor-select-label">Competitor Brand</InputLabel>
                <Select
                  labelId="competitor-select-label"
                  id="competitor-select"
                  value={selectedCompetitor}
                  onChange={(e: SelectChangeEvent) => setSelectedCompetitor(e.target.value as Brand)}
                  label="Competitor Brand"
                >
                  {selectedBrands.filter(brand => brand !== mainBrand).map(brand => (
                    <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Nordstrom Chart */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="text-md font-medium mb-2 text-center">{mainBrand}</h4>
                <div className="h-64">
                  {averageSentimentOverTimeByBrand.labels.length === 0 ? (
                    <EmptyChartFallback message="No time-series sentiment data available" />
                  ) : (
                    <Line 
                      data={{
                        labels: averageSentimentOverTimeByBrand.labels,
                        datasets: averageSentimentOverTimeByBrand.datasets.filter(ds => ds.label === mainBrand)
                      }} 
                      options={lineOptions} 
                    />
                  )}
                </div>
              </div>
              
              {/* Competitor Chart */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="text-md font-medium mb-2 text-center">{selectedCompetitor}</h4>
                <div className="h-64">
                  {averageSentimentOverTimeByBrand.labels.length === 0 ? (
                    <EmptyChartFallback message="No time-series sentiment data available" />
                  ) : (
                    <Line 
                      data={{
                        labels: averageSentimentOverTimeByBrand.labels,
                        datasets: averageSentimentOverTimeByBrand.datasets.filter(ds => ds.label === selectedCompetitor)
                      }} 
                      options={lineOptions} 
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Pie Chart - Overall Sentiment Distribution - Side by Side Comparison */}
          <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Overall Sentiment Distribution</h3>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="pie-competitor-select-label">Competitor Brand</InputLabel>
                <Select
                  labelId="pie-competitor-select-label"
                  id="pie-competitor-select"
                  value={selectedCompetitor}
                  onChange={(e: SelectChangeEvent) => setSelectedCompetitor(e.target.value as Brand)}
                  label="Competitor Brand"
                >
                  {selectedBrands.filter(brand => brand !== mainBrand).map(brand => (
                    <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Nordstrom Chart */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="text-md font-medium mb-2 text-center">{mainBrand}</h4>
                <div className="h-64">
                  {nordstromSentimentDistribution.datasets[0].data.every(d => d === 0) ? (
                    <EmptyChartFallback message="No sentiment data available" />
                  ) : (
                    <Pie data={nordstromSentimentDistribution} options={pieOptions} />
                  )}
                </div>
              </div>
              
              {/* Competitor Chart */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="text-md font-medium mb-2 text-center">{selectedCompetitor}</h4>
                <div className="h-64">
                  {competitorSentimentDistribution.datasets[0].data.every(d => d === 0) ? (
                    <EmptyChartFallback message="No sentiment data available" />
                  ) : (
                    <Pie data={competitorSentimentDistribution} options={pieOptions} />
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Stacked Area Chart - Sentiment Volume Over Time - Side by Side Comparison */}
          <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Sentiment Volume Over Time</h3>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="volume-competitor-select-label">Competitor Brand</InputLabel>
                <Select
                  labelId="volume-competitor-select-label"
                  id="volume-competitor-select"
                  value={selectedCompetitor}
                  onChange={(e: SelectChangeEvent) => setSelectedCompetitor(e.target.value as Brand)}
                  label="Competitor Brand"
                >
                  {selectedBrands.filter(brand => brand !== mainBrand).map(brand => (
                    <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Nordstrom Chart */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="text-md font-medium mb-2 text-center">{mainBrand}</h4>
                <div className="h-64">
                  {nordstromSentimentOverTime.labels.length === 0 ? (
                    <EmptyChartFallback message="No time-series sentiment data available" />
                  ) : (
                    <Bar 
                      data={nordstromSentimentOverTime} 
                      options={stackedBarOptions} 
                    />
                  )}
                </div>
              </div>
              
              {/* Competitor Chart */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="text-md font-medium mb-2 text-center">{selectedCompetitor}</h4>
                <div className="h-64">
                  {competitorSentimentOverTime.labels.length === 0 ? (
                    <EmptyChartFallback message="No time-series sentiment data available" />
                  ) : (
                    <Bar 
                      data={competitorSentimentOverTime} 
                      options={stackedBarOptions} 
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SentimentAnalysis;
