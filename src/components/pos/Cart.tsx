import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Minus, Plus, X, ShoppingCart } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
}

export function Cart({ items, onUpdateQuantity, onRemoveItem, onCheckout }: CartProps) {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleUpdateQuantity = async (item: CartItem, newQuantity: number) => {
    const { data: productData, error } = await supabase
      .from("products")
      .select("stock")
      .eq("id", item.id)
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not check product stock",
      });
      return;
    }

    if (newQuantity > productData.stock) {
      toast({
        variant: "destructive",
        title: "Not enough stock",
        description: `Only ${productData.stock} items available`,
      });
      return;
    }

    onUpdateQuantity(item.id, newQuantity);
  };

  const handleCheckout = async () => {
    // Create order with selected payment method
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to checkout",
      });
      return;
    }

    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          staff_id: user.id,
          total_amount: total,
          status: "completed",
          payment_method: paymentMethod,
          payment_status: "completed"
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      await queryClient.invalidateQueries({ queryKey: ["orders-history"] });
      onCheckout();
      toast({
        title: "Order Complete",
        description: "The order has been successfully processed.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Checkout Failed",
        description: error.message,
      });
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center space-y-0 gap-2">
        <ShoppingCart className="h-5 w-5" />
        <CardTitle>Current Order</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <ScrollArea className="h-[calc(100vh-400px)]">
          {items.length === 0 ? (
            <p className="text-muted-foreground text-center">No items in cart</p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2 p-2 border rounded-lg hover:bg-gray-50">
                  <div className="flex-grow">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleUpdateQuantity(item, Math.max(0, item.quantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 border-t pt-4">
        <div className="w-full space-y-4">
          <RadioGroup
            value={paymentMethod}
            onValueChange={(value: "cash" | "card") => setPaymentMethod(value)}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem value="cash" id="cash" className="peer sr-only" />
              <Label
                htmlFor="cash"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                Cash
              </Label>
            </div>
            <div>
              <RadioGroupItem value="card" id="card" className="peer sr-only" />
              <Label
                htmlFor="card"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                Card
              </Label>
            </div>
          </RadioGroup>
        </div>
        <div className="flex justify-between w-full text-lg font-bold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <Button 
          className="w-full" 
          size="lg"
          disabled={items.length === 0}
          onClick={handleCheckout}
        >
          Checkout with {paymentMethod}
        </Button>
      </CardFooter>
    </Card>
  );
}