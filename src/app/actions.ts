
"use server";

import { invoices, finishedGoods } from "@/lib/data";
import { generateSalesForecast, type GenerateSalesForecastInput, type GenerateSalesForecastOutput } from "@/ai/flows/generate-sales-forecast";

type ForecastResult = Partial<GenerateSalesForecastOutput> & { error?: string };

export async function getSalesForecast({productName, forecastHorizon}: {productName: string, forecastHorizon: string}): Promise<ForecastResult> {
    try {
        let historicalSales = invoices;
        if(productName !== 'All Products') {
            historicalSales = invoices.filter(inv => inv.items.some(item => item.description === productName));
        }

        const historicalSalesData = historicalSales.map(inv => ({
            productId: inv.items[0]?.description, // Simplified for example
            date: inv.date,
            quantitySold: inv.items.reduce((acc, item) => acc + item.quantity, 0),
            revenue: inv.totalAmount,
        }));
        
        // This is mock data for market trends. In a real application, you would fetch this from a service.
        const marketTrendData = [
            { date: "2023-01-15", trendScore: 0.5 },
            { date: "2023-02-15", trendScore: 0.6 },
            { date: "2023-03-15", trendScore: 0.55 },
            { date: "2023-04-15", trendScore: 0.7 },
            { date: "2023-05-15", trendScore: 0.8 },
            { date: "2023-06-15", trendScore: 0.75 },
        ];

        const input: GenerateSalesForecastInput = {
            historicalSalesData,
            marketTrendData,
            productName,
            forecastHorizon
        };
        
        const forecast = await generateSalesForecast(input);
        return forecast;

    } catch (error: any) {
        console.error("Error generating sales forecast:", error);
        return { error: error.message || 'An unknown error occurred.' };
    }
}
