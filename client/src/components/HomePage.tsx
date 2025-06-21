import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLogin } from './admin/AdminLogin';
import { UserManagement } from './admin/UserManagement';
import { TestUserSetup } from './TestUserSetup';
import { Sun, Moon, Users, Shield, Play } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';

export const HomePage: React.FC = () => {
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showTestUserSetup, setShowTestUserSetup] = useState(false);
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();

  const handleAdminAccess = () => {
    setShowAdminLogin(false);
    setShowUserManagement(true);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Personal Gallery Hub
            </h1>
          </div>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
          </button>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Create Your Personal
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"> Gallery</span>
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
            Build your own private media gallery with timeline events, stories, and Spotify integration. 
            Share memories in a beautiful, personalized space.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 transform hover:scale-105"
            >
              Create Account
            </button>
          </div>

          {/* Demo Button */}
          <div className="flex justify-center mb-16">
            <button
              onClick={() => setShowTestUserSetup(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              Try Demo Gallery
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Personal Space
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your own private gallery where only you can upload and manage your memories
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Secure & Private
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Complete data isolation ensures your content stays private and secure
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Rich Features
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Timeline events, stories, Spotify integration, and more in a beautiful interface
              </p>
            </div>
          </div>

          {/* Admin Access */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <button
              onClick={() => setShowAdminLogin(true)}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Administrator Access
            </button>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Demo: admin / test123
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAdminLogin && (
        <AdminLogin
          onAdminAccess={handleAdminAccess}
          onCancel={() => setShowAdminLogin(false)}
        />
      )}

      {showUserManagement && (
        <UserManagement
          onClose={() => setShowUserManagement(false)}
        />
      )}

      {showTestUserSetup && (
        <TestUserSetup
          onClose={() => setShowTestUserSetup(false)}
        />
      )}
    </div>
  );
};