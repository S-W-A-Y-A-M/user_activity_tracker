// src/components/KpiCard.jsx
import React from "react";

const KpiCard = ({ title, value, icon }) => {
  return (
    <div className="kpi-card">
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-content">
        <div className="kpi-value">{value}</div>
        <div className="kpi-title">{title}</div>
      </div>
    </div>
  );
};

export default KpiCard;
