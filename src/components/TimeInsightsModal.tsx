import { useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RevisionData } from "@/lib/chartUtils";

interface TimeInsightsModalProps {
  revisions: RevisionData[];
}

interface TimeData {
  subject: string;
  totalTimeMinutes: number;
  totalQuestions: number;
  efficiency: number;
}

type TimeframeType = 'daily' | 'weekly' | 'monthly';

const TimeInsightsModal = ({ revisions }: TimeInsightsModalProps) => {
  const [timeframe, setTimeframe] = useState<TimeframeType>('daily');

  // Filter revisions that have time data
  const revisionsWithTime = revisions.filter(revision => 
    revision.timeSpentMinutes && revision.timeSpentMinutes > 0
  );

  // Process data by timeframe
  const processTimeData = (timeframe: TimeframeType): TimeData[] => {
    const timeMap = new Map<string, { totalTime: number; totalQuestions: number; revisions: RevisionData[] }>();

    // Group revisions by timeframe
    const groupedRevisions = new Map<string, RevisionData[]>();
    
    revisionsWithTime.forEach(revision => {
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

      if (!groupedRevisions.has(key)) {
        groupedRevisions.set(key, []);
      }
      groupedRevisions.get(key)!.push(revision);
    });

    // Now process by subject within each timeframe and aggregate
    const subjectMap = new Map<string, { totalTime: number; totalQuestions: number }>();

    groupedRevisions.forEach(periodRevisions => {
      periodRevisions.forEach(revision => {
        const subject = revision.subject;
        if (!subjectMap.has(subject)) {
          subjectMap.set(subject, { totalTime: 0, totalQuestions: 0 });
        }
        const current = subjectMap.get(subject)!;
        current.totalTime += revision.timeSpentMinutes!;
        current.totalQuestions += revision.numQuestions;
      });
    });

    return Array.from(subjectMap.entries())
      .map(([subject, data]) => ({
        subject,
        totalTimeMinutes: data.totalTime,
        totalQuestions: data.totalQuestions,
        efficiency: data.totalQuestions / (data.totalTime / 60), // questions per hour
      }))
      .sort((a, b) => b.totalTimeMinutes - a.totalTimeMinutes);
  };

  const timeData = processTimeData(timeframe);

  const formatTime = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
    return `${minutes} mins`;
  };

  const getTotalStats = () => {
    const totalTime = timeData.reduce((sum, item) => sum + item.totalTimeMinutes, 0);
    const totalQuestions = timeData.reduce((sum, item) => sum + item.totalQuestions, 0);
    const avgEfficiency = totalQuestions > 0 ? totalQuestions / (totalTime / 60) : 0;
    
    return { totalTime, totalQuestions, avgEfficiency };
  };

  const stats = getTotalStats();

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Clock className="h-4 w-4" />
          Total Time
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-w-[500px] ml-auto h-full">
        <DrawerHeader className="border-b">
          <DrawerTitle className="text-center">Time-Based Analysis</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-auto p-4">
          <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as TimeframeType)}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>

            <TabsContent value={timeframe} className="space-y-4">
              {/* Summary Stats */}
              <Card className="bg-muted/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Overall Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Time:</span>
                    <span className="font-medium">{formatTime(stats.totalTime)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Questions:</span>
                    <span className="font-medium">{stats.totalQuestions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg Efficiency:</span>
                    <span className="font-medium">{stats.avgEfficiency.toFixed(1)} q/hr</span>
                  </div>
                </CardContent>
              </Card>

              {/* Subject-wise Time Analysis */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground mb-3">
                  Subject-wise Breakdown ({timeframe})
                </h3>
                
                {timeData.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No time data recorded yet</p>
                      <p className="text-xs mt-1">Add revisions with time tracking to see insights</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                      <div>Subject</div>
                      <div className="text-center">Time Spent</div>
                      <div className="text-center">Questions</div>
                      <div className="text-center">Efficiency</div>
                    </div>
                    
                    {/* Data Rows */}
                    {timeData.map((item) => (
                      <Card key={item.subject} className="hover:bg-muted/50 transition-colors">
                        <CardContent className="p-3">
                          <div className="grid grid-cols-4 gap-2 text-sm">
                            <div className="font-medium truncate" title={item.subject}>
                              {item.subject}
                            </div>
                            <div className="text-center">
                              {formatTime(item.totalTimeMinutes)}
                            </div>
                            <div className="text-center">
                              {item.totalQuestions}
                            </div>
                            <div className="text-center font-medium">
                              {item.efficiency.toFixed(1)} q/hr
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
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

export default TimeInsightsModal;