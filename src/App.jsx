// src/App.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaUsers,
  FaServer,
  FaExclamationTriangle,
  FaSignInAlt,
} from "react-icons/fa";

import KpiCard from "./components/KpiCard";
import ActivityChart from "./components/ActivityChart";
import TopEndpointsChart from "./components/TopEndpointsChart";
import ErrorBreakdownChart from "./components/ErrorBreakdownChart";
import LiveLogStream from "./components/LiveLogStream";
import SearchPane from "./components/SearchPane";
import SearchResultsTable from "./components/UserOperationAnalytics";
import "./App.css";

const API_URL = "http://localhost:5000";

function App() {
  // ... (all other state and functions remain the same)
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [userList, setUserList] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [activeFilters, setActiveFilters] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get(`${API_URL}/report/dashboard_stats`);
        setDashboardData(response.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Could not load dashboard statistics.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API_URL}/users`);
        setUserList(response.data);
      } catch (err) {
        console.error("Failed to fetch user list:", err);
      }
    };
    fetchUsers();
  }, []);

  const handleSearch = async (filters) => {
    setActiveFilters(filters);
    setIsSearching(true);
    setSearchError("");
    setSearchResults([]);

    try {
      const params = { ...filters, limit: 500 };
      Object.keys(params).forEach(
        (key) =>
          (params[key] === "" || params[key] === null) && delete params[key]
      );
      const response = await axios.get(`${API_URL}/logs`, { params });
      setSearchResults(response.data);
    } catch (err) {
      setSearchError("Failed to fetch logs.");
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  if (isLoading) return <p className="status-message">Loading Dashboard...</p>;
  if (error) return <p className="status-message error">{error}</p>;
  if (!dashboardData)
    return <p className="status-message">Waiting for data...</p>;

  const showSearchResults = activeFilters !== null;

  return (
    <div className="app-container">
      <header>
        <h1>Audit Log Dashboard</h1>
      </header>
      <div className="main-layout">
        <main className="main-content">
          {/* ... (KPI and Charts sections remain the same) */}
          <section className="kpi-grid">
            <KpiCard
              title="Unique Users Today"
              value={dashboardData.kpis.unique_users_today}
              icon={<FaUsers />}
            />
            <KpiCard
              title="Total API Calls"
              value={dashboardData.kpis.total_api_calls}
              icon={<FaServer />}
            />
            <KpiCard
              title="Error Rate"
              value={`${dashboardData.kpis.error_rate}%`}
              icon={<FaExclamationTriangle />}
            />
            <KpiCard
              title="Total Logins"
              value={dashboardData.kpis.total_logins}
              icon={<FaSignInAlt />}
            />
          </section>
          <section className="charts-grid">
            <div className="card chart-container">
              <ActivityChart data={dashboardData.charts.activity_over_time} />
            </div>
            <div className="card chart-container">
              <TopEndpointsChart data={dashboardData.charts.top_endpoints} />
            </div>
            <div className="card chart-container">
              <ErrorBreakdownChart
                data={dashboardData.charts.error_breakdown}
              />
            </div>
          </section>
          {showSearchResults ? (
            <section className="card">
              <h2>Search Results</h2>
              <SearchResultsTable
                isLoading={isSearching}
                error={searchError}
                results={searchResults}
                userList={userList}
              />
            </section>
          ) : (
            <section className="card">
              <h2>Live Log Stream</h2>
              {/* --- CHANGE: Pass userList to the live stream component --- */}
              <LiveLogStream userList={userList} />
            </section>
          )}
        </main>
        <aside className="right-pane">
          <SearchPane
            userList={userList}
            onSearch={handleSearch}
            isLoading={isSearching}
          />
        </aside>
      </div>
    </div>
  );
}

export default App;
