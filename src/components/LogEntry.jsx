// src/components/LogEntry.jsx
import React from "react";
import { format } from "date-fns";
import PropTypes from "prop-types"; // Import PropTypes

// Helper moved outside the component: it's a pure function that doesn't need to be redefined on each render.
const getStatusClass = (code) => {
  if (!code || typeof code !== "string") return "status-default";
  if (code.startsWith("5")) return "status-error";
  if (code.startsWith("4")) return "status-warn";
  if (code.startsWith("2")) return "status-success";
  return "status-default";
};

const LogEntry = ({ log }) => {
  return (
    <div className="log-entry">
      <div className="log-header">
        <span className={`log-method method-${log.method?.toLowerCase()}`}>
          {log.method || "N/A"}
        </span>
        <span className="log-path">{log.path}</span>
        <span className={`log-status ${getStatusClass(log.code)}`}>
          {log.code || "---"}
        </span>
      </div>
      <div className="log-meta">
        <span className="log-timestamp">
          {/* Added a check to prevent errors if timestamp is invalid */}
          {log.timestamp
            ? format(new Date(log.timestamp), "HH:mm:ss.SSS")
            : "Invalid Date"}
        </span>
        <span className="log-blueprint">
          Blueprint: {log.blueprint || "N/A"}
        </span>
        <span className="log-ip">IP: {log.ip}</span>
        <span className="log-user">User: {log.user_id || "N/A"}</span>
      </div>
      {log.message && <div className="log-message">{log.message}</div>}
    </div>
  );
};

// Define the expected shape and types for the 'log' prop.
LogEntry.propTypes = {
  log: PropTypes.shape({
    method: PropTypes.string,
    path: PropTypes.string.isRequired,
    code: PropTypes.string,
    timestamp: PropTypes.string.isRequired,
    blueprint: PropTypes.string,
    ip: PropTypes.string.isRequired,
    user_id: PropTypes.string,
    message: PropTypes.string,
  }).isRequired,
};

export default LogEntry;
