"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import AnalyticsDashboard from "@/components/dashboard/analytics-dashboard";

const HomePage = () => {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const user = session?.user || null;
  const isAuthenticated = !!session?.user;
  const isLoading = isPending;

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rowad-600"></div>
        </div>
      </div>
    );
  }

  // Show access denied if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">
              Rowad Speedball Dashboard
            </CardTitle>
            <CardDescription className="text-lg">
              Admin Access Required
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">
                🔒 Access Restricted
              </h2>
              <p className="text-gray-600 max-w-md mx-auto">
                This dashboard contains sensitive analytics and insights for the
                Rowad speedball team. Admin authentication is required to access
                this content.
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => router.push("/admin")}
                className="bg-rowad-600 hover:bg-rowad-700"
              >
                Go to Admin Login
              </Button>

              <div className="text-sm text-gray-500">
                <p>For public access to player and test information:</p>
                <div className="flex gap-4 justify-center mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/players")}
                  >
                    View Players
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/tests")}
                  >
                    View Tests
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show dashboard for authenticated admin users
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Rowad Speedball Dashboard
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Comprehensive analytics and insights for Rowad speedball team
          performance
        </p>
        <div className="mt-4 flex justify-center gap-4">
          <Button variant="outline" onClick={() => router.push("/admin")}>
            Admin Panel
          </Button>
          <Button variant="outline" onClick={() => router.push("/players")}>
            Players
          </Button>
          <Button variant="outline" onClick={() => router.push("/tests")}>
            Tests
          </Button>
        </div>
      </header>

      {/* Dashboard */}
      <AnalyticsDashboard />
    </div>
  );
};

export default HomePage;
