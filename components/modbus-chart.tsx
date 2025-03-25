"use client"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Line } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface ModbusChartProps {
  data: {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      borderColor: string
      backgroundColor: string
      pointStyle: "circle"
      pointRadius: 3
      showLine: boolean
    }>
  }
}

export function ModbusChart({ data }: ModbusChartProps) {
  return (
    <Line
      data={data.labels.length > 0 ? data : { labels: ["No data"], datasets: [] }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const reg = context.dataset.label || ""
                const value = context.parsed.y
                return `${reg}: ${value}`
              },
            },
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            borderColor: "rgba(75, 192, 75, 0.8)",
            borderWidth: 1,
            titleFont: {
              size: 14,
            },
            bodyFont: {
              size: 14,
            },
          },
          legend: {
            display: true,
            position: "top",
            labels: {
              color: "white",
              font: {
                size: 13,
              },
              usePointStyle: true,
              pointStyle: "circle"
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Tempo",
              color: "white",
              font: {
                size: 14,
              },
            },
            grid: {
              display: true,
              color: "rgba(70, 70, 70, 0.2)",
            },
            ticks: {
              color: "white",
              font: {
                size: 12,
              },
            },
          },
          y: {
            title: {
              display: true,
              text: "Valor (Dec)",
              color: "white",
              font: {
                size: 14,
              },
            },
            beginAtZero: true,
            grid: {
              display: true,
              color: "rgba(70, 70, 70, 0.2)",
            },
            ticks: {
              color: "white",
              font: {
                size: 12,
              },
            },
          },
        },
        elements: {
          point: {
            radius: 12,
            hoverRadius: 14,
          },
          line: {
            tension: 0,
          },
        },
        animation: {
          duration: 0,
        },
      }}
    />
  )
}

