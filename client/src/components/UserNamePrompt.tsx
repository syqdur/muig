import React, { useState } from 'react';
import { User, Camera } from 'lucide-react';

interface UserNamePromptProps {
  onNameSubmit: (name: string) => void;
  isDarkMode?: boolean;
}

export const UserNamePrompt: React.FC<UserNamePromptProps> = ({ 
  onNameSubmit, 
  isDarkMode = false 
}) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onNameSubmit(name.trim());
    } catch (error) {
      console.error('Error submitting name:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`rounded-2xl p-8 max-w-md w-full transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        <div className="text-center mb-6">
          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
            isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
          }`}>
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Willkommen in der Galerie!
          </h2>
          <p className={`text-sm ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Bitte gib deinen Namen ein, damit wir sehen können, wer welche schönen Momente geteilt hat.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Dein Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Anna, Max, Familie Müller..."
                maxLength={50}
                className={`w-full px-4 py-3 pl-10 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                autoFocus
                disabled={isSubmitting}
              />
              <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
            </div>
            <p className={`text-xs mt-1 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {name.length}/50 Zeichen
            </p>
          </div>

          <button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            className={`w-full py-3 px-4 rounded-xl font-medium transition-colors duration-300 ${
              !name.trim() || isSubmitting
                ? isDarkMode
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isSubmitting ? 'Speichere...' : 'Galerie betreten'}
          </button>
        </form>

        <div className={`mt-4 text-xs text-center ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          Dein Name wird mit diesem Gerät verknüpft und für alle deine Uploads verwendet.
        </div>
      </div>
    </div>
  );
};