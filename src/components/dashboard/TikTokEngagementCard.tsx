import React from 'react';
import { motion } from 'framer-motion';
import * as BiIcons from 'react-icons/bi';

interface TikTokEngagementCardProps {
  tikTokEngagementRate: number;
  competitorTikTokEngagementRate: number;
  selectedCompetitor: string;
  cardVariants: any;
}

import { formatKpiValue } from '../../utils'; // Import the formatter

const TikTokEngagementCard: React.FC<TikTokEngagementCardProps> = ({
  tikTokEngagementRate,
  competitorTikTokEngagementRate,
  selectedCompetitor,
  cardVariants
}) => {
  // The tikTokEngagementRate from calculateTotalMetrics is already a percentage value (e.g., 10.5 for 10.5%)
  // and formatted to 1 decimal place. formatKpiValue will handle toFixed(2) and add '%'.
  const nordstromERDisplay = formatKpiValue(tikTokEngagementRate, true);
  const competitorERDisplay = formatKpiValue(competitorTikTokEngagementRate, true);

  let differenceText = 'Equal engagement rates.';
  if (tikTokEngagementRate !== null && competitorTikTokEngagementRate !== null && !isNaN(Number(tikTokEngagementRate)) && !isNaN(Number(competitorTikTokEngagementRate))) {
    const difference = Number(tikTokEngagementRate) - Number(competitorTikTokEngagementRate);
    if (difference !== 0) {
      const formattedDifference = formatKpiValue(Math.abs(difference), true);
      if (difference > 0) {
        differenceText = `Nordstrom has ${formattedDifference} higher engagement.`;
      } else {
        differenceText = `${selectedCompetitor} has ${formattedDifference} higher engagement.`;
      }
    }
  }


  return (
    <motion.div
      custom={4} // Ensure this custom index is unique if used with others in the same list
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-lg hover:shadow-xl transform hover:scale-[1.01] transition-all duration-300 ease-out"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Engagement Rate (TikTok)</p>
          <h3 className="text-3xl font-bold text-nordstrom-blue mt-1">{nordstromERDisplay}</h3>
        </div>
        <BiIcons.BiTrendingUp className="text-3xl text-nordstrom-blue/70 dark:text-nordstrom-blue/60" />
      </div>
      <div className="mt-4 text-xs text-gray-600 dark:text-gray-300">
        <div className="flex justify-between">
          <p>Nordstrom</p>
          <p className="font-medium">{nordstromERDisplay}</p>
        </div>
        <div className="flex justify-between mt-1">
          <p>{selectedCompetitor}</p>
          <p className="font-medium">{competitorERDisplay}</p>
        </div>
        {nordstromERDisplay !== "N/A" && competitorERDisplay !== "N/A" && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
            <p>
              {differenceText}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TikTokEngagementCard;