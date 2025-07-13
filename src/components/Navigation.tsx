import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircle, BarChart3 } from "lucide-react";

const Navigation = () => {
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
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;