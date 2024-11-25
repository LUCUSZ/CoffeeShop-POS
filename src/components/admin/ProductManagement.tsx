import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { ProductForm } from "./product/ProductForm";
import { ProductCard } from "./product/ProductCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProductMutations } from "./product/useProductMutations";
import type { Product, Category } from "@/types/schema";

interface ProductWithCategory extends Product {
  categories: Category | null;
}

export function ProductManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { addProductMutation, updateProductMutation, deleteProductMutation } = useProductMutations();

  const { data: categories, isError: isCategoriesError } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) {
        console.error("Error fetching categories:", error);
        return [];
      }
      return data as Category[];
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", selectedCategory],
    queryFn: async () => {
      try {
        let query = supabase
          .from("products")
          .select("*, categories(id, name, created_at)")
          .order("name");

        if (selectedCategory !== "all") {
          query = query.eq("category_id", selectedCategory);
        }

        const { data, error } = await query;
        if (error) {
          console.error("Error fetching products:", error);
          return [];
        }
        return data as unknown as ProductWithCategory[];
      } catch (error) {
        console.error("Error in products query:", error);
        return [];
      }
    },
  });

  const handleSubmit = (formData: any) => {
    const productData = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      category_id: formData.category_id,
    };

    if (editingProduct) {
      updateProductMutation.mutate({ ...productData, id: editingProduct.id });
      setEditingProduct(null);
    } else {
      addProductMutation.mutate(productData);
      setIsAddDialogOpen(false);
    }
  };

  if (isLoading) return <div>Loading products...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Products</h2>
          {!isCategoriesError && categories && categories.length > 0 && (
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <ProductForm onSubmit={handleSubmit} submitLabel="Add Product" />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products?.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={(product) => {
              setEditingProduct(product);
            }}
            onDelete={(id) => deleteProductMutation.mutate(id)}
          />
        ))}
      </div>

      {editingProduct && (
        <Dialog open={true} onOpenChange={() => setEditingProduct(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>
            <ProductForm
              initialData={{
                name: editingProduct.name,
                description: editingProduct.description || "",
                price: editingProduct.price.toString(),
                stock: editingProduct.stock.toString(),
                category_id: editingProduct.category_id || "",
              }}
              onSubmit={handleSubmit}
              submitLabel="Update Product"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}