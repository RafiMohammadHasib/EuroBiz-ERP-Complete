"use server";

import { generateSalesForecast, GenerateSalesForecastInput } from "@/ai/flows/generate-sales-forecast";
import { invoices, finishedGoods } from "@/lib/data";

export async function getSalesForecast({ productName, forecastHorizon }: { productName: string, forecastHorizon: string }) {
  // This is a simplified example. In a real app, you'd gather this data from your database.
  
  let salesDataToProcess = invoices;
  if (productName !== "All Products") {
    const product = finishedGoods.find(fg => fg.productName === productName);
    if (product) {
        // This logic is still simplified. In a real scenario, you'd link invoices to specific products.
        // For now, we'll just filter some invoices to simulate product-specific data.
        salesDataToProcess = invoices.filter(inv => inv.items.some(item => item.description.includes(product.productName.split(' ')[0])));
    }
  }

  const historicalSalesData = salesDataToProcess.map(i => ({
    productId: productName === 'All Products' ? 'general' : productName,
    date: i.date,
    quantitySold: Math.floor(i.amount / 100), // dummy data
    revenue: i.amount,
  }));


  const marketTrendData = [
    { date: "2023-08-01", trendScore: 0.5 },
    { date: "2023-09-01", trendScore: 0.6 },
    { date: "2023-10-01", trendScore: 0.7 },
    { date: "2023-11-01", trendScore: 0.75 },
    { date: "2023-12-01", trendScore: 0.8 },
  ];

  const input: GenerateSalesForecastInput = {
    historicalSalesData,
    marketTrendData,
    productName,
    forecastHorizon,
  };

  try {
    const forecast = await generateSalesForecast(input);
    return { ...forecast, error: undefined };
  } catch (error) {
    console.error("Error generating sales forecast:", error);
    return { error: "Failed to generate forecast. The AI model may be unavailable." };
  }
}
