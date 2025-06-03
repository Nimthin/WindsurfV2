import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import * as FaIcons from 'react-icons/fa';
import * as AiIcons from 'react-icons/ai';
import * as BiIcons from 'react-icons/bi';
import * as HiIcons from 'react-icons/hi';
import { ALL_BRANDS } from '../../services/api';
import { useSocialData } from '../../context/SocialDataContext';
import { AVAILABLE_MONTHS, initialFilterOptions } from '../../context/SocialDataContext';
import { Brand, Platform } from '../../types';

interface HeaderProps {
  // No props needed for simplified header
}

const Header: React.FC<HeaderProps> = () => {
  const { 
    isLoading, 
    refreshData, 
    socialData, 
    filterOptions, 
    setFilterOptions,
    selectedBrands, 
    setSelectedBrands,
    darkMode
  } = useSocialData();

  const [showFilters, setShowFilters] = useState(false);
  const [refreshClicked, setRefreshClicked] = useState(false);
  const [activeFilterSection, setActiveFilterSection] = useState<'platform' | 'months' | 'brands' | null>(null);
  
  // Handle click outside to close filter dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.filter-dropdown') && !target.closest('.filter-button')) {
        setActiveFilterSection(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle brand selection
  const handleBrandSelection = (brand: Brand) => {
    if (selectedBrands.includes(brand)) {
      // Don't allow deselecting if it's the last selected brand
      if (selectedBrands.length > 1) {
        setSelectedBrands(selectedBrands.filter(b => b !== brand));
      }
    } else {
      setSelectedBrands([...selectedBrands, brand]);
    }
    // Refresh data when changing brands
    refreshData();
  };

  // Handle data refresh
  const handleRefresh = async () => {
    setRefreshClicked(true);
    await refreshData();
    setTimeout(() => setRefreshClicked(false), 1000);
  };

  // Handle platform filter change
  const handlePlatformChange = (platform: Platform | 'All') => {
    setFilterOptions({
      ...filterOptions,
      platform
    });
    // Refresh data when changing platform
    refreshData();
  };
  
  // Handle month selection - single select dropdown
  const handleMonthSelection = (month: string) => {
    setFilterOptions({
      ...filterOptions,
      selectedMonth: month
    });
    // Refresh data when changing months
    refreshData();
  };

  // Get the last fetched time for display
  const getLastFetchedTime = () => {
    const times: Date[] = [];
    
    // Collect all last fetched times
    selectedBrands.forEach(brand => {
      const instagramTime = socialData.lastFetched.Instagram[brand];
      const tiktokTime = socialData.lastFetched.TikTok[brand];
      
      // Make sure we only add valid Date objects
      if (instagramTime && instagramTime instanceof Date && !isNaN(instagramTime.getTime())) {
        times.push(instagramTime);
      }
      if (tiktokTime && tiktokTime instanceof Date && !isNaN(tiktokTime.getTime())) {
        times.push(tiktokTime);
      }
    });
    
    if (times.length === 0) return 'Never';
    
    // Return the most recent time
    try {
      const mostRecent = new Date(Math.max(...times.map(t => t.getTime())));
      return format(mostRecent, 'MMM dd, yyyy HH:mm');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Recently';
    }
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-10 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} shadow-md transition-all duration-300`}>
      <div className="p-4 flex justify-between items-center">
        <div>
          <div className="flex items-center">
            <h1 className="text-xl font-bold">Nordstrom Social Analytics</h1>
            {isLoading && (
              <div className="ml-3 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                <span className="text-xs text-blue-500">Updating data...</span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 flex items-center">
            <span className="mr-1">📅</span>
            Last updated: {getLastFetchedTime()}
            <span className="ml-2 text-xs text-blue-500 cursor-pointer hover:underline" onClick={handleRefresh}>
              Refresh now
            </span>
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Theme toggle button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh} /* Using refresh button instead of theme toggle for now */
            className={`p-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} flex items-center`}
            aria-label="Refresh data"
            title="Refresh data"
          >
            <BiIcons.BiRefresh size={20} />
          </motion.button>
          
          {/* Filter dropdowns */}
          <div className="flex items-center space-x-2">
            {/* Month selector */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveFilterSection(activeFilterSection === 'months' ? null : 'months')}
                className={`p-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} flex items-center filter-button`}
              >
                <FaIcons.FaCalendarAlt className="mr-2" size={14} />
                <span>Month: {filterOptions.selectedMonth}</span>
                <BiIcons.BiChevronDown className="ml-1" />
              </motion.button>
              
              {activeFilterSection === 'months' && (
                <div className={`absolute right-0 mt-2 w-64 rounded-md shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} ring-1 ring-black ring-opacity-5 z-50 filter-dropdown`}>
                  <div className="p-3">
                    <div className="mb-2">
                      <h3 className="font-medium">Select Month</h3>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      {['All (Feb-May)', 'February', 'March', 'April', 'May'].map((month) => (
                        <button
                          key={month}
                          onClick={() => handleMonthSelection(month)}
                          className={`px-3 py-2 rounded-md flex items-center justify-between ${
                            filterOptions.selectedMonth === month
                              ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                              : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
                          }`}
                        >
                          <span>{month}</span>
                          {filterOptions.selectedMonth === month && 
                            <AiIcons.AiOutlineCheck size={14} className="ml-2" />
                          }
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Brand selector */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveFilterSection(activeFilterSection === 'brands' ? null : 'brands')}
                className={`p-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} flex items-center filter-button`}
              >
                <FaIcons.FaStore className="mr-2" size={14} />
                <span>Brands ({selectedBrands.length})</span>
                <BiIcons.BiChevronDown className="ml-1" />
              </motion.button>
              
              {activeFilterSection === 'brands' && (
                <div className={`absolute right-0 mt-2 w-72 rounded-md shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} ring-1 ring-black ring-opacity-5 z-50 filter-dropdown`}>
                  <div className="p-3">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Select Brands</h3>
                      <div className="text-xs text-gray-500">
                        {selectedBrands.length} selected
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                      {ALL_BRANDS.map((brand) => (
                        <button
                          key={brand}
                          onClick={() => handleBrandSelection(brand)}
                          className={`px-3 py-2 rounded-md flex items-center justify-between ${
                            selectedBrands.includes(brand)
                              ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                              : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
                          }`}
                        >
                          <span className="truncate">{brand}</span>
                          {selectedBrands.includes(brand) && 
                            <AiIcons.AiOutlineCheck size={14} className="ml-2 flex-shrink-0" />
                          }
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Platform selector */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveFilterSection(activeFilterSection === 'platform' ? null : 'platform')}
                className={`p-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} flex items-center filter-button`}
              >
                <FaIcons.FaShareAlt className="mr-2" size={14} />
                <span>Platforms</span>
                <BiIcons.BiChevronDown className="ml-1" />
              </motion.button>
              
              {activeFilterSection === 'platform' && (
                <div className={`absolute right-0 mt-2 w-52 rounded-md shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} ring-1 ring-black ring-opacity-5 z-50 filter-dropdown`}>
                  <div className="p-3">
                    <div className="mb-2">
                      <h3 className="font-medium">Select Platform</h3>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      {['All', 'Instagram', 'TikTok'].map((platform) => (
                        <button
                          key={platform}
                          onClick={() => handlePlatformChange(platform as Platform | 'All')}
                          className={`px-3 py-2 rounded-md flex items-center justify-between ${
                            filterOptions.platform === platform
                              ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                              : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
                          }`}
                        >
                          <span className="flex items-center">
                            {platform === 'All' && <span className="mr-2">🌐</span>}
                            {platform === 'Instagram' && <span className="mr-2">📷</span>}
                            {platform === 'TikTok' && <span className="mr-2">🎵</span>}
                            {platform}
                          </span>
                          {filterOptions.platform === platform && 
                            <AiIcons.AiOutlineCheck size={14} className="ml-2" />
                          }
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Reset filters button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setFilterOptions({
                  ...initialFilterOptions,
                  selectedMonth: 'All (Feb-May)' // Make sure we're using the new property
                });
                setSelectedBrands(['Nordstrom']);
                refreshData();
              }}
              className={`p-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} flex items-center`}
              title="Reset all filters"
            >
              <BiIcons.BiReset className="mr-1" />
              <span>Reset</span>
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={refreshClicked ? { rotate: 360 } : {}}
            transition={{ duration: 0.5 }}
            onClick={handleRefresh}
            disabled={isLoading}
            className={`p-2 rounded-md ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white flex items-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <span className={`mr-2 ${isLoading ? 'animate-spin' : ''}`}>🔄</span>
            <span>{isLoading ? 'Refreshing...' : 'Refresh Data'}</span>
          </motion.button>
          
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} flex items-center`}
              onClick={() => {
                // Generate export data for selected brands
                const exportData = {
                  exportDate: new Date().toISOString(),
                  selectedBrands,
                  platforms: filterOptions.platform,
                  month: filterOptions.selectedMonth,
                  instagramData: Object.fromEntries(
                    selectedBrands.map(brand => [brand, socialData.instagram[brand]])
                  ),
                  tiktokData: Object.fromEntries(
                    selectedBrands.map(brand => [brand, socialData.tiktok[brand]])
                  )
                };
                
                // Create a downloadable JSON file
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `social-analytics-export-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
            >
              <span className="mr-2">📄</span>
              <span>Export</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`px-4 pb-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
          >
            {/* Filter Navigation */}
            <div className="border-t pt-4 mb-4">
              <div className="flex border-b">
                <button
                  onClick={() => setActiveFilterSection('platform')}
                  className={`px-4 py-2 font-medium ${
                    activeFilterSection === 'platform' 
                      ? `border-b-2 ${darkMode ? 'border-blue-500 text-blue-400' : 'border-blue-500 text-blue-500'}` 
                      : 'text-gray-500'
                  }`}
                >
                  Platforms
                </button>
                <button
                  onClick={() => setActiveFilterSection('months')}
                  className={`px-4 py-2 font-medium ${
                    activeFilterSection === 'months' 
                      ? `border-b-2 ${darkMode ? 'border-blue-500 text-blue-400' : 'border-blue-500 text-blue-500'}` 
                      : 'text-gray-500'
                  }`}
                >
                  Months
                </button>
                <button
                  onClick={() => setActiveFilterSection('brands')}
                  className={`px-4 py-2 font-medium ${
                    activeFilterSection === 'brands' 
                      ? `border-b-2 ${darkMode ? 'border-blue-500 text-blue-400' : 'border-blue-500 text-blue-500'}` 
                      : 'text-gray-500'
                  }`}
                >
                  Brands
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Platform Filter Section */}
              {activeFilterSection === 'platform' && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Select Platform</h3>
                    <div className="text-xs text-gray-500">Choose which platform(s) to analyze</div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {['All', 'Instagram', 'TikTok'].map((platform) => (
                      <button
                        key={platform}
                        onClick={() => handlePlatformChange(platform as Platform | 'All')}
                        className={`px-4 py-2 rounded-md flex items-center ${filterOptions.platform === platform
                          ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                          : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}
                        `}
                      >
                        {platform === 'All' && <span className="mr-2">🌐</span>}
                        {platform === 'Instagram' && <span className="mr-2">📷</span>}
                        {platform === 'TikTok' && <span className="mr-2">🎵</span>}
                        {platform}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Months Filter Section */}
              {activeFilterSection === 'months' && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Select Months</h3>
                    <div className="flex space-x-2">
                        <button
                          onClick={() => handleMonthSelection('All (Feb-May)')}
                          className="text-xs text-blue-500 hover:underline flex items-center"
                        >
                        <AiIcons.AiOutlineCheckSquare size={16} className="mr-1" /> Select All
                      </button>
                        <button
                          onClick={() => handleMonthSelection('February')}
                          className="text-xs text-blue-500 hover:underline flex items-center"
                        >
                        <AiIcons.AiOutlineClear size={16} className="mr-1" /> Clear
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {AVAILABLE_MONTHS.map((month) => (
                      <button
                        key={month}
                        onClick={() => handleMonthSelection(month)}
                        className={`px-4 py-3 rounded-md flex items-center justify-between ${
                          filterOptions.selectedMonth === month
                            ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                            : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
                        }`}
                      >
                        <span>{month}</span>
                        {filterOptions.selectedMonth === month && 
                          <AiIcons.AiOutlineCheck size={16} className="ml-2" />
                        }
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-2 p-2 bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded">
                    <p className="flex items-center">
                      <BiIcons.BiInfoCircle size={16} className="mr-1 flex-shrink-0" />
                      Data is filtered by <code className="mx-1 px-1 bg-blue-100 dark:bg-blue-800 rounded">timestamp</code> for Instagram and <code className="mx-1 px-1 bg-blue-100 dark:bg-blue-800 rounded">createTimeISO</code> for TikTok.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Brands Filter Section */}
              {activeFilterSection === 'brands' && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Select Brands to Compare</h3>
                    <div className="text-xs text-gray-500">
                      {selectedBrands.length} brand(s) selected
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {ALL_BRANDS.map((brand) => (
                      <button
                        key={brand}
                        onClick={() => handleBrandSelection(brand)}
                        className={`px-3 py-2 rounded-md flex items-center justify-between ${
                          selectedBrands.includes(brand)
                            ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                            : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
                        }`}
                      >
                        <span>{brand}</span>
                        {selectedBrands.includes(brand) && 
                          <AiIcons.AiOutlineCheck size={16} className="ml-2" />
                        }
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Header;
