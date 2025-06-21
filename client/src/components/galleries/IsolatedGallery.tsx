import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Upload, Image as ImageIcon, Video, FileText, Trash2, Edit3 } from 'lucide-react';
import { galleryApi, mediaApi, commentApi, likeApi } from '../../lib/api';
import { Gallery, MediaItem, Comment, Like } from '@shared/schema';

interface IsolatedGalleryProps {
  userId: number;
  userName: string;
  deviceId: string;
  isDarkMode?: boolean;
}

export const IsolatedGallery: React.FC<IsolatedGalleryProps> = ({
  userId,
  userName,
  deviceId,
  isDarkMode = false
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  
  const queryClient = useQueryClient();

  // Get or create user's default gallery
  const { data: galleries = [] } = useQuery({
    queryKey: ['galleries', userId],
    queryFn: () => galleryApi.getUserGalleries(userId),
  });

  const defaultGallery = galleries[0];

  // Create default gallery if none exists
  const createGalleryMutation = useMutation({
    mutationFn: () => galleryApi.create({
      userId,
      name: `${userName}'s Gallery`,
      description: 'Personal media gallery',
      isPrivate: true,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleries', userId] });
    },
  });

  useEffect(() => {
    if (galleries.length === 0) {
      createGalleryMutation.mutate();
    }
  }, [galleries.length]);

  // Get media items for the gallery
  const { data: mediaItems = [] } = useQuery({
    queryKey: ['media', defaultGallery?.id],
    queryFn: () => defaultGallery ? mediaApi.getGalleryMedia(defaultGallery.id) : [],
    enabled: !!defaultGallery,
  });

  // Get comments for selected media
  const { data: comments = [] } = useQuery({
    queryKey: ['comments', selectedMediaIndex !== null ? mediaItems[selectedMediaIndex]?.id : null],
    queryFn: () => selectedMediaIndex !== null && mediaItems[selectedMediaIndex] 
      ? commentApi.getMediaComments(mediaItems[selectedMediaIndex].id) 
      : [],
    enabled: selectedMediaIndex !== null && !!mediaItems[selectedMediaIndex],
  });

  // Get likes for all media items
  const { data: allLikes = [] } = useQuery({
    queryKey: ['likes', defaultGallery?.id],
    queryFn: async () => {
      if (!mediaItems.length) return [];
      const likesPromises = mediaItems.map(item => likeApi.getMediaLikes(item.id));
      const likesArrays = await Promise.all(likesPromises);
      return likesArrays.flat();
    },
    enabled: !!defaultGallery && mediaItems.length > 0,
  });

  // Upload media mutation
  const uploadMediaMutation = useMutation({
    mutationFn: async ({ file, noteText }: { file?: File; noteText?: string }) => {
      if (!defaultGallery) throw new Error('No gallery available');
      
      if (file) {
        // For now, we'll store a placeholder URL since we don't have file upload endpoint
        const mediaData = {
          galleryId: defaultGallery.id,
          name: file.name,
          url: URL.createObjectURL(file), // Temporary local URL
          type: file.type.startsWith('video/') ? 'video' as const : 'image' as const,
          uploadedBy: userName,
          deviceId,
        };
        return mediaApi.create(mediaData);
      } else if (noteText) {
        const noteData = {
          galleryId: defaultGallery.id,
          name: `note-${Date.now()}`,
          url: null,
          type: 'note' as const,
          noteText,
          uploadedBy: userName,
          deviceId,
        };
        return mediaApi.create(noteData);
      }
      throw new Error('No file or note provided');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', defaultGallery?.id] });
      setSelectedFile(null);
      setNoteText('');
      setIsUploading(false);
    },
  });

  // Delete media mutation
  const deleteMediaMutation = useMutation({
    mutationFn: (mediaId: number) => mediaApi.delete(mediaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', defaultGallery?.id] });
      setSelectedMediaIndex(null);
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: ({ mediaId, text }: { mediaId: number; text: string }) =>
      commentApi.create({
        mediaId,
        text,
        userName,
        deviceId,
      }),
    onSuccess: () => {
      if (selectedMediaIndex !== null && mediaItems[selectedMediaIndex]) {
        queryClient.invalidateQueries({ queryKey: ['comments', mediaItems[selectedMediaIndex].id] });
      }
      setNewComment('');
    },
  });

  // Toggle like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: (mediaId: number) => likeApi.toggle(mediaId, userName, deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['likes', defaultGallery?.id] });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile && !noteText) return;
    
    setIsUploading(true);
    try {
      await uploadMediaMutation.mutateAsync({ 
        file: selectedFile || undefined, 
        noteText: noteText || undefined 
      });
    } catch (error) {
      console.error('Upload failed:', error);
      setIsUploading(false);
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim() || selectedMediaIndex === null) return;
    
    const mediaItem = mediaItems[selectedMediaIndex];
    if (mediaItem) {
      addCommentMutation.mutate({ mediaId: mediaItem.id, text: newComment.trim() });
    }
  };

  const getLikesForMedia = (mediaId: number) => {
    return allLikes.filter(like => like.mediaId === mediaId);
  };

  const isLikedByUser = (mediaId: number) => {
    return allLikes.some(like => like.mediaId === mediaId && like.deviceId === deviceId);
  };

  if (!defaultGallery && createGalleryMutation.isPending) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>Setting up your gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {defaultGallery?.name || 'My Gallery'}
          </h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Welcome {userName} - Share your moments
          </p>
        </div>

        {/* Upload Section */}
        <div className={`mb-8 p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Add to Gallery
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {/* File Upload */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Upload Media
              </label>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className={`w-full p-3 border rounded-lg ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              {selectedFile && (
                <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>

            {/* Note Input */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Or Add a Note
              </label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Share your thoughts..."
                className={`w-full p-3 border rounded-lg h-20 resize-none ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={(!selectedFile && !noteText.trim()) || isUploading}
            className={`mt-4 px-6 py-2 rounded-lg font-medium transition-colors ${
              (!selectedFile && !noteText.trim()) || isUploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isUploading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Uploading...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Add to Gallery
              </div>
            )}
          </button>
        </div>

        {/* Media Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mediaItems.map((item, index) => (
            <div
              key={item.id}
              className={`rounded-lg overflow-hidden shadow-lg cursor-pointer transform transition-transform hover:scale-105 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}
              onClick={() => setSelectedMediaIndex(index)}
            >
              {/* Media Content */}
              <div className="aspect-square relative">
                {item.type === 'image' && item.url && (
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                )}
                {item.type === 'video' && item.url && (
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted
                  />
                )}
                {item.type === 'note' && (
                  <div className={`w-full h-full flex items-center justify-center p-4 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <div className="text-center">
                      <FileText className={`w-12 h-12 mx-auto mb-2 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`} />
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {item.noteText?.substring(0, 100)}
                        {item.noteText && item.noteText.length > 100 ? '...' : ''}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Media Type Icon */}
                <div className="absolute top-2 right-2">
                  {item.type === 'image' && (
                    <ImageIcon className="w-5 h-5 text-white bg-black bg-opacity-50 rounded p-1" />
                  )}
                  {item.type === 'video' && (
                    <Video className="w-5 h-5 text-white bg-black bg-opacity-50 rounded p-1" />
                  )}
                </div>
              </div>

              {/* Media Info */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    by {item.uploadedBy}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLikeMutation.mutate(item.id);
                      }}
                      className={`flex items-center gap-1 ${
                        isLikedByUser(item.id) ? 'text-red-500' : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isLikedByUser(item.id) ? 'fill-current' : ''}`} />
                      <span className="text-sm">{getLikesForMedia(item.id).length}</span>
                    </button>
                    <span className={`flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm">0</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {mediaItems.length === 0 && (
          <div className="text-center py-12">
            <div className={`w-16 h-16 mx-auto mb-4 border-2 rounded-full flex items-center justify-center ${
              isDarkMode ? 'border-gray-600' : 'border-gray-300'
            }`}>
              <ImageIcon className={`w-8 h-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </div>
            <h3 className={`text-xl font-light mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              No media yet
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Upload your first photo, video, or add a note to get started!
            </p>
          </div>
        )}

        {/* Media Modal */}
        {selectedMediaIndex !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className={`max-w-4xl w-full max-h-full overflow-auto rounded-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {mediaItems[selectedMediaIndex].name}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => deleteMediaMutation.mutate(mediaItems[selectedMediaIndex].id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setSelectedMediaIndex(null)}
                      className={`p-2 rounded-lg transition-colors ${
                        isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="mb-6">
                  {mediaItems[selectedMediaIndex].type === 'image' && mediaItems[selectedMediaIndex].url && (
                    <img
                      src={mediaItems[selectedMediaIndex].url!}
                      alt={mediaItems[selectedMediaIndex].name}
                      className="w-full max-h-96 object-contain rounded-lg"
                    />
                  )}
                  {mediaItems[selectedMediaIndex].type === 'video' && mediaItems[selectedMediaIndex].url && (
                    <video
                      src={mediaItems[selectedMediaIndex].url!}
                      controls
                      className="w-full max-h-96 rounded-lg"
                    />
                  )}
                  {mediaItems[selectedMediaIndex].type === 'note' && (
                    <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <p className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>
                        {mediaItems[selectedMediaIndex].noteText}
                      </p>
                    </div>
                  )}
                </div>

                {/* Comments Section */}
                <div className="border-t pt-4">
                  <h4 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Comments ({comments.length})
                  </h4>
                  
                  {/* Add Comment */}
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className={`flex-1 p-2 border rounded-lg ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        !newComment.trim()
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      Post
                    </button>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {comments.map((comment) => (
                      <div key={comment.id} className={`p-3 rounded-lg ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={`font-medium text-sm ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {comment.userName}
                            </span>
                            <p className={`mt-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                              {comment.text}
                            </p>
                          </div>
                          <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};