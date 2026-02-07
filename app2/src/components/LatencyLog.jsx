function LatencyLog({ logs }) {
  if (logs.length === 0) return null;

  return (
    <div className="latency-log">
      <h3>⚡ Performance Log (ms)</h3>
      <ul>
        {logs.map((log, i) => (
          <li key={log.timestamp} className={log.duration > 100 ? 'slow' : ''}>
            <span className="operation">{log.operation}:</span>
            <span className="duration">{log.duration}ms</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default LatencyLog;
