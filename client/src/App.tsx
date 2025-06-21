import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthWrapper } from './components/auth/AuthWrapper';
import { UserGallery } from './components/UserGallery';
import { HomePage } from './components/HomePage';
import { GalleryDemo } from './components/GalleryDemo';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/demo" element={<GalleryDemo />} />
            <Route path="/login" element={<AuthWrapper />} />
            <Route path="/register" element={<AuthWrapper />} />
            <Route 
              path="/gallery" 
              element={
                <ProtectedRoute>
                  <UserGallery />
                </ProtectedRoute>
              } 
            />
            <Route path="/gallery/:username" element={<Navigate to="/gallery" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;