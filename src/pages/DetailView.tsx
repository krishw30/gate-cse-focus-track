import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Calendar, BarChart3, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RevisionData } from "@/lib/chartUtils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import { Bar as ChartJSBar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

type ViewMode = 'date-wise' | 'subject-wise' | 'type-wise';
type PeriodFilter = 'last-7-days' | 'last-30-days' | 'this-month' | 'this-year' | 'all-time';

interface GroupedData {
  key: string;
  sessions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  revisions: RevisionData[];
}

const DetailView = () => {
  const [revisions, setRevisions] = useState<RevisionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('date-wise');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('last-7-days');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
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

  // Filter data based on period
  const getFilteredRevisions = () => {
    const now = new Date();
    const filterDate = new Date();

    switch (periodFilter) {
      case 'last-7-days':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'last-30-days':
        filterDate.setDate(now.getDate() - 30);
        break;
      case 'this-month':
        filterDate.setDate(1);
        break;
      case 'this-year':
        filterDate.setMonth(0, 1);
        break;
      case 'all-time':
        return revisions;
    }

    return revisions.filter(revision => new Date(revision.date) >= filterDate);
  };

  // Group data based on view mode
  const getGroupedData = (): GroupedData[] => {
    const filteredRevisions = getFilteredRevisions();
    const groups = new Map<string, RevisionData[]>();

    filteredRevisions.forEach(revision => {
      let key: string;

      switch (viewMode) {
        case 'date-wise':
          key = revision.date;
          break;
        case 'subject-wise':
          key = revision.subject;
          break;
        case 'type-wise':
          key = revision.type || 'Other';
          break;
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(revision);
    });

    return Array.from(groups.entries())
      .map(([key, revs]) => {
        const attempted = revs.reduce((sum, r) => sum + r.numQuestions, 0);
        const correct = revs.reduce((sum, r) => sum + r.numCorrect, 0);
        const incorrect = attempted - correct;
        const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0;

        return {
          key,
          sessions: revs.length,
          attempted,
          correct,
          incorrect,
          accuracy,
          revisions: revs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        };
      })
      .sort((a, b) => {
        if (viewMode === 'date-wise') {
          return b.key.localeCompare(a.key);
        }
        return a.key.localeCompare(b.key);
      });
  };

  const exportCSV = () => {
    const groupedData = getGroupedData();
    let csvContent = 'Date,Subject,Type,Total Questions,Correct,Wrong,Accuracy (%),Remarks,Weak Topics\n';

    groupedData.forEach(group => {
      group.revisions.forEach(revision => {
        const accuracy = revision.numQuestions > 0 ? 
          ((revision.numCorrect / revision.numQuestions) * 100).toFixed(1) : '0';
        const wrong = revision.numQuestions - revision.numCorrect;
        csvContent += `${revision.date},"${revision.subject}","${revision.type || 'Other'}",${revision.numQuestions},${revision.numCorrect},${wrong},${accuracy},"${revision.remarks || ''}","${revision.weakTopics || ''}"\n`;
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revision-data-${viewMode}-${periodFilter}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const toggleRowExpansion = (key: string) => {
    if (viewMode === 'date-wise') {
      const newExpanded = new Set(expandedRows);
      if (newExpanded.has(key)) {
        newExpanded.delete(key);
      } else {
        newExpanded.add(key);
      }
      setExpandedRows(newExpanded);
    } else {
      // For subject-wise and type-wise, clicking shows chart
      setSelectedItem(key);
    }
  };

  const handleBackToList = () => {
    setSelectedItem(null);
  };

  const getChartData = () => {
    if (!selectedItem) return { data: null, options: null };
    
    const filteredRevisions = getFilteredRevisions();
    const relevantRevisions = filteredRevisions.filter(rev => {
      if (viewMode === 'subject-wise') {
        return rev.subject === selectedItem;
      } else if (viewMode === 'type-wise') {
        return (rev.type || 'Other') === selectedItem;
      }
      return false;
    });

    const groups = new Map<string, RevisionData[]>();
    
    relevantRevisions.forEach(revision => {
      let key: string;
      if (viewMode === 'subject-wise') {
        key = revision.type || 'Other';
      } else {
        key = revision.subject;
      }
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(revision);
    });

    const chartData = Array.from(groups.entries()).map(([key, revs]) => {
      const attempted = revs.reduce((sum, r) => sum + r.numQuestions, 0);
      const correct = revs.reduce((sum, r) => sum + r.numCorrect, 0);
      
      return {
        name: key,
        sessions: revs.length,
        attempted,
        correct,
        incorrect: attempted - correct,
        accuracy: attempted > 0 ? Number(((correct / attempted) * 100).toFixed(1)) : 0
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    if (chartData.length === 0) {
      return { data: null, options: null };
    }

    // Build stacked horizontal bar chart data like Analysis page
    const labels = chartData.map(item => item.name);
    const correctData = chartData.map(item => item.correct);
    const incorrectData = chartData.map(item => item.incorrect);

    const data = {
      labels,
      datasets: [
        {
          label: 'Correct Answers',
          data: correctData,
          backgroundColor: 'hsl(166, 64%, 48%)', // #20c997 - teal (matching Analysis page)
          borderColor: 'hsl(166, 64%, 38%)',
          borderWidth: 0,
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: 'Incorrect Answers',
          data: incorrectData,
          backgroundColor: 'hsl(9, 100%, 70%)', // #ff6b6b - coral (matching Analysis page)
          borderColor: 'hsl(9, 100%, 60%)',
          borderWidth: 0,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y' as const,
      scales: {
        x: {
          stacked: true,
          beginAtZero: true,
          grid: {
            color: 'rgba(0,0,0,0.05)',
          },
          ticks: {
            color: 'hsl(215.4, 16.3%, 46.9%)', // muted-foreground
            font: {
              family: 'Inter, system-ui',
              weight: 500,
            },
          },
        },
        y: {
          stacked: true,
          type: 'category' as const,
          grid: {
            color: 'rgba(0,0,0,0.05)',
          },
          ticks: {
            color: 'hsl(215.4, 16.3%, 46.9%)', // muted-foreground
            font: {
              family: 'Inter, system-ui',
              weight: 500,
            },
            maxTicksLimit: 10, // Prevent overlap for long labels
          },
        },
      },
      interaction: {
        mode: 'point' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            font: {
              family: 'Inter, system-ui',
              weight: 600,
            },
            color: 'hsl(222.2, 84%, 4.9%)', // foreground color
          },
        },
        tooltip: {
          backgroundColor: '#ffffff',
          titleColor: '#212529',
          bodyColor: '#212529',
          borderColor: '#e9ecef',
          borderWidth: 1,
          cornerRadius: 12,
          padding: 12,
          callbacks: {
            beforeLabel: function() {
              return null;
            },
            title: function(context: any) {
              return `📚 ${viewMode === 'subject-wise' ? 'Type' : 'Subject'}: ${context[0].label}`;
            },
            label: function(context: any) {
              const itemName = context.label;
              const itemData = chartData.find(item => item.name === itemName);
              
              if (!itemData) return [];
              
              return [
                `📊 Sessions: ${itemData.sessions}`,
                `📝 Attempted: ${itemData.attempted}`,
                `✅ Correct: ${itemData.correct}`,
                `❌ Incorrect: ${itemData.incorrect}`,
                `📈 Accuracy: ${itemData.accuracy}%`
              ];
            },
            labelColor: function(context: any) {
              if (context.datasetIndex === 0) {
                return {
                  borderColor: 'hsl(166, 64%, 48%)',
                  backgroundColor: 'hsl(166, 64%, 48%)'
                };
              } else {
                return {
                  borderColor: 'hsl(9, 100%, 70%)',
                  backgroundColor: 'hsl(9, 100%, 70%)'
                };
              }
            }
          }
        },
        onHover: (event: any, elements: any) => {
          if (event.native) {
            event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
          }
        }
      },
    };

    return { data, options, chartData };
  };


  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading detail view...</p>
          </div>
        </div>
      </div>
    );
  }

  const groupedData = getGroupedData();
  const chartResult = getChartData();

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Sticky Filter Bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm rounded-lg mb-6 p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* View Mode Switcher */}
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'date-wise' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setViewMode('date-wise');
                  setSelectedItem(null);
                  setExpandedRows(new Set());
                }}
                className="rounded-md"
              >
                Date-wise
              </Button>
              <Button
                variant={viewMode === 'subject-wise' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setViewMode('subject-wise');
                  setSelectedItem(null);
                  setExpandedRows(new Set());
                }}
                className="rounded-md"
              >
                Subject-wise
              </Button>
              <Button
                variant={viewMode === 'type-wise' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setViewMode('type-wise');
                  setSelectedItem(null);
                  setExpandedRows(new Set());
                }}
                className="rounded-md"
              >
                Type-wise
              </Button>
            </div>

            {/* Period Selector */}
            <Select value={periodFilter} onValueChange={(value) => setPeriodFilter(value as PeriodFilter)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
                <SelectItem value="all-time">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export CSV Button */}
          <Button variant="outline" onClick={exportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-4">
        {/* Show chart view for subject-wise and type-wise when item is selected */}
        {selectedItem && (viewMode === 'subject-wise' || viewMode === 'type-wise') ? (
          <div className="space-y-4">
            {/* Back button */}
            <Button 
              variant="outline" 
              onClick={handleBackToList}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {viewMode === 'subject-wise' ? 'Subjects' : 'Types'}
            </Button>

            {/* Chart Card */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {viewMode === 'subject-wise' ? 'Types' : 'Subjects'} in {selectedItem}
                </h3>
                
                {!chartResult.data ? (
                  <div className="text-center text-muted-foreground py-8">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No data available for this filter.</p>
                  </div>
                ) : (
                  <div className="h-96 w-full">
                    <ChartJSBar
                      data={chartResult.data}
                      options={chartResult.options}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary Table */}
            {chartResult.chartData && chartResult.chartData.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h4 className="text-md font-semibold mb-4">Summary</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium">
                            {viewMode === 'subject-wise' ? 'Type' : 'Subject'}
                          </th>
                          <th className="text-center py-2 font-medium">Sessions</th>
                          <th className="text-center py-2 font-medium">Attempted</th>
                          <th className="text-center py-2 font-medium">Correct</th>
                          <th className="text-center py-2 font-medium">Incorrect</th>
                          <th className="text-center py-2 font-medium">Accuracy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chartResult.chartData.map((item) => (
                          <tr key={item.name} className="border-b hover:bg-muted/50">
                            <td className="py-3 font-medium">{item.name}</td>
                            <td className="text-center py-3">{item.sessions}</td>
                            <td className="text-center py-3">{item.attempted}</td>
                            <td className="text-center py-3" style={{ color: 'hsl(166, 64%, 48%)' }}>{item.correct}</td>
                            <td className="text-center py-3" style={{ color: 'hsl(9, 100%, 70%)' }}>{item.incorrect}</td>
                            <td className="text-center py-3 font-medium text-chart-accent">{item.accuracy}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* Regular list view */
          <>
            {groupedData.length === 0 ? (
              <Card className="p-12">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No data available for this filter.</h3>
                  <p>Try changing your filters or period selection.</p>
                </div>
              </Card>
            ) : (
              groupedData.map((group) => (
                <Card key={group.key} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Main Row */}
                    <div 
                      className={`flex items-center justify-between p-4 transition-colors ${
                        viewMode === 'date-wise' 
                          ? 'cursor-pointer hover:bg-muted/50' 
                          : 'cursor-pointer hover:bg-muted/50'
                      }`}
                      onClick={() => toggleRowExpansion(group.key)}
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{group.key}</h3>
                        <p className="text-sm text-muted-foreground">
                          {group.sessions} session{group.sessions !== 1 ? 's' : ''} • {group.attempted} questions
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">Attempted</div>
                          <div className="font-semibold">{group.attempted}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">Correct</div>
                          <div className="font-semibold text-chart-correct">{group.correct}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">Incorrect</div>
                          <div className="font-semibold text-chart-wrong">{group.incorrect}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">Accuracy</div>
                          <div className="font-semibold text-chart-accent">{group.accuracy.toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details - Only for Date-wise */}
                    {viewMode === 'date-wise' && expandedRows.has(group.key) && (
                      <div className="border-t border-border bg-muted/20 p-4">
                        <div className="space-y-3">
                          {group.revisions.map((revision, index) => (
                            <div key={index} className="bg-background rounded-lg p-4 border border-border">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-chart-accent" />
                                  <span className="font-medium">{revision.date}</span>
                                   <span className="text-sm text-muted-foreground">• {revision.subject}</span>
                                   <span className="text-sm text-muted-foreground">• {revision.type || 'Other'}</span>
                                </div>
                                <div className="text-sm font-bold text-chart-accent bg-chart-accent/10 px-3 py-1 rounded-full">
                                  {((revision.numCorrect / revision.numQuestions) * 100).toFixed(1)}%
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                                <div className="text-center p-2 bg-muted/30 rounded-lg">
                                  <div className="text-muted-foreground text-xs uppercase tracking-wide">Total</div>
                                  <div className="font-semibold">{revision.numQuestions}</div>
                                </div>
                                <div className="text-center p-2 bg-chart-correct/10 rounded-lg">
                                  <div className="text-muted-foreground text-xs uppercase tracking-wide">Correct</div>
                                  <div className="font-semibold text-chart-correct">{revision.numCorrect}</div>
                                </div>
                                <div className="text-center p-2 bg-chart-wrong/10 rounded-lg">
                                  <div className="text-muted-foreground text-xs uppercase tracking-wide">Wrong</div>
                                  <div className="font-semibold text-chart-wrong">{revision.numQuestions - revision.numCorrect}</div>
                                </div>
                              </div>

                              {revision.remarks && (
                                <div className="text-sm text-muted-foreground border-l-2 border-chart-accent pl-3 bg-muted/20 rounded-r-lg py-2">
                                  <div className="text-xs uppercase tracking-wide mb-1">Remarks</div>
                                  <div>{revision.remarks}</div>
                                </div>
                              )}

                              {revision.weakTopics && (
                                <div className="text-sm text-muted-foreground border-l-2 border-chart-wrong pl-3 bg-chart-wrong/5 rounded-r-lg py-2 mt-2">
                                  <div className="text-xs uppercase tracking-wide mb-1">Weak Topics</div>
                                  <div>{revision.weakTopics}</div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DetailView;