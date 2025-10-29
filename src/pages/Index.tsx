import { useState, useEffect } from 'react';
import { CustomerPerformance, DashboardSummary } from '@/types/sales';
import { SummaryCard } from '@/components/SummaryCard';
import { CustomerTable } from '@/components/CustomerTable';
import { ProductDetailsModal } from '@/components/ProductDetailsModal';
import { Target, TrendingUp, Users, Award, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { parseCSVFromURL, parseExcelFromURL, calculatePerformance } from '@/utils/dataProcessor';

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
      // Show localStorage data immediately for fast initial load
      const cached = localStorage.getItem('dashboard_cache');
      if (cached) {
        const data = JSON.parse(cached);
        if (data.performances && data.performances.length > 0) {
          setPerformances(data.performances);
          setSummary(data.summary);
          setLastRefresh(new Date(data.timestamp));
          setLoading(false);
        }
      }

      // Load config first
      await loadConfig();

      // Always load from database to get the latest shared data
      const hasData = await loadFromDatabase();
      
      if (!hasData && (!cached || !JSON.parse(cached).performances?.length)) {
        // No cached data available anywhere - auto-refresh
        console.log('No data found, auto-refreshing...');
        await loadDataFromConfig();
      }
    } catch (error) {
      console.error('Error loading cache:', error);
      toast.error('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const loadFromDatabase = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase
        .from('dashboard_cache')
        .select('*')
        .eq('id', 1)
        .single();

      if (!error && data) {
        const performances = data.performances as unknown as CustomerPerformance[];
        const summary = data.summary as unknown as DashboardSummary;
        
        if (performances && performances.length > 0) {
          const cacheData = {
            performances,
            summary,
            timestamp: data.updated_at
          };
          
          setPerformances(performances);
          setSummary(summary);
          setLastRefresh(new Date(data.updated_at));
          
          // Update localStorage
          localStorage.setItem('dashboard_cache', JSON.stringify(cacheData));
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error loading from database:', error);
      return false;
    }
  };

  const loadConfig = async () => {
    if (config) return; // Already loaded
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
      // Try API first (for Vercel production)
      const response = await fetch('/api/update-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // API endpoint exists (Vercel) - data is already saved to database by the API
        const result = await response.json();
        
        if (result.success && result.data) {
          const { performances, summary, timestamp } = result.data;
          
          setPerformances(performances);
          setSummary(summary);
          setLastRefresh(new Date(timestamp));

          // Cache in localStorage
          localStorage.setItem('dashboard_cache', JSON.stringify(result.data));

          toast.success(result.message || `Dashboard refreshed! ${performances.length} customers analyzed.`);
          setRefreshing(false);
          return;
        }
      }

      // Fallback to frontend processing (for Lovable preview)
      console.log('API not available, processing data on frontend...');
      
      // Load customer master
      const customers = await parseCSVFromURL(config.customerMasterFile);
      
      // Load all sales files
      const allSalesRecords = [];
      for (const fileName of config.salesFiles) {
        try {
          const records = await parseExcelFromURL(`${config.salesDataFolder}/${fileName}`);
          allSalesRecords.push(...records);
        } catch (error) {
          console.warn(`Could not load ${fileName}:`, error);
        }
      }

      // Calculate performance
      const result = calculatePerformance(customers, allSalesRecords);
      
      const cacheData = {
        performances: result.performances,
        summary: result.summary,
        timestamp: new Date().toISOString()
      };

      // Save to database so all users can see it
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { error: dbError } = await supabase
          .from('dashboard_cache')
          .update({
            performances: result.performances as any,
            summary: result.summary as any,
            updated_at: cacheData.timestamp
          })
          .eq('id', 1);
        
        if (dbError) {
          console.error('Error saving to database:', dbError);
        } else {
          console.log('Successfully saved to shared database cache');
        }
      } catch (dbError) {
        console.error('Error saving to database:', dbError);
      }

      setPerformances(result.performances);
      setSummary(result.summary);
      setLastRefresh(new Date());

      // Cache in localStorage
      localStorage.setItem('dashboard_cache', JSON.stringify(cacheData));

      toast.success(`Dashboard refreshed! ${result.performances.length} customers analyzed.`);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error refreshing data: ' + error.message);
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

        {/* No Data State */}
        {!loading && (!summary || performances.length === 0) && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">No Data Available</h3>
              <p className="text-muted-foreground">Click the Refresh button to load the latest data</p>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && summary && performances.length > 0 && (
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
