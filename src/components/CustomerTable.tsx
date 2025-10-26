import { CustomerPerformance } from '@/types/sales';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface CustomerTableProps {
  customers: CustomerPerformance[];
  onViewDetails: (customer: CustomerPerformance) => void;
}

export const CustomerTable = ({ customers, onViewDetails }: CustomerTableProps) => {
  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-success';
    if (percentage >= 75) return 'bg-primary';
    if (percentage >= 50) return 'bg-warning';
    return 'bg-destructive';
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(Math.round(num));
  };

  return (
    <Card className="shadow-md animate-slide-up">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Customer Name</TableHead>
              <TableHead className="font-semibold">Customer Code</TableHead>
              <TableHead className="font-semibold">Agreement Period</TableHead>
              <TableHead className="font-semibold text-right">Target Volume</TableHead>
              <TableHead className="font-semibold text-right">Achieved Volume</TableHead>
              <TableHead className="font-semibold">Progress</TableHead>
              <TableHead className="font-semibold text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer, index) => (
              <TableRow 
                key={customer.customerCode} 
                className="hover:bg-muted/30 transition-colors cursor-pointer"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <TableCell className="font-medium">{customer.customerName}</TableCell>
                <TableCell className="text-muted-foreground">{customer.customerCode}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {customer.agreementStartDate} to {customer.agreementEndDate}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatNumber(customer.agreementTargetVolume)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatNumber(customer.achievedVolume)}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{customer.progressPercentage.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={Math.min(customer.progressPercentage, 100)} 
                      className="h-2"
                      indicatorClassName={getProgressColor(customer.progressPercentage)}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(customer)}
                    className="hover:bg-primary/10 hover:text-primary"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
