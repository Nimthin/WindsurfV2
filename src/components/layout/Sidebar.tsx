import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FaIcons from 'react-icons/fa';
import * as MdIcons from 'react-icons/md';
import * as BsIcons from 'react-icons/bs';
import { useSocialData } from '../../context/SocialDataContext';

interface SidebarProps {
  isCollapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useSocialData();

  // Navigation items with emoji instead of icons to avoid TypeScript issues
  const navItems = [
    { path: '/', icon: '📊', label: 'Dashboard' },
    { path: '/instagram', icon: '📷', label: 'Instagram' },
    { path: '/tiktok', icon: '🎵', label: 'TikTok' },
    { path: '/comparison', icon: '⚖️', label: 'Comparison' },
    { path: '/hashtags', icon: '#️⃣', label: 'Hashtags' },
    { path: '/analytics', icon: '📈', label: 'Analytics' },
  ];

  return (
    <motion.div
      initial={{ x: -250 }}
      animate={{ x: 0, width: isCollapsed ? 64 : 256 }}
      className={`h-screen fixed top-0 left-0 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'} shadow-lg transition-all duration-300 overflow-hidden`}
    >
      <div className={`p-4 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <h1 className="text-xl font-bold flex items-center">
          <span className="mr-2">📊</span> {!isCollapsed && 'Nordstrom'}
        </h1>
        {!isCollapsed && <p className="text-sm text-gray-500 mt-1">Social Media Analytics</p>}
      </div>

      <nav className="mt-6">
        <ul>
          {navItems.map((item) => (
            <motion.li key={item.path} whileHover={{ scale: isCollapsed ? 1.1 : 1.03 }} whileTap={{ scale: 0.97 }}>
              <button
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : ''} p-4 text-left ${location.pathname === item.path ? 
                  (darkMode ? 'bg-gray-800 text-blue-400' : 'bg-blue-50 text-blue-600') : 
                  'hover:bg-opacity-10 hover:bg-blue-500'}`}
                title={isCollapsed ? item.label : ''}
              >
                <span className={isCollapsed ? '' : 'mr-3'}>{item.icon}</span>
                {!isCollapsed && <span>{item.label}</span>}
                {location.pathname === item.path && !isCollapsed && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="ml-auto w-1 h-6 bg-blue-500 rounded"
                  />
                )}
              </button>
            </motion.li>
          ))}
        </ul>
      </nav>

      {!isCollapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Theme</span>
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}
            >
              <div
                className={`w-6 h-6 rounded-full transform transition-transform ${darkMode ? 'translate-x-2 bg-blue-500' : 'translate-x-0 bg-gray-500'}`}
              />
            </button>
          </div>
        </div>
      )}
      {isCollapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center">
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}
            title="Toggle theme"
          >
            {darkMode ? '🌙' : '☀️'}
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default Sidebar;
