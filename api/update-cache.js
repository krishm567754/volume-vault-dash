import fetch from 'node-fetch';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Get base URL from request
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    // Load config
    const configRes = await fetch(`${baseUrl}/config.json`);
    const config = await configRes.json();

    // Parse CSV function
    const parseCSV = (text) => {
      return new Promise((resolve, reject) => {
        Papa.parse(text, {
          header: true,
          complete: (results) => {
            const customers = results.data
              .filter(row => row['Customer Code'] && row['Customer Name'])
              .map(row => ({
                customerCode: row['Customer Code'].trim(),
                customerName: row['Customer Name'].trim(),
                agreementStartDate: row['Agreement Start Date']?.trim() || '',
                agreementEndDate: row['Agreement End Date']?.trim() || '',
                agreementTargetVolume: parseFloat(row['Agreement Target Volume']) || 0
              }));
            resolve(customers);
          },
          error: reject
        });
      });
    };

    // Parse Excel function
    const parseExcel = (buffer) => {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      
      return jsonData
        .filter(row => row['Customer Code'] && row['Product Name'])
        .map(row => ({
          customerCode: String(row['Customer Code']).trim(),
          productName: String(row['Product Name']).trim(),
          productVolume: parseFloat(row['Product Volume']) || 0
        }));
    };

    // Calculate performance
    const calculatePerformance = (customers, salesRecords) => {
      const performances = customers.map(customer => {
        const customerSales = salesRecords.filter(
          record => record.customerCode === customer.customerCode
        );

        const productMap = new Map();
        customerSales.forEach(sale => {
          const current = productMap.get(sale.productName) || 0;
          productMap.set(sale.productName, current + sale.productVolume);
        });

        const products = Array.from(productMap.entries()).map(([name, volume]) => ({
          productName: name,
          totalVolume: volume
        }));

        const achievedVolume = products.reduce((sum, p) => sum + p.totalVolume, 0);
        const progressPercentage = customer.agreementTargetVolume > 0
          ? (achievedVolume / customer.agreementTargetVolume) * 100
          : 0;

        return {
          ...customer,
          achievedVolume,
          progressPercentage,
          products
        };
      });

      const summary = {
        totalTarget: customers.reduce((sum, c) => sum + c.agreementTargetVolume, 0),
        totalAchieved: performances.reduce((sum, p) => sum + p.achievedVolume, 0),
        overallProgress: 0,
        totalCustomers: customers.length
      };

      summary.overallProgress = summary.totalTarget > 0
        ? (summary.totalAchieved / summary.totalTarget) * 100
        : 0;

      return { performances, summary };
    };

    // Fetch customer master
    const customerRes = await fetch(`${baseUrl}${config.customerMasterFile}`);
    const customerText = await customerRes.text();
    const customers = await parseCSV(customerText);

    // Fetch all sales files
    const allSalesRecords = [];
    for (const fileName of config.salesFiles) {
      try {
        const salesRes = await fetch(`${baseUrl}${config.salesDataFolder}/${fileName}`);
        if (salesRes.ok) {
          const salesBuffer = await salesRes.arrayBuffer();
          const records = parseExcel(Buffer.from(salesBuffer));
          allSalesRecords.push(...records);
        }
      } catch (error) {
        console.warn(`Could not load ${fileName}:`, error.message);
      }
    }

    // Calculate and generate cache
    const result = calculatePerformance(customers, allSalesRecords);
    const cacheData = {
      performances: result.performances,
      summary: result.summary,
      timestamp: new Date().toISOString()
    };

    // Note: Vercel serverless functions have read-only filesystem
    // So we just return the data instead of writing to file
    // The frontend will cache it in localStorage for fast subsequent loads

    // Return the cached data
    res.status(200).json({
      success: true,
      data: cacheData,
      message: `Cache updated with ${result.performances.length} customers`
    });

  } catch (error) {
    console.error('Error updating cache:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
