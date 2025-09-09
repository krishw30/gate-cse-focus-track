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
    let yAxisData, yAxisLabel, yAxisColor, gradientColor;
    
    switch (yAxisType) {
      case 'timeSpent':
        yAxisData = flmtData.slice().reverse().map(test => test.timeSpent);
        yAxisLabel = 'Time Spent (minutes)';
        yAxisColor = 'hsl(var(--chart-coral))';
        gradientColor = 'hsla(var(--chart-coral), 0.1)';
        break;
      case 'marksPerMinute':
        yAxisData = flmtData.slice().reverse().map(test => test.marksPerMinute.toFixed(2));
        yAxisLabel = 'Marks per Minute';
        yAxisColor = 'hsl(var(--chart-purple))';
        gradientColor = 'hsla(var(--chart-purple), 0.1)';
        break;
      default:
        yAxisData = flmtData.slice().reverse().map(test => test.marks);
        yAxisLabel = 'Marks';
        yAxisColor = 'hsl(var(--chart-accent))';
        gradientColor = 'hsla(var(--chart-accent), 0.1)';
    }

    return {
      labels: chartLabels,
      datasets: [
        {
          label: yAxisLabel,
          data: yAxisData,
          borderColor: yAxisColor,
          backgroundColor: (context: any) => {
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            if (!chartArea) return gradientColor;
            
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, yAxisColor.replace('hsl', 'hsla').replace(')', ', 0.3)'));
            gradient.addColorStop(1, yAxisColor.replace('hsl', 'hsla').replace(')', ', 0.05)'));
            return gradient;
          },
          borderWidth: 4,
          pointRadius: 8,
          pointHoverRadius: 12,
          pointBackgroundColor: yAxisColor,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 3,
          pointHoverBackgroundColor: yAxisColor,
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 4,
          tension: 0.4,
          fill: true,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: { 
            size: 14, 
            weight: 600,
            family: 'Inter'
          },
          padding: 24,
          usePointStyle: true,
          pointStyleWidth: 18
        }
      },
      tooltip: {
        backgroundColor: 'hsl(var(--popover))',
        titleColor: 'hsl(var(--popover-foreground))',
        bodyColor: 'hsl(var(--popover-foreground))',
        borderColor: 'hsl(var(--border))',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 16,
        titleFont: {
          size: 16,
          weight: 600,
          family: 'Inter'
        },
        bodyFont: {
          size: 14,
          family: 'Inter'
        },
        displayColors: false,
        callbacks: {
          title: (context: any) => {
            const index = context[0].dataIndex;
            const test = flmtData.slice().reverse()[index];
            return test.testName;
          },
          afterTitle: (context: any) => {
            const index = context[0].dataIndex;
            const test = flmtData.slice().reverse()[index];
            return `📅 ${test.date}`;
          },
          label: (context: any) => {
            const index = context.dataIndex;
            const test = flmtData.slice().reverse()[index];
            return [
              `📊 Marks: ${test.marks}`,
              `✅ Correct: ${test.correct}`,
              `❌ Incorrect: ${test.incorrect}`,
              `🎯 Accuracy: ${test.accuracy.toFixed(1)}%`,
              `⏱️ Time: ${test.timeSpent} minutes`,
              `⚡ Efficiency: ${test.marksPerMinute.toFixed(2)} marks/min`
            ];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'hsl(var(--border))',
          lineWidth: 1,
          drawBorder: false
        },
        border: {
          display: false
        },
        ticks: {
          font: { 
            size: 12,
            weight: 500,
            family: 'Inter'
          },
          color: 'hsl(var(--muted-foreground))',
          padding: 12
        }
      },
      x: {
        grid: {
          color: 'hsl(var(--border))',
          lineWidth: 1,
          drawBorder: false
        },
        border: {
          display: false
        },
        ticks: {
          font: { 
            size: 12,
            weight: 500,
            family: 'Inter'
          },
          color: 'hsl(var(--muted-foreground))',
          padding: 12,
          maxRotation: 45
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-chart-accent/5 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto p-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-chart-accent rounded-full mb-6 shadow-lg">
            <span className="text-3xl">📊</span>
          </div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-chart-accent to-primary bg-clip-text text-transparent">
            Full Length Mock Test Analysis
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Track your mock test performance with beautiful insights and identify areas for improvement
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-primary/5 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="pb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-chart-accent rounded-lg flex items-center justify-center">
                <span className="text-lg">📝</span>
              </div>
              <CardTitle className="text-sm font-semibold text-muted-foreground">Total Tests</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold bg-gradient-to-r from-primary to-chart-accent bg-clip-text text-transparent">{totalTests}</div>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-chart-teal/5 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-teal/10 via-transparent to-chart-teal/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="pb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-chart-teal to-chart-green rounded-lg flex items-center justify-center">
                <span className="text-lg">📊</span>
              </div>
              <CardTitle className="text-sm font-semibold text-muted-foreground">Average Marks</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold bg-gradient-to-r from-chart-teal to-chart-green bg-clip-text text-transparent">{averageMarks.toFixed(1)}</div>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-chart-orange/5 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-orange/10 via-transparent to-chart-orange/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="pb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-chart-orange to-chart-coral rounded-lg flex items-center justify-center">
                <span className="text-lg">🏆</span>
              </div>
              <CardTitle className="text-sm font-semibold text-muted-foreground">Best Marks</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold bg-gradient-to-r from-chart-orange to-chart-coral bg-clip-text text-transparent">{bestMarks}</div>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-chart-purple/5 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-purple/10 via-transparent to-chart-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="pb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-chart-purple to-primary rounded-lg flex items-center justify-center">
                <span className="text-lg">🎯</span>
              </div>
              <CardTitle className="text-sm font-semibold text-muted-foreground">Average Accuracy</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold bg-gradient-to-r from-chart-purple to-primary bg-clip-text text-transparent">{averageAccuracy.toFixed(1)}%</div>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-chart-blue/5 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-blue/10 via-transparent to-chart-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="pb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-chart-blue to-chart-accent rounded-lg flex items-center justify-center">
                <span className="text-lg">⏱️</span>
              </div>
              <CardTitle className="text-sm font-semibold text-muted-foreground">Avg Time/Test</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold bg-gradient-to-r from-chart-blue to-chart-accent bg-clip-text text-transparent">{averageTimeSpent.toFixed(0)}m</div>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-chart-coral/5 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-coral/10 via-transparent to-chart-coral/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="pb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-chart-coral to-chart-orange rounded-lg flex items-center justify-center">
                <span className="text-lg">⚡</span>
              </div>
              <CardTitle className="text-sm font-semibold text-muted-foreground">Avg Marks/Min</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold bg-gradient-to-r from-chart-coral to-chart-orange bg-clip-text text-transparent">{averageMarksPerMinute.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card via-card/80 to-primary/5 shadow-2xl hover:shadow-3xl transition-all duration-500 mb-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="pb-6 relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-chart-accent rounded-xl flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Performance Over Time
              </CardTitle>
              <CardDescription className="text-lg mt-2 text-muted-foreground">
                Visualize your performance trends with interactive insights
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 pt-4">
            <Button
              variant={yAxisType === 'marks' ? 'default' : 'outline'}
              size="lg"
              onClick={() => setYAxisType('marks')}
              className="font-semibold text-base px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              📊 Marks
            </Button>
            <Button
              variant={yAxisType === 'timeSpent' ? 'default' : 'outline'}
              size="lg"
              onClick={() => setYAxisType('timeSpent')}
              className="font-semibold text-base px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              ⏱️ Time Spent
            </Button>
            <Button
              variant={yAxisType === 'marksPerMinute' ? 'default' : 'outline'}
              size="lg"
              onClick={() => setYAxisType('marksPerMinute')}
              className="font-semibold text-base px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              ⚡ Efficiency
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-2 relative z-10">
          <div className="h-[450px] p-4 bg-gradient-to-br from-background/50 to-muted/20 rounded-xl backdrop-blur-sm">
            <Line data={getChartData()} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* FLMT Records Table */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card via-card/90 to-muted/10 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-accent/5 pointer-events-none" />
        <CardHeader className="pb-8 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-chart-teal to-chart-green rounded-xl flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Test Records
              </CardTitle>
              <CardDescription className="text-lg mt-2 text-muted-foreground">
                Detailed breakdown of each Full Length Mock Test performance
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2 relative z-10">
          <div className="space-y-8">
            {flmtData.map((test, index) => (
              <Card key={test.id} className="group relative overflow-hidden border-0 bg-gradient-to-br from-background via-background/95 to-primary/5 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-chart-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="p-8 relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-chart-accent rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground">{test.testName}</h3>
                        <p className="text-muted-foreground flex items-center gap-2 mt-1">
                          <span>📅</span> {test.date}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setExpandedRow(expandedRow === test.id ? null : test.id)}
                      className="shrink-0 rounded-xl px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {expandedRow === test.id ? <ChevronUp className="w-5 h-5 mr-2" /> : <ChevronDown className="w-5 h-5 mr-2" />}
                      {expandedRow === test.id ? 'Hide Details' : 'View Details'}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-chart-accent/10 rounded-xl border border-primary/20 shadow-lg">
                      <div className="text-3xl font-bold bg-gradient-to-r from-primary to-chart-accent bg-clip-text text-transparent">{test.marks}</div>
                      <div className="text-sm font-semibold text-muted-foreground mt-2 flex items-center justify-center gap-1">
                        <span>📊</span> Total Marks
                      </div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-chart-teal/10 to-chart-green/10 rounded-xl border border-chart-teal/20 shadow-lg">
                      <div className="text-3xl font-bold bg-gradient-to-r from-chart-teal to-chart-green bg-clip-text text-transparent">{test.accuracy.toFixed(1)}%</div>
                      <div className="text-sm font-semibold text-muted-foreground mt-2 flex items-center justify-center gap-1">
                        <span>🎯</span> Accuracy
                      </div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-chart-blue/10 to-chart-purple/10 rounded-xl border border-chart-blue/20 shadow-lg">
                      <div className="text-3xl font-bold bg-gradient-to-r from-chart-blue to-chart-purple bg-clip-text text-transparent">{test.timeSpent}m</div>
                      <div className="text-sm font-semibold text-muted-foreground mt-2 flex items-center justify-center gap-1">
                        <span>⏱️</span> Time Spent
                      </div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-chart-coral/10 to-chart-orange/10 rounded-xl border border-chart-coral/20 shadow-lg">
                      <div className="text-3xl font-bold bg-gradient-to-r from-chart-coral to-chart-orange bg-clip-text text-transparent">{test.marksPerMinute.toFixed(2)}</div>
                      <div className="text-sm font-semibold text-muted-foreground mt-2 flex items-center justify-center gap-1">
                        <span>⚡</span> Efficiency
                      </div>
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