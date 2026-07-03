export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`bubble-wrapper ${isUser ? 'user' : 'assistant'}`}>
      <div className={`bubble ${isUser ? 'bubble-user' : 'bubble-assistant'} ${message.isCrisis ? 'bubble-crisis' : ''}`}>
        {message.content.split('\n').map((line, i, arr) => (
          <span key={i}>
            {line}
            {i < arr.length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  );
}
