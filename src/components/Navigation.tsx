import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, PlusCircle, BarChart3, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

const Navigation = () => {
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="border-b bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary">GATE CSE 2025 Revision Tracker</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }
            >
              <Button variant="ghost" size="sm">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </NavLink>

            <NavLink
              to="/add-revision"
              className={({ isActive }) =>
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }
            >
              <Button variant="ghost" size="sm">
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Revision
              </Button>
            </NavLink>
            
            <NavLink
              to="/analysis"
              className={({ isActive }) =>
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }
            >
              <Button variant="ghost" size="sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analysis
              </Button>
            </NavLink>
            
            {user && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;