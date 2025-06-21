import React, { useState, useEffect } from 'react';
import { getAllUsers, deactivateUser, deleteUser, UserProfile, UserStats } from '../../services/userService';
import { Trash2, Ban, ExternalLink, Users, Image, Calendar } from 'lucide-react';

interface UserManagementProps {
  onClose: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ onClose }) => {
  const [users, setUsers] = useState<(UserProfile & UserStats)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const userData = await getAllUsers();
      setUsers(userData);
    } catch (error) {
      setError('Failed to load users');
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (uid: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;
    
    try {
      await deactivateUser(uid);
      await loadUsers(); // Reload users
    } catch (error) {
      setError('Failed to deactivate user');
      console.error('Error deactivating user:', error);
    }
  };

  const handleDelete = async (uid: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      await deleteUser(uid);
      await loadUsers(); // Reload users
    } catch (error) {
      setError('Failed to delete user');
      console.error('Error deleting user:', error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="text-center">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              User Management
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {users.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              No users found
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.uid}
                  className={`border rounded-lg p-4 ${
                    user.isActive === false 
                      ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.displayName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <Users className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {user.displayName}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </p>
                        </div>
                        {user.isActive === false && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                            Deactivated
                          </span>
                        )}
                      </div>

                      {user.bio && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          {user.bio}
                        </p>
                      )}

                      <div className="flex gap-6 text-sm text-gray-500 dark:text-gray-400 mb-3">
                        <div className="flex items-center gap-1">
                          <Image className="w-4 h-4" />
                          <span>{user.mediaCount} media</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{user.eventsCount} events</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{user.storiesCount} stories</span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        Joined: {new Date(user.createdAt).toLocaleDateString()}
                        {user.lastLoginAt && (
                          <span className="ml-4">
                            Last login: {new Date(user.lastLoginAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => window.open(`/gallery/${user.displayName.toLowerCase()}`, '_blank')}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                        title="View Gallery"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      
                      {user.isActive !== false && (
                        <button
                          onClick={() => handleDeactivate(user.uid)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded"
                          title="Deactivate User"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDelete(user.uid)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};