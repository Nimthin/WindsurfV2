import React from 'react';
import { motion } from 'framer-motion';
import * as BiIcons from 'react-icons/bi';

interface TikTokEngagementCardProps {
  tikTokEngagementRate: number;
  competitorTikTokEngagementRate: number;
  selectedCompetitor: string;
  cardVariants: any;
}

const TikTokEngagementCard: React.FC<TikTokEngagementCardProps> = ({
  tikTokEngagementRate,
  competitorTikTokEngagementRate,
  selectedCompetitor,
  cardVariants
}) => {
  return (
    <motion.div
      custom={4}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white shadow-lg"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium opacity-80">Engagement Rate</p>
          <h3 className="text-2xl font-bold mt-1">{(tikTokEngagementRate * 100).toFixed(2)}%</h3>
        </div>
        <BiIcons.BiTrendingUp className="text-3xl opacity-80" />
      </div>
      <div className="mt-3 text-sm">
        <div className="flex justify-between">
          <p className="opacity-80">Nordstrom</p>
          <p className="font-medium">{(tikTokEngagementRate * 100).toFixed(2)}%</p>
        </div>
        <div className="flex justify-between mt-1">
          <p className="opacity-80">{selectedCompetitor}</p>
          <p className="font-medium">{(competitorTikTokEngagementRate * 100).toFixed(2)}%</p>
        </div>
        {tikTokEngagementRate > 0 && competitorTikTokEngagementRate > 0 && (
          <div className="mt-2 text-xs">
            <p className="opacity-90">
              {tikTokEngagementRate > competitorTikTokEngagementRate 
                ? `Nordstrom has ${((tikTokEngagementRate - competitorTikTokEngagementRate) * 100).toFixed(2)}% higher engagement`
                : tikTokEngagementRate < competitorTikTokEngagementRate
                  ? `${selectedCompetitor} has ${((competitorTikTokEngagementRate - tikTokEngagementRate) * 100).toFixed(2)}% higher engagement`
                  : 'Equal engagement rates'}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TikTokEngagementCard;
