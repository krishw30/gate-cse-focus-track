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
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface RevisionData {
  date: string;
  subject: string;
  numQuestions: number;
  numCorrect: number;
  remarks: string;
}

const Analysis = () => {
  const [revisions, setRevisions] = useState<RevisionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRevisions = async () => {
      try {
        const q = query(collection(db, "revisions"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => doc.data() as RevisionData);
        setRevisions(data);
      } catch (error) {
        console.error("Error fetching revisions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRevisions();
  }, []);

  // Subject-wise analysis
  const subjectAnalysis = revisions.reduce((acc, revision) => {
    if (!acc[revision.subject]) {
      acc[revision.subject] = { total: 0, correct: 0, attempts: 0 };
    }
    acc[revision.subject].total += revision.numQuestions;
    acc[revision.subject].correct += revision.numCorrect;
    acc[revision.subject].attempts += 1;
    return acc;
  }, {} as Record<string, { total: number; correct: number; attempts: number }>);

  const subjectNames = Object.keys(subjectAnalysis);
  const subjectAccuracy = subjectNames.map(subject => 
    ((subjectAnalysis[subject].correct / subjectAnalysis[subject].total) * 100).toFixed(1)
  );
  const subjectAttempts = subjectNames.map(subject => subjectAnalysis[subject].attempts);

  // Daily progress analysis
  const dailyProgress = revisions.reduce((acc, revision) => {
    if (!acc[revision.date]) {
      acc[revision.date] = { total: 0, correct: 0 };
    }
    acc[revision.date].total += revision.numQuestions;
    acc[revision.date].correct += revision.numCorrect;
    return acc;
  }, {} as Record<string, { total: number; correct: number }>);

  const dates = Object.keys(dailyProgress).sort();
  const dailyTotalQuestions = dates.map(date => dailyProgress[date].total);
  const dailyCorrectAnswers = dates.map(date => dailyProgress[date].correct);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">Loading analysis...</div>
      </div>
    );
  }

  if (revisions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">Analysis</h1>
        <div className="text-center text-muted-foreground">
          No revision data available. Add some revisions to see analysis.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Analysis Dashboard</h1>
      
      <Tabs defaultValue="subjects" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="subjects">Subject Analysis</TabsTrigger>
          <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Subject-wise Accuracy</CardTitle>
                <CardDescription>Accuracy percentage by subject</CardDescription>
              </CardHeader>
              <CardContent>
                <Bar
                  data={{
                    labels: subjectNames,
                    datasets: [
                      {
                        label: 'Accuracy (%)',
                        data: subjectAccuracy,
                        backgroundColor: 'hsl(var(--primary))',
                        borderColor: 'hsl(var(--primary))',
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    ...chartOptions,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                      },
                    },
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subject-wise Attempts</CardTitle>
                <CardDescription>Number of attempts per subject</CardDescription>
              </CardHeader>
              <CardContent>
                <Pie
                  data={{
                    labels: subjectNames,
                    datasets: [
                      {
                        data: subjectAttempts,
                        backgroundColor: [
                          'hsl(var(--primary))',
                          'hsl(var(--secondary))',
                          'hsl(var(--accent))',
                          'hsl(var(--muted))',
                          '#FF6384',
                          '#36A2EB',
                          '#FFCE56',
                          '#4BC0C0',
                          '#9966FF',
                          '#FF9F40',
                          '#FF6384',
                          '#C9CBCF'
                        ],
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={chartOptions}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Daily Progress</CardTitle>
              <CardDescription>Questions attempted vs correct answers over time</CardDescription>
            </CardHeader>
            <CardContent>
              <Line
                data={{
                  labels: dates,
                  datasets: [
                    {
                      label: 'Total Questions',
                      data: dailyTotalQuestions,
                      borderColor: 'hsl(var(--primary))',
                      backgroundColor: 'hsl(var(--primary) / 0.1)',
                      tension: 0.1,
                    },
                    {
                      label: 'Correct Answers',
                      data: dailyCorrectAnswers,
                      borderColor: 'hsl(var(--secondary))',
                      backgroundColor: 'hsl(var(--secondary) / 0.1)',
                      tension: 0.1,
                    },
                  ],
                }}
                options={{
                  ...chartOptions,
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revisions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revisions.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revisions.reduce((sum, r) => sum + r.numQuestions, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((revisions.reduce((sum, r) => sum + r.numCorrect, 0) / 
                 revisions.reduce((sum, r) => sum + r.numQuestions, 0)) * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analysis;