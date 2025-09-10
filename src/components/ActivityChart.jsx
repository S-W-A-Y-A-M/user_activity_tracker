// src/components/ActivityChart.jsx
import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ActivityChart = ({ data }) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: "API Calls per Hour",
        data: data.values,
        borderColor: "#42b883",
        backgroundColor: "rgba(66, 184, 131, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "API Activity (Last 24 Hours)",
        color: "#e6e6e6",
      },
    },
    scales: {
      y: { ticks: { color: "#b9bbbe" } },
      x: { ticks: { color: "#b9bbbe" } },
    },
  };

  return <Line options={options} data={chartData} />;
};

export default ActivityChart;
