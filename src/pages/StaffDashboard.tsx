import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { POSSystem } from "@/components/shared/POSSystem";
import { OrderHistory } from "@/components/shared/OrderHistory";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, ShoppingCart, History } from "lucide-react";
import { Card } from "@/components/ui/card";

const StaffDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

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

        if (profile?.role !== "staff") {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You don't have permission to access this page.",
          });
          navigate("/login");
        }
        setIsLoading(false);
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

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 bg-white shadow">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">POS System</h1>
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
        <Tabs defaultValue="pos" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="pos" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              POS
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pos">
            <POSSystem />
          </TabsContent>

          <TabsContent value="orders">
            <Card className="p-4">
              <OrderHistory />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StaffDashboard;