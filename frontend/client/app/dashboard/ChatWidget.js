'use client';
import { useState, useEffect, useRef } from 'react';

export default function ChatWidget({ tripId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const API_BASE = 'http://localhost:5001';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/trips/${tripId}/chat/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Błąd ładowania wiadomości:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && tripId) {
      loadMessages();
      // Odświeżaj co 5 sekund gdy czat jest otwarty
      const interval = setInterval(loadMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, tripId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const message = newMessage.trim();
    if (!message || sending) return;

    const userId = localStorage.getItem('user_id');
    if (!userId) {
      console.error('Brak user_id w localStorage');
      alert('Błąd: nie można wysłać wiadomości. Zaloguj się ponownie.');
      return;
    }

    try {
      setSending(true);
      const res = await fetch(`${API_BASE}/api/trips/${tripId}/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: parseInt(userId),
          message
        })
      });

      if (res.ok) {
        setNewMessage('');
        await loadMessages();
      } else {
        const errorData = await res.json();
        console.error('Błąd API:', errorData);
        alert(`Nie udało się wysłać wiadomości: ${errorData.message || 'Nieznany błąd'}`);
      }
    } catch (err) {
      console.error('Błąd wysyłania wiadomości:', err);
      alert('Wystąpił błąd podczas wysyłania wiadomości');
    } finally {
      setSending(false);
    }
  };

  const getAvatarColor = (username) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-yellow-500', 'bg-indigo-500',
      'bg-red-500', 'bg-teal-500'
    ];
    const index = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  };

  const currentUserId = parseInt(localStorage.getItem('user_id'));

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Rozwinięty czat */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl w-96 h-[500px] flex flex-col mb-4 border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">💬</span>
              <span className="font-semibold">Czat wycieczki</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-800 rounded-full p-1 transition"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {loading && messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Ładowanie wiadomości...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Brak wiadomości. Napisz pierwszą!
              </div>
            ) : (
              messages.map((msg) => {
                const isOwnMessage = msg.user_id === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <div className={`${getAvatarColor(msg.username)} w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {msg.username.charAt(0).toUpperCase()}
                    </div>

                    {/* Message bubble */}
                    <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`${isOwnMessage ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'} px-3 py-2 rounded-lg shadow-sm`}>
                        {!isOwnMessage && (
                          <div className="text-xs font-semibold mb-1 text-gray-600">
                            {msg.username}
                          </div>
                        )}
                        <div className="text-sm break-words">{msg.message}</div>
                      </div>
                      <div className={`text-xs text-gray-500 mt-1 px-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Napisz wiadomość..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold transition flex items-center gap-1"
              >
                {sending ? '...' : '📤'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white w-14 h-14 rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center justify-center text-2xl"
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
}
