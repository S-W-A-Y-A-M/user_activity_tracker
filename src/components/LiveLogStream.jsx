import React, { useState, useEffect, useRef, useMemo } from "react";
import { io } from "socket.io-client";
import { format } from "date-fns";

// Import the new details function
import { getLogDetails } from "../utils/logTranslator";

const SOCKET_URL = "http://localhost:5000/logs";
const MAX_LOGS = 100;

const getStatusClass = (code) => {
  if (!code || typeof code !== "string") return "";
  if (code.startsWith("5")) return "status-error";
  if (code.startsWith("4")) return "status-warn";
  if (code.startsWith("2")) return "status-success";
  return "";
};

const LiveLogStream = ({ userList }) => {
  const [logs, setLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const tableContainerRef = useRef(null);

  const userMap = useMemo(() => {
    if (!userList) return new Map();
    return new Map(userList.map((user) => [user.id, user.name]));
  }, [userList]);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket"] });

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("subscribe", { type: "latest" });
    });

    socket.on("disconnect", () => setIsConnected(false));

    socket.on("log", (logData) => {
      try {
        const newLog = JSON.parse(logData);
        setLogs((prevLogs) => [newLog, ...prevLogs].slice(0, MAX_LOGS));
      } catch (error) {
        console.error("Failed to parse log data:", error);
      }
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  }, [logs]);

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "1rem" }}>Live Log Stream</h2>
        <span
          style={{
            color: isConnected ? "var(--accent-green)" : "var(--accent-red)",
            fontSize: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "1.5rem" }}>●</span>
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>

      {/* Table */}
      <div className="table-container" ref={tableContainerRef}>
        {logs.length > 0 ? (
          <table className="results-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Operation</th>
                <th>Blueprint</th>
                <th>Path</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const details = getLogDetails(log);
                return (
                  <tr
                    key={log._id}
                    className={log.is_login_event ? "log-entry-login" : ""}
                  >
                  <td data-label="Timestamp">
                   {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}
                  </td>
                    <td data-label="User">
                      {userMap.get(log.user_id) || log.user_id || "N/A"}
                    </td>
                    <td data-label="Operation">
                      {details.actionPerformed}
                    </td>
                    <td data-label="Blueprint">{log.blueprint || "N/A"}</td>
                    <td data-label="Path" className="log-path">
                      {log.path}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="status-message">Waiting for new logs...</p>
        )}
      </div>
    </div>
  );
};

export default LiveLogStream;
