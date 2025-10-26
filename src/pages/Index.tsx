import { useState, useEffect } from 'react';
import { CustomerPerformance, DashboardSummary } from '@/types/sales';
import { SummaryCard } from '@/components/SummaryCard';
import { CustomerTable } from '@/components/CustomerTable';
import { ProductDetailsModal } from '@/components/ProductDetailsModal';
import { FileUploader } from '@/components/FileUploader';
import { parseCSV, parseExcel, calculatePerformance } from '@/utils/dataProcessor';
import { Target, TrendingUp, Users, Award } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const [loading, setLoading] = useState(false);
  const [performances, setPerformances] = useState<CustomerPerformance[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerPerformance | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [hasData, setHasData] = useState(false);

  // Load sample data on mount
  useEffect(() => {
    loadSampleData();
  }, []);

  const loadSampleData = async () => {
    setLoading(true);
    try {
      // Fetch sample files
      const customerResponse = await fetch('/sample_data/customer_master.csv');
      const customerBlob = await customerResponse.blob();
      const customerFile = new File([customerBlob], 'customer_master.csv', { type: 'text/csv' });

      const salesResponse = await fetch('/sample_data/sales_q1.xlsx');
      const salesBlob = await salesResponse.blob();
      const salesFile = new File([salesBlob], 'sales_q1.xlsx', { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      await processFiles(customerFile, [salesFile]);
      toast.success('Sample data loaded successfully!');
    } catch (error) {
      console.error('Error loading sample data:', error);
      toast.error('Error loading sample data. Please upload your own files.');
    } finally {
      setLoading(false);
    }
  };

  const processFiles = async (customerFile: File, salesFiles: File[]) => {
    setLoading(true);
    try {
      // Parse customer master
      const customers = await parseCSV(customerFile);
      
      if (customers.length === 0) {
        toast.error('No valid customer data found in CSV file');
        return;
      }

      // Parse all sales files
      const allSalesRecords = [];
      for (const salesFile of salesFiles) {
        const records = await parseExcel(salesFile);
        allSalesRecords.push(...records);
      }

      if (allSalesRecords.length === 0) {
        toast.error('No valid sales data found in Excel files');
        return;
      }

      // Calculate performance
      const result = calculatePerformance(customers, allSalesRecords);
      
      setPerformances(result.performances);
      setSummary(result.summary);
      setHasData(true);
      
      toast.success(`Dashboard generated! ${result.performances.length} customers analyzed.`);
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Error processing files. Please check file formats and try again.');
    } finally {
      setLoading(false);
    }
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
            <Award className="w-12 h-12 text-primary" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* File Uploader */}
        {!loading && (
          <div className="max-w-2xl mx-auto">
            <FileUploader 
              onFilesSelected={processFiles} 
              loading={loading}
            />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-lg font-medium text-muted-foreground animate-pulse-subtle">
              Processing your data...
            </p>
          </div>
        )}

        {/* Dashboard Content */}
        {hasData && summary && !loading && (
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
