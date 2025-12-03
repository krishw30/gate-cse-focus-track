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
import { Bar, Line, Chart } from 'react-chartjs-2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import DetailsPanel from "@/components/DetailsPanel";
import TimeInsightsModal from "@/components/TimeInsightsModal";
import QuestionsModal from "@/components/QuestionsModal";
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
  calculateAvgQuestions,
  processDailyAvgData,
  buildDailyAvgChart,
  generateInsights,
  MockTestData
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
  const [mockTests, setMockTests] = useState<MockTestData[]>([]);
  const [includeMocks, setIncludeMocks] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [avgTimeframe, setAvgTimeframe] = useState<'weekly' | 'monthly'>('weekly');
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // fetch revisions
        const qRev = query(collection(db, "revisions"), orderBy("timestamp", "desc"));
        const revSnap = await getDocs(qRev);
        const revs = revSnap.docs.map(doc => doc.data() as RevisionData);

        // fetch mock tests
        const qMock = query(collection(db, "mockTest"), orderBy("timestamp", "desc"));
        const mockSnap = await getDocs(qMock);
        const mocks = mockSnap.docs.map(doc => doc.data() as MockTestData);

        setRevisions(revs);
        setMockTests(mocks);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch revision or mock test data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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

  if (revisions.length === 0 && mockTests.length === 0) { // <-- include mockTests in empty check
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

  // Keep subject-only analysis (optional: expand mockTests.subjectDetails into per-subject revisions if you want)
  const subjectAnalysis = processSubjectAnalysis(revisions);
  const subjectChart = buildSubjectChart(subjectAnalysis);

  // Convert mock tests into RevisionData-like entries for totals/progress/type/daily insights
  const mockAsRevisions: RevisionData[] = mockTests.map(m => ({
    date: m.date,
    subject: "Mock Test",
    numQuestions: Number(m.totalQuestions || 0),
    numCorrect: Number(m.totalCorrect || 0),
    type: "Mock Test",
    remarks: m.sillyMistakes || "",
    timeSpentMinutes: undefined
  }));

  // Combined activities used for totals/progress/type/insights
  // includeMocks controls whether mock tests are considered in aggregated metrics & charts
  const combinedActivities = includeMocks ? [...revisions, ...mockAsRevisions] : [...revisions];

  const totalRevisions = combinedActivities.length;
  const totalQuestions = combinedActivities.reduce((sum, r) => sum + (r.numQuestions || 0), 0);
  const totalCorrect = combinedActivities.reduce((sum, r) => sum + (r.numCorrect || 0), 0);
  const overallAccuracy = totalQuestions > 0 ? ((totalCorrect / totalQuestions) * 100).toFixed(1) : '0';

  // Recalculate progress data using combined activities (so mocks are included)
  const progressData = processProgressData(combinedActivities, timeframe);
  const progressChart = buildProgressChart(progressData);

  // Use combined activities for type analysis (includes Mock Test)
  const typeAnalysis = processTypeAnalysis(combinedActivities);
  const typeChart = buildTypeChart(typeAnalysis);

  // Time analysis remains derived from combinedActivities (mock entries have no time by default)
  const timeAnalysis = processTimeAnalysis(combinedActivities);
  const timeChart = buildTimeChart(timeAnalysis);

  const avgQuestionsPerDay = calculateAvgQuestions(combinedActivities, 'all');
  
  // Calculate daily avg data and insights using combined activities
  const dailyAvgData = processDailyAvgData(combinedActivities, avgTimeframe);
  const dailyAvgChart = buildDailyAvgChart(dailyAvgData);
  const insights = generateInsights(combinedActivities);

  // --- NEW: styled accessible ToggleSwitch component ---
  const ToggleSwitch = ({ checked, onChange, count }: { checked: boolean; onChange: () => void; count?: number }) => {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`inline-flex items-center gap-3 px-3 py-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          checked ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-sm' : 'bg-slate-100 text-slate-700'
        }`}
      >
        <span className="relative inline-flex items-center w-12 h-6">
          <span className={`absolute inset-0 rounded-full transition-colors ${checked ? 'bg-emerald-600' : 'bg-gray-300'}`}></span>
          <span
            className={`relative z-10 inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
              checked ? 'translate-x-6' : 'translate-x-0'
            }`}
            aria-hidden
          />
        </span>

        <span className="flex flex-col leading-none text-left">
          <span className="text-sm font-medium">{checked ? 'Including full-length mocks' : 'Exclude full-length mocks'}</span>
          <span className="text-[11px] text-muted-foreground">{count ?? 0} mock(s)</span>
        </span>
      </button>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold font-semibold">Analysis Dashboard</h1>
        <div className="flex gap-3">
          {/* Toggle: include/exclude full-length mock tests from aggregated metrics */}
          <ToggleSwitch checked={includeMocks} onChange={() => setIncludeMocks(prev => !prev)} count={mockTests.length} />
           <QuestionsModal />
           <TimeInsightsModal revisions={revisions} />
           <DetailsPanel revisions={revisions} />
         </div>
       </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="rounded-xl shadow-md border-0 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revisions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-accent">{totalRevisions}</div>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl shadow-md border-0 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-accent">{totalQuestions}</div>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl shadow-md border-0 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-accent">{overallAccuracy}%</div>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl shadow-md border-0 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Questions/Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-accent">{avgQuestionsPerDay.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subjects" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-muted rounded-xl p-1">
          <TabsTrigger value="subjects" className="font-medium rounded-lg">Subject Analysis</TabsTrigger>
          <TabsTrigger value="types" className="font-medium rounded-lg">Analysis by Type</TabsTrigger>
          <TabsTrigger value="progress" className="font-medium rounded-lg">Progress Tracking</TabsTrigger>
          <TabsTrigger value="daily-avg" className="font-medium rounded-lg">Daily Average</TabsTrigger>
          <TabsTrigger value="time" className="font-medium rounded-lg">Time Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="space-y-6">
          <Card className="rounded-xl shadow-md border-0 hover:shadow-lg transition-all duration-300" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardHeader>
              <CardTitle className="font-semibold text-foreground">Subject-wise Performance</CardTitle>
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
          <Card className="rounded-xl shadow-md border-0 hover:shadow-lg transition-all duration-300" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <CardHeader>
              <CardTitle className="font-semibold text-foreground">Analysis by Type</CardTitle>
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
                  <div key={type} className="text-center p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-all duration-200">
                    <div className="text-2xl font-bold text-chart-accent">
                      {stats.attempts}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">{type}</div>
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
          <Card className="rounded-xl shadow-md border-0 hover:shadow-lg transition-all duration-300" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardHeader>
              <CardTitle className="font-semibold text-foreground">Progress Over Time</CardTitle>
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
                  className="font-medium transition-all duration-200 hover:scale-105"
                  style={timeframe === 'daily' ? { backgroundColor: 'hsl(216, 92%, 43%)', borderColor: 'hsl(216, 92%, 43%)' } : {}}
                >
                  Daily
                </Button>
                <Button
                  variant={timeframe === 'weekly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeframe('weekly')}
                  className="font-medium transition-all duration-200 hover:scale-105"
                  style={timeframe === 'weekly' ? { backgroundColor: 'hsl(216, 92%, 43%)', borderColor: 'hsl(216, 92%, 43%)' } : {}}
                >
                  Weekly
                </Button>
                <Button
                  variant={timeframe === 'monthly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeframe('monthly')}
                  className="font-medium transition-all duration-200 hover:scale-105"
                  style={timeframe === 'monthly' ? { backgroundColor: 'hsl(216, 92%, 43%)', borderColor: 'hsl(216, 92%, 43%)' } : {}}
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

        <TabsContent value="daily-avg" className="space-y-6">
          <Card className="rounded-xl shadow-md border-0 hover:shadow-lg transition-all duration-300" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardHeader>
              <CardTitle className="font-semibold text-foreground">Daily Average Questions</CardTitle>
              <CardDescription>
                Average questions per day by week/month with accuracy trend overlay
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-2 flex-wrap">
                <Button
                  variant={avgTimeframe === 'weekly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAvgTimeframe('weekly')}
                  className="font-medium transition-all duration-200 hover:scale-105"
                >
                  Weekly
                </Button>
                <Button
                  variant={avgTimeframe === 'monthly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAvgTimeframe('monthly')}
                  className="font-medium transition-all duration-200 hover:scale-105"
                >
                  Monthly
                </Button>
              </div>
              
              <div className="h-[400px]">
                <Chart
                  type="bar"
                  data={dailyAvgChart.data}
                  options={dailyAvgChart.options}
                />
              </div>
            </CardContent>
          </Card>

          {/* Progress Insights */}
          {insights.length > 0 && (
            <Card className="rounded-xl shadow-md border-0 hover:shadow-lg transition-all duration-300" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <CardHeader>
                <CardTitle className="font-semibold text-foreground">Progress Insights</CardTitle>
                <CardDescription>
                  AI-generated insights about your revision progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.map((insight, index) => (
                    <div 
                      key={index}
                      className="p-4 bg-muted/30 rounded-lg border-l-4 border-chart-accent"
                    >
                      <p className="text-sm text-foreground font-medium">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="time" className="space-y-6">
          <Card className="rounded-xl shadow-md border-0 hover:shadow-lg transition-all duration-300" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardHeader>
              <CardTitle className="font-semibold text-foreground">Time Analysis</CardTitle>
              <CardDescription>
                Time spent per subject with efficiency metrics (questions per hour)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(timeAnalysis).length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <div className="mb-4 text-4xl">⏱️</div>
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

      {/* Chatbot removed: no AI chat component is rendered here anymore */}
    </div>
  );
};

export default Analysis;
