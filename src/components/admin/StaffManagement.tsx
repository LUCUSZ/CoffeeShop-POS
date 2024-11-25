import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface StaffMember {
  id: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

export function StaffManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: staff, isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at");
      
      if (error) throw error;
      return data as StaffMember[];
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({
        title: "Role updated",
        description: "Staff member's role has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  if (isLoading) return <div>Loading staff data...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Staff Management</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff?.map((member) => (
          <Card key={member.id}>
            <CardHeader>
              <CardTitle>{member.full_name || "Unnamed Staff"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Role</p>
                  <p className="font-medium">{member.role}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={member.role === "staff" ? "default" : "outline"}
                    onClick={() => updateRoleMutation.mutate({ id: member.id, role: "staff" })}
                    disabled={member.role === "staff"}
                  >
                    Staff
                  </Button>
                  <Button
                    variant={member.role === "admin" ? "default" : "outline"}
                    onClick={() => updateRoleMutation.mutate({ id: member.id, role: "admin" })}
                    disabled={member.role === "admin"}
                  >
                    Admin
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