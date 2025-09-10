// src/components/LogTable.jsx
import React, { useMemo } from "react";
import { format } from "date-fns";
import { getLogDetails } from "../utils/logTranslator";

const LogTable = ({ logs, userList }) => {
  const userMap = useMemo(() => {
    if (!userList) return new Map();
    return new Map(userList.map((user) => [user.id, user.name]));
  }, [userList]);

  return (
    <div className="table-container">
      <table className="results-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Timestamp</th>
            <th>Method</th>
            <th>Blueprint</th>
            <th>Path</th>
            <th>IP Address</th>
            <th>Status Message</th>
            <th>Action Performed</th>
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
                <td data-label="User">
                  {userMap.get(log.user_id) || log.user_id || "N/A"}
                </td>
                <td data-label="Timestamp">
                  {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}
                </td>
                <td data-label="Method">
                  <span
                    className={`log-method method-${log.method?.toLowerCase()}`}
                  >
                    {log.method}
                  </span>
                </td>
                <td data-label="Blueprint">{log.blueprint || "N/A"}</td>
                <td data-label="Path" className="log-path">
                  {log.path}
                </td>
                <td data-label="IP Address">{log.ip}</td>
                <td data-label="Status Message" className="log-message">
                  {log.message || "None"}
                </td>
                <td data-label="Action Performed">{details.actionPerformed}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default LogTable;
