import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, BarChart3, PlusCircle, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import AddQuestionModal from "@/components/AddQuestionModal";

const Index = () => {
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            GATE CSE Revision Tracker
          </h1>
          <p className="text-xl text-muted-foreground">
            Track your progress, analyze weak topics, and ace your GATE preparation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Add Revision Card */}
          <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Plus className="h-6 w-6 text-primary" />
                Add Revision
              </CardTitle>
              <CardDescription>
                Log your study session and track performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/add-revision">
                <Button className="w-full" size="lg">
                  Start Revision Log
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Add Question Card */}
          <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <PlusCircle className="h-6 w-6 text-primary" />
                Add Question
              </CardTitle>
              <CardDescription>
                Save important questions for future reference
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => setIsAddQuestionOpen(true)}
              >
                Add New Question
              </Button>
            </CardContent>
          </Card>

          {/* Analysis Card */}
          <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                Analysis
              </CardTitle>
              <CardDescription>
                View detailed insights and progress analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/analysis">
                <Button className="w-full" size="lg" variant="outline">
                  View Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* FLMT Analysis Card */}
          <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                FLMT Analysis
              </CardTitle>
              <CardDescription>
                Track and analyze your mock test performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/flmt-analysis">
                <Button className="w-full" size="lg" variant="outline">
                  View FLMT Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-center mb-8">Your GATE Journey</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">📚</div>
                <div className="text-sm text-muted-foreground mt-2">Track Revisions</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">🎯</div>
                <div className="text-sm text-muted-foreground mt-2">Analyze Performance</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">📝</div>
                <div className="text-sm text-muted-foreground mt-2">Save Questions</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">🚀</div>
                <div className="text-sm text-muted-foreground mt-2">Ace GATE</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AddQuestionModal 
        isOpen={isAddQuestionOpen}
        onClose={() => setIsAddQuestionOpen(false)}
      />
    </div>
  );
};

export default Index;