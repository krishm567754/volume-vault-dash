export interface Customer {
  customerCode: string;
  customerName: string;
  agreementStartDate: string;
  agreementEndDate: string;
  agreementTargetVolume: number;
}

export interface SalesRecord {
  customerCode: string;
  productName: string;
  productVolume: number;
}

export interface CustomerPerformance extends Customer {
  achievedVolume: number;
  progressPercentage: number;
  products: ProductDetail[];
}

export interface ProductDetail {
  productName: string;
  totalVolume: number;
}

export interface DashboardSummary {
  totalTarget: number;
  totalAchieved: number;
  overallProgress: number;
  totalCustomers: number;
}
