import { useState } from 'react';

export default function Message({ message, isOwn, onDelete, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message?.content || '');

  const handleEditSubmit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit(message._id, editContent);
      setIsEditing(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div
        className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
          isOwn
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-100'
        }`}
      >
        {!isOwn && (
          <p className="text-sm font-semibold text-gray-300">{message?.sender?.username || 'Unknown'}</p>
        )}

        {isEditing ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="flex-1 px-2 py-1 bg-gray-800 text-white rounded text-sm"
              autoFocus
            />
            <button
              onClick={handleEditSubmit}
              className="text-green-400 hover:text-green-300 text-xs font-semibold"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(message.content);
              }}
              className="text-red-400 hover:text-red-300 text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <p className="break-words">{message.content}</p>
            {message.edited && (
              <p className="text-xs opacity-75 mt-1">(edited)</p>
            )}
          </>
        )}

        <p className={`text-xs mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
          {formatTime(message.timestamp)}
        </p>

        {isOwn && !isEditing && (
          <div className="opacity-0 group-hover:opacity-100 transition duration-200 flex gap-2 mt-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs bg-blue-500 hover:bg-blue-700 px-2 py-1 rounded text-white"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(message._id)}
              className="text-xs bg-red-500 hover:bg-red-700 px-2 py-1 rounded text-white"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
