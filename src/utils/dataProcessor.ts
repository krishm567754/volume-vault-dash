import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Customer, SalesRecord, CustomerPerformance, ProductDetail, DashboardSummary } from '@/types/sales';

export const parseCSV = (file: File): Promise<Customer[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const customers: Customer[] = results.data.map((row: any) => ({
          customerCode: row['Customer Code']?.trim() || '',
          customerName: row['Customer Name']?.trim() || '',
          agreementStartDate: row['Agreement Start Date']?.trim() || '',
          agreementEndDate: row['Agreement End Date']?.trim() || '',
          agreementTargetVolume: parseFloat(row['Agreement Target Volume']) || 0,
        }));
        resolve(customers.filter(c => c.customerCode));
      },
      error: (error) => reject(error),
    });
  });
};

export const parseCSVFromURL = (url: string): Promise<Customer[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(url);
      const text = await response.text();
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const customers: Customer[] = results.data.map((row: any) => ({
            customerCode: row['Customer Code']?.trim() || '',
            customerName: row['Customer Name']?.trim() || '',
            agreementStartDate: row['Agreement Start Date']?.trim() || '',
            agreementEndDate: row['Agreement End Date']?.trim() || '',
            agreementTargetVolume: parseFloat(row['Agreement Target Volume']) || 0,
          }));
          resolve(customers.filter(c => c.customerCode));
        },
        error: (error) => reject(error),
      });
    } catch (error) {
      reject(error);
    }
  });
};

export const parseExcel = (file: File): Promise<SalesRecord[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Find header row and column indices
        const headers = jsonData[0] as string[];
        const customerCodeIdx = headers.findIndex(h => h?.toLowerCase().includes('customer code'));
        const productNameIdx = headers.findIndex(h => h?.toLowerCase().includes('product name'));
        const productVolumeIdx = headers.findIndex(h => h?.toLowerCase().includes('product volume'));

        const salesRecords: SalesRecord[] = jsonData
          .slice(1)
          .filter(row => row[customerCodeIdx] && row[productVolumeIdx])
          .map(row => ({
            customerCode: String(row[customerCodeIdx]).trim(),
            productName: String(row[productNameIdx] || 'Unknown Product').trim(),
            productVolume: parseFloat(row[productVolumeIdx]) || 0,
          }));

        resolve(salesRecords);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const parseExcelFromURL = (url: string): Promise<SalesRecord[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Find header row and column indices
      const headers = jsonData[0] as string[];
      const customerCodeIdx = headers.findIndex(h => h?.toLowerCase().includes('customer code'));
      const productNameIdx = headers.findIndex(h => h?.toLowerCase().includes('product name'));
      const productVolumeIdx = headers.findIndex(h => h?.toLowerCase().includes('product volume'));

      const salesRecords: SalesRecord[] = jsonData
        .slice(1)
        .filter(row => row[customerCodeIdx] && row[productVolumeIdx])
        .map(row => ({
          customerCode: String(row[customerCodeIdx]).trim(),
          productName: String(row[productNameIdx] || 'Unknown Product').trim(),
          productVolume: parseFloat(row[productVolumeIdx]) || 0,
        }));

      resolve(salesRecords);
    } catch (error) {
      reject(error);
    }
  });
};

export const calculatePerformance = (
  customers: Customer[],
  salesRecords: SalesRecord[]
): { performances: CustomerPerformance[]; summary: DashboardSummary } => {
  const customerMap = new Map<string, CustomerPerformance>();

  // Initialize customer performance data
  customers.forEach(customer => {
    customerMap.set(customer.customerCode, {
      ...customer,
      achievedVolume: 0,
      progressPercentage: 0,
      products: [],
    });
  });

  // Aggregate sales data
  const productMap = new Map<string, Map<string, number>>();

  salesRecords.forEach(record => {
    const customer = customerMap.get(record.customerCode);
    if (customer) {
      customer.achievedVolume += record.productVolume;

      if (!productMap.has(record.customerCode)) {
        productMap.set(record.customerCode, new Map());
      }
      const customerProducts = productMap.get(record.customerCode)!;
      const currentVolume = customerProducts.get(record.productName) || 0;
      customerProducts.set(record.productName, currentVolume + record.productVolume);
    }
  });

  // Calculate progress and compile product details
  const performances: CustomerPerformance[] = [];
  let totalTarget = 0;
  let totalAchieved = 0;

  customerMap.forEach((customer, customerCode) => {
    const products: ProductDetail[] = [];
    const customerProducts = productMap.get(customerCode);
    
    if (customerProducts) {
      customerProducts.forEach((totalVolume, productName) => {
        products.push({ productName, totalVolume });
      });
      products.sort((a, b) => b.totalVolume - a.totalVolume);
    }

    customer.products = products;
    customer.progressPercentage = customer.agreementTargetVolume > 0
      ? (customer.achievedVolume / customer.agreementTargetVolume) * 100
      : 0;

    totalTarget += customer.agreementTargetVolume;
    totalAchieved += customer.achievedVolume;

    performances.push(customer);
  });

  const summary: DashboardSummary = {
    totalTarget,
    totalAchieved,
    overallProgress: totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0,
    totalCustomers: customers.length,
  };

  return { performances, summary };
};
