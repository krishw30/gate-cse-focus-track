import { useState, useEffect, useMemo } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { MockTestData } from "@/lib/chartUtils";
import { aggregateMockSubjects, computeMockOverview, computeMockProgress, identifyWeakSubjects } from "@/lib/combinedDataUtils";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const MockAnalysis = () => {
  const [mocks, setMocks] = useState<MockTestData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview'|'subjects'|'progress'|'tests'>('overview');
  const { toast } = useToast();

  useEffect(() => {
    const fetchMocks = async () => {
      try {
        setIsLoading(true);
        const q = query(collection(db, "mockTest"), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => {
          const obj = d.data() as any;
          // defensive mapping: ensure numeric fields are numbers and subjectDetails is array
          return {
            date: obj.date ?? "",
            provider: obj.provider ?? "",
            testType: obj.testType ?? obj.test_type ?? obj.testtype ?? "FMT",
            testName: obj.testName ?? obj.test_name ?? obj.name ?? "",
            totalScore: Number(obj.totalScore ?? obj.total_score ?? obj.score ?? 0),
            totalMarks: Number(obj.totalMarks ?? obj.total_marks ?? 0),
            totalQuestions: Number(obj.totalQuestions ?? obj.total_questions ?? 0),
            totalCorrect: Number(obj.totalCorrect ?? obj.total_correct ?? 0),
            totalIncorrect: Number(obj.totalIncorrect ?? obj.total_incorrect ?? 0),
            subjectDetails: Array.isArray(obj.subjectDetails) ? obj.subjectDetails : (obj.subject_details && Array.isArray(obj.subject_details) ? obj.subject_details : []),
            sillyMistakes: obj.sillyMistakes ?? obj.silly_mistakes ?? obj.silly ?? ""
          } as MockTestData;
        });
        setMocks(data);
      } catch (e) {
        console.error(e);
        toast({ title: "Error", description: "Failed to load mock tests", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchMocks();
  }, [toast]);

  const overview = useMemo(() => computeMockOverview(mocks), [mocks]);
  const aggregatedSubjects = useMemo(() => aggregateMockSubjects(mocks), [mocks]);
  const weakSubjects = useMemo(() => identifyWeakSubjects(aggregatedSubjects, { accuracyThreshold: 70, minAttempts: 2, topN: 8 }), [aggregatedSubjects]);
  const progress = useMemo(() => computeMockProgress(mocks), [mocks]);

  // Subject chart (horizontal stacked)
  const subjectLabels = aggregatedSubjects.map(s => s.subject);
  const subjectCorrect = aggregatedSubjects.map(s => Math.round(s.totalCorrect));
  const subjectWrong = aggregatedSubjects.map(s => Math.round(s.totalWrong));
  const subjectData = {
    labels: subjectLabels,
    datasets: [
      { label: "Correct", data: subjectCorrect, backgroundColor: "hsl(166,64%,48%)" },
      { label: "Wrong", data: subjectWrong, backgroundColor: "hsl(9,100%,70%)" }
    ]
  };
  const maxSubjectVal = Math.max(...subjectCorrect, ...subjectWrong, 1);
  const subjectOptions = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" as const } },
    scales: {
      x: { stacked: true, beginAtZero: true, suggestedMax: Math.ceil(maxSubjectVal * 1.2) },
      y: { stacked: true }
    }
  };

  // Progress chart (line)
  const progLabels = progress.map(p => p.date || "");
  const progQuestions = progress.map(p => p.totalQuestions);
  const progCorrect = progress.map(p => p.totalCorrect);
  const progressData = {
    labels: progLabels,
    datasets: [
      { label: "Total Questions", data: progQuestions, borderColor: "#0069d9", backgroundColor: "rgba(0,105,217,0.12)", tension: 0.3, fill: true },
      { label: "Correct", data: progCorrect, borderColor: "#20c997", backgroundColor: "rgba(32,201,151,0.12)", tension: 0.3, fill: true }
    ]
  };
  const maxProgressVal = Math.max(...progQuestions, ...progCorrect, 1);
  const progressOptions = { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, suggestedMax: Math.ceil(maxProgressVal * 1.2) } } };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[320px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading mock analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Mock Test Analysis</h1>
        <div className="flex gap-3 items-center">
          <Badge variant="secondary" className="text-sm">{mocks.length} mock(s)</Badge>
          <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <div className="flex items-center justify-between">
          <TabsList className="grid grid-cols-4 gap-2 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="tests">Logged Tests</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Card><CardHeader><CardTitle>Total Mocks</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{overview.totalMocks}</div></CardContent></Card>
            <Card><CardHeader><CardTitle>Total Questions</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{overview.totalQuestions}</div></CardContent></Card>
            <Card><CardHeader><CardTitle>Overall Accuracy</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{overview.overallAccuracy.toFixed(1)}%</div></CardContent></Card>
            <Card><CardHeader><CardTitle>Avg Score / Mock</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{overview.avgScorePerMock !== null ? overview.avgScorePerMock.toFixed(1) : "—"}</div></CardContent></Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Subject summary (top subjects)</CardTitle><CardDescription>Quick glance at aggregated subject performance</CardDescription></CardHeader>
              <CardContent>
                {aggregatedSubjects.length === 0 ? (
                  <div className="p-6 text-sm text-muted-foreground">No subject breakdown available. Ensure subjectDetails are saved with each mock.</div>
                ) : (
                  <div style={{ minHeight: 360 }}>
                    <Bar data={subjectData} options={subjectOptions} />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Weak Subjects</CardTitle><CardDescription>Subjects flagged for focused practice</CardDescription></CardHeader>
              <CardContent>
                {weakSubjects.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No weak subjects detected — great!</div>
                ) : (
                  <div className="space-y-3">
                    {weakSubjects.map(s => (
                      <div key={s.subject} className="p-3 rounded-lg border-l-4" style={{ borderLeftColor: 'hsl(9,100%,70%)' }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{s.subject}</div>
                            <div className="text-xs text-muted-foreground">{s.attempts} mock(s) • {s.totalQuestions} q</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">{s.accuracy.toFixed(1)}%</div>
                            <div className="text-xs text-muted-foreground">Accuracy</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subjects">
          <Card>
            <CardHeader><CardTitle>Subject-wise Details</CardTitle><CardDescription>Table with totals (correct / wrong / unattempted) per subject — includes marks summary when available</CardDescription></CardHeader>
            <CardContent>
              {aggregatedSubjects.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">No subject data available.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground">
                        <th>Subject</th>
                        <th className="text-center">Correct</th>
                        <th className="text-center">Wrong</th>
                        <th className="text-center">Unattempted</th>
                        <th className="text-center">Total Qs</th>

                        {/* NEW: marks columns */}
                        <th className="text-center">Total Marks (sum)</th>
                        <th className="text-center">Gained (sum)</th>
                        <th className="text-center">Lost (sum)</th>
                        <th className="text-center">Avg Score</th>

                        <th className="text-center">Accuracy</th>
                        <th className="text-center">Mocks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aggregatedSubjects.map(s => (
                        <tr key={s.subject} className="border-t">
                          <td className="py-2 font-medium">{s.subject}</td>
                          <td className="py-2 text-center text-chart-correct">{s.totalCorrect}</td>
                          <td className="py-2 text-center text-chart-wrong">{s.totalWrong}</td>
                          <td className="py-2 text-center">{s.totalUnattempted}</td>
                          <td className="py-2 text-center">{s.totalQuestions}</td>

                          {/* marks */}
                          <td className="py-2 text-center">{s.totalMarksSum > 0 ? s.totalMarksSum : '—'}</td>
                          <td className="py-2 text-center">{s.totalGainedMarks > 0 ? s.totalGainedMarks : '—'}</td>
                          <td className="py-2 text-center">{s.totalLostMarks !== 0 ? s.totalLostMarks : '—'}</td>
                          <td className="py-2 text-center font-semibold">{s.attempts > 0 ? s.avgScore.toFixed(2) : '—'}</td>

                          <td className="py-2 text-center font-semibold">{s.accuracy.toFixed(1)}%</td>
                          <td className="py-2 text-center">{s.attempts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardHeader><CardTitle>Progress Over Time (Mocks)</CardTitle><CardDescription>Questions attempted and correct per mock date</CardDescription></CardHeader>
            <CardContent>
              {progress.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">No progress data available — ensure mock tests are logged with a date.</div>
              ) : (
                <div style={{ minHeight: 360 }}>
                  <Line data={progressData} options={progressOptions} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests">
          <Card>
            <CardHeader><CardTitle>Logged Mocks</CardTitle><CardDescription>Full list of logged mocks — view subject breakdown per test</CardDescription></CardHeader>
            <CardContent>
              {mocks.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">No mock tests logged.</div>
              ) : (
                <div className="space-y-3">
                  {mocks.map((m, idx) => (
                    <div key={idx} className="p-3 rounded-lg border hover:shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{m.testName || `${m.provider} - ${m.testType}`}</div>
                          <div className="text-xs text-muted-foreground">{m.provider} • {m.date}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">{m.totalCorrect}/{m.totalQuestions}</div>
                          <div className="text-xs text-muted-foreground">{m.totalQuestions > 0 ? ((m.totalCorrect / m.totalQuestions)*100).toFixed(1) + "%" : "—"}</div>
                        </div>
                      </div>

                      <details className="mt-2 text-sm">
                        <summary className="cursor-pointer text-xs text-muted-foreground">View subject breakdown</summary>
                        <div className="mt-2 overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-xs text-muted-foreground">
                                <th>Subject</th><th className="text-center">Correct</th><th className="text-center">Wrong</th><th className="text-center">Unatt.</th><th className="text-center">Accuracy</th>

                                {/* NEW: marks columns in per-test breakdown */}
                                <th className="text-center">Total Marks</th>
                                <th className="text-center">Gained Marks</th>
                                <th className="text-center">Lost Marks</th>
                                <th className="text-center">Score</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(m.subjectDetails || []).map((s, i) => {
                                const attempted = Number(s.correct || 0) + Number(s.wrong || 0);
                                const acc = attempted > 0 ? ((Number(s.correct || 0) / attempted) * 100).toFixed(1) : "—";
                                return (
                                  <tr key={i} className="border-t">
                                    <td className="py-2">{s.subject}</td>
                                    <td className="py-2 text-center text-chart-correct">{s.correct}</td>
                                    <td className="py-2 text-center text-chart-wrong">{s.wrong}</td>
                                    <td className="py-2 text-center">{s.unattempted}</td>

                                    {/* NEW: show marks fields if provided */}
                                    <td className="py-2 text-center">{(s.totalMarks !== undefined) ? s.totalMarks : '—'}</td>
                                    <td className="py-2 text-center">{(s.gainedMarks !== undefined) ? s.gainedMarks : '—'}</td>
                                    <td className="py-2 text-center">{(s.lostMarks !== undefined) ? s.lostMarks : '—'}</td>
                                    <td className="py-2 text-center">{(s.score !== undefined) ? s.score : '—'}</td>

                                    <td className="py-2 text-center">{acc}%</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MockAnalysis;
