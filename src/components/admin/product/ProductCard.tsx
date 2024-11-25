import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import type { Product, Category } from "@/types/schema";

interface ProductCardProps {
  product: Product & { categories?: Category };
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  return (
    <div className="p-4 border rounded-lg shadow-sm space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{product.name}</h3>
          <p className="text-sm text-muted-foreground">{product.description}</p>
          {product.categories && (
            <Badge variant="secondary" className="mt-1">
              {product.categories.name}
            </Badge>
          )}
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(product)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (window.confirm("Are you sure you want to delete this product?")) {
                onDelete(product.id);
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex justify-between text-sm">
        <span>${product.price.toFixed(2)}</span>
        <span>Stock: {product.stock}</span>
      </div>
    </div>
  );
}