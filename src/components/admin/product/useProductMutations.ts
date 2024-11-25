import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/types/schema";

export function useProductMutations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addProductMutation = useMutation({
    mutationFn: async (newProduct: Omit<Product, "id">) => {
      const { data, error } = await supabase
        .from("products")
        .insert([newProduct])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Product added",
        description: "The product has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (product: Product) => {
      const { data, error } = await supabase
        .from("products")
        .update({
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          category_id: product.category_id,
        })
        .eq("id", product.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Product updated",
        description: "The product has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);
      
      if (error) {
        console.error("Error deleting product:", error);
        throw error;
      }
      
      return id;
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["products"] });

      // Snapshot the previous value
      const previousProducts = queryClient.getQueryData(["products"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["products"], (old: any) => {
        return old?.filter((product: Product) => product.id !== deletedId);
      });

      // Return a context object with the snapshotted value
      return { previousProducts };
    },
    onError: (error: Error, _variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(["products"], context?.previousProducts);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure cache synchronization
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onSuccess: () => {
      toast({
        title: "Product deleted",
        description: "The product has been deleted successfully.",
      });
    },
  });

  return {
    addProductMutation,
    updateProductMutation,
    deleteProductMutation,
  };
}