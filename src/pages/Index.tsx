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

const CACHE_KEY = 'dashboard_data_cache';

interface CachedData {
  performances: CustomerPerformance[];
  summary: DashboardSummary;
  timestamp: number;
}

const Index = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [performances, setPerformances] = useState<CustomerPerformance[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerPerformance | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [config, setConfig] = useState<Config | null>(null);

  const loadFromCache = (): boolean => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const cachedData: CachedData = JSON.parse(cached);
        setPerformances(cachedData.performances);
        setSummary(cachedData.summary);
        setLastRefresh(new Date(cachedData.timestamp));
        return true;
      }
    } catch (error) {
      console.error('Error loading from cache:', error);
    }
    return false;
  };

  const saveToCache = (performances: CustomerPerformance[], summary: DashboardSummary) => {
    try {
      const cacheData: CachedData = {
        performances,
        summary,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (!config) return;

    const interval = setInterval(() => {
      loadDataFromConfig(true);
    }, config.autoRefreshInterval);

    return () => clearInterval(interval);
  }, [config]);

  const loadConfig = async () => {
    try {
      const response = await fetch('/config.json');
      const configData: Config = await response.json();
      setConfig(configData);
      
      const hasCachedData = loadFromCache();
      
      if (hasCachedData) {
        setLoading(false);
        loadDataFromConfig(true, configData);
      } else {
        await loadDataFromConfig(false, configData);
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Error loading configuration file. Please ensure config.json exists.');
      setLoading(false);
    }
  };

  const loadDataFromConfig = async (isAutoRefresh: boolean = false, configData?: Config) => {
    const activeConfig = configData || config;
    if (!activeConfig) return;

    if (!isAutoRefresh) {
      setRefreshing(true);
    }

    try {
      // Fetch customer master
      const customerResponse = await fetch(activeConfig.customerMasterFile);
      if (!customerResponse.ok) {
        throw new Error('Customer master file not found');
      }
      const customerBlob = await customerResponse.blob();
      const customerFile = new File([customerBlob], 'customer_master.csv', { type: 'text/csv' });

      // Fetch all sales files
      const salesFiles: File[] = [];
      for (const fileName of activeConfig.salesFiles) {
        try {
          const salesResponse = await fetch(`${activeConfig.salesDataFolder}/${fileName}`);
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
      setPerformances(result.performances);
      setSummary(result.summary);
      setLastRefresh(new Date());
      
      saveToCache(result.performances, result.summary);

      if (!isAutoRefresh) {
        toast.success(`Dashboard refreshed! ${result.performances.length} customers analyzed.`);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      if (!isAutoRefresh) {
        toast.error('Error loading data files. Please check file locations.');
      }
    } finally {
      if (!isAutoRefresh) {
        setRefreshing(false);
      }
    }
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadDataFromConfig(false);
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
                title="Refresh data from server"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
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
