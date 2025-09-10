import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TopOperationsChart = ({ data }) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        // --- CHANGE: Updated label for clarity ---
        label: "Operation Count",
        data: data.values,
        backgroundColor: "rgba(100, 108, 255, 0.7)",
        borderColor: "#646cff",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    indexAxis: "y", // Horizontal bar chart
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      // --- CHANGE: Title updated to match the new requirement ---
      title: {
        display: true,
        text: "Top 5 User Operations Today",
        color: "#e6e6e6",
      },
    },
    scales: {
      y: { ticks: { color: "#b9bbbe" } },
      x: { ticks: { color: "#b9bbbe" } },
    },
  };

  return <Bar options={options} data={chartData} />;
};

export default TopOperationsChart;
