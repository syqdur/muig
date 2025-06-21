import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sun, Moon, Users, Calendar, Image } from 'lucide-react';
import { IsolatedGallery } from './galleries/IsolatedGallery';
import { TimelineGallery } from './galleries/TimelineGallery';
import { useDarkMode } from '../hooks/useDarkMode';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

interface User {
  id: number;
  name: string;
  deviceId: string;
}

export const GalleryDemo: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeGallery, setActiveGallery] = useState<'media' | 'timeline'>('media');

  // Demo users
  const demoUsers: User[] = [
    { id: 1, name: 'Alice', deviceId: 'device_alice_123' },
    { id: 2, name: 'Bob', deviceId: 'device_bob_456' },
    { id: 3, name: 'Carol', deviceId: 'device_carol_789' },
  ];

  if (!selectedUser) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="flex justify-between items-center mb-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Isolated Gallery System
              </h1>
            </div>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </button>
          </div>

          {/* User Selection */}
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Choose Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"> Gallery</span>
            </h2>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
              Each user has their own completely isolated gallery with media, timeline events, and social features.
            </p>

            {/* User Cards */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {demoUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`p-8 rounded-xl shadow-lg cursor-pointer transform transition-all duration-200 hover:scale-105 ${
                    isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    isDarkMode ? 'bg-blue-900' : 'bg-blue-100'
                  }`}>
                    <Users className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user.name}'s Gallery
                  </h3>
                  <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    User ID: {user.id}
                  </p>
                  <div className="flex justify-center gap-4 text-sm">
                    <span className={`flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <Image className="w-4 h-4" />
                      Media
                    </span>
                    <span className={`flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <Calendar className="w-4 h-4" />
                      Timeline
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Isolated Data
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Each user's gallery is completely separate with their own media, comments, likes, and timeline events
                </p>
              </div>
              <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Full Features
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Upload media, add notes, create timeline events, like and comment on content
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Navigation */}
        <div className={`sticky top-0 z-40 border-b ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedUser(null)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    isDarkMode 
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  ← Back to Users
                </button>
                <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedUser.name}'s Gallery
                </h1>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Gallery Type Toggle */}
                <div className={`flex rounded-lg p-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <button
                    onClick={() => setActiveGallery('media')}
                    className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm transition-colors ${
                      activeGallery === 'media'
                        ? isDarkMode
                          ? 'bg-gray-600 text-white'
                          : 'bg-white text-gray-900 shadow-sm'
                        : isDarkMode
                          ? 'text-gray-400 hover:text-gray-200'
                          : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Image className="w-4 h-4" />
                    Media
                  </button>
                  <button
                    onClick={() => setActiveGallery('timeline')}
                    className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm transition-colors ${
                      activeGallery === 'timeline'
                        ? isDarkMode
                          ? 'bg-gray-600 text-white'
                          : 'bg-white text-gray-900 shadow-sm'
                        : isDarkMode
                          ? 'text-gray-400 hover:text-gray-200'
                          : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    Timeline
                  </button>
                </div>

                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Content */}
        {activeGallery === 'media' ? (
          <IsolatedGallery
            userId={selectedUser.id}
            userName={selectedUser.name}
            deviceId={selectedUser.deviceId}
            isDarkMode={isDarkMode}
          />
        ) : (
          <TimelineGallery
            userId={selectedUser.id}
            userName={selectedUser.name}
            deviceId={selectedUser.deviceId}
            isDarkMode={isDarkMode}
          />
        )}
      </div>
    </QueryClientProvider>
  );
};