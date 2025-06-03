import Sentiment from 'sentiment';

// Initialize sentiment analyzer
const sentiment = new Sentiment();

// Sentiment score ranges
export const SENTIMENT_THRESHOLDS = {
  POSITIVE: 0.3,  // Scores above this are positive
  NEGATIVE: -0.3, // Scores below this are negative
  // Between these thresholds is considered neutral
};

// Sentiment label type
export type SentimentLabel = 'positive' | 'neutral' | 'negative';

// Function to analyze text and return sentiment score and label
export const analyzeSentiment = (text: string): { score: number; label: SentimentLabel } => {
  if (!text) {
    return { score: 0, label: 'neutral' };
  }
  
  // Analyze text using sentiment library
  const result = sentiment.analyze(text);
  
  // Normalize score to range between -1 and 1
  const normalizedScore = result.comparative;
  
  // Determine sentiment label based on score
  let label: SentimentLabel;
  if (normalizedScore >= SENTIMENT_THRESHOLDS.POSITIVE) {
    label = 'positive';
  } else if (normalizedScore <= SENTIMENT_THRESHOLDS.NEGATIVE) {
    label = 'negative';
  } else {
    label = 'neutral';
  }
  
  return {
    score: normalizedScore,
    label
  };
};

// Function to get color for sentiment label
export const getSentimentColor = (label: SentimentLabel): string => {
  switch (label) {
    case 'positive':
      return '#4CAF50'; // Green
    case 'negative':
      return '#F44336'; // Red
    case 'neutral':
    default:
      return '#9E9E9E'; // Gray
  }
};

// Function to get sentiment distribution from posts
export const getSentimentDistribution = (
  posts: Array<any>
): { positive: number; neutral: number; negative: number } => {
  const distribution = {
    positive: 0,
    neutral: 0,
    negative: 0
  };
  
  if (!posts || !Array.isArray(posts)) {
    return distribution;
  }
  
  posts.forEach(post => {
    if (post.sentimentLabel) {
      const label = post.sentimentLabel as keyof typeof distribution;
      if (label === 'positive' || label === 'neutral' || label === 'negative') {
        distribution[label]++;
      }
    }
  });
  
  return distribution;
};

// Function to get average sentiment score by date
export const getAverageSentimentByDate = (
  posts: Array<any>
): Array<{ date: string; score: number }> => {
  if (!posts || !Array.isArray(posts)) {
    return [];
  }
  
  const scoresByDate: Record<string, { total: number; count: number }> = {};
  
  posts.forEach(post => {
    if (post.timestamp && typeof post.sentimentScore === 'number') {
      try {
        const date = new Date(post.timestamp);
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        if (!scoresByDate[dateStr]) {
          scoresByDate[dateStr] = { total: 0, count: 0 };
        }
        
        scoresByDate[dateStr].total += post.sentimentScore;
        scoresByDate[dateStr].count++;
      } catch (e) {
        console.error('Error processing date for sentiment analysis:', e);
      }
    }
  });
  
  // Convert to array and calculate averages
  return Object.entries(scoresByDate)
    .map(([date, { total, count }]) => ({
      date,
      score: count > 0 ? total / count : 0
    }))
    .sort((a, b) => a.date.localeCompare(b.date)); // Sort by date
};

// Function to get sentiment counts over time (for stacked area chart)
export const getSentimentOverTime = (
  posts: Array<any>
): Array<{ date: string; positive: number; neutral: number; negative: number }> => {
  if (!posts || !Array.isArray(posts)) {
    return [];
  }
  
  const countsByDate: Record<string, { positive: number; neutral: number; negative: number }> = {};
  
  posts.forEach(post => {
    if (post.timestamp && post.sentimentLabel && 
        (post.sentimentLabel === 'positive' || post.sentimentLabel === 'neutral' || post.sentimentLabel === 'negative')) {
      try {
        const date = new Date(post.timestamp);
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        if (!countsByDate[dateStr]) {
          countsByDate[dateStr] = { positive: 0, neutral: 0, negative: 0 };
        }
        
        const label = post.sentimentLabel as keyof typeof countsByDate[typeof dateStr];
        countsByDate[dateStr][label]++;
      } catch (e) {
        console.error('Error processing date for sentiment analysis:', e);
      }
    }
  });
  
  // Convert to array
  return Object.entries(countsByDate)
    .map(([date, counts]) => ({
      date,
      ...counts
    }))
    .sort((a, b) => a.date.localeCompare(b.date)); // Sort by date
};
