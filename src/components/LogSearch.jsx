// src/components/LogSearch.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FixedSizeList as List } from "react-window"; // --- CHANGE: Import react-window

const API_URL = "http://localhost:5000";

const LogSearch = () => {
  const [filters, setFilters] = useState({ user_id: "" });
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [userList, setUserList] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API_URL}/users`);
        setUserList(response.data);
      } catch (err) {
        console.error("Failed to fetch user list:", err);
        setError("Could not load user list.");
      }
    };
    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setResults([]);

    try {
      const params = { ...filters, limit: 500 }; // Fetch more logs if needed
      if (startDate) params.start_date = startDate.toISOString();
      if (endDate) params.end_date = endDate.toISOString();

      Object.keys(params).forEach(
        (key) => params[key] === "" && delete params[key]
      );

      const response = await axios.get(`${API_URL}/logs`, { params });
      setResults(response.data);
    } catch (err) {
      setError("Failed to fetch logs. Please check the console for details.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- CHANGE: Create a Row component for react-window ---
  // This tells the list how to render each individual log entry.
  const Row = ({ index, style }) => {
    const log = results[index];
    return (
      <div style={style}>
        <LogEntry log={log} />
      </div>
    );
  };

  return (
    <div>
      <h2>Historical Log Search</h2>
      <form onSubmit={handleSearch}>
        {/* Your form JSX remains the same... */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr auto",
            gap: "1rem",
            alignItems: "flex-end",
          }}
        >
          {/* User Select */}
          <div className="form-group">
            <label htmlFor="user_id">User</label>
            <select
              name="user_id"
              id="user_id"
              value={filters.user_id}
              onChange={handleInputChange}
            >
              <option value="">All Users</option>
              {userList.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          {/* Start Date */}
          <div className="form-group">
            <label htmlFor="start_date">Start Date</label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              isClearable
              showTimeSelect
              dateFormat="Pp"
            />
          </div>
          {/* End Date */}
          <div className="form-group">
            <label htmlFor="end_date">End Date</label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              isClearable
              showTimeSelect
              dateFormat="Pp"
            />
          </div>
          {/* Search Button */}
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {error && <p style={{ color: "var(--accent-red)" }}>{error}</p>}

      {/* --- CHANGE: Render results using the virtualized List --- */}
      {results.length > 0 && (
        <List
          height={500} // The total height of the scrollable area
          itemCount={results.length} // The total number of items
          itemSize={185} // The height of a single LogEntry item in pixels
          width={"100%"} // Take up the full width
          style={{ marginTop: "1.5rem" }}
        >
          {Row}
        </List>
      )}

      {!isLoading && results.length === 0 && !error && (
        <p style={{ textAlign: "center", color: "#888", marginTop: "2rem" }}>
          No results. Refine your search and try again.
        </p>
      )}
    </div>
  );
};

export default LogSearch;
