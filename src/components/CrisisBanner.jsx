export default function CrisisBanner({ visible }) {
  return (
    <div className={`crisis-banner ${visible ? 'visible' : ''}`}>
      Se você está em risco, ligue agora: <strong>188</strong> (CVV, 24h gratuito) &bull; <strong>192</strong> (SAMU) &bull; <strong>190</strong> (Polícia)
    </div>
  );
}
