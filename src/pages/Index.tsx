import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, BarChart3, PlusCircle, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import AddQuestionModal from "@/components/AddQuestionModal";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const { toast } = useToast();

  const hardReset = async () => {
    setIsResetting(true);
    try {
      const collectionsToWipe = ["revisions", "weak topics", "fmt"];
      let totalDeleted = 0;
      for (const colName of collectionsToWipe) {
        const snap = await getDocs(collection(db, colName));
        // Batch delete in chunks of 400
        const docs = snap.docs;
        for (let i = 0; i < docs.length; i += 400) {
          const batch = writeBatch(db);
          docs.slice(i, i + 400).forEach(d => batch.delete(doc(db, colName, d.id)));
          await batch.commit();
        }
        totalDeleted += docs.length;
      }
      toast({
        title: "Hard reset complete",
        description: `Deleted ${totalDeleted} documents. Questions library preserved.`,
      });
      setResetOpen(false);
      setConfirmText("");
    } catch (e: any) {
      console.error(e);
      toast({ title: "Reset failed", description: e.message, variant: "destructive" });
    } finally {
      setIsResetting(false);
    }
  };

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        {/* Danger Zone */}
        <div className="mt-16">
          <Card className="border-2 border-destructive/40 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Hard reset wipes all revision logs, weak topics, and FLMT records.
                Your Questions Library is preserved.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Hard Reset All Data</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete ALL revisions, weak topics, and Full Length Mock Test records.
                      Your Questions Library will NOT be touched. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2">
                    <Label>Type <span className="font-mono font-bold">RESET</span> to confirm:</Label>
                    <Input
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="RESET"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={confirmText !== "RESET" || isResetting}
                      onClick={(e) => { e.preventDefault(); hardReset(); }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isResetting ? "Resetting..." : "Yes, delete everything"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
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