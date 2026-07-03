import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import Sidebar from '../components/Sidebar';
import MessageBubble from '../components/MessageBubble';
import CrisisBanner from '../components/CrisisBanner';

function generateTitle(text) {
  const cleaned = text.trim().replace(/\n/g, ' ');
  return cleaned.length > 60 ? cleaned.slice(0, 57) + '...' : cleaned;
}

export default function ChatPage({ session }) {
  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [crisis, setCrisis] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { loadConversations(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  function authHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    };
  }

  async function loadConversations() {
    const res = await fetch('/api/conversations', { headers: authHeaders() });
    if (res.ok) setConversations(await res.json());
  }

  async function loadConversation(id) {
    const res = await fetch(`/api/conversations/${id}`, { headers: authHeaders() });
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.map(m => ({ role: m.role, content: m.content, isCrisis: m.is_crisis })));
    setCurrentConvId(id);
    setCrisis(data.some(m => m.is_crisis));
    setSidebarOpen(false);
  }

  function startNew() {
    setCurrentConvId(null);
    setMessages([]);
    setCrisis(false);
    setSidebarOpen(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  async function deleteConversation(id) {
    await fetch(`/api/conversations/${id}`, { method: 'DELETE', headers: authHeaders() });
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConvId === id) startNew();
  }

  function handleInputChange(e) {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'; }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setLoading(true);

    const newMsg = { role: 'user', content: text };
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);

    let convId = currentConvId;

    if (!convId) {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ title: generateTitle(text) }),
      });
      if (!res.ok) { setLoading(false); return; }
      const newConv = await res.json();
      convId = newConv.id;
      setCurrentConvId(convId);
      setConversations(prev => [newConv, ...prev]);
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          conversationId: convId,
        }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();

      setMessages(prev => [...prev, { role: 'assistant', content: data.text, isCrisis: data.isCrisis }]);
      if (data.isCrisis) setCrisis(true);

      setConversations(prev => {
        const conv = prev.find(c => c.id === convId);
        if (!conv) return prev;
        return [{ ...conv, updated_at: new Date().toISOString() }, ...prev.filter(c => c.id !== convId)];
      });
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Não foi possível obter uma resposta agora. Tente novamente.', isCrisis: false },
      ]);
    }

    setLoading(false);
  }

  return (
    <div className="chat-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <Sidebar
        open={sidebarOpen}
        conversations={conversations}
        currentConvId={currentConvId}
        onSelect={loadConversation}
        onNew={startNew}
        onDelete={deleteConversation}
        onSignOut={() => supabase.auth.signOut()}
        user={session.user}
      />

      <div className="chat-main">
        <CrisisBanner visible={crisis} />

        <div className="mobile-header">
          <button className="hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="Menu">
            <span /><span /><span />
          </button>
          <span className="mobile-header-title">Acolhe</span>
          <div style={{ width: 36 }} />
        </div>

        <div className="content-area">
          {messages.length === 0 ? (
            <div className="welcome">
              <div className="orb" />
              <h1>Como você se sente hoje?</h1>
              <p>Este é um espaço seguro de escuta. Não substitui acompanhamento profissional — em emergência, ligue 188 (CVV).</p>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((m, i) => <MessageBubble key={i} message={m} />)}
              {loading && (
                <div className="typing-indicator">
                  <span /><span /><span />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="composer">
          <div className="composer-box">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Como você está se sentindo..."
              rows={1}
              disabled={loading}
            />
            <button className="send-btn" onClick={sendMessage} disabled={!input.trim() || loading} aria-label="Enviar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
