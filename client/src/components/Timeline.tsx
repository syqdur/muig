import React, { useState, useEffect, useRef } from 'react';
import { Plus, Calendar, MapPin, Camera, Video, Edit3, Trash2, X, Upload, Eye, ExternalLink, Heart, MessageCircle, Clock, Star, Award, Users, Sparkles, Image } from 'lucide-react';
import { TimelineEvent, MediaItem } from '../types';
import { loadTimelineEvents, addTimelineEvent, updateTimelineEvent, deleteTimelineEvent } from '../services/databaseTimelineService';

interface TimelineProps {
  isDarkMode: boolean;
  userName: string;
  isAdmin: boolean;
}

export const Timeline: React.FC<TimelineProps> = ({ isDarkMode, userName, isAdmin }) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    customEventName: '',
    date: '',
    description: '',
    location: '',
    type: 'other' as TimelineEvent['type']
  });
  const [modalMedia, setModalMedia] = useState<{
    url: string;
    type: 'image' | 'video';
    title: string;
  } | null>(null);

  // Load timeline events
  useEffect(() => {
    console.log('Loading timeline events from database...');
    
    let unsubscribe: (() => void) | null = null;
    
    const loadEvents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        unsubscribe = loadTimelineEvents((timelineEvents) => {
          console.log(`Timeline events loaded: ${timelineEvents.length}`);
          setEvents(timelineEvents);
          setIsLoading(false);
          setError(null);
        });
        
      } catch (error: any) {
        console.error('Timeline setup error:', error);
        setError(`Timeline konnte nicht geladen werden: ${error.message}`);
        setIsLoading(false);
        setEvents([]);
      }
    };
    
    loadEvents();
    
    return () => {
      if (unsubscribe) {
        console.log('Cleaning up timeline listener');
        unsubscribe();
      }
    };
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      customEventName: '',
      date: '',
      description: '',
      location: '',
      type: 'other'
    });
    setSelectedFiles([]);
    setShowAddForm(false);
    setEditingEvent(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
      type: event.type
    });
    setShowAddForm(true);
  };

  const handleDelete = async (event: TimelineEvent) => {
    if (window.confirm('Dieses Ereignis wirklich löschen?')) {
      try {
        await deleteTimelineEvent(event.id.toString());
        console.log('Event deleted successfully');
      } catch (error) {
        console.error('Error deleting event:', error);
        setError('Fehler beim Löschen des Ereignisses');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.date || !formData.description.trim()) {
      setError('Bitte fülle alle Pflichtfelder aus');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const eventData = {
        ...formData,
        createdBy: userName,
        mediaUrls: [],
        mediaTypes: [],
        mediaFileNames: []
      };

      if (editingEvent) {
        await updateTimelineEvent(editingEvent.id.toString(), eventData);
      } else {
        await addTimelineEvent(eventData);
      }

      resetForm();
    } catch (error: any) {
      console.error('Error saving event:', error);
      setError('Fehler beim Speichern des Ereignisses');
    } finally {
      setIsUploading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'first_date': return <Heart className="w-4 h-4" />;
      case 'first_kiss': return <Heart className="w-4 h-4" />;
      case 'first_vacation': return <Camera className="w-4 h-4" />;
      case 'engagement': return <Star className="w-4 h-4" />;
      case 'moving_together': return <Users className="w-4 h-4" />;
      case 'anniversary': return <Award className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'first_date': return 'bg-pink-500';
      case 'first_kiss': return 'bg-red-500';
      case 'first_vacation': return 'bg-blue-500';
      case 'engagement': return 'bg-yellow-500';
      case 'moving_together': return 'bg-purple-500';
      case 'anniversary': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className={`p-8 rounded-xl transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          <span className={`ml-3 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Timeline wird geladen...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-8 rounded-xl transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-800' : 'bg-white'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-full transition-colors duration-300 ${
            isDarkMode ? 'bg-pink-600' : 'bg-pink-500'
          }`}>
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className={`text-2xl font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Unsere Timeline
            </h2>
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {events.length} besondere Momente
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddForm(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-300 ${
              isDarkMode
                ? 'bg-pink-600 hover:bg-pink-700 text-white'
                : 'bg-pink-500 hover:bg-pink-600 text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            Ereignis hinzufügen
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className={`mb-6 p-4 rounded-lg border transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-red-900/20 border-red-700/30 text-red-300' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {editingEvent ? 'Ereignis bearbeiten' : 'Neues Ereignis hinzufügen'}
              </h3>
              <button
                onClick={resetForm}
                className={`p-2 rounded-full transition-colors duration-300 ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Ereignistyp
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as TimelineEvent['type'] })}
                  className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-pink-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-pink-500'
                  } focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-20`}
                >
                  <option value="first_date">Erstes Date</option>
                  <option value="first_kiss">Erster Kuss</option>
                  <option value="first_vacation">Erster Urlaub</option>
                  <option value="engagement">Verlobung</option>
                  <option value="moving_together">Zusammenziehen</option>
                  <option value="anniversary">Jahrestag</option>
                  <option value="custom">Benutzerdefiniert</option>
                  <option value="other">Sonstiges</option>
                </select>
              </div>

              {formData.type === 'custom' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Name des benutzerdefinierten Ereignisses
                  </label>
                  <input
                    type="text"
                    value={formData.customEventName}
                    onChange={(e) => setFormData({ ...formData, customEventName: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-pink-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-pink-500'
                    } focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-20`}
                    placeholder="z.B. Erster gemeinsamer Konzertbesuch"
                  />
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Titel *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-pink-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-pink-500'
                  } focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-20`}
                  placeholder="z.B. Unser erstes Date"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Datum *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-pink-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-pink-500'
                  } focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-20`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Beschreibung *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-pink-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-pink-500'
                  } focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-20`}
                  rows={3}
                  placeholder="Erzähle von diesem besonderen Moment..."
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Ort
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-pink-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-pink-500'
                  } focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-20`}
                  placeholder="z.B. Restaurant Zur Post, München"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isUploading}
                  className={`flex-1 py-3 px-6 rounded-xl font-medium transition-colors duration-300 ${
                    isDarkMode
                      ? 'bg-pink-600 hover:bg-pink-700 text-white disabled:bg-gray-700'
                      : 'bg-pink-500 hover:bg-pink-600 text-white disabled:bg-gray-300'
                  } disabled:cursor-not-allowed`}
                >
                  {isUploading ? 'Speichere...' : editingEvent ? 'Aktualisieren' : 'Hinzufügen'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className={`py-3 px-6 rounded-xl transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
                      : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                  }`}
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-6">
        {events.length === 0 ? (
          <div className={`text-center py-12 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Noch keine Timeline-Ereignisse vorhanden.</p>
            {isAdmin && (
              <p className="mt-2">Klicke auf "Ereignis hinzufügen", um zu beginnen.</p>
            )}
          </div>
        ) : (
          events.map((event, index) => (
            <div key={event.id} className={`relative pl-8 transition-colors duration-300 ${
              index !== events.length - 1 ? 'pb-8' : ''
            }`}>
              {/* Timeline line */}
              {index !== events.length - 1 && (
                <div className={`absolute left-4 top-8 w-0.5 h-full transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                }`} />
              )}
              
              {/* Event marker */}
              <div className={`absolute left-0 top-2 w-8 h-8 rounded-full ${getEventColor(event.type)} flex items-center justify-center`}>
                {getEventIcon(event.type)}
              </div>
              
              {/* Event content */}
              <div className={`rounded-lg p-6 transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {event.title}
                      </h3>
                      <span className={`text-sm px-2 py-1 rounded-full transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {new Date(event.date).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                    
                    <p className={`mb-3 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {event.description}
                    </p>
                    
                    {event.location && (
                      <div className={`flex items-center gap-1 text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </div>
                    )}
                  </div>
                  
                  {isAdmin && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(event)}
                        className={`p-2 rounded-lg transition-colors duration-300 ${
                          isDarkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                        }`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(event)}
                        className={`p-2 rounded-lg transition-colors duration-300 ${
                          isDarkMode ? 'hover:bg-red-600 text-red-400' : 'hover:bg-red-100 text-red-500'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};