// src/components/SearchPane.jsx
import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const SearchPane = ({ userList, onSearch, isLoading }) => {
  const [userId, setUserId] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const filters = {
      user_id: userId,
      start_date: startDate ? startDate.toISOString() : null,
      end_date: endDate ? endDate.toISOString() : null,
    };
    onSearch(filters);
  };

  return (
    <div className="search-pane-container">
      <h2>Historical Log Search</h2>
      <form onSubmit={handleSubmit}>
        {/* User Select */}
        <div className="form-group">
          <label htmlFor="user_id">User</label>
          <select
            name="user_id"
            id="user_id"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
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
            className="date-picker-input"
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
            className="date-picker-input"
          />
        </div>

        {/* Search Button */}
        <button type="submit" disabled={isLoading} className="search-button">
          {isLoading ? "Searching..." : "Search"}
        </button>
      </form>
    </div>
  );
};

export default SearchPane;
