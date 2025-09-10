// src/components/ErrorBreakdownChart.jsx
import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const ErrorBreakdownChart = ({ data }) => {
  // --- CHANGE: Check if there is any error data to display ---
  const hasData = data && data.values && data.values.length > 0;

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: "Error Count",
        data: data.values,
        backgroundColor: [
          "#f44336",
          "#ff9800",
          "#ff5722",
          "#e91e63",
          "#9c27b0",
        ],
        borderColor: "#2c2f33",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", labels: { color: "#b9bbbe" } },
      title: { display: true, text: "Error Codes Breakdown", color: "#e6e6e6" },
    },
  };

  return (
    <>
      {/* --- CHANGE: Conditionally render the chart or a message --- */}
      {hasData ? (
        <Doughnut options={options} data={chartData} />
      ) : (
        <div
          style={{ textAlign: "center", color: "#b9bbbe", paddingTop: "5rem" }}
        >
          <h3 style={{ margin: 0 }}>🎉 No Errors Today!</h3>
          <p>The system is running smoothly.</p>
        </div>
      )}
    </>
  );
};

export default ErrorBreakdownChart;
