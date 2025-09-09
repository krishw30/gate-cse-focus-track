// Chart utility functions for GATE CSE 2025 Revision Tracker

export interface RevisionData {
  date: string;
  subject: string;
  numQuestions: number;
  numCorrect: number;
  type: "DPP" | "PYQ" | "Mock Test" | "Other";
  remarks: string;
  timeSpentMinutes?: number;
  weakTopics?: string;
}

export interface SubjectAnalysis {
  [subject: string]: {
    totalCorrect: number;
    totalQuestions: number;
    attempts: number;
    accuracy: number;
  };
}

export interface ProgressData {
  date: string;
  totalQuestions: number;
  totalCorrect: number;
}

// Process revisions data for subject analysis
export const processSubjectAnalysis = (revisions: RevisionData[]): SubjectAnalysis => {
  return revisions.reduce((acc, revision) => {
    if (!acc[revision.subject]) {
      acc[revision.subject] = {
        totalCorrect: 0,
        totalQuestions: 0,
        attempts: 0,
        accuracy: 0,
      };
    }
    
    acc[revision.subject].totalCorrect += revision.numCorrect;
    acc[revision.subject].totalQuestions += revision.numQuestions;
    acc[revision.subject].attempts += 1;
    acc[revision.subject].accuracy = 
      (acc[revision.subject].totalCorrect / acc[revision.subject].totalQuestions) * 100;
    
    return acc;
  }, {} as SubjectAnalysis);
};

// Build stacked horizontal bar chart for subjects
export const buildSubjectChart = (subjectAnalysis: SubjectAnalysis) => {
  // Sort subjects alphabetically to ensure consistent tooltip matching
  const subjects = Object.keys(subjectAnalysis).sort();
  const correctData = subjects.map(subject => subjectAnalysis[subject].totalCorrect);
  const wrongData = subjects.map(subject => 
    subjectAnalysis[subject].totalQuestions - subjectAnalysis[subject].totalCorrect
  );

  const data = {
    labels: subjects,
    datasets: [
      {
        label: 'Correct Answers',
        data: correctData,
        backgroundColor: 'hsl(166, 64%, 48%)', // #20c997 - teal
        borderColor: 'hsl(166, 64%, 38%)',
        borderWidth: 0,
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Incorrect Answers',
        data: wrongData,
        backgroundColor: 'hsl(9, 100%, 70%)', // #ff6b6b - coral
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
            // Prevent multiple tooltips by returning empty for non-first dataset
            return null;
          },
          title: function(context: any) {
            return `📘 Subject: ${context[0].label}`;
          },
          label: function(context: any) {
            // Get the subject name and find its data
            const subjectName = context.label;
            const subjectStats = Object.entries(subjectAnalysis).find(([key]) => key === subjectName);
            
            if (!subjectStats) return [];
            
            const [, stats] = subjectStats;
            const correct = stats.totalCorrect;
            const total = stats.totalQuestions;
            const wrong = total - correct;
            const accuracy = ((correct / total) * 100).toFixed(1);
            
            return [
              `✅ Correct Answers: ${correct}`,
              `❌ Incorrect Answers: ${wrong}`,
              `📈 Accuracy: ${accuracy}%`
            ];
          },
          labelColor: function(context: any) {
            // Return colors for the labels
            if (context.datasetIndex === 0) {
              return {
                borderColor: '#20c997',
                backgroundColor: '#20c997'
              };
            } else {
              return {
                borderColor: '#ff6b6b',
                backgroundColor: '#ff6b6b'
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

  return { data, options };
};

// Process revisions data for type analysis
export const processTypeAnalysis = (revisions: RevisionData[]) => {
  const typeAnalysis = revisions.reduce((acc, revision) => {
    const type = revision.type || "Other";
    if (!acc[type]) {
      acc[type] = {
        totalCorrect: 0,
        totalQuestions: 0,
        attempts: 0,
        accuracy: 0,
      };
    }
    
    acc[type].totalCorrect += revision.numCorrect;
    acc[type].totalQuestions += revision.numQuestions;
    acc[type].attempts += 1;
    acc[type].accuracy = 
      (acc[type].totalCorrect / acc[type].totalQuestions) * 100;
    
    return acc;
  }, {} as SubjectAnalysis);

  return typeAnalysis;
};

// Build stacked horizontal bar chart for types
export const buildTypeChart = (typeAnalysis: SubjectAnalysis) => {
  const types = Object.keys(typeAnalysis).sort();
  const correctData = types.map(type => typeAnalysis[type].totalCorrect);
  const wrongData = types.map(type => 
    typeAnalysis[type].totalQuestions - typeAnalysis[type].totalCorrect
  );

  const data = {
    labels: types,
    datasets: [
      {
        label: 'Correct Answers',
        data: correctData,
        backgroundColor: 'hsl(166, 64%, 48%)', // #20c997 - teal
        borderColor: 'hsl(166, 64%, 38%)',
        borderWidth: 0,
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Incorrect Answers',
        data: wrongData,
        backgroundColor: 'hsl(9, 100%, 70%)', // #ff6b6b - coral
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
          color: 'hsl(222.2, 84%, 4.9%)', // foreground
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
            return `📚 Type: ${context[0].label}`;
          },
          label: function(context: any) {
            const typeName = context.label;
            const typeStats = Object.entries(typeAnalysis).find(([key]) => key === typeName);
            
            if (!typeStats) return [];
            
            const [, stats] = typeStats;
            const correct = stats.totalCorrect;
            const total = stats.totalQuestions;
            const wrong = total - correct;
            const accuracy = ((correct / total) * 100).toFixed(1);
            
            return [
              `✅ Correct: ${correct}`,
              `❌ Incorrect: ${wrong}`,
              `📈 Accuracy: ${accuracy}%`
            ];
          },
          labelColor: function(context: any) {
            if (context.datasetIndex === 0) {
              return {
                borderColor: '#20c997',
                backgroundColor: '#20c997'
              };
            } else {
              return {
                borderColor: '#ff6b6b',
                backgroundColor: '#ff6b6b'
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

  return { data, options };
};

// Process data for progress tracking
export const processProgressData = (revisions: RevisionData[], fmt: RevisionData[], timeframe: 'daily' | 'weekly' | 'monthly'): ProgressData[] => {
  const allEntries = [...revisions, ...fmt];
  const progressMap = new Map<string, { totalQuestions: number; totalCorrect: number }>();

  allEntries.forEach((entry, index) => {
    // This 'try...catch' block makes the function crash-proof.
    try {
      // This is the normal logic we expect to run.
      let key: string;
      const date = new Date(entry.date as string);

      if (timeframe === 'daily') {
        key = entry.date as string;
      } else if (timeframe === 'weekly') {
        const year = date.getFullYear();
        const week = getWeekNumber(date);
        key = `${year}-W${week.toString().padStart(2, '0')}`;
      } else {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        key = `${year}-${month.toString().padStart(2, '0')}`;
      }

      if (!progressMap.has(key)) {
        progressMap.set(key, { totalQuestions: 0, totalCorrect: 0 });
      }

      const existing = progressMap.get(key)!;
      
      if ('numQuestions' in entry) {
        existing.totalQuestions += entry.numQuestions;
        existing.totalCorrect += entry.numCorrect;
      } else if ('correct' in entry) {
        existing.totalQuestions += (entry.correct + entry.incorrect);
        existing.totalCorrect += entry.correct;
      }

    } catch (error) {
      // If any error occurs above, this block runs instead of crashing.
      console.error(`An error occurred while processing an entry at index: ${index}`);
      console.error("The problematic entry was:", entry);
      console.error("The specific error was:", error);
    }
  });

  return Array.from(progressMap.entries())
    .map(([date, data]) => ({
      date,
      totalQuestions: data.totalQuestions,
      totalCorrect: data.totalCorrect,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
};
// Build line chart for progress tracking
export const buildProgressChart = (progressData: ProgressData[]) => {
  const labels = progressData.map(item => item.date);
  const questionsData = progressData.map(item => item.totalQuestions);
  const correctData = progressData.map(item => item.totalCorrect);

  const data = {
    labels,
    datasets: [
      {
        label: 'Total Questions',
        data: questionsData,
        backgroundColor: 'rgba(0, 105, 217, 0.6)', // Blue with opacity
        borderColor: '#0069d9',
        borderWidth: 3,
        pointBackgroundColor: '#0069d9',
        pointBorderColor: 'hsl(0 0% 100%)',
        pointBorderWidth: 2,
        pointRadius: 5,
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Correct Answers',
        data: correctData,
        backgroundColor: 'rgba(32, 201, 151, 0.6)', // Teal with opacity
        borderColor: '#20c997',
        borderWidth: 3,
        pointBackgroundColor: '#20c997',
        pointBorderColor: 'hsl(0 0% 100%)',
        pointBorderWidth: 2,
        pointRadius: 5,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            family: 'system-ui',
            weight: 500,
          },
          color: 'hsl(222.2 84% 4.9%)',
        },
      },
      tooltip: {
        backgroundColor: 'hsl(0 0% 100%)',
        titleColor: 'hsl(222.2 84% 4.9%)',
        bodyColor: 'hsl(222.2 84% 4.9%)',
        borderColor: 'hsl(214.3 31.8% 91.4%)',
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'hsl(214.3 31.8% 91.4% / 0.5)',
        },
        ticks: {
          color: 'hsl(215.4 16.3% 46.9%)',
          font: {
            family: 'system-ui',
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'hsl(214.3 31.8% 91.4% / 0.5)',
        },
        ticks: {
          color: 'hsl(215.4 16.3% 46.9%)',
          font: {
            family: 'system-ui',
          },
        },
      },
    },
  };

  return { data, options };
};

// Process revisions data for time analysis
export const processTimeAnalysis = (revisions: RevisionData[]) => {
  const timeAnalysis = revisions
    .filter(revision => revision.timeSpentMinutes && revision.timeSpentMinutes > 0)
    .reduce((acc, revision) => {
      if (!acc[revision.subject]) {
        acc[revision.subject] = {
          totalTimeMinutes: 0,
          totalQuestions: 0,
          attempts: 0,
          efficiency: 0,
        };
      }
      
      acc[revision.subject].totalTimeMinutes += revision.timeSpentMinutes!;
      acc[revision.subject].totalQuestions += revision.numQuestions;
      acc[revision.subject].attempts += 1;
      acc[revision.subject].efficiency = 
        acc[revision.subject].totalQuestions / (acc[revision.subject].totalTimeMinutes / 60);
      
      return acc;
    }, {} as Record<string, { totalTimeMinutes: number; totalQuestions: number; attempts: number; efficiency: number }>);

  return timeAnalysis;
};

// Build horizontal bar chart for time analysis
export const buildTimeChart = (timeAnalysis: Record<string, any>) => {
  const subjects = Object.keys(timeAnalysis).sort();
  const timeData = subjects.map(subject => timeAnalysis[subject].totalTimeMinutes);

  const data = {
    labels: subjects,
    datasets: [
      {
        label: 'Time Spent (minutes)',
        data: timeData,
        backgroundColor: 'hsl(267, 57%, 67%)', // chart-purple
        borderColor: 'hsl(267, 57%, 57%)',
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
          color: 'hsl(222.2, 84%, 4.9%)', // foreground
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
          title: function(context: any) {
            return `⏱️ Subject: ${context[0].label}`;
          },
          label: function(context: any) {
            const subjectName = context.label;
            const subjectStats = timeAnalysis[subjectName];
            
            if (!subjectStats) return [];
            
            const timeMinutes = subjectStats.totalTimeMinutes;
            const questions = subjectStats.totalQuestions;
            const efficiency = subjectStats.efficiency.toFixed(1);
            
            return [
              `⏰ Time Spent: ${timeMinutes} minutes`,
              `❓ Questions Attempted: ${questions}`,
              `⚡ Efficiency: ${efficiency} questions/hour`
            ];
          },
          labelColor: function() {
            return {
              borderColor: '#6f42c1',
              backgroundColor: '#6f42c1'
            };
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

  return { data, options };
};

// Helper function to get week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
