import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, MapPin, Plus, Edit3, Trash2, Save, X, Heart } from 'lucide-react';
import { galleryApi, timelineApi } from '../../lib/api';
import { TimelineEvent } from '@shared/schema';

interface TimelineGalleryProps {
  userId: number;
  userName: string;
  deviceId: string;
  isDarkMode?: boolean;
}

const eventTypes = [
  { value: 'first_date', label: '💕 First Date', color: 'pink' },
  { value: 'first_kiss', label: '💋 First Kiss', color: 'red' },
  { value: 'first_vacation', label: '✈️ First Vacation', color: 'blue' },
  { value: 'moving_together', label: '🏠 Moving Together', color: 'green' },
  { value: 'engagement', label: '💍 Engagement', color: 'yellow' },
  { value: 'anniversary', label: '🎉 Anniversary', color: 'purple' },
  { value: 'custom', label: '✨ Custom Event', color: 'indigo' },
  { value: 'other', label: '❤️ Other', color: 'gray' }
] as const;

export const TimelineGallery: React.FC<TimelineGalleryProps> = ({
  userId,
  userName,
  deviceId,
  isDarkMode = false
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    customEventName: '',
    date: '',
    description: '',
    location: '',
    type: 'other' as TimelineEvent['type']
  });

  const queryClient = useQueryClient();

  // Get user's galleries
  const { data: galleries = [] } = useQuery({
    queryKey: ['galleries', userId],
    queryFn: () => galleryApi.getUserGalleries(userId),
  });

  const defaultGallery = galleries[0];

  // Get timeline events
  const { data: events = [] } = useQuery({
    queryKey: ['timeline', defaultGallery?.id],
    queryFn: () => defaultGallery ? timelineApi.getGalleryEvents(defaultGallery.id) : [],
    enabled: !!defaultGallery,
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: (eventData: typeof formData) => {
      if (!defaultGallery) throw new Error('No gallery available');
      
      return timelineApi.create({
        galleryId: defaultGallery.id,
        title: eventData.type === 'custom' ? eventData.customEventName : eventData.title,
        customEventName: eventData.type === 'custom' ? eventData.customEventName : undefined,
        date: eventData.date,
        description: eventData.description,
        location: eventData.location || undefined,
        type: eventData.type,
        createdBy: userName,
        mediaUrls: undefined,
        mediaTypes: undefined,
        mediaFileNames: undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', defaultGallery?.id] });
      resetForm();
    },
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<TimelineEvent> }) =>
      timelineApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', defaultGallery?.id] });
      setEditingEvent(null);
      resetForm();
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: (id: number) => timelineApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', defaultGallery?.id] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      customEventName: '',
      date: '',
      description: '',
      location: '',
      type: 'other'
    });
    setShowAddForm(false);
    setEditingEvent(null);
  };

  const handleSubmit = () => {
    if (!formData.title && !formData.customEventName) return;
    if (!formData.date || !formData.description) return;

    if (editingEvent) {
      updateEventMutation.mutate({
        id: editingEvent.id,
        updates: {
          title: formData.type === 'custom' ? formData.customEventName : formData.title,
          customEventName: formData.type === 'custom' ? formData.customEventName : null,
          date: formData.date,
          description: formData.description,
          location: formData.location || null,
          type: formData.type,
        }
      });
    } else {
      createEventMutation.mutate(formData);
    }
  };

  const handleEdit = (event: TimelineEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      customEventName: event.customEventName || '',
      date: event.date,
      description: event.description,
      location: event.location || '',
      type: event.type,
    });
    setShowAddForm(true);
  };

  const getEventTypeInfo = (type: string) => {
    return eventTypes.find(et => et.value === type) || eventTypes[eventTypes.length - 1];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!defaultGallery) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>Loading timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Our Timeline
            </h1>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Special moments and memories
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>

        {/* Add/Edit Event Form */}
        {showAddForm && (
          <div className={`mb-8 p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {editingEvent ? 'Edit Event' : 'Add New Event'}
              </h2>
              <button
                onClick={resetForm}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Event Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as TimelineEvent['type'] })}
                  className={`w-full p-3 border rounded-lg ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  {eventTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className={`w-full p-3 border rounded-lg ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              {formData.type === 'custom' ? (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Custom Event Name
                  </label>
                  <input
                    type="text"
                    value={formData.customEventName}
                    onChange={(e) => setFormData({ ...formData, customEventName: e.target.value })}
                    placeholder="Enter custom event name"
                    className={`w-full p-3 border rounded-lg ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              ) : (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Event title"
                    className={`w-full p-3 border rounded-lg ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Where did this happen?"
                  className={`w-full p-3 border rounded-lg ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell the story of this moment..."
                rows={4}
                className={`w-full p-3 border rounded-lg resize-none ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmit}
                disabled={(!formData.title && !formData.customEventName) || !formData.date || !formData.description}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                  (!formData.title && !formData.customEventName) || !formData.date || !formData.description
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Save className="w-4 h-4" />
                {editingEvent ? 'Update Event' : 'Save Event'}
              </button>
              <button
                onClick={resetForm}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode 
                    ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                    : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="relative">
          {/* Timeline Line */}
          <div className={`absolute left-8 top-0 bottom-0 w-0.5 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>

          {/* Events */}
          <div className="space-y-8">
            {events.map((event, index) => {
              const eventTypeInfo = getEventTypeInfo(event.type);
              return (
                <div key={event.id} className="relative flex items-start">
                  {/* Timeline Dot */}
                  <div className={`absolute left-6 w-4 h-4 rounded-full border-4 ${
                    isDarkMode ? 'bg-gray-900 border-blue-500' : 'bg-white border-blue-500'
                  }`}></div>

                  {/* Event Card */}
                  <div className={`ml-16 w-full p-6 rounded-lg shadow-lg ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                  }`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className={`text-xl font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {event.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm">
                          <span className={`flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <Calendar className="w-4 h-4" />
                            {formatDate(event.date)}
                          </span>
                          {event.location && (
                            <span className={`flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              <MapPin className="w-4 h-4" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(event)}
                          className={`p-2 rounded-lg transition-colors ${
                            isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteEventMutation.mutate(event.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {event.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {eventTypeInfo.label}
                      </span>
                      <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        Added by {event.createdBy}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {events.length === 0 && (
            <div className="text-center py-12 ml-16">
              <div className={`w-16 h-16 mx-auto mb-4 border-2 rounded-full flex items-center justify-center ${
                isDarkMode ? 'border-gray-600' : 'border-gray-300'
              }`}>
                <Heart className={`w-8 h-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </div>
              <h3 className={`text-xl font-light mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                No timeline events yet
              </h3>
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Start creating your story by adding your first special moment!
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add First Event
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};