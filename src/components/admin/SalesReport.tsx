import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SalesData {
  date: string;
  total: number;
  orders: number;
}

const timeRanges = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 14 days", value: "14" },
  { label: "Last 30 days", value: "30" },
];

export function SalesReport() {
  const [selectedRange, setSelectedRange] = useState("7");

  const { data: salesData, isLoading } = useQuery({
    queryKey: ["sales-report", selectedRange],
    queryFn: async () => {
      const endDate = endOfDay(new Date());
      const startDate = startOfDay(subDays(new Date(), parseInt(selectedRange)));

      const { data, error } = await supabase
        .from("orders")
        .select("created_at, total_amount")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at");

      if (error) throw error;

      const groupedSales = data.reduce((acc: { [key: string]: SalesData }, order) => {
        const date = format(new Date(order.created_at), "yyyy-MM-dd");
        if (!acc[date]) {
          acc[date] = {
            date,
            total: 0,
            orders: 0,
          };
        }
        acc[date].total += Number(order.total_amount);
        acc[date].orders += 1;
        return acc;
      }, {});

      return Object.values(groupedSales);
    },
  });

  const totalSales = salesData?.reduce((sum, day) => sum + day.total, 0) || 0;
  const totalOrders = salesData?.reduce((sum, day) => sum + day.orders, 0) || 0;

  if (isLoading) return <div>Loading sales data...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select value={selectedRange} onValueChange={setSelectedRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            {timeRanges.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Sales</CardTitle>
            <CardDescription>Overall revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${totalSales.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Orders</CardTitle>
            <CardDescription>Number of completed orders</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalOrders}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Sales</CardTitle>
          <CardDescription>Revenue over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#3b82f6" name="Sales ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}