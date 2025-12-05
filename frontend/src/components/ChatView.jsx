import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { messagesApi, channelsApi } from '../services/api';
import Message from './Message';

export default function ChatView({ channelId, channels, user, onChannelsUpdated }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]); // array of { userId, username }
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [pagination, setPagination] = useState({ skip: 0, limit: 50, total: 0, hasMore: false });
  const [loadingMore, setLoadingMore] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const channel = channels && Array.isArray(channels) 
    ? channels.find(ch => ch && ch._id === channelId)
    : null;

  useEffect(() => {
    setMessages([]);
    setPagination({ skip: 0, limit: 50, total: 0, hasMore: false });
    loadMessages(0);
    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [channelId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    socketRef.current = io({
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    let userData = null;
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        userData = JSON.parse(userStr);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }

    socketRef.current.on('connect', () => {
      console.log('Connected to socket');
      if (userData) {
        socketRef.current.emit('user_login', userData);
        socketRef.current.emit('join_channel', channelId);
      }
    });

    socketRef.current.on('receive_message', (data) => {
      setMessages(prev => [...prev, data]);
    });

    socketRef.current.on('message_edited', (data) => {
      setMessages(prev =>
        prev.map(msg => msg._id === data._id ? { ...msg, content: data.content, edited: data.edited, editedAt: data.editedAt } : msg)
      );
    });

    socketRef.current.on('message_deleted', (data) => {
      setMessages(prev => prev.filter(msg => msg._id !== data._id));
    });

    socketRef.current.on('user_typing', (data) => {
      if (!data || !userData || data.userId === userData.id) return;
      setTypingUsers(prev => {
        if (prev.find(u => u.userId === data.userId)) return prev;
        return [...prev, { userId: data.userId, username: data.username }];
      });
    });

    socketRef.current.on('user_stop_typing', (data) => {
      if (!data) return;
      setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
    });

    // Online users per channel
    socketRef.current.on('channel_online_users', (data) => {
      if (data.channelId === channelId) {
        setOnlineUsers(data.onlineUsers);
      }
    });

    socketRef.current.on('user_joined_channel', (data) => {
      if (data.channelId === channelId) {
        setOnlineUsers(prev => {
          const exists = prev.find(u => u.userId === data.userId);
          return exists ? prev : [...prev, { userId: data.userId, username: data.username }];
        });
      }
    });

    socketRef.current.on('user_left_channel', (data) => {
      if (data.channelId === channelId) {
        setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId));
      }
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from socket');
    });
  };

  const loadMessages = async (skip = 0) => {
    try {
      const response = await messagesApi.getByChannel(channelId, 50, skip);
      const { messages: newMessages, total, hasMore } = response.data;
      
      if (skip === 0) {
        setMessages(newMessages);
      } else {
        setMessages(prev => [...newMessages, ...prev]);
      }
      
      setPagination({ skip, limit: 50, total, hasMore });
      setLoadingMore(false);
    } catch (error) {
      console.error('Error loading messages:', error);
      setLoadingMore(false);
    } finally {
      if (skip === 0) setLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!pagination.hasMore || loadingMore) return;
    
    setLoadingMore(true);
    const nextSkip = pagination.skip + pagination.limit;
    await loadMessages(nextSkip);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage('');

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (socketRef.current) {
      socketRef.current.emit('stop_typing', { channelId });
    }

    try {
      const response = await messagesApi.create(content, channelId);
      socketRef.current.emit('send_message', {
        _id: response.data._id,
        sender: response.data.sender,
        channelId,
        content: response.data.content,
        timestamp: response.data.timestamp
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTyping = () => {
    if (socketRef.current) {
      socketRef.current.emit('typing', { channelId });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit('stop_typing', { channelId });
      }
    }, 3000);
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await messagesApi.delete(messageId);
      socketRef.current.emit('delete_message', {
        _id: messageId,
        channelId
      });
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleEditMessage = async (messageId, newContent) => {
    try {
      const response = await messagesApi.update(messageId, newContent);
      socketRef.current.emit('edit_message', {
        _id: response.data._id,
        channelId,
        content: response.data.content,
        edited: response.data.edited,
        editedAt: response.data.editedAt
      });
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-gray-500">Loading messages...</div>;
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-800">
      {/* Channel Header */}
      <div className="bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">#{channel?.name}</h2>
          <p className="text-sm text-gray-400">{channel?.description}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-sm text-gray-300">
            <span className="font-semibold text-white">{channel?.members?.length || 0}</span> {channel?.members?.length === 1 ? 'member' : 'members'}
          </div>
          <div className="text-xs text-gray-400 max-w-xs overflow-ellipsis">
            Online: <span className="text-green-400 font-semibold">{onlineUsers.length}</span>
          </div>
        </div>
      </div>

      {/* Online Users List */}
      {onlineUsers.length > 0 && (
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
          <p className="text-xs text-gray-400 mb-1">Online Users:</p>
          <div className="flex flex-wrap gap-2">
            {onlineUsers.map(u => (
              <div key={u.userId} className="flex items-center gap-1 bg-green-600 bg-opacity-30 px-2 py-1 rounded text-xs text-green-300">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                {u.username}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
        {pagination.hasMore && (
          <button
            onClick={loadMoreMessages}
            disabled={loadingMore}
            className="mx-auto text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load More Messages'}
          </button>
        )}

        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <Message
              key={msg?._id}
              message={msg}
              isOwn={!!(msg && msg.sender && user && msg.sender._id === user.id)}
              onDelete={handleDeleteMessage}
              onEdit={handleEditMessage}
            />
          ))
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="text-sm text-gray-400 italic">
            {typingUsers.length === 1 && `${typingUsers[0].username} is typing...`}
            {typingUsers.length === 2 && `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`}
            {typingUsers.length > 2 && `${typingUsers[0].username}, ${typingUsers[1].username} and ${typingUsers.length - 2} others are typing...`}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="bg-gray-900 border-t border-gray-700 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type your message..."
            className="flex-1 bg-gray-800 text-white px-4 py-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded transition duration-200"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
