function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const days = Math.floor((now - d) / 86400000);
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  if (days < 7) return `${days} dias atrás`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function Sidebar({ open, conversations, currentConvId, onSelect, onNew, onDelete, onSignOut, user }) {
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">Acolhe</div>
        <button className="new-conv-btn" onClick={onNew}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nova conversa
        </button>
      </div>

      <div className="conv-list">
        {conversations.length === 0 ? (
          <p className="conv-empty">Nenhuma conversa ainda</p>
        ) : (
          conversations.map(conv => (
            <div
              key={conv.id}
              className={`conv-item ${conv.id === currentConvId ? 'active' : ''}`}
              onClick={() => onSelect(conv.id)}
            >
              <div className="conv-title">{conv.title}</div>
              <div className="conv-date">{formatDate(conv.updated_at)}</div>
              <button
                className="conv-delete"
                onClick={e => { e.stopPropagation(); onDelete(conv.id); }}
                aria-label="Excluir"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      <div className="sidebar-footer">
        <div className="user-avatar">
          {(user.user_metadata?.full_name?.[0] || user.email?.[0] || '?').toUpperCase()}
        </div>
        <div className="user-email">{user.email}</div>
        <button className="signout-btn" onClick={onSignOut}>Sair</button>
      </div>
    </aside>
  );
}
