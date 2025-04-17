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

interface RaydiumChartProps {
  price: number | null;
  priceHistory: PricePoint[];
  loading: boolean;
  error: string | null;
  tokenPair: string; // New prop for token pair
}

const RaydiumChart: React.FC<RaydiumChartProps> = ({
  price,
  priceHistory,
  loading,
  error,
  tokenPair,
}) => {
  // Split tokenPair into base and quote tokens (e.g., "SOL/USDC" -> "SOL" and "USDC")
  const [baseToken, quoteToken] = tokenPair.split('/');

  const chartData = {
    labels: priceHistory.map((point) => point.timestamp),
    datasets: [
      {
        label: `${baseToken}/${quoteToken} Price`, // Dynamic label
        data: priceHistory.map((point) => point.price),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
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
        text: `${baseToken}/${quoteToken} Price Over Time`, // Dynamic title
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
          text: `Price (${quoteToken})`, // Dynamic y-axis title
        },
      },
    },
  };

  return (
    <div className="chart-section">
      <p>Raydium</p>
      {loading && <p>Loading...</p>}
      {error && <p>{error}</p>}
      {price && (
        <div className="table-section">
          <p className="price">1 {baseToken} = {price.toFixed(6)} {quoteToken}</p> {/* Dynamic price text */}
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
};

export default RaydiumChart;