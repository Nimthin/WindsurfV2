import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SocialDataProvider } from './context/SocialDataContext';

// Layout component
import Layout from './components/layout/Layout';

// Page components
import DashboardOverview from './components/dashboard/DashboardOverview';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 60, // 1 hour
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SocialDataProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<DashboardOverview />} />
              {/* All routes redirect to the main dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Router>
      </SocialDataProvider>
    </QueryClientProvider>
  );
}

export default App;
