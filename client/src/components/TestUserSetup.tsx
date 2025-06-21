import React, { useState } from 'react';
import { createTestUser, loginAsTestUser } from '../utils/testData';
import { useNavigate } from 'react-router-dom';

interface TestUserSetupProps {
  onClose: () => void;
}

export const TestUserSetup: React.FC<TestUserSetupProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const handleCreateTestUser = async () => {
    setLoading(true);
    setStatus('Creating test user and sample data...');
    
    try {
      await createTestUser();
      setStatus('✅ Test user created successfully! Logging you in...');
      
      // Wait a moment then navigate to gallery
      setTimeout(() => {
        navigate('/gallery');
        onClose();
      }, 1500);
      
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginAsTestUser = async () => {
    setLoading(true);
    setStatus('Logging in as test user...');
    
    try {
      await loginAsTestUser();
      setStatus('✅ Logged in successfully!');
      
      setTimeout(() => {
        navigate('/gallery');
        onClose();
      }, 1000);
      
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Test User Setup
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          {status && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">{status}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Test User Details
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <p><strong>Email:</strong> testuser@gallery.com</p>
                <p><strong>Password:</strong> testpass123</p>
                <p><strong>Display Name:</strong> Test User</p>
              </div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                Sample Content Included
              </h3>
              <ul className="text-sm text-green-700 dark:text-green-200 space-y-1">
                <li>• Profile with bio and external links</li>
                <li>• 3 sample notes in gallery</li>
                <li>• 3 timeline events</li>
                <li>• Ready for photo/video uploads</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreateTestUser}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Test User'}
              </button>
              
              <button
                onClick={handleLoginAsTestUser}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Login as Test User'}
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              The test user will be created in Firebase with sample content to demonstrate all gallery features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};