import { useState, useEffect } from 'react';
import { CustomerPerformance, DashboardSummary } from '@/types/sales';
import { SummaryCard } from '@/components/SummaryCard';
import { CustomerTable } from '@/components/CustomerTable';
import { ProductDetailsModal } from '@/components/ProductDetailsModal';
import { parseCSV, parseExcel, calculatePerformance } from '@/utils/dataProcessor';
import { Target, TrendingUp, Users, Award, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Config {
  customerMasterFile: string;
  salesDataFolder: string;
  salesFiles: string[];
  autoRefreshInterval: number;
}

const Index = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [performances, setPerformances] = useState<CustomerPerformance[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerPerformance | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [config, setConfig] = useState<Config | null>(null);

  // Load cached data instantly on mount
  useEffect(() => {
    loadCachedData();
  }, []);

  const loadCachedData = async () => {
    try {
      // Try localStorage first (fastest)
      const cached = localStorage.getItem('dashboard_cache');
      if (cached) {
        const data = JSON.parse(cached);
        setPerformances(data.performances);
        setSummary(data.summary);
        setLastRefresh(new Date(data.timestamp));
        setLoading(false);
        return;
      }

      // Fall back to cache.json file
      const response = await fetch('/cache.json');
      if (response.ok) {
        const data = await response.json();
        setPerformances(data.performances);
        setSummary(data.summary);
        setLastRefresh(new Date(data.timestamp));
        toast.success('Dashboard loaded from cache');
      }
    } catch (error) {
      console.error('No cache found, need manual refresh:', error);
      toast.info('Click Refresh to load latest data');
    } finally {
      setLoading(false);
      // Load config for refresh functionality
      loadConfig();
    }
  };

  const loadConfig = async () => {
    try {
      const response = await fetch('/config.json');
      const configData: Config = await response.json();
      setConfig(configData);
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Error loading configuration file.');
    }
  };

  const loadDataFromConfig = async () => {
    if (!config) {
      toast.error('Configuration not loaded');
      return;
    }

    setRefreshing(true);

    try {
      // Fetch customer master
      const customerResponse = await fetch(config.customerMasterFile);
      if (!customerResponse.ok) {
        throw new Error('Customer master file not found');
      }
      const customerBlob = await customerResponse.blob();
      const customerFile = new File([customerBlob], 'customer_master.csv', { type: 'text/csv' });

      // Fetch all sales files
      const salesFiles: File[] = [];
      for (const fileName of config.salesFiles) {
        try {
          const salesResponse = await fetch(`${config.salesDataFolder}/${fileName}`);
          if (salesResponse.ok) {
            const salesBlob = await salesResponse.blob();
            const salesFile = new File([salesBlob], fileName, {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            salesFiles.push(salesFile);
          }
        } catch (error) {
          console.warn(`Could not load ${fileName}, skipping...`);
        }
      }

      if (salesFiles.length === 0) {
        throw new Error('No sales files could be loaded');
      }

      // Process data
      const customers = await parseCSV(customerFile);
      if (customers.length === 0) {
        throw new Error('No valid customer data found');
      }

      const allSalesRecords = [];
      for (const salesFile of salesFiles) {
        const records = await parseExcel(salesFile);
        allSalesRecords.push(...records);
      }

      if (allSalesRecords.length === 0) {
        throw new Error('No valid sales data found');
      }

      const result = calculatePerformance(customers, allSalesRecords);
      const timestamp = new Date();
      
      setPerformances(result.performances);
      setSummary(result.summary);
      setLastRefresh(timestamp);

      // Cache in localStorage
      const cacheData = {
        performances: result.performances,
        summary: result.summary,
        timestamp: timestamp.toISOString()
      };
      localStorage.setItem('dashboard_cache', JSON.stringify(cacheData));

      toast.success(`Dashboard refreshed! ${result.performances.length} customers analyzed.`);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error loading data files. Please check file locations.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    loadDataFromConfig();
  };

  const handleViewDetails = (customer: CustomerPerformance) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(Math.round(num));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b shadow-sm sticky top-0 z-10 backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Sales Performance Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track customer performance against agreement targets
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh data manually"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <Award className="w-12 h-12 text-primary" />
            </div>
          </div>
          {!loading && lastRefresh && (
            <p className="text-xs text-muted-foreground mt-2">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-lg font-medium text-muted-foreground animate-pulse-subtle">
              Loading dashboard data...
            </p>
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && summary && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <SummaryCard
                title="Total Target Volume"
                value={formatNumber(summary.totalTarget)}
                icon={Target}
                variant="primary"
              />
              <SummaryCard
                title="Total Achieved Volume"
                value={formatNumber(summary.totalAchieved)}
                icon={TrendingUp}
                variant="secondary"
              />
              <SummaryCard
                title="Overall Progress"
                value={`${summary.overallProgress.toFixed(1)}%`}
                icon={Award}
                variant="success"
              />
              <SummaryCard
                title="Key Customers"
                value={summary.totalCustomers}
                icon={Users}
                variant="default"
              />
            </div>

            {/* Customer Table */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Customer Performance Details</h2>
              <CustomerTable 
                customers={performances} 
                onViewDetails={handleViewDetails}
              />
            </div>
          </>
        )}
      </main>

      {/* Product Details Modal */}
      <ProductDetailsModal
        customer={selectedCustomer}
        open={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
};

export default Index;
