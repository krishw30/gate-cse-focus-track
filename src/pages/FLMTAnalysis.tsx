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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Full Length Mock Test Analysis
          </h1>
          <p className="text-xl text-muted-foreground">
            Track your mock test performance and identify improvement areas
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{totalTests}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Marks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{averageMarks.toFixed(1)}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Best Marks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{bestMarks}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{averageAccuracy.toFixed(1)}%</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Time/Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{averageTimeSpent.toFixed(0)}m</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Marks/Min</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{averageMarksPerMinute.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 mb-8">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-semibold">Performance Over Time</CardTitle>
          <CardDescription className="text-base">
            Track your performance trends across different metrics
          </CardDescription>
          <div className="flex gap-3 pt-2">
            <Button
              variant={yAxisType === 'marks' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setYAxisType('marks')}
              className="font-medium"
            >
              Marks
            </Button>
            <Button
              variant={yAxisType === 'timeSpent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setYAxisType('timeSpent')}
              className="font-medium"
            >
              Time Spent
            </Button>
            <Button
              variant={yAxisType === 'marksPerMinute' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setYAxisType('marksPerMinute')}
              className="font-medium"
            >
              Marks/Minute
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-[400px]">
            <Line data={getChartData()} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* FLMT Records Table */}
      <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-semibold">Test Records</CardTitle>
          <CardDescription className="text-base">
            Detailed breakdown of each Full Length Mock Test performance
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-6">
            {flmtData.map((test) => (
              <Card key={test.id} className="shadow-lg border border-muted/20 bg-background/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{test.testName}</h3>
                      <p className="text-muted-foreground text-sm">{test.date}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedRow(expandedRow === test.id ? null : test.id)}
                      className="shrink-0"
                    >
                      {expandedRow === test.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      View Details
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{test.marks}</div>
                      <div className="text-sm text-muted-foreground">Total Marks</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{test.accuracy.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">Accuracy</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{test.timeSpent}m</div>
                      <div className="text-sm text-muted-foreground">Time Spent</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{test.marksPerMinute.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">Marks/Min</div>
                    </div>
                  </div>
                  
                  {expandedRow === test.id && (
                    <div className="border-t pt-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Performance Section */}
                        <Card className="shadow-sm border border-muted/20 bg-muted/10">
                          <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-semibold">Performance Breakdown</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800/30">
                              <span className="font-medium text-foreground">Correct Answers</span>
                              <span className="text-xl font-bold text-green-600 dark:text-green-400">{test.correct}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800/30">
                              <span className="font-medium text-foreground">Incorrect Answers</span>
                              <span className="text-xl font-bold text-red-600 dark:text-red-400">{test.incorrect}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-950/30 rounded-lg border border-gray-200 dark:border-gray-800/30">
                              <span className="font-medium text-foreground">Unattempted</span>
                              <span className="text-xl font-bold text-gray-600 dark:text-gray-400">{test.unattempted}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                              <span className="font-medium text-foreground">Total Marks</span>
                              <span className="text-xl font-bold text-primary">{test.marks}</span>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* Time Analysis Section */}
                        <Card className="shadow-sm border border-muted/20 bg-muted/10">
                          <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-semibold">Time Analysis</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800/30">
                              <span className="font-medium text-foreground">Time Spent</span>
                              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{test.timeSpent} min</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800/30">
                              <span className="font-medium text-foreground">Marks per Minute</span>
                              <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{test.marksPerMinute.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                              <span className="font-medium text-foreground">Overall Accuracy</span>
                              <span className="text-xl font-bold text-primary">{test.accuracy.toFixed(1)}%</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Weak Subjects Section */}
                      <Card className="shadow-sm border border-muted/20 bg-muted/10">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg font-semibold">Weak Subjects</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {test.weakSubjects && test.weakSubjects.length > 0 ? (
                              test.weakSubjects.map((subject, index) => (
                                <Badge key={index} variant="secondary" className="px-3 py-1 text-sm font-medium bg-orange-100 dark:bg-orange-950/30 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-800/30">
                                  {subject}
                                </Badge>
                              ))
                            ) : (
                              <div className="text-muted-foreground text-sm bg-muted/30 px-4 py-2 rounded-lg">
                                No weak subjects identified
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Remarks Section */}
                      {test.remarks && (
                        <Card className="shadow-sm border border-muted/20 bg-muted/10">
                          <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-semibold">Additional Notes</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="bg-background/80 p-4 rounded-lg border border-muted/20">
                              <p className="text-foreground leading-relaxed">{test.remarks}</p>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default FLMTAnalysis;