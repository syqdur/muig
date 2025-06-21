// Local file upload service to replace Firebase
export class UploadService {
  // Upload multiple files for media gallery
  static async uploadMediaFiles(
    userId: number,
    files: FileList,
    userName: string,
    onProgress: (progress: number) => void
  ): Promise<any[]> {
    const formData = new FormData();
    
    // Add files to form data
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });
    
    formData.append('uploadedBy', userName);
    
    try {
      const response = await fetch(`/api/users/${userId}/media/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      onProgress(100);
      return await response.json();
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }
  
  // Upload files for timeline events
  static async uploadTimelineFiles(
    userId: number,
    files: FileList,
    eventData: {
      title: string;
      description: string;
      date: string;
      location?: string;
      type: string;
      createdBy: string;
    },
    onProgress: (progress: number) => void
  ): Promise<any> {
    const formData = new FormData();
    
    // Add files to form data
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });
    
    // Add event data
    Object.entries(eventData).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value);
      }
    });
    
    try {
      const response = await fetch(`/api/users/${userId}/timeline/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      onProgress(100);
      return await response.json();
    } catch (error) {
      console.error('Timeline upload error:', error);
      throw error;
    }
  }
  
  // Upload single video blob (for recorded videos)
  static async uploadVideoBlob(
    userId: number,
    videoBlob: Blob,
    userName: string,
    onProgress: (progress: number) => void
  ): Promise<any> {
    const formData = new FormData();
    const file = new File([videoBlob], `recorded-video-${Date.now()}.webm`, {
      type: 'video/webm'
    });
    
    formData.append('files', file);
    formData.append('uploadedBy', userName);
    
    try {
      const response = await fetch(`/api/users/${userId}/media/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      onProgress(100);
      const result = await response.json();
      return result[0]; // Return first item since we uploaded one file
    } catch (error) {
      console.error('Video upload error:', error);
      throw error;
    }
  }
}