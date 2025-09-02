import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CustomBarChart, CustomPieChart, CustomLineChart } from './ChartComponents';
import './Analytics.css';

const AnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5038/api/analytics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAnalyticsData(response.data);
        setError('');
      } catch (err) {
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const renderChart = (chartType, data, title) => {
    if (!data || Object.keys(data).length === 0) return null;

    const chartData = Object.entries(data).map(([name, value]) => ({ name, value }));

    switch(chartType) {
      case 'line': return <CustomLineChart data={chartData} title={title} />;
      case 'bar': return <CustomBarChart data={chartData} title={title} />;
      case 'pie': return <CustomPieChart data={chartData} title={title} />;
      default: return null;
    }
  };

  return (
    <div className="analytics-container">
      {loading && <div className="loading">Loading analytics...</div>}
      {error && <div className="error">{error}</div>}

      {/* Demographical Analysis Row */}
      <div className="analysis-row">
        <div className="demographical-analysis">
          <h2>Sales by Location</h2>
          {renderChart('bar', analyticsData?.demographics.locationSales, 'Top Locations')}
        </div>
        
        <div className="top-selling">
          <h2>Top Selling Products</h2>
          <div className="products-grid">
            {Object.entries(analyticsData?.topSelling || {}).map(([category, brackets]) => (
              <div key={category} className="category-card">
                <h3>{category}</h3>
                {Object.entries(brackets).map(([range, product]) => (
                  <div key={range} className="product-item">
                    <span className="price-range">{range}:</span>
                    <span className="product-name">{product}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sales Analysis Row */}
      <div className="analysis-row">
        <div className="sales-analysis">
          <h2>Sales Overview</h2>
          <div className="sales-grid">
            <div className="main-chart">
              {renderChart('line', analyticsData?.salesAnalysis.monthlySales, 'Monthly Sales Trend')}
            </div>
            <div className="side-charts">
              {renderChart('bar', analyticsData?.salesAnalysis.topCategories, 'Top Categories')}
              {renderChart('bar', analyticsData?.salesAnalysis.returnRates, 'Return Rates')}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Behavior Analysis */}
      <div className="analysis-row">
        <div className="customer-behavior">
          <h2>Customer Insights</h2>
          <div className="behavior-grid">
            {renderChart('pie', analyticsData?.customerBehavior.ageDistribution, 'Age Distribution')}
            {renderChart('pie', analyticsData?.customerBehavior.genderSales, 'Gender Sales')}
            {renderChart('bar', analyticsData?.customerBehavior.discountImpact, 'Discount Impact')}
            {renderChart('pie', analyticsData?.customerBehavior.customerTypes, 'Customer Types')}
            {renderChart('pie', analyticsData?.customerBehavior.advertisementImpact, 'Ad Impact')}
            {renderChart('bar', analyticsData?.customerBehavior.ageSales, 'Age vs Spending')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
