import { useState, useEffect } from 'react';
import { channelsApi } from '../services/api';

export default function ChannelList({ channels, selectedChannelId, setSelectedChannelId, onChannelCreated }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userChannels, setUserChannels] = useState([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      setUserChannels([]);
      return;
    }
    try {
      const user = JSON.parse(userData);
      const filtered = channels.filter(ch => ch.members && ch.members.some(m => m._id === user.id));
      setUserChannels(filtered);
    } catch (error) {
      console.error('Error parsing user data:', error);
      setUserChannels([]);
    }
  }, [channels]);

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await channelsApi.create(newChannelName, newChannelDesc);
      setNewChannelName('');
      setNewChannelDesc('');
      setShowCreateModal(false);
      onChannelCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create channel');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChannel = async (channelId) => {
    try {
      await channelsApi.join(channelId);
      onChannelCreated();
      setSelectedChannelId(channelId);
    } catch (error) {
      console.error('Error joining channel:', error);
    }
  };

  const handleLeaveChannel = async (channelId, e) => {
    e.stopPropagation();
    try {
      await channelsApi.leave(channelId);
      onChannelCreated();
      if (selectedChannelId === channelId) {
        setSelectedChannelId(null);
      }
    } catch (error) {
      console.error('Error leaving channel:', error);
    }
  };

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col border-r border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold mb-4">Channels</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition duration-200"
        >
          + New Channel
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">YOUR CHANNELS</h3>
          {userChannels && userChannels.length > 0 ? (
            userChannels.map((channel) => {
              if (!channel || !channel._id) return null;
              return (
                <div
                  key={channel._id}
                  onClick={() => setSelectedChannelId(channel._id)}
                  className={`p-3 mb-2 rounded cursor-pointer transition duration-200 flex items-center justify-between group ${
                    selectedChannelId === channel._id
                      ? 'bg-blue-600'
                      : 'hover:bg-gray-700'
                  }`}
                >
                  <span className="truncate">#{channel.name || 'Unnamed'}</span>
                  <button
                    onClick={(e) => handleLeaveChannel(channel._id, e)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 text-sm"
                    title="Leave channel"
                  >
                    ✕
                  </button>
                </div>
              );
            })
          ) : (
            <p className="text-gray-400 text-sm">No channels yet</p>
          )}
        </div>

        <div className="p-4 border-t border-gray-700">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">BROWSE CHANNELS</h3>
          {channels && Array.isArray(channels) && channels.length > 0 ? (
            channels.map((channel) => {
              if (!channel || !channel._id) return null;
              const userData = localStorage.getItem('user');
              let currentUserId = null;
              try {
                if (userData) {
                  currentUserId = JSON.parse(userData).id;
                }
              } catch (error) {
                console.error('Error parsing user:', error);
              }
              const isMember = channel.members && channel.members.some(m => m && m._id === currentUserId);
              return !isMember ? (
                <div
                  key={channel._id}
                  className="p-3 mb-2 rounded bg-gray-700 hover:bg-gray-600 transition duration-200 flex items-center justify-between group cursor-pointer"
                >
                  <span className="truncate text-sm">{channel.name || 'Unnamed'}</span>
                  <button
                    onClick={() => handleJoinChannel(channel._id)}
                    className="opacity-0 group-hover:opacity-100 text-green-400 hover:text-green-500 text-sm"
                    title="Join channel"
                  >
                    +
                  </button>
                </div>
              ) : null;
            })
          ) : (
            <p className="text-gray-400 text-sm">No channels available</p>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Create New Channel</h3>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateChannel}>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">Channel Name</label>
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">Description (optional)</label>
                <textarea
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  rows="3"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewChannelName('');
                    setNewChannelDesc('');
                  }}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
