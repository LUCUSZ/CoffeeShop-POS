import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Coffee, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createInitialUsers = async () => {
    try {
      const { data: adminData, error: adminError } = await supabase.auth.signUp({
        email: 'admin@test.com',
        password: 'admin123',
        options: {
          data: {
            full_name: 'Admin User',
            role: 'admin'
          }
        }
      });
      if (adminError) throw adminError;

      const { data: staffData, error: staffError } = await supabase.auth.signUp({
        email: 'staff@test.com',
        password: 'staff123',
        options: {
          data: {
            full_name: 'Staff User',
            role: 'staff'
          }
        }
      });
      if (staffError) throw staffError;

      toast.success("Test users created successfully! Please check your email for verification links.");
    } catch (error: any) {
      console.error(error);
      toast.error("Error creating test users: " + (error.message || "Unknown error occurred"));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (profile?.role === "admin") {
          navigate("/admin");
        } else if (profile?.role === "staff") {
          navigate("/pos");
        }
      }
    } catch (error: any) {
      console.error(error);
      setError(error.message);
      toast.error("Login failed: " + (error.message || "Unknown error occurred"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center">
            <Coffee className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="username"
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                "Loading..."
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <div className="pt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={createInitialUsers}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Create Test Users
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;