import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string | null;
}

export function CheckoutPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ id, stock }: { id: string; stock: number }) => {
      const { error } = await supabase
        .from("products")
        .update({ stock })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Stock Updated",
        description: "Product stock has been updated successfully.",
      });
      setQuantities({});
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const handleQuantityChange = (productId: string, value: string) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: value,
    }));
  };

  const handleUpdateStock = async (product: Product) => {
    const quantityStr = quantities[product.id] || "0";
    const quantity = parseInt(quantityStr);
    
    if (isNaN(quantity)) {
      toast({
        variant: "destructive",
        title: "Invalid quantity",
        description: "Please enter a valid number",
      });
      return;
    }

    const newStock = product.stock + quantity;
    if (newStock < 0) {
      toast({
        variant: "destructive",
        title: "Invalid quantity",
        description: "Cannot reduce stock below 0",
      });
      return;
    }

    updateStockMutation.mutate({ id: product.id, stock: newStock });
  };

  if (isLoading) return <div>Loading products...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Stock Management</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products?.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Current Stock: {product.stock}</span>
                  <span>Price: ${product.price.toFixed(2)}</span>
                </div>
                <div className="space-y-2">
                  <Input
                    type="number"
                    value={quantities[product.id] || ""}
                    onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                    placeholder="Enter quantity"
                  />
                  <Button 
                    className="w-full"
                    onClick={() => handleUpdateStock(product)}
                    disabled={!quantities[product.id]}
                  >
                    Update Stock
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}