// Chart utility functions for GATE CSE 2025 Revision Tracker

export interface RevisionData {
  date: string;
  subject: string;
  numQuestions: number;
  numCorrect: number;
  remarks: string;
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
        backgroundColor: '#20c997', // Vibrant teal
        borderColor: '#20c997',
        borderWidth: 1,
      },
      {
        label: 'Wrong Answers',
        data: wrongData,
        backgroundColor: '#ff6b6b', // Vibrant coral
        borderColor: '#ff6b6b',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    interaction: {
      mode: 'nearest' as const,
      axis: 'y' as const,
      intersect: true,
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
      y: {
        type: 'category' as const,
        stacked: true,
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

// Process data for progress tracking
export const processProgressData = (revisions: RevisionData[], timeframe: 'daily' | 'weekly' | 'monthly'): ProgressData[] => {
  const progressMap = new Map<string, { totalQuestions: number; totalCorrect: number }>();

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

    if (!progressMap.has(key)) {
      progressMap.set(key, { totalQuestions: 0, totalCorrect: 0 });
    }

    const existing = progressMap.get(key)!;
    existing.totalQuestions += revision.numQuestions;
    existing.totalCorrect += revision.numCorrect;
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

// Helper function to get week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}