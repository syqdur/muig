// Generate a unique device ID for the current browser/device
export const getDeviceId = (): string => {
  const storageKey = 'wedding_gallery_device_id';
  
  // Try to get existing device ID from localStorage
  const existingId = localStorage.getItem(storageKey);
  if (existingId) {
    return existingId;
  }
  
  // Generate new device ID
  const deviceId = generateDeviceId();
  
  // Store in localStorage
  localStorage.setItem(storageKey, deviceId);
  
  return deviceId;
};

// Store and retrieve user name for this device
export const getUserName = (): string | null => {
  return localStorage.getItem('wedding_gallery_user_name');
};

export const setUserName = (name: string): void => {
  localStorage.setItem('wedding_gallery_user_name', name);
};

export const clearUserName = (): void => {
  localStorage.removeItem('wedding_gallery_user_name');
};

const generateDeviceId = (): string => {
  // Use a combination of timestamp and random values
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substr(2, 9);
  
  // Add some browser characteristics for uniqueness
  const navigatorData = [
    navigator.userAgent.slice(-10),
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset()
  ].join('|');
  
  // Simple hash of navigator data
  const hash = btoa(navigatorData).slice(0, 8);
  
  return `device_${timestamp}_${randomPart}_${hash}`;
};