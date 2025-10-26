import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploaderProps {
  onFilesSelected: (customerFile: File, salesFiles: File[]) => void;
  loading: boolean;
}

export const FileUploader = ({ onFilesSelected, loading }: FileUploaderProps) => {
  const customerFileRef = useRef<HTMLInputElement>(null);
  const salesFilesRef = useRef<HTMLInputElement>(null);

  const handleCustomerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error('Please select a valid CSV file for customer master');
        return;
      }
      // Store in sessionStorage temporarily
      const reader = new FileReader();
      reader.onload = () => {
        sessionStorage.setItem('customerFile', JSON.stringify({
          name: file.name,
          type: file.type,
          size: file.size
        }));
      };
      reader.readAsText(file);
      toast.success('Customer master file selected');
    }
  };

  const handleSalesFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const validFiles = Array.from(files).filter(file => 
        file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
      );
      
      if (validFiles.length === 0) {
        toast.error('Please select valid Excel files (.xlsx or .xls)');
        return;
      }

      toast.success(`${validFiles.length} sales file(s) selected`);
    }
  };

  const handleProcess = () => {
    const customerFile = customerFileRef.current?.files?.[0];
    const salesFiles = salesFilesRef.current?.files;

    if (!customerFile) {
      toast.error('Please select a customer master CSV file');
      return;
    }

    if (!salesFiles || salesFiles.length === 0) {
      toast.error('Please select at least one sales Excel file');
      return;
    }

    onFilesSelected(customerFile, Array.from(salesFiles));
  };

  return (
    <Card className="p-6 shadow-lg border-2 border-dashed border-primary/20 bg-gradient-to-br from-card to-muted/20">
      <div className="space-y-6">
        <div className="text-center">
          <Upload className="w-12 h-12 mx-auto mb-3 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Upload Your Data Files</h3>
          <p className="text-sm text-muted-foreground">
            Select customer master (CSV) and sales data (Excel) files to generate the dashboard
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Customer Master File (CSV)
            </label>
            <input
              ref={customerFileRef}
              type="file"
              accept=".csv"
              onChange={handleCustomerFileChange}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer cursor-pointer"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-secondary" />
              Sales Data Files (Excel)
            </label>
            <input
              ref={salesFilesRef}
              type="file"
              accept=".xlsx,.xls"
              multiple
              onChange={handleSalesFilesChange}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/90 file:cursor-pointer cursor-pointer"
              disabled={loading}
            />
          </div>
        </div>

        <Button 
          onClick={handleProcess} 
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
          size="lg"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Processing Files...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Generate Dashboard
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
