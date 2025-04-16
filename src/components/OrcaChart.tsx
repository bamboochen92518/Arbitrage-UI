import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { PricePoint } from '../types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface OrcaChartProps {
  price: number | null;
  priceHistory: PricePoint[];
  loading: boolean;
  error: string | null;
}

const OrcaChart: React.FC<OrcaChartProps> = ({
  price,
  priceHistory,
  loading,
  error,
}) => {
  const chartData = {
    labels: priceHistory.map((point) => point.timestamp),
    datasets: [
      {
        label: 'SOL/USDC Price',
        data: priceHistory.map((point) => point.price),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: false,
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'SOL/USDC Price Over Time',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Price (USDC)',
        },
      },
    },
  };

  return (
    <div className="chart-section">
      <p>Orca</p>
      {loading && <p>Loading...</p>}
      {error && <p>{error}</p>}
      {price && (
        <div>
          <p style={{ textAlign: 'center' }}>1 SOL = {price.toFixed(6)} USDC</p>
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
};

export default OrcaChart;