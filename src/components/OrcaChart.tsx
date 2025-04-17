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
  tokenPair: string;
}

const OrcaChart: React.FC<OrcaChartProps> = ({
  price,
  priceHistory,
  loading,
  error,
  tokenPair,
}) => {
  const [baseToken, quoteToken] = tokenPair.split('/');

  const chartData = {
    labels: priceHistory.map((point) => point.timestamp),
    datasets: [
      {
        label: `${baseToken}/${quoteToken} Price`,
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
        text: `${baseToken}/${quoteToken} Price Over Time`,
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
          text: `Price (${quoteToken})`,
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
        <div className="table-section">
          <p style={{ textAlign: 'center' }}>
            1 {baseToken} = {price.toFixed(6)} {quoteToken}
          </p>
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
};

export default OrcaChart;