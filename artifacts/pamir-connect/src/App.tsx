import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import FeedPage from "@/pages/FeedPage";
import GroupsPage from "@/pages/GroupsPage";
import EventsPage from "@/pages/EventsPage";
import RidesPage from "@/pages/RidesPage";
import MessagesPage from "@/pages/MessagesPage";
import ProfilePage from "@/pages/ProfilePage";
import AuthPage from "@/pages/AuthPage";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route>
          <Redirect to="/auth" />
        </Route>
      </Switch>
    );
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={FeedPage} />
        <Route path="/groups" component={GroupsPage} />
        <Route path="/events" component={EventsPage} />
        <Route path="/rides" component={RidesPage} />
        <Route path="/messages" component={MessagesPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    </AppLayout>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </Router>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
