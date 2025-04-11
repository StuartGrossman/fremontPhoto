import React, { createContext, useContext, useState } from 'react';

const LogContext = createContext();

export function LogProvider({ children }) {
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toISOString();
    const logEntry = { message, type, timestamp };
    console.log(`[${type.toUpperCase()}] ${message}`);
    setLogs(prevLogs => [...prevLogs, logEntry]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <LogContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </LogContext.Provider>
  );
}

export function useLogger() {
  return useContext(LogContext);
}

export function LogDisplay() {
  const { logs, clearLogs } = useLogger();

  return (
    <div className="log-display">
      <div className="log-header">
        <h3>Application Logs</h3>
        <button onClick={clearLogs}>Clear Logs</button>
      </div>
      <div className="log-content">
        {logs.map((log, index) => (
          <div key={index} className={`log-entry ${log.type}`}>
            <span className="timestamp">[{log.timestamp}]</span>
            <span className="message">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 