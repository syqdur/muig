import { apiClient } from './apiClient';
import { TimelineEvent } from '../types';

// Convert Firebase user ID to database user ID
const getUserDbId = (firebaseUid: string): number => {
  // Always use the first user for now (could be improved with proper mapping)
  return 1;
};

export const loadTimelineEvents = (callback: (events: TimelineEvent[]) => void) => {
  const loadData = async () => {
    try {
      const events = await apiClient.getUserTimeline(1);
      callback(events);
    } catch (error) {
      console.error('Error loading timeline events:', error);
      callback([]);
    }
  };
  
  loadData();
  // More frequent polling for real-time updates
  const interval = setInterval(loadData, 1000);
  return () => clearInterval(interval);
};

export const addTimelineEvent = async (
  event: Omit<TimelineEvent, 'id' | 'createdAt'>,
  userId: string = '1'
): Promise<void> => {
  const dbUserId = getUserDbId(userId);
  
  await apiClient.createTimelineEvent(dbUserId, {
    userId: dbUserId,
    title: event.title,
    customEventName: event.customEventName,
    date: event.date,
    description: event.description,
    location: event.location,
    type: event.type,
    createdBy: event.createdBy,
    mediaUrls: event.mediaUrls || [],
    mediaTypes: event.mediaTypes || [],
    mediaFileNames: event.mediaFileNames || []
  });
};

export const updateTimelineEvent = async (
  eventId: string,
  event: Partial<TimelineEvent>
): Promise<void> => {
  await apiClient.updateTimelineEvent(parseInt(eventId), event);
};

export const deleteTimelineEvent = async (eventId: string): Promise<void> => {
  await apiClient.deleteTimelineEvent(parseInt(eventId));
};