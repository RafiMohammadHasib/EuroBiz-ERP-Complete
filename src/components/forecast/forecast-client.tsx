"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Area, Bar, BarChart, ComposedChart, XAxis, YAxis } from "recharts";
import { BrainCircuit, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSalesForecast } from "@/app/actions";
import type { GenerateSalesForecastOutput } from "@/ai/flows/generate-sales-forecast";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { finishedGoods } from "@/lib/data";

type ForecastResult = Partial<GenerateSalesForecastOutput> & { error?: string };

const chartConfig = {
  predictedSales: {
    label: "Predicted Sales",
    color: "hsl(var(--primary))",
  },
   confidence: {
    label: "Confidence Interval",
    color: "hsl(var(--muted))",
  },
};

export default function ForecastClient() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [productName, setProductName] = useState("All Products");
  const [forecastHorizon, setForecastHorizon] = useState("3 months");

  const handleGenerateForecast = async () => {
    setLoading(true);
    setResult(null);
    const forecastResult = await getSalesForecast({productName, forecastHorizon});
    setResult(forecastResult);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-start gap-4">
        <div className="grid gap-2 flex-1 w-full">
            <p className="text-sm font-medium">Forecast Settings</p>
            <div className="grid grid-cols-2 gap-4">
               <Select value={productName} onValueChange={setProductName}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Product" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All Products">All Products</SelectItem>
                        {finishedGoods.map(fg => (
                             <SelectItem key={fg.id} value={fg.productName}>{fg.productName}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={forecastHorizon} onValueChange={setForecastHorizon}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Horizon" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="3 months">3 Months</SelectItem>
                        <SelectItem value="6 months">6 Months</SelectItem>
                        <SelectItem value="12 months">12 Months</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        <div className="flex-shrink-0 w-full md:w-auto">
            <p className="text-sm font-medium hidden md:block">&nbsp;</p>
            <Button onClick={handleGenerateForecast} disabled={loading} className="w-full md:w-auto mt-2 md:mt-0">
                {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <BrainCircuit className="mr-2 h-4 w-4" />
                )}
                Generate Forecast
            </Button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center rounded-lg border border-dashed h-64">
            <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                <p className="mt-2 text-sm text-muted-foreground">AI is analyzing the data...</p>
            </div>
        </div>
      )}

      {result?.error && (
        <Card className="border-destructive">
            <CardHeader>
                <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
                <p>{result.error}</p>
            </CardContent>
        </Card>
      )}

      {result?.forecast && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Forecasted Sales for {productName}</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] w-full">
                    <ChartContainer config={chartConfig} className="w-full h-full">
                        <ComposedChart accessibilityLayer data={result.forecast}>
                            <XAxis
                                dataKey="month"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                            <Area
                                dataKey={(data) => [data.confidenceIntervalLow, data.confidenceIntervalHigh]}
                                type="monotone"
                                fill="var(--color-confidence)"
                                stroke="var(--color-confidence)"
                                strokeWidth={0}
                                name="Confidence Interval"
                                isAnimationActive={false}
                            />
                            <Bar dataKey="predictedSales" fill="var(--color-predictedSales)" radius={[4, 4, 0, 0]} />
                        </ComposedChart>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>AI Summary & Insights</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">{result.summary}</p>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
