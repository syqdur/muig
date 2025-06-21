import { apiClient } from './apiClient';

export interface SiteStatus {
  id: number;
  isUnderConstruction: boolean;
  launchDate: Date | null;
  updatedBy: string;
  updatedAt: Date;
}

export const getSiteStatus = async (): Promise<SiteStatus> => {
  try {
    return await apiClient.getSiteStatus();
  } catch (error) {
    console.error('Error loading site status:', error);
    // Return default status if loading fails
    return {
      id: 1,
      isUnderConstruction: false,
      launchDate: null,
      updatedBy: 'System',
      updatedAt: new Date()
    };
  }
};

export const updateSiteStatus = async (
  isUnderConstruction: boolean,
  updatedBy: string
): Promise<void> => {
  await apiClient.updateSiteStatus({
    isUnderConstruction,
    updatedBy
  });
};

// Load site status with callback for real-time updates
export const loadSiteStatus = (callback: (status: SiteStatus) => void) => {
  const loadData = async () => {
    try {
      const status = await getSiteStatus();
      callback(status);
    } catch (error) {
      console.error('Error loading site status:', error);
    }
  };
  
  loadData();
  const interval = setInterval(loadData, 10000); // Check every 10 seconds
  return () => clearInterval(interval);
};