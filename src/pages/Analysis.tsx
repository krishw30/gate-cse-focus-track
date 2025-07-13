import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  RevisionData,
  processSubjectAnalysis,
  buildSubjectChart,
  processProgressData,
  buildProgressChart,
} from "@/lib/chartUtils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const Analysis = () => {
  const [revisions, setRevisions] = useState<RevisionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const { toast } = useToast();

  useEffect(() => {
    const fetchRevisions = async () => {
      try {
        const q = query(collection(db, "revisions"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => doc.data() as RevisionData);
        setRevisions(data);
      } catch (error) {
        console.error("Error fetching revisions:", error);
        toast({
          title: "Error",
          description: "Failed to fetch revision data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRevisions();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  if (revisions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-center font-semibold">Analysis Dashboard</h1>
        <Card className="shadow-sm">
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <div className="mb-4">📊</div>
              <h3 className="text-lg font-medium mb-2">No data yet</h3>
              <p>Add some revisions to see your progress analysis.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subjectAnalysis = processSubjectAnalysis(revisions);
  const subjectChart = buildSubjectChart(subjectAnalysis);
  
  const progressData = processProgressData(revisions, timeframe);
  const progressChart = buildProgressChart(progressData);

  const totalRevisions = revisions.length;
  const totalQuestions = revisions.reduce((sum, r) => sum + r.numQuestions, 0);
  const totalCorrect = revisions.reduce((sum, r) => sum + r.numCorrect, 0);
  const overallAccuracy = totalQuestions > 0 ? ((totalCorrect / totalQuestions) * 100).toFixed(1) : '0';

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center font-semibold">Analysis Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revisions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalRevisions}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalQuestions}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{overallAccuracy}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subjects" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-muted">
          <TabsTrigger value="subjects" className="font-medium">Subject Analysis</TabsTrigger>
          <TabsTrigger value="progress" className="font-medium">Progress Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-semibold">Subject-wise Performance</CardTitle>
              <CardDescription>
                Stacked bar chart showing correct vs wrong answers with accuracy line overlay
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px]">
                <Bar
                  data={subjectChart.data}
                  options={subjectChart.options}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-semibold">Progress Over Time</CardTitle>
              <CardDescription>
                Track your questions attempted and correct answers over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-2 flex-wrap">
                <Button
                  variant={timeframe === 'daily' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeframe('daily')}
                  className="font-medium"
                >
                  Daily
                </Button>
                <Button
                  variant={timeframe === 'weekly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeframe('weekly')}
                  className="font-medium"
                >
                  Weekly
                </Button>
                <Button
                  variant={timeframe === 'monthly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeframe('monthly')}
                  className="font-medium"
                >
                  Monthly
                </Button>
              </div>
              
              <div className="h-[400px]">
                <Line
                  data={progressChart.data}
                  options={progressChart.options}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analysis;