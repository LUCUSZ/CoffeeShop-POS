import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export function OrderHistory() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            quantity,
            price_at_time,
            products (name)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div>Loading orders...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Order History</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Payment Status</TableHead>
            <TableHead>Order Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders?.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                {format(new Date(order.created_at), "MMM d, yyyy HH:mm")}
              </TableCell>
              <TableCell>
                {order.order_items?.map((item: any) => (
                  <div key={item.id}>
                    {item.products.name} x {item.quantity}
                  </div>
                ))}
              </TableCell>
              <TableCell>${order.total_amount}</TableCell>
              <TableCell className="capitalize">{order.payment_method}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    order.payment_status === "completed"
                      ? "secondary"
                      : order.payment_status === "failed"
                      ? "destructive"
                      : "default"
                  }
                >
                  {order.payment_status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge>{order.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}