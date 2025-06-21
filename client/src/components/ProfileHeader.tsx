import React, { useState } from 'react';
import { Edit3, Camera, User } from 'lucide-react';

interface ProfileHeaderProps {
  userName: string;
  bio?: string;
  photoURL?: string;
  isAdmin: boolean;
  isDarkMode: boolean;
  onBioUpdate?: (newBio: string) => void;
  onPhotoUpdate?: (photoURL: string) => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userName,
  bio = "Willkommen in unserer Hochzeitsgalerie! 💕",
  photoURL,
  isAdmin,
  isDarkMode,
  onBioUpdate,
  onPhotoUpdate
}) => {
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editBio, setEditBio] = useState(bio);

  const handleBioSave = () => {
    if (onBioUpdate) {
      onBioUpdate(editBio);
    }
    setIsEditingBio(false);
  };

  const handleBioCancel = () => {
    setEditBio(bio);
    setIsEditingBio(false);
  };

  return (
    <div className={`p-6 rounded-lg border ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center space-x-4">
        {/* Profile Photo */}
        <div className="relative">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            {photoURL ? (
              <img 
                src={photoURL} 
                alt={userName}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <User className={`w-8 h-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            )}
          </div>
          {isAdmin && (
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file && onPhotoUpdate) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      onPhotoUpdate(e.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                };
                input.click();
              }}
              className={`absolute -bottom-1 -right-1 p-1.5 rounded-full ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white transition-colors`}
            >
              <Camera className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex-1">
          <h1 className={`text-2xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {userName}
          </h1>
          
          {/* Bio Section */}
          <div className="mt-2">
            {isEditingBio ? (
              <div className="space-y-2">
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className={`w-full p-2 rounded border resize-none ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  rows={3}
                  maxLength={200}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleBioSave}
                    className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                  >
                    Speichern
                  </button>
                  <button
                    onClick={handleBioCancel}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start space-x-2">
                <p className={`text-sm leading-relaxed ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {bio}
                </p>
                {isAdmin && (
                  <button
                    onClick={() => setIsEditingBio(true)}
                    className={`p-1 rounded hover:bg-opacity-10 hover:bg-gray-500 transition-colors ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};