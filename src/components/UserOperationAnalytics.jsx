import React, { useMemo } from "react";
import { format } from "date-fns";
import { getLogDetails } from "../utils/logTranslator";

const UserOperationAnalytics = ({ isLoading, error, results, userList }) => {
  // Create a map from user ID to user name for quick lookups
  const userMap = useMemo(() => {
    if (!userList) return new Map();
    return new Map(userList.map((user) => [user.id, user.name]));
  }, [userList]);

  // Aggregate the log data to create the analytics view
  const aggregatedData = useMemo(() => {
    if (!results || results.length === 0) return [];

    // Use an object to group logs by a unique key: "userId-action"
    const analytics = results.reduce((acc, log) => {
      const { actionPerformed } = getLogDetails(log);
      if (!log.user_id || !actionPerformed) return acc;

      const key = `${log.user_id}-${actionPerformed}`;

      if (!acc[key]) {
        // If this is the first time we see this user/action combo, initialize it
        acc[key] = {
          userId: log.user_id,
          userName: userMap.get(log.user_id) || log.user_id || "N/A",
          operation: actionPerformed,
          blueprint: log.blueprint,
          count: 0,
          lastActionTime: new Date(log.timestamp),
        };
      }

      // Increment the count for this operation
      acc[key].count += 1;

      // Update the 'last action time' if the current log is more recent
      const currentTimestamp = new Date(log.timestamp);
      if (currentTimestamp > acc[key].lastActionTime) {
        acc[key].lastActionTime = currentTimestamp;
      }

      return acc;
    }, {});

    // Convert the aggregated object back into an array for rendering
    return Object.values(analytics);
  }, [results, userMap]);

  // Render logic for loading, error, and empty states
  if (isLoading) {
    return <p className="status-message">Loading analytics data...</p>;
  }

  if (error) {
    return <p className="status-message error">{error}</p>;
  }

  if (aggregatedData.length === 0) {
    return (
      <p className="status-message">
        No user operations found for the selected criteria.
      </p>
    );
  }

  // Render the analytics table
  return (
    <div className="table-container">
      <table className="results-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Operation</th>
            <th>Blueprint</th>
            <th>Performed Count</th>
            <th>Last Action Time</th>
          </tr>
        </thead>
        <tbody>
          {aggregatedData.map((item) => (
            <tr key={`${item.userId}-${item.operation}`}>
              <td data-label="User">{item.userName}</td>
              <td data-label="Operation">{item.operation}</td>
              <td data-label="Blueprint">{item.blueprint}</td>
              <td data-label="Performed Count">{item.count}</td>
              <td data-label="Last Action Time">
                {format(item.lastActionTime, "MMM d, hh:mm a")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserOperationAnalytics;
