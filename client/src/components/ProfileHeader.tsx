import React from 'react';
import { UserPlus, Settings, User } from 'lucide-react';
import { UserProfile } from '../contexts/AuthContext';

interface ProfileHeaderProps {
  profile: UserProfile | null;
  onEdit: () => void;
  isDarkMode?: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, onEdit, isDarkMode = false }) => {
  if (!profile) {
    return (
      <div className={`p-4 border-b transition-colors duration-300 ${
        isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'
      }`}>
        <div className="animate-pulse">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-full bg-gray-300 dark:bg-gray-600"></div>
            <div className="flex-1">
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-2 w-32"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 border-b transition-colors duration-300 ${
      isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'
    }`}>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700">
          {profile.photoURL ? (
            <img 
              src={profile.photoURL} 
              alt={profile.displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className={`w-8 h-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h2 className={`text-xl font-semibold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {profile.displayName}
          </h2>

          <div className={`flex gap-6 mt-2 text-sm transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <span><strong>Personal</strong> Gallery</span>
          </div>
        </div>
      </div>
     
      {profile.bio && (
        <div className="mb-4">
          <p className={`text-sm whitespace-pre-wrap transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {profile.bio}
          </p>
        </div>
      )}

      {profile.externalLinks && (profile.externalLinks.spotify || profile.externalLinks.instagram) && (
        <div className="flex gap-2 mb-4">
          {profile.externalLinks.spotify && (
            <a
              href={profile.externalLinks.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-xs px-2 py-1 rounded-full transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-green-900 text-green-200 hover:bg-green-800' 
                  : 'bg-green-100 text-green-800 hover:bg-green-200'
              }`}
            >
              🎵 Spotify
            </a>
          )}
          {profile.externalLinks.instagram && (
            <a
              href={profile.externalLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-xs px-2 py-1 rounded-full transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-pink-900 text-pink-200 hover:bg-pink-800' 
                  : 'bg-pink-100 text-pink-800 hover:bg-pink-200'
              }`}
            >
              📸 Instagram
            </a>
          )}
        </div>
      )}
      
      <div className="flex gap-2">
        <button 
          onClick={onEdit}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
          }`}
        >
          <Settings className="w-4 h-4" />
          Edit Profile
        </button>
      </div>
    </div>
  );
};