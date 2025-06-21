import React, { useState, useEffect } from 'react';
import { Camera, Video, Calendar, Music, Heart, MessageCircle, Upload, Play } from 'lucide-react';

// Simple demo types
interface DemoMediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  fileName: string;
  text?: string;
  createdAt: string;
}

interface DemoTimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  type: string;
  mediaUrls?: string[];
  mediaTypes?: string[];
}

interface DemoGalleryProps {
  isDarkMode: boolean;
}

export const DemoGallery: React.FC<DemoGalleryProps> = ({ isDarkMode }) => {
  const [activeTab, setActiveTab] = useState<'gallery' | 'timeline' | 'music'>('gallery');
  const [mediaItems, setMediaItems] = useState<DemoMediaItem[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<DemoTimelineEvent[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');

  // Initialize with sample data
  useEffect(() => {
    // Sample media items
    const sampleMedia: DemoMediaItem[] = [
      {
        id: '1',
        url: 'https://picsum.photos/400/400?random=1',
        type: 'image',
        fileName: 'sample1.jpg',
        text: 'Beautiful sunset at the beach',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        url: 'https://picsum.photos/400/600?random=2',
        type: 'image',
        fileName: 'sample2.jpg',
        text: 'Mountain hiking adventure',
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        url: 'https://picsum.photos/600/400?random=3',
        type: 'image',
        fileName: 'sample3.jpg',
        text: 'City lights at night',
        createdAt: new Date().toISOString()
      }
    ];

    // Sample timeline events
    const sampleTimeline: DemoTimelineEvent[] = [
      {
        id: '1',
        title: 'First Date',
        description: 'Our magical first date at the coffee shop downtown',
        date: '2024-01-15',
        type: 'first_date',
        mediaUrls: ['https://picsum.photos/400/300?random=4'],
        mediaTypes: ['image']
      },
      {
        id: '2',
        title: 'Anniversary Celebration',
        description: 'Celebrating our 6-month anniversary with a romantic dinner',
        date: '2024-07-15',
        type: 'anniversary',
        mediaUrls: ['https://picsum.photos/400/300?random=5', 'https://picsum.photos/400/300?random=6'],
        mediaTypes: ['image', 'image']
      }
    ];

    setMediaItems(sampleMedia);
    setTimelineEvents(sampleTimeline);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setUploadStatus('Uploading...');
    
    // Simulate upload process
    setTimeout(() => {
      const newItems: DemoMediaItem[] = Array.from(files).map((file, index) => ({
        id: `upload-${Date.now()}-${index}`,
        url: URL.createObjectURL(file),
        type: file.type.startsWith('video/') ? 'video' as const : 'image' as const,
        fileName: file.name,
        text: `Uploaded: ${file.name}`,
        createdAt: new Date().toISOString()
      }));

      setMediaItems(prev => [...newItems, ...prev]);
      setUploadStatus('Upload successful!');
      setTimeout(() => setUploadStatus(''), 3000);
    }, 1000);
  };

  const openModal = (index: number) => {
    setCurrentIndex(index);
    setModalOpen(true);
  };

  const nextImage = () => {
    setCurrentIndex(prev => (prev + 1) % mediaItems.length);
  };

  const prevImage = () => {
    setCurrentIndex(prev => prev === 0 ? mediaItems.length - 1 : prev - 1);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Media Gallery Demo</h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Experience timeline events with media upload and display functionality
          </p>
        </div>

        {/* Tab Navigation */}
        <div className={`flex justify-center mb-6 rounded-lg p-1 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
        }`}>
          {[
            { key: 'gallery', label: 'Gallery', icon: Camera },
            { key: 'timeline', label: 'Timeline', icon: Calendar },
            { key: 'music', label: 'Music', icon: Music }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === key
                  ? isDarkMode 
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 text-blue-700'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'gallery' && (
          <div>
            {/* Upload Section */}
            <div className={`mb-6 p-4 rounded-lg border-2 border-dashed transition-colors ${
              isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'
            }`}>
              <div className="text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className={`mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Upload your photos and videos
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className={`inline-block px-4 py-2 rounded-md cursor-pointer transition-colors ${
                    isDarkMode 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  Choose Files
                </label>
                {uploadStatus && (
                  <p className={`mt-2 text-sm ${
                    uploadStatus.includes('successful') ? 'text-green-500' : 'text-blue-500'
                  }`}>
                    {uploadStatus}
                  </p>
                )}
              </div>
            </div>

            {/* Media Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mediaItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
                  }`}
                  onClick={() => openModal(index)}
                >
                  <div className="aspect-square relative">
                    {item.type === 'video' ? (
                      <div className="relative w-full h-full">
                        <video 
                          src={item.url} 
                          className="w-full h-full object-cover"
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                          <Play className="w-12 h-12 text-white" />
                        </div>
                      </div>
                    ) : (
                      <img 
                        src={item.url} 
                        alt={item.text || item.fileName}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity" />
                  </div>
                  {item.text && (
                    <div className="p-3">
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {item.text}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-6">
            {timelineEvents.map((event) => (
              <div
                key={event.id}
                className={`p-6 rounded-lg ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-3 h-3 rounded-full ${
                    event.type === 'first_date' ? 'bg-pink-500' :
                    event.type === 'anniversary' ? 'bg-purple-500' :
                    'bg-blue-500'
                  }`} />
                  <h3 className="text-lg font-semibold">{event.title}</h3>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {event.date}
                  </span>
                </div>
                <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {event.description}
                </p>
                
                {event.mediaUrls && event.mediaUrls.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {event.mediaUrls.map((url, index) => (
                      <div key={index} className="aspect-video rounded-lg overflow-hidden">
                        <img 
                          src={url} 
                          alt={`${event.title} - ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'music' && (
          <div className={`text-center p-8 rounded-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
          }`}>
            <Music className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Music Wishlist</h3>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Your shared music wishlist will appear here
            </p>
          </div>
        )}

        {/* Modal */}
        {modalOpen && mediaItems.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
            <div className="relative max-w-4xl max-h-screen p-4">
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
              >
                <span className="text-2xl">×</span>
              </button>
              
              <div className="relative">
                {mediaItems[currentIndex].type === 'video' ? (
                  <video 
                    src={mediaItems[currentIndex].url} 
                    controls 
                    autoPlay
                    className="max-w-full max-h-full"
                  />
                ) : (
                  <img 
                    src={mediaItems[currentIndex].url} 
                    alt={mediaItems[currentIndex].text || mediaItems[currentIndex].fileName}
                    className="max-w-full max-h-full object-contain"
                  />
                )}
                
                {mediaItems.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300"
                    >
                      <span className="text-3xl">‹</span>
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300"
                    >
                      <span className="text-3xl">›</span>
                    </button>
                  </>
                )}
              </div>
              
              {mediaItems[currentIndex].text && (
                <div className="absolute bottom-4 left-4 right-4 text-white text-center">
                  <p className="text-lg">{mediaItems[currentIndex].text}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};