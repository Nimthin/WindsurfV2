import { Brand, InstagramData, InstagramPost, TikTokData, TikTokPost } from '../types';
import { analyzeSentiment } from './sentimentUtils';

/**
 * Converts raw Instagram data from Excel to the format expected by the application
 * @param rawData Raw data from Excel file
 * @param brand Brand associated with this data
 * @returns Array of properly formatted Instagram posts
 */
export const convertInstagramRawData = (rawData: any[], brand: Brand): InstagramPost[] => {
  
  return rawData.map((post: any) => {
    // Extract hashtags from multiple columns if available
    const hashtags: string[] = [];
    
    // Try to extract hashtags from numbered fields
    for (let i = 0; i <= 18; i++) {
      if (post[`hashtags/${i}`] && post[`hashtags/${i}`].trim() !== '') {
        hashtags.push(post[`hashtags/${i}`]);
      }
    }
    
    // If no hashtags found above, try to extract from any field containing 'hashtag'
    if (hashtags.length === 0) {
      Object.keys(post).forEach(key => {
        if (key.toLowerCase().includes('hashtag') && post[key] && typeof post[key] === 'string' && post[key].trim() !== '') {
          hashtags.push(post[key].trim());
        }
      });
    }
    
    // Extract mentions from multiple columns if available
    const mentions: string[] = [];
    
    // Try to extract mentions from numbered fields
    for (let i = 0; i <= 11; i++) {
      if (post[`mentions/${i}`] && post[`mentions/${i}`].trim() !== '') {
        mentions.push(post[`mentions/${i}`]);
      }
    }
    
    // If no mentions found above, try to extract from any field containing 'mention'
    if (mentions.length === 0) {
      Object.keys(post).forEach(key => {
        if (key.toLowerCase().includes('mention') && post[key] && typeof post[key] === 'string' && post[key].trim() !== '') {
          mentions.push(post[key].trim());
        }
      });
    }
    
    // Ensure timestamp is valid
    let timestamp = post.timestamp;
    if (!timestamp || !Date.parse(timestamp)) {
      // Try to find any field that might be a date
      const possibleDateFields = ['createTime', 'createTimeISO', 'date', 'createdAt'];
      for (const field of possibleDateFields) {
        if (post[field] && Date.parse(post[field])) {
          timestamp = post[field];
          break;
        }
      }
      
      // If still no valid date, use current date
      if (!timestamp || !Date.parse(timestamp)) {
        timestamp = new Date().toISOString();
      }
    }
    
    // Determine if this is a video post based on available fields
    const isVideo = 
      (post.videoViewCount && parseFloat(post.videoViewCount) > 0) || 
      (post.videoPlayCount && parseFloat(post.videoPlayCount) > 0) || 
      post.type === 'video' || 
      post.mediaType === 'video';
    
    // Analyze sentiment from caption text
    const captionText = post.caption || '';
    const sentiment = analyzeSentiment(captionText);
    
    return {
      id: `${brand}-ig-${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      shortcode: post.url || post.shortcode || '',
      caption: captionText,
      likesCount: parseFloat(post.likesCount || '0'),
      commentsCount: parseFloat(post.commentsCount || '0'),
      locationName: post.locationName || undefined,
      isSponsored: post.isSponsored === 'TRUE' || post.isSponsored === true,
      mediaType: post.mediaType || (isVideo ? 'video' : 'image'),
      mediaUrl: post.url || post.mediaUrl || '',
      mentions,
      hashtags,
      thumbnailUrl: post.url || post.thumbnailUrl || '',
      type: isVideo ? 'video' : 'image',
      videoViewCount: isVideo ? parseFloat(post.videoViewCount || '0') : undefined,
      videoPlayCount: isVideo ? parseFloat(post.videoPlayCount || '0') : undefined,
      // Add sentiment analysis
      sentimentScore: sentiment.score,
      sentimentLabel: sentiment.label
    };
  });
};

/**
 * Converts raw TikTok data from Excel to the format expected by the application
 * @param rawData Raw data from Excel file
 * @param brand Brand associated with this data
 * @returns Array of properly formatted TikTok posts
 */
export const convertTiktokRawData = (rawData: any[], brand: Brand): TikTokPost[] => {
  
  return rawData.map((post: any) => {
    // Get the creation time from the specified columns
    let createTime = post.createTime || post.createTimeISO || new Date().toISOString();
    
    // Extract hashtags from the specified hashtag columns
    const hashtags: string[] = [];
    for (let i = 0; i <= 8; i++) {
      const hashtagKey = `hashtags/${i}/name`;
      if (post[hashtagKey] && typeof post[hashtagKey] === 'string' && post[hashtagKey].trim() !== '') {
        hashtags.push(post[hashtagKey].trim());
      }
    }
    
    // Extract mentions from the specified columns
    const mentions: string[] = [];
    if (post['mentions/0'] && typeof post['mentions/0'] === 'string') {
      mentions.push(post['mentions/0']);
    }
    if (post['mentions/1'] && typeof post['mentions/1'] === 'string') {
      mentions.push(post['mentions/1']);
    }
    
    // Extract detailed mentions
    if (post['detailedMentions/0/name'] && typeof post['detailedMentions/0/name'] === 'string') {
      mentions.push(post['detailedMentions/0/name']);
    }
    if (post['detailedMentions/1/name'] && typeof post['detailedMentions/1/name'] === 'string') {
      mentions.push(post['detailedMentions/1/name']);
    }
    
    // Use safe number parsing for all count fields using only the specified columns
    const diggCount = parseFloat(post.diggCount || '0');
    const commentCount = parseFloat(post.commentCount || '0');
    const playCount = parseFloat(post.playCount || '0');
    const shareCount = parseFloat(post.shareCount || '0');
    const collectCount = parseFloat(post.collectCount || '0');
    
    // Extract reach and impression metrics for TikTok
    const views = parseFloat(post.playCount || '0'); // Using playCount as views
    const reach = parseFloat(post.playCount || '0'); // Using playCount as reach since we don't have a specific reach column
    
    // Convert hashtags to the required format
    const formattedHashtags = hashtags.map(tag => ({
      id: `hashtag-${Math.random().toString(36).substr(2, 9)}`,
      name: tag.replace('#', '')
    }));
    
    // Analyze sentiment from post text
    const postText = post.text || '';
    const sentiment = analyzeSentiment(postText);
    
    return {
      id: `${brand}-tt-${Math.random().toString(36).substr(2, 9)}`,
      text: postText,
      createTime,
      authorMeta: {
        id: `author-${Math.random().toString(36).substr(2, 9)}`,
        name: post['authorMeta/name'] || 'Unknown Author',
        fans: parseFloat(post['authorMeta/fans'] || '0'),
        following: parseFloat(post['authorMeta/following'] || '0'),
        heart: parseFloat(post['authorMeta/heart'] || '0'),
        verified: post['authorMeta/verified'] === 'true' || false,
        privateAccount: post['authorMeta/privateAccount'] === 'true' || false,
        digg: parseFloat(post['authorMeta/digg'] || '0'),
        region: post['authorMeta/region'] || '',
        friends: parseFloat(post['authorMeta/friends'] || '0'),
        originalAvatarUrl: post['authorMeta/originalAvatarUrl'] || ''
      },
      musicMeta: {
        musicId: `music-${Math.random().toString(36).substr(2, 9)}`,
        musicName: 'Unknown Music'
      },
      videoUrl: '',
      webVideoUrl: '',
      coverUrl: '',
      diggCount,
      shareCount,
      playCount,
      commentCount,
      collectCount,
      // Add reach and views metrics for ReachSection component
      views,
      reach,
      hashtags: formattedHashtags,
      // Add sentiment analysis
      sentimentScore: sentiment.score,
      sentimentLabel: sentiment.label,
      // Add location data
      locationMeta: {
        city: post['locationMeta/city'] || '',
        cityCode: post['locationMeta/cityCode'] || '',
        address: post['locationMeta/address'] || '',
        locationName: post['locationMeta/locationName'] || '',
        countryCode: post['locationMeta/countryCode'] || ''
      },
      // Add effect stickers
      effectStickers: post['effectStickers/0/name'] ? [{
        ID: post['effectStickers/0/ID'] || '',
        name: post['effectStickers/0/name'] || '',
        stickerStats: {
          useCount: parseFloat(post['effectStickers/0/stickerStats/useCount'] || '0')
        }
      }] : undefined,
      // Add other metadata
      textLanguage: post.textLanguage || '',
      fromProfileSection: post.fromProfileSection === 'true' || false,
      isSponsored: post.isSponsored === 'true' || false,
      // Add mentions
      mentions: mentions
    };
  });
};
