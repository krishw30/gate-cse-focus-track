import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface FLMTData {
  id: string;
  date: string;
  testName: string;
  correct: number;
  incorrect: number;
  marks: number;
  timeSpent: number; // minutes
  weakSubjects: string[];
  remarks?: string;
  importantQuestions?: string[];
  // Auto-calculated fields
  unattempted: number;
  accuracy: number;
  marksPerMinute: number;
}

const FLMTAnalysis = () => {
  const [flmtData, setFlmtData] = useState<FLMTData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [yAxisType, setYAxisType] = useState<'marks' | 'timeSpent' | 'marksPerMinute'>('marks');
  const { toast } = useToast();

  useEffect(() => {
    const fetchFLMTData = async () => {
      try {
        const q = query(collection(db, "fmt"), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => {
          const docData = doc.data();
          const correct = docData.correct || 0;
          const incorrect = docData.incorrect || 0;
          const marks = docData.marks || 0;
          const timeSpent = docData.timeSpent || 1;
          
          return {
            id: doc.id,
            ...docData,
            unattempted: 65 - correct - incorrect,
            accuracy: (correct / 65) * 100,
            marksPerMinute: marks / timeSpent,
          } as FLMTData;
        });
        setFlmtData(data);
      } catch (error) {
        console.error("Error fetching FLMT data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch Full Length Mock Test data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFLMTData();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading Full Length Mock Test analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  if (flmtData.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold font-semibold">Full Length Mock Test Analysis</h1>
        </div>
        <Card className="shadow-sm">
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <div className="mb-4 text-4xl">📝</div>
              <h3 className="text-lg font-medium mb-2">No Full Length Mock Tests yet</h3>
              <p>Add some Full Length Mock Tests to see your analysis.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate summary statistics
  const totalTests = flmtData.length;
  const averageMarks = flmtData.reduce((sum, test) => sum + test.marks, 0) / totalTests;
  const bestMarks = Math.max(...flmtData.map(test => test.marks));
  const averageAccuracy = flmtData.reduce((sum, test) => sum + test.accuracy, 0) / totalTests;
  const averageTimeSpent = flmtData.reduce((sum, test) => sum + test.timeSpent, 0) / totalTests;
  const averageMarksPerMinute = flmtData.reduce((sum, test) => sum + test.marksPerMinute, 0) / totalTests;

  // Prepare chart data
  const chartLabels = flmtData.slice().reverse().map(test => test.date);
  const getChartData = () => {
    let yAxisData, yAxisLabel, yAxisColor;
    
    switch (yAxisType) {
      case 'timeSpent':
        yAxisData = flmtData.slice().reverse().map(test => test.timeSpent);
        yAxisLabel = 'Time Spent (minutes)';
        yAxisColor = 'hsl(var(--chart-2))';
        break;
      case 'marksPerMinute':
        yAxisData = flmtData.slice().reverse().map(test => test.marksPerMinute.toFixed(2));
        yAxisLabel = 'Marks per Minute';
        yAxisColor = 'hsl(var(--chart-3))';
        break;
      default:
        yAxisData = flmtData.slice().reverse().map(test => test.marks);
        yAxisLabel = 'Marks';
        yAxisColor = 'hsl(var(--chart-1))';
    }

    return {
      labels: chartLabels,
      datasets: [
        {
          label: yAxisLabel,
          data: yAxisData,
          borderColor: yAxisColor,
          backgroundColor: yAxisColor + '20',
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          tension: 0.1,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: { size: 12 },
          padding: 20
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          title: (context: any) => {
            const index = context[0].dataIndex;
            const test = flmtData.slice().reverse()[index];
            return test.testName;
          },
          afterTitle: (context: any) => {
            const index = context[0].dataIndex;
            const test = flmtData.slice().reverse()[index];
            return `Date: ${test.date}`;
          },
          label: (context: any) => {
            const index = context.dataIndex;
            const test = flmtData.slice().reverse()[index];
            return [
              `Marks: ${test.marks}`,
              `Correct: ${test.correct}`,
              `Incorrect: ${test.incorrect}`,
              `Accuracy: ${test.accuracy.toFixed(1)}%`,
              `Time Spent: ${test.timeSpent} minutes`,
              `Marks per Minute: ${test.marksPerMinute.toFixed(2)}`
            ];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'hsl(var(--border))'
        },
        ticks: {
          font: { size: 11 }
        }
      },
      x: {
        grid: {
          color: 'hsl(var(--border))'
        },
        ticks: {
          font: { size: 11 }
        }
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold font-semibold">Full Length Mock Test Analysis</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Card className="rounded-xl shadow-md border-0 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-accent">{totalTests}</div>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl shadow-md border-0 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Marks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-accent">{averageMarks.toFixed(1)}</div>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl shadow-md border-0 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Best Marks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-accent">{bestMarks}</div>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl shadow-md border-0 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-accent">{averageAccuracy.toFixed(1)}%</div>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl shadow-md border-0 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Time/Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-accent">{averageTimeSpent.toFixed(0)}m</div>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl shadow-md border-0 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Marks/Min</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-accent">{averageMarksPerMinute.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card className="rounded-xl shadow-md border-0 hover:shadow-lg transition-all duration-300 mb-8">
        <CardHeader>
          <CardTitle className="font-semibold text-foreground">Performance Over Time</CardTitle>
          <CardDescription>
            Track your progress across Full Length Mock Tests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2 flex-wrap">
            <Button
              variant={yAxisType === 'marks' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setYAxisType('marks')}
              className="font-medium transition-all duration-200"
            >
              Marks
            </Button>
            <Button
              variant={yAxisType === 'timeSpent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setYAxisType('timeSpent')}
              className="font-medium transition-all duration-200"
            >
              Time Spent
            </Button>
            <Button
              variant={yAxisType === 'marksPerMinute' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setYAxisType('marksPerMinute')}
              className="font-medium transition-all duration-200"
            >
              Marks/Minute
            </Button>
          </div>
          
          <div className="h-[400px]">
            <Line data={getChartData()} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* FLMT Records Table */}
      <Card className="rounded-xl shadow-md border-0 hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <CardTitle className="font-semibold text-foreground">Full Length Mock Test Records</CardTitle>
          <CardDescription>
            Detailed breakdown of all your mock test attempts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {flmtData.map((test) => (
              <div key={test.id} className="border rounded-lg">
                <div className="flex items-center justify-between p-4 hover:bg-muted/50">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 flex-1">
                    <div>
                      <div className="text-sm text-muted-foreground">Date</div>
                      <div className="font-medium">{test.date}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Test Name</div>
                      <div className="font-medium">{test.testName}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Marks</div>
                      <div className="font-medium">{test.marks}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Accuracy</div>
                      <div className="font-medium">{test.accuracy.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Time</div>
                      <div className="font-medium">{test.timeSpent}m</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Marks/Min</div>
                      <div className="font-medium">{test.marksPerMinute.toFixed(2)}</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedRow(expandedRow === test.id ? null : test.id)}
                  >
                    {expandedRow === test.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    View Details
                  </Button>
                </div>
                
                {expandedRow === test.id && (
                  <div className="border-t bg-muted/20 p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">Test Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Test Name:</span>
                              <span className="font-medium">{test.testName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Date:</span>
                              <span className="font-medium">{test.date}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">Performance</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Correct:</span>
                              <span className="font-medium text-green-600">{test.correct}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Incorrect:</span>
                              <span className="font-medium text-red-600">{test.incorrect}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Unattempted:</span>
                              <span className="font-medium text-orange-600">{test.unattempted}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Marks:</span>
                              <span className="font-medium">{test.marks}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Accuracy:</span>
                              <span className="font-medium">{test.accuracy.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">Time Analysis</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Time Spent:</span>
                              <span className="font-medium">{test.timeSpent} minutes</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Marks per Minute:</span>
                              <span className="font-medium">{test.marksPerMinute.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">Weak Subjects</h4>
                          <div className="flex flex-wrap gap-1">
                            {test.weakSubjects && test.weakSubjects.length > 0 ? (
                              test.weakSubjects.map((subject, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {subject}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm">No weak subjects noted</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {test.remarks && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Remarks</h4>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">{test.remarks}</p>
                      </div>
                    )}
                    
                    {test.importantQuestions && test.importantQuestions.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Important Questions</h4>
                        <div className="max-h-32 overflow-y-auto bg-muted/50 p-3 rounded-lg">
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {test.importantQuestions.map((question, index) => (
                              <li key={index} className="text-muted-foreground">{question}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FLMTAnalysis;