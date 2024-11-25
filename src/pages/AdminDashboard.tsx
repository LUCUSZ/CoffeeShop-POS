import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProductManagement } from "@/components/admin/ProductManagement";
import { SalesReport } from "@/components/admin/SalesReport";
import { StaffManagement } from "@/components/admin/StaffManagement";
import { POSSystem } from "@/components/shared/POSSystem";
import { OrderHistory } from "@/components/shared/OrderHistory";
import { LogOut, LayoutDashboard, Package, Users, ShoppingCart, History } from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/login");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role !== "admin") {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You don't have permission to access this page.",
          });
          navigate("/login");
        }
        setLoading(false);
      } catch (error: any) {
        console.error("Error in checkAuth:", error);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: error.message,
        });
        navigate("/login");
      }
    };

    checkAuth();
  }, [navigate, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 bg-white shadow">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <Button
            variant="ghost"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/login");
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto p-4">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Staff
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="pos" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              POS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="p-4">
              <SalesReport />
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="staff">
            <StaffManagement />
          </TabsContent>

          <TabsContent value="orders">
            <Card className="p-4">
              <OrderHistory />
            </Card>
          </TabsContent>

          <TabsContent value="pos">
            <POSSystem />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;