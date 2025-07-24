import { useState, useEffect } from "react";
import { ArrowLeft, ChevronRight, Download, Calendar, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { RevisionData } from "@/lib/chartUtils";

interface PeriodData {
  period: string;
  totalQuestions: number;
  totalCorrect: number;
  totalWrong: number;
  accuracy: number;
  revisions: RevisionData[];
}

interface SubjectData {
  subject: string;
  totalQuestions: number;
  totalCorrect: number;
  totalWrong: number;
  accuracy: number;
  revisions: RevisionData[];
}

interface DetailsPanelProps {
  revisions: RevisionData[];
}

type ViewLevel = 'periods' | 'subjects' | 'revisions';
type TimeframeType = 'daily' | 'weekly' | 'monthly';

const DetailsPanel = ({ revisions }: DetailsPanelProps) => {
  const [currentView, setCurrentView] = useState<ViewLevel>('periods');
  const [timeframe, setTimeframe] = useState<TimeframeType>('daily');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodData | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Process data based on timeframe
  const processPeriodData = (revisions: RevisionData[], timeframe: TimeframeType): PeriodData[] => {
    const periodMap = new Map<string, RevisionData[]>();

    revisions.forEach(revision => {
      let key: string;
      const date = new Date(revision.date);
      
      if (timeframe === 'daily') {
        key = revision.date;
      } else if (timeframe === 'weekly') {
        const year = date.getFullYear();
        const week = getWeekNumber(date);
        key = `${year}-W${week.toString().padStart(2, '0')}`;
      } else {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        key = `${year}-${month.toString().padStart(2, '0')}`;
      }

      if (!periodMap.has(key)) {
        periodMap.set(key, []);
      }
      periodMap.get(key)!.push(revision);
    });

    return Array.from(periodMap.entries())
      .map(([period, revs]) => {
        const totalQuestions = revs.reduce((sum, r) => sum + r.numQuestions, 0);
        const totalCorrect = revs.reduce((sum, r) => sum + r.numCorrect, 0);
        const totalWrong = totalQuestions - totalCorrect;
        const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
        
        return {
          period,
          totalQuestions,
          totalCorrect,
          totalWrong,
          accuracy,
          revisions: revs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        };
      })
      .sort((a, b) => b.period.localeCompare(a.period));
  };

  const processSubjectData = (revisions: RevisionData[]): SubjectData[] => {
    const subjectMap = new Map<string, RevisionData[]>();

    revisions.forEach(revision => {
      if (!subjectMap.has(revision.subject)) {
        subjectMap.set(revision.subject, []);
      }
      subjectMap.get(revision.subject)!.push(revision);
    });

    return Array.from(subjectMap.entries())
      .map(([subject, revs]) => {
        const totalQuestions = revs.reduce((sum, r) => sum + r.numQuestions, 0);
        const totalCorrect = revs.reduce((sum, r) => sum + r.numCorrect, 0);
        const totalWrong = totalQuestions - totalCorrect;
        const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
        
        return {
          subject,
          totalQuestions,
          totalCorrect,
          totalWrong,
          accuracy,
          revisions: revs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        };
      })
      .sort((a, b) => a.subject.localeCompare(b.subject));
  };

  const exportCSV = () => {
    let csvContent = '';
    let data: any[] = [];

    if (currentView === 'revisions' && selectedSubject) {
      csvContent = 'Date,Subject,Type,Total Questions,Correct,Wrong,Accuracy (%),Remarks\n';
      data = selectedSubject.revisions;
    } else {
      csvContent = 'Date,Subject,Type,Total Questions,Correct,Wrong,Accuracy (%),Remarks\n';
      data = revisions;
    }

    data.forEach(revision => {
      const accuracy = revision.numQuestions > 0 ? 
        ((revision.numCorrect / revision.numQuestions) * 100).toFixed(1) : '0';
      const wrong = revision.numQuestions - revision.numCorrect;
      csvContent += `${revision.date},"${revision.subject}","${revision.type || 'Other'}",${revision.numQuestions},${revision.numCorrect},${wrong},${accuracy},"${revision.remarks || ''}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revision-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const goBack = () => {
    if (currentView === 'revisions') {
      setCurrentView('subjects');
      setSelectedSubject(null);
    } else if (currentView === 'subjects') {
      setCurrentView('periods');
      setSelectedPeriod(null);
    }
  };

  const periodData = processPeriodData(revisions, timeframe);
  const subjectData = selectedPeriod ? processSubjectData(selectedPeriod.revisions) : [];

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BarChart3 className="h-4 w-4" />
          Details ⤵︎
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-w-[420px] ml-auto h-full">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            {currentView !== 'periods' && (
              <Button variant="ghost" size="sm" onClick={goBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <DrawerTitle className="flex-1 text-center">
              {currentView === 'periods' && 'Choose Period'}
              {currentView === 'subjects' && `Subjects in ${selectedPeriod?.period}`}
              {currentView === 'revisions' && `${selectedSubject?.subject} Details`}
            </DrawerTitle>
            <Button variant="ghost" size="sm" onClick={exportCSV} className="gap-2">
              <Download className="h-4 w-4" />
              CSV
            </Button>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-auto p-4">
          {/* Level 1: Choose Period */}
          {currentView === 'periods' && (
            <div className="space-y-4">
              <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as TimeframeType)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-2">
                {periodData.map((period) => (
                  <Card 
                    key={period.period} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setSelectedPeriod(period);
                      setCurrentView('subjects');
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{period.period}</div>
                          <div className="text-sm text-muted-foreground">
                            {period.totalQuestions} questions • {period.accuracy.toFixed(1)}% accuracy
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right text-sm">
                            <div className="text-green-600 font-medium">{period.totalCorrect}</div>
                            <div className="text-red-500">{period.totalWrong}</div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Level 2: Subjects in Selected Period */}
          {currentView === 'subjects' && selectedPeriod && (
            <div className="space-y-2">
              {subjectData.map((subject) => (
                <Card 
                  key={subject.subject} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    setSelectedSubject(subject);
                    setCurrentView('revisions');
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{subject.subject}</div>
                        <div className="text-sm text-muted-foreground">
                          {subject.totalQuestions} questions • {subject.accuracy.toFixed(1)}% accuracy
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right text-sm">
                          <div className="text-green-600 font-medium">{subject.totalCorrect}</div>
                          <div className="text-red-500">{subject.totalWrong}</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Level 3: Revisions Under Subject */}
          {currentView === 'revisions' && selectedSubject && (
            <div className="space-y-2">
              {selectedSubject.revisions.map((revision, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{revision.date}</span>
                        </div>
                        <div className="text-sm font-medium">
                          {((revision.numCorrect / revision.numQuestions) * 100).toFixed(1)}%
                        </div>
                      </div>
                       <div className="grid grid-cols-4 gap-4 text-sm">
                         <div>
                           <div className="text-muted-foreground">Type</div>
                           <div className="font-medium">{revision.type || "Other"}</div>
                         </div>
                         <div>
                           <div className="text-muted-foreground">Total</div>
                           <div className="font-medium">{revision.numQuestions}</div>
                         </div>
                         <div>
                           <div className="text-muted-foreground">Correct</div>
                           <div className="font-medium text-green-600">{revision.numCorrect}</div>
                         </div>
                         <div>
                           <div className="text-muted-foreground">Wrong</div>
                           <div className="font-medium text-red-500">{revision.numQuestions - revision.numCorrect}</div>
                         </div>
                        </div>
                        
                        {/* Time Spent and Efficiency */}
                        <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
                          <div>
                            <div className="text-muted-foreground">Time Spent</div>
                            <div className="font-medium">
                              {revision.timeSpentMinutes && revision.timeSpentMinutes > 0 
                                ? `${revision.timeSpentMinutes} minutes` 
                                : "—"}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Efficiency</div>
                            <div className="font-medium">
                              {revision.timeSpentMinutes && revision.timeSpentMinutes > 0 
                                ? `${(revision.numQuestions / (revision.timeSpentMinutes / 60)).toFixed(1)} q/hr`
                                : "—"}
                            </div>
                          </div>
                        </div>
                        
                       {revision.remarks && (
                         <div className="text-sm text-muted-foreground border-l-2 border-muted pl-2 mt-2">
                           {revision.remarks}
                         </div>
                       )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

// Helper function for week calculation
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export default DetailsPanel;