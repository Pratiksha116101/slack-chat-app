import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { channelsApi } from '../services/api';
import ChannelList from '../components/ChannelList';
import ChatView from '../components/ChatView';
import Navigation from '../components/Navigation';

export default function ChatLayout({ setIsAuthenticated }) {
  const [channels, setChannels] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUser(null);
      }
    }
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const response = await channelsApi.getAll();
      const data = response.data || [];
      setChannels(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0 && data[0]._id) {
        setSelectedChannelId(data[0]._id);
      }
    } catch (error) {
      console.error('Error loading channels:', error);
      setChannels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-2xl font-bold text-gray-800">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      <ChannelList
        channels={channels}
        selectedChannelId={selectedChannelId}
        setSelectedChannelId={setSelectedChannelId}
        onChannelCreated={loadChannels}
      />
      <div className="flex-1 flex flex-col">
        <Navigation user={user} onLogout={handleLogout} />
        {selectedChannelId ? (
          <ChatView
            channelId={selectedChannelId}
            channels={channels}
            user={user}
            onChannelsUpdated={loadChannels}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Select a channel to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
