// Chart utility functions for GATE CSE 2025 Revision Tracker

// =================================================================
// 1. SINGLE SOURCE OF TRUTH FOR TYPE DEFINITIONS
// =================================================================

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
  date: string; // This will be the day, week, or month key
  totalQuestions: number;
  totalCorrect: number;
}

// =================================================================
// 2. SUBJECT ANALYSIS FUNCTIONS
// =================================================================

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
        backgroundColor: 'hsl(166, 64%, 48%)',
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Incorrect Answers',
        data: wrongData,
        backgroundColor: 'hsl(9, 100%, 70%)',
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
      x: { stacked: true, beginAtZero: true },
      y: { stacked: true, type: 'category' as const },
    },
    plugins: {
      tooltip: {
        callbacks: {
          title: (context: any) => `📘 Subject: ${context[0].label}`,
          label: (context: any) => {
            const subjectName = context.label;
            const stats = subjectAnalysis[subjectName];
            if (!stats) return [];
            const { totalCorrect, totalQuestions } = stats;
            const wrong = totalQuestions - totalCorrect;
            const accuracy = ((totalCorrect / totalQuestions) * 100).toFixed(1);
            return [
              `✅ Correct Answers: ${totalCorrect}`,
              `❌ Incorrect Answers: ${wrong}`,
              `📈 Accuracy: ${accuracy}%`
            ];
          },
        }
      }
    },
  };

  return { data, options };
};

// =================================================================
// 3. TYPE ANALYSIS FUNCTIONS
// =================================================================

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
        backgroundColor: 'hsl(166, 64%, 48%)',
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Incorrect Answers',
        data: wrongData,
        backgroundColor: 'hsl(9, 100%, 70%)',
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
      x: { stacked: true, beginAtZero: true },
      y: { stacked: true, type: 'category' as const },
    },
     plugins: {
      tooltip: {
        callbacks: {
          title: (context: any) => `📚 Type: ${context[0].label}`,
          label: (context: any) => {
            const typeName = context.label;
            const stats = typeAnalysis[typeName];
            if (!stats) return [];
            const { totalCorrect, totalQuestions } = stats;
            const wrong = totalQuestions - totalCorrect;
            const accuracy = ((totalCorrect / totalQuestions) * 100).toFixed(1);
            return [
              `✅ Correct: ${correct}`,
              `❌ Incorrect: ${wrong}`,
              `📈 Accuracy: ${accuracy}%`
            ];
          },
        }
      }
    },
  };

  return { data, options };
};


// =================================================================
// 4. PROGRESS TRACKING FUNCTIONS
// =================================================================

// <-- FIX: All duplicate type definitions that were here have been removed.
// We now use the main `RevisionData` and `ProgressData` interfaces from the top of the file.

const getWeekNumber = (d: Date): number => {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export const processProgressData = (
  revisions: RevisionData[],
  fmt: RevisionData[], // <-- FIX: Changed to use the main RevisionData interface
  timeframe: 'daily' | 'weekly' | 'monthly'
): ProgressData[] => {
  // Combine both data sources into a single array
  const allEntries = [...revisions, ...fmt];

  const progressMap = new Map<string, { totalQuestions: number; totalCorrect: number }>();

  allEntries.forEach(entry => {
    let key: string;
    const date = new Date(entry.date);
    
    if (timeframe === 'daily') {
      key = entry.date;
    } else if (timeframe === 'weekly') {
      const year = date.getFullYear();
      const week = getWeekNumber(date);
      key = `${year}-W${week.toString().padStart(2, '0')}`;
    } else { // monthly
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      key = `${year}-${month.toString().padStart(2, '0')}`;
    }

    if (!progressMap.has(key)) {
      progressMap.set(key, { totalQuestions: 0, totalCorrect: 0 });
    }

    const existing = progressMap.get(key)!;
    existing.totalQuestions += entry.numQuestions;
    existing.totalCorrect += entry.numCorrect;
  });

  return Array.from(progressMap.entries())
    .map(([date, data]) => ({
      date,
      totalQuestions: data.totalQuestions,
      totalCorrect: data.totalCorrect,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

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
        backgroundColor: 'rgba(0, 105, 217, 0.6)',
        borderColor: '#0069d9',
        borderWidth: 3,
        pointRadius: 5,
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Correct Answers',
        data: correctData,
        backgroundColor: 'rgba(32, 201, 151, 0.6)',
        borderColor: '#20c997',
        borderWidth: 3,
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
  };

  return { data, options };
};


// =================================================================
// 5. TIME ANALYSIS FUNCTIONS
// =================================================================

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
      // Calculate efficiency in questions per hour
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
        backgroundColor: 'hsl(267, 57%, 67%)',
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
      x: { beginAtZero: true },
      y: { type: 'category' as const },
    },
     plugins: {
      tooltip: {
        callbacks: {
          title: (context: any) => `⏱️ Subject: ${context[0].label}`,
          label: (context: any) => {
            const subjectName = context.label;
            const stats = timeAnalysis[subjectName];
            if (!stats) return [];
            const { totalTimeMinutes, totalQuestions, efficiency } = stats;
            return [
              `⏰ Time Spent: ${totalTimeMinutes} minutes`,
              `❓ Questions Attempted: ${totalQuestions}`,
              `⚡ Efficiency: ${efficiency.toFixed(1)} questions/hour`
            ];
          },
        }
      }
    },
  };

  return { data, options };
};
