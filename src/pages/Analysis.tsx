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
import DetailsPanel from "@/components/DetailsPanel";
import WeakTopicsModal from "@/components/WeakTopicsModal";
import TimeInsightsModal from "@/components/TimeInsightsModal";
import {
  RevisionData,
  processSubjectAnalysis,
  buildSubjectChart,
  processProgressData,
  buildProgressChart,
  processTypeAnalysis,
  buildTypeChart,
  processTimeAnalysis,
  buildTimeChart,
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

  const typeAnalysis = processTypeAnalysis(revisions);
  const typeChart = buildTypeChart(typeAnalysis);

  const timeAnalysis = processTimeAnalysis(revisions);
  const timeChart = buildTimeChart(timeAnalysis);

  const totalRevisions = revisions.length;
  const totalQuestions = revisions.reduce((sum, r) => sum + r.numQuestions, 0);
  const totalCorrect = revisions.reduce((sum, r) => sum + r.numCorrect, 0);
  const overallAccuracy = totalQuestions > 0 ? ((totalCorrect / totalQuestions) * 100).toFixed(1) : '0';

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold font-semibold">Analysis Dashboard</h1>
        <div className="flex gap-3">
          <WeakTopicsModal />
          <TimeInsightsModal revisions={revisions} />
          <DetailsPanel revisions={revisions} />
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="rounded-xl shadow-md border-0" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revisions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: '#0069d9' }}>{totalRevisions}</div>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl shadow-md border-0" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: '#0069d9' }}>{totalQuestions}</div>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl shadow-md border-0" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: '#0069d9' }}>{overallAccuracy}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subjects" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-muted rounded-xl p-1">
          <TabsTrigger value="subjects" className="font-medium rounded-lg">Subject Analysis</TabsTrigger>
          <TabsTrigger value="types" className="font-medium rounded-lg">Analysis by Type</TabsTrigger>
          <TabsTrigger value="progress" className="font-medium rounded-lg">Progress Tracking</TabsTrigger>
          <TabsTrigger value="time" className="font-medium rounded-lg">Time Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="space-y-6">
          <Card className="rounded-xl shadow-md border-0" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardHeader>
              <CardTitle className="font-semibold" style={{ color: '#212529' }}>Subject-wise Performance</CardTitle>
              <CardDescription>
                Stacked horizontal bars showing correct vs wrong answers for each subject
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

        <TabsContent value="types" className="space-y-6">
          <Card className="rounded-xl shadow-md border-0" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <CardHeader>
              <CardTitle className="font-semibold" style={{ color: '#212529' }}>Analysis by Type</CardTitle>
              <CardDescription>
                Performance breakdown by revision type (DPP, PYQ, Mock Test, Other)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <Bar
                  data={typeChart.data}
                  options={typeChart.options}
                />
              </div>
              
              {/* Type Distribution Summary */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(typeAnalysis).map(([type, stats]) => (
                  <div key={type} className="text-center">
                    <div className="text-2xl font-bold" style={{ color: '#0069d9' }}>
                      {stats.attempts}
                    </div>
                    <div className="text-sm text-muted-foreground">{type}</div>
                    <div className="text-xs text-muted-foreground">
                      {stats.accuracy.toFixed(1)}% accuracy
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <Card className="rounded-xl shadow-md border-0" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardHeader>
              <CardTitle className="font-semibold" style={{ color: '#212529' }}>Progress Over Time</CardTitle>
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
                  className="font-medium transition-all hover:scale-105"
                  style={timeframe === 'daily' ? { backgroundColor: '#0069d9', borderColor: '#0069d9' } : {}}
                >
                  Daily
                </Button>
                <Button
                  variant={timeframe === 'weekly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeframe('weekly')}
                  className="font-medium transition-all hover:scale-105"
                  style={timeframe === 'weekly' ? { backgroundColor: '#0069d9', borderColor: '#0069d9' } : {}}
                >
                  Weekly
                </Button>
                <Button
                  variant={timeframe === 'monthly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeframe('monthly')}
                  className="font-medium transition-all hover:scale-105"
                  style={timeframe === 'monthly' ? { backgroundColor: '#0069d9', borderColor: '#0069d9' } : {}}
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

        <TabsContent value="time" className="space-y-6">
          <Card className="rounded-xl shadow-md border-0" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardHeader>
              <CardTitle className="font-semibold" style={{ color: '#212529' }}>Time Analysis</CardTitle>
              <CardDescription>
                Time spent per subject with efficiency metrics (questions per hour)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(timeAnalysis).length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <div className="mb-4">⏱️</div>
                  <h3 className="text-lg font-medium mb-2">No time data available</h3>
                  <p>Add revisions with time tracking to see time analysis.</p>
                </div>
              ) : (
                <div className="h-[400px]">
                  <Bar
                    data={timeChart.data}
                    options={timeChart.options}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analysis;