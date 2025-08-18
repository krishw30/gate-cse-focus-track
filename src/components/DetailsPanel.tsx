import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { RevisionData } from "@/lib/chartUtils";

interface DetailsPanelProps {
  revisions: RevisionData[];
}

const DetailsPanel = ({ revisions }: DetailsPanelProps) => {
  const navigate = useNavigate();

  return (
    <Button 
      variant="outline" 
      className="gap-2"
      onClick={() => navigate("/analysis/detail")}
    >
      <BarChart3 className="h-4 w-4" />
      Details ⤵︎
    </Button>
  );
};

export default DetailsPanel;