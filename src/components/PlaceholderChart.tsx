interface PlaceholderChartProps {
    title: string;
  }
  
  const PlaceholderChart: React.FC<PlaceholderChartProps> = ({ title }) => {
    return (
      <div className="chart-section placeholder">
        <p>{title}</p>
        <p>Placeholder for future chart</p>
      </div>
    );
  };
  
  export default PlaceholderChart;