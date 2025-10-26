import { CustomerPerformance } from '@/types/sales';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';

interface ProductDetailsModalProps {
  customer: CustomerPerformance | null;
  open: boolean;
  onClose: () => void;
}

export const ProductDetailsModal = ({ customer, open, onClose }: ProductDetailsModalProps) => {
  if (!customer) return null;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(Math.round(num));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Package className="w-6 h-6 text-primary" />
            {customer.customerName}
          </DialogTitle>
          <DialogDescription className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">{customer.customerCode}</Badge>
              <Badge variant={customer.progressPercentage >= 100 ? "default" : "secondary"}>
                {customer.progressPercentage.toFixed(1)}% Complete
              </Badge>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Target Volume</p>
              <p className="text-xl font-bold">{formatNumber(customer.agreementTargetVolume)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Achieved Volume</p>
              <p className="text-xl font-bold text-primary">{formatNumber(customer.achievedVolume)}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              Product Breakdown
              <Badge variant="secondary">{customer.products.length} Products</Badge>
            </h3>
            
            {customer.products.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Product Name</TableHead>
                      <TableHead className="font-semibold text-right">Total Volume</TableHead>
                      <TableHead className="font-semibold text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.products.map((product, index) => {
                      const percentage = (product.totalVolume / customer.achievedVolume) * 100;
                      return (
                        <TableRow key={index} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{product.productName}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatNumber(product.totalVolume)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">{percentage.toFixed(1)}%</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No product data available
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
