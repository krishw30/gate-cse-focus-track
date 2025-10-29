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

// Calculate average questions per day
export const calculateAvgQuestions = (revisions: RevisionData[], timeframe: 'week' | 'month' | 'all') => {
  if (revisions.length === 0) return 0;

  const now = new Date();
  let filteredRevisions = revisions;
  let days = 0;

  if (timeframe === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    filteredRevisions = revisions.filter(r => new Date(r.date) >= weekAgo);
    days = 7;
  } else if (timeframe === 'month') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    filteredRevisions = revisions.filter(r => new Date(r.date) >= monthAgo);
    days = 30;
  } else {
    // All time - calculate actual days since first revision
    if (revisions.length > 0) {
      const firstDate = new Date(Math.min(...revisions.map(r => new Date(r.date).getTime())));
      days = Math.ceil((now.getTime() - firstDate.getTime()) / (24 * 60 * 60 * 1000));
    }
  }

  const totalQuestions = filteredRevisions.reduce((sum, r) => sum + r.numQuestions, 0);
  return days > 0 ? totalQuestions / days : 0;
};

// Process daily average questions data with weekly/monthly grouping
export const processDailyAvgData = (revisions: RevisionData[], timeframe: 'weekly' | 'monthly') => {
  if (revisions.length === 0) return [];

  const now = new Date();
  
  // Get earliest revision date
  const earliestDate = new Date(Math.min(...revisions.map(r => new Date(r.date).getTime())));
  
  // Create continuous timeline from earliest date to now
  const periods = new Map<string, { questions: number; correct: number; accuracy: number; avgQuestionsPerDay: number; period: string }>();
  
  // Group revisions by period
  revisions.forEach(revision => {
    const date = new Date(revision.date);
    let periodKey: string;
    let periodLabel: string;
    
    if (timeframe === 'weekly') {
      const year = date.getFullYear();
      const week = getWeekNumber(date);
      periodKey = `${year}-W${week.toString().padStart(2, '0')}`;
      periodLabel = `Week ${week} (${getWeekDateRange(year, week)})`;
    } else {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      periodKey = `${year}-${month.toString().padStart(2, '0')}`;
      periodLabel = `${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    }
    
    if (!periods.has(periodKey)) {
      periods.set(periodKey, { questions: 0, correct: 0, accuracy: 0, avgQuestionsPerDay: 0, period: periodLabel });
    }
    
    const existing = periods.get(periodKey)!;
    existing.questions += revision.numQuestions;
    existing.correct += revision.numCorrect;
  });
  
  // Fill in missing periods with 0 values
  if (timeframe === 'weekly') {
    let currentDate = new Date(earliestDate);
    while (currentDate <= now) {
      const year = currentDate.getFullYear();
      const week = getWeekNumber(currentDate);
      const periodKey = `${year}-W${week.toString().padStart(2, '0')}`;
      
      if (!periods.has(periodKey)) {
        const periodLabel = `Week ${week} (${getWeekDateRange(year, week)})`;
        periods.set(periodKey, { questions: 0, correct: 0, accuracy: 0, avgQuestionsPerDay: 0, period: periodLabel });
      }
      
      currentDate.setDate(currentDate.getDate() + 7);
    }
  } else {
    let currentDate = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
    while (currentDate <= now) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const periodKey = `${year}-${month.toString().padStart(2, '0')}`;
      
      if (!periods.has(periodKey)) {
        const periodLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        periods.set(periodKey, { questions: 0, correct: 0, accuracy: 0, avgQuestionsPerDay: 0, period: periodLabel });
      }
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  }
  
  // Calculate averages and accuracy
  periods.forEach((data, key) => {
    if (data.questions > 0) {
      data.accuracy = (data.correct / data.questions) * 100;
      
      if (timeframe === 'weekly') {
        data.avgQuestionsPerDay = data.questions / 7;
      } else {
        // Get days in the month
        const [year, month] = key.split('-');
        const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
        data.avgQuestionsPerDay = data.questions / daysInMonth;
      }
    }
  });
  
  return Array.from(periods.entries())
    .map(([key, data]) => ({
      period: key,
      periodLabel: data.period,
      questions: data.questions,
      correct: data.correct,
      accuracy: data.accuracy,
      avgQuestionsPerDay: data.avgQuestionsPerDay
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
};

// Helper function to get week date range
function getWeekDateRange(year: number, week: number): string {
  const jan1 = new Date(year, 0, 1);
  const days = (week - 1) * 7;
  const weekStart = new Date(jan1.getTime() + days * 24 * 60 * 60 * 1000);
  
  // Adjust to Monday
  const dayOfWeek = weekStart.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  weekStart.setDate(weekStart.getDate() + mondayOffset);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  return `${formatDate(weekStart)}–${formatDate(weekEnd)}`;
}

// Build daily average questions chart with proper period handling
export const buildDailyAvgChart = (periodData: Array<{ period: string; periodLabel: string; questions: number; correct: number; accuracy: number; avgQuestionsPerDay: number }>) => {
  const labels = periodData.map(item => {
    // For weekly data, show short format, for monthly show month name
    if (item.period.includes('W')) {
      const parts = item.periodLabel.match(/Week (\d+) \(([^)]+)\)/);
      return parts ? `W${parts[1]}` : item.period;
    } else {
      const date = new Date(item.period + '-01');
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
  });
  
  const avgQuestionsData = periodData.map(item => item.avgQuestionsPerDay);
  const accuracyData = periodData.map(item => item.accuracy);

  const data = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Avg Questions/Day',
        data: avgQuestionsData,
        backgroundColor: 'hsl(217, 91%, 60%)',
        borderColor: 'hsl(217, 91%, 50%)',
        borderWidth: 2,
        borderRadius: 6,
        yAxisID: 'y'
      },
      {
        type: 'line' as const,
        label: 'Accuracy %',
        data: accuracyData,
        borderColor: 'hsl(166, 64%, 48%)',
        backgroundColor: 'hsl(166, 64%, 48%)',
        borderWidth: 4,
        pointBackgroundColor: 'hsl(166, 64%, 48%)',
        pointBorderColor: 'hsl(0 0% 100%)',
        pointBorderWidth: 2,
        pointRadius: 6,
        tension: 0.4,
        yAxisID: 'y1',
        fill: false,
        order: 0 // Ensures line is drawn on top
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false
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
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Avg Questions/Day',
          color: 'hsl(215.4 16.3% 46.9%)'
        },
        grid: {
          color: 'hsl(214.3 31.8% 91.4% / 0.5)',
        },
        ticks: {
          color: 'hsl(215.4 16.3% 46.9%)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Accuracy %',
          color: 'hsl(215.4 16.3% 46.9%)'
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: 'hsl(215.4 16.3% 46.9%)',
        },
      }
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
        callbacks: {
          title: function(context: any) {
            const index = context[0].dataIndex;
            return periodData[index].periodLabel;
          },
          label: function(context: any) {
            const index = context.dataIndex;
            const item = periodData[index];
            
            if (context.dataset.label === 'Avg Questions/Day') {
              return `Avg Q/day: ${item.avgQuestionsPerDay.toFixed(1)}`;
            } else {
              return `Accuracy: ${item.accuracy.toFixed(1)}%`;
            }
          }
        }
      },
    }
  };

  return { data, options };
};

// Generate progress insights
export const generateInsights = (revisions: RevisionData[]) => {
  if (revisions.length === 0) return [];

  const insights: string[] = [];
  const now = new Date();
  
  // Sort revisions by date
  const sortedRevisions = [...revisions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Total questions milestones
  const totalQuestions = revisions.reduce((sum, r) => sum + r.numQuestions, 0);
  
  if (totalQuestions >= 1000) {
    let questionsCount = 0;
    let firstMilestone: Date | null = null;
    let secondMilestone: Date | null = null;
    
    for (const revision of sortedRevisions) {
      questionsCount += revision.numQuestions;
      
      if (questionsCount >= 1000 && !firstMilestone) {
        firstMilestone = new Date(revision.date);
      }
      if (questionsCount >= 2000 && !secondMilestone) {
        secondMilestone = new Date(revision.date);
        break;
      }
    }
    
    if (firstMilestone && secondMilestone) {
      const daysBetween = Math.ceil((secondMilestone.getTime() - firstMilestone.getTime()) / (24 * 60 * 60 * 1000));
      const firstMilestoneDays = Math.ceil((firstMilestone.getTime() - new Date(sortedRevisions[0].date).getTime()) / (24 * 60 * 60 * 1000));
      insights.push(`🎯 You reached your first 1000 questions in ${firstMilestoneDays} days, the next 1000 in ${daysBetween} days!`);
    } else if (firstMilestone) {
      const days = Math.ceil((firstMilestone.getTime() - new Date(sortedRevisions[0].date).getTime()) / (24 * 60 * 60 * 1000));
      insights.push(`🎯 Great milestone! You reached 1000 questions in ${days} days.`);
    }
  }

  // Weekly accuracy comparison
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastWeekRevisions = revisions.filter(r => new Date(r.date) >= weekAgo);
  
  if (lastWeekRevisions.length > 0) {
    const weekQuestions = lastWeekRevisions.reduce((sum, r) => sum + r.numQuestions, 0);
    const weekCorrect = lastWeekRevisions.reduce((sum, r) => sum + r.numCorrect, 0);
    const weekAccuracy = (weekCorrect / weekQuestions) * 100;
    
    const overallCorrect = revisions.reduce((sum, r) => sum + r.numCorrect, 0);
    const overallAccuracy = (overallCorrect / totalQuestions) * 100;
    
    if (weekAccuracy > overallAccuracy + 5) {
      insights.push(`📈 Excellent! Last week's accuracy (${weekAccuracy.toFixed(1)}%) was significantly higher than your overall (${overallAccuracy.toFixed(1)}%).`);
    } else if (weekAccuracy < overallAccuracy - 5) {
      insights.push(`📊 Last week's accuracy (${weekAccuracy.toFixed(1)}%) was lower than your overall (${overallAccuracy.toFixed(1)}%). Keep pushing!`);
    }
  }

  // Monthly comparison
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  
  const thisMonthRevisions = revisions.filter(r => new Date(r.date) >= monthAgo);
  const lastMonthRevisions = revisions.filter(r => new Date(r.date) >= twoMonthsAgo && new Date(r.date) < monthAgo);
  
  if (thisMonthRevisions.length > 0) {
    const thisMonthQuestions = thisMonthRevisions.reduce((sum, r) => sum + r.numQuestions, 0);
    const thisMonthAvg = thisMonthQuestions / 30;
    
    if (lastMonthRevisions.length > 0) {
      const lastMonthQuestions = lastMonthRevisions.reduce((sum, r) => sum + r.numQuestions, 0);
      const lastMonthAvg = lastMonthQuestions / 30;
      
      if (thisMonthAvg > lastMonthAvg) {
        insights.push(`🚀 This month you averaged ${thisMonthAvg.toFixed(0)} questions/day, compared to ${lastMonthAvg.toFixed(0)}/day last month!`);
      }
    } else {
      insights.push(`📅 This month you're averaging ${thisMonthAvg.toFixed(0)} questions per day.`);
    }
  }

  // Pace prediction
  if (sortedRevisions.length >= 7) {
    const recentWeek = sortedRevisions.slice(-7);
    const recentAvg = recentWeek.reduce((sum, r) => sum + r.numQuestions, 0) / 7;
    
    if (recentAvg > 0) {
      const daysToNext1000 = Math.ceil((Math.ceil(totalQuestions / 1000) * 1000 - totalQuestions) / recentAvg);
      if (daysToNext1000 <= 30 && totalQuestions < (Math.ceil(totalQuestions / 1000) * 1000)) {
        const targetQuestions = Math.ceil(totalQuestions / 1000) * 1000;
        insights.push(`⚡ At this pace, you'll cross ${targetQuestions} questions in ${daysToNext1000} days!`);
      }
    }
  }

  // Subject strength insight
  const subjectStats = processSubjectAnalysis(revisions);
  const subjects = Object.entries(subjectStats);
  if (subjects.length > 1) {
    const bestSubject = subjects.reduce((best, current) => 
      current[1].accuracy > best[1].accuracy ? current : best
    );
    const weakestSubject = subjects.reduce((weakest, current) => 
      current[1].accuracy < weakest[1].accuracy ? current : weakest
    );
    
    if (bestSubject[1].accuracy - weakestSubject[1].accuracy > 20) {
      insights.push(`💪 Your strongest subject is ${bestSubject[0]} (${bestSubject[1].accuracy.toFixed(1)}% accuracy), focus more on ${weakestSubject[0]} (${weakestSubject[1].accuracy.toFixed(1)}%).`);
    }
  }

  return insights.slice(0, 4); // Return max 4 insights
};

// Smart Weak Topic Analysis Types
export interface TopicAnalysis {
  topic: string;
  subject: string;
  attempts: number;
  totalQuestions: number;
  totalCorrect: number;
  accuracy: number;
  consistencyScore: number; // 0-100, higher is more consistent
  trendScore: number; // -1 to 1, negative is declining
  weaknessScore: number; // Combined score for ranking
  revisionDates: string[];
}

export interface WeakTopicsBySubject {
  [subject: string]: TopicAnalysis[];
}

// Extract topics from unstructured text using NLP
export const extractTopicsFromText = (revisions: RevisionData[]): Map<string, { subject: string; revisions: RevisionData[] }> => {
  const topicMap = new Map<string, { subject: string; revisions: RevisionData[] }>();
  
  // Common academic/study stopwords to filter out
  const stopwords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'could', 'may', 'might', 'must', 'can', 'about', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further',
    'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both',
    'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 'this', 'that', 'these',
    'those', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you',
    'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself',
    'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them',
    'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'whose',
    'question', 'questions', 'answer', 'answers', 'studied', 'study', 'revision',
    'practice', 'test', 'exam', 'got', 'did', 'tried', 'need', 'needs', 'work'
  ]);

  // Extract all remarks text
  const allRemarks = revisions
    .filter(r => r.remarks && r.remarks.trim().length > 0)
    .map(r => ({ text: r.remarks!, revision: r }));

  // Term frequency calculation across all documents
  const termFrequency = new Map<string, number>();
  const documentFrequency = new Map<string, number>();
  const termToRevisions = new Map<string, Set<RevisionData>>();

  // Process each remark
  allRemarks.forEach(({ text, revision }) => {
    // Extract meaningful terms (2-3 word phrases and single important words)
    const terms = extractMeaningfulTerms(text, stopwords);
    const uniqueTermsInDoc = new Set(terms);

    terms.forEach(term => {
      // Update term frequency
      termFrequency.set(term, (termFrequency.get(term) || 0) + 1);
      
      // Track revisions for each term
      if (!termToRevisions.has(term)) {
        termToRevisions.set(term, new Set());
      }
      termToRevisions.get(term)!.add(revision);
    });

    // Update document frequency
    uniqueTermsInDoc.forEach(term => {
      documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1);
    });
  });

  // Calculate TF-IDF scores and identify significant topics
  const totalDocs = allRemarks.length;
  const tfidfScores = new Map<string, number>();

  termFrequency.forEach((tf, term) => {
    const df = documentFrequency.get(term) || 1;
    const idf = Math.log(totalDocs / df);
    const tfidf = tf * idf;
    tfidfScores.set(term, tfidf);
  });

  // Filter and normalize topics - keep only significant terms
  const sortedTopics = Array.from(tfidfScores.entries())
    .filter(([term, score]) => {
      const df = documentFrequency.get(term) || 0;
      const tf = termFrequency.get(term) || 0;
      // Keep terms that appear in at least 2 revisions OR appear multiple times
      return (df >= 2 || tf >= 3) && term.length >= 3;
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30); // Keep top 30 topics

  // Build topic map
  sortedTopics.forEach(([term]) => {
    const revisionSet = termToRevisions.get(term);
    if (revisionSet && revisionSet.size > 0) {
      const revs = Array.from(revisionSet);
      // Use the most common subject for this topic
      const subjectCounts = new Map<string, number>();
      revs.forEach(r => {
        subjectCounts.set(r.subject, (subjectCounts.get(r.subject) || 0) + 1);
      });
      const mostCommonSubject = Array.from(subjectCounts.entries())
        .sort((a, b) => b[1] - a[1])[0][0];

      topicMap.set(term, {
        subject: mostCommonSubject,
        revisions: revs
      });
    }
  });

  return topicMap;
};

// Extract meaningful terms from text
const extractMeaningfulTerms = (text: string, stopwords: Set<string>): string[] => {
  const terms: string[] = [];
  
  // Normalize text
  const normalized = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = normalized.split(' ').filter(w => w.length > 2);

  // Extract 2-3 word phrases
  for (let i = 0; i < words.length; i++) {
    // 2-word phrases
    if (i < words.length - 1) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      if (!stopwords.has(words[i]) && !stopwords.has(words[i + 1])) {
        terms.push(phrase);
      }
    }
    
    // 3-word phrases
    if (i < words.length - 2) {
      const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      if (!stopwords.has(words[i]) && !stopwords.has(words[i + 1]) && !stopwords.has(words[i + 2])) {
        terms.push(phrase);
      }
    }

    // Single meaningful words
    if (!stopwords.has(words[i]) && words[i].length >= 4) {
      terms.push(words[i]);
    }
  }

  return terms;
};

// Analyze all topics from revisions
export const analyzeTopics = (revisions: RevisionData[]): Map<string, TopicAnalysis> => {
  const topicMap = new Map<string, {
    subject: string;
    attempts: number;
    totalQuestions: number;
    totalCorrect: number;
    accuracies: number[];
    revisionDates: string[];
  }>();

  // Collect data for each topic
  revisions.forEach(revision => {
    const hashtags = parseHashtags(revision.remarks);
    const accuracy = revision.numQuestions > 0 
      ? (revision.numCorrect / revision.numQuestions) * 100 
      : 0;

    hashtags.forEach(tag => {
      const topicKey = tag.toLowerCase();
      
      if (!topicMap.has(topicKey)) {
        topicMap.set(topicKey, {
          subject: revision.subject,
          attempts: 0,
          totalQuestions: 0,
          totalCorrect: 0,
          accuracies: [],
          revisionDates: []
        });
      }

      const topicData = topicMap.get(topicKey)!;
      topicData.attempts++;
      topicData.totalQuestions += revision.numQuestions;
      topicData.totalCorrect += revision.numCorrect;
      topicData.accuracies.push(accuracy);
      topicData.revisionDates.push(revision.date);
    });
  });

  // Calculate analysis metrics
  const analyzedTopics = new Map<string, TopicAnalysis>();

  topicMap.forEach((data, topicKey) => {
    const avgAccuracy = data.totalQuestions > 0 
      ? (data.totalCorrect / data.totalQuestions) * 100 
      : 0;

    // Calculate consistency score (lower variance = higher consistency)
    let consistencyScore = 100;
    if (data.accuracies.length > 1) {
      const mean = avgAccuracy;
      const variance = data.accuracies.reduce((sum, acc) => 
        sum + Math.pow(acc - mean, 2), 0) / data.accuracies.length;
      const stdDev = Math.sqrt(variance);
      // Convert to 0-100 scale (lower stdDev = higher consistency)
      consistencyScore = Math.max(0, 100 - stdDev);
    }

    // Calculate trend score (comparing first half vs second half)
    let trendScore = 0;
    if (data.accuracies.length >= 4) {
      const halfPoint = Math.floor(data.accuracies.length / 2);
      const firstHalf = data.accuracies.slice(0, halfPoint);
      const secondHalf = data.accuracies.slice(halfPoint);
      
      const firstAvg = firstHalf.reduce((sum, acc) => sum + acc, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, acc) => sum + acc, 0) / secondHalf.length;
      
      // Normalize to -1 to 1 range
      trendScore = (secondAvg - firstAvg) / 100;
    }

    analyzedTopics.set(topicKey, {
      topic: topicKey,
      subject: data.subject,
      attempts: data.attempts,
      totalQuestions: data.totalQuestions,
      totalCorrect: data.totalCorrect,
      accuracy: avgAccuracy,
      consistencyScore,
      trendScore,
      weaknessScore: 0, // Will be calculated after we know overall average
      revisionDates: data.revisionDates
    });
  });

  return analyzedTopics;
};

// Identify weak topics based on intelligent analysis
export const identifyWeakTopics = (
  revisions: RevisionData[],
  minAttempts: number = 2
): WeakTopicsBySubject => {
  // Calculate overall average accuracy
  const totalQuestions = revisions.reduce((sum, r) => sum + r.numQuestions, 0);
  const totalCorrect = revisions.reduce((sum, r) => sum + r.numCorrect, 0);
  const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

  // Analyze all topics
  const topicAnalysis = analyzeTopics(revisions);

  // Filter and score weak topics
  const weakTopics: TopicAnalysis[] = [];

  topicAnalysis.forEach(topic => {
    // Only consider topics with minimum attempts
    if (topic.attempts < minAttempts) return;

    // Calculate weakness score based on multiple factors
    let weaknessScore = 0;

    // Factor 1: Accuracy relative to overall (0-50 points)
    // Lower accuracy = higher score
    const accuracyDiff = overallAccuracy - topic.accuracy;
    if (accuracyDiff > 0) {
      weaknessScore += Math.min(50, accuracyDiff * 2);
    }

    // Factor 2: Inconsistency (0-25 points)
    // Lower consistency = higher score
    weaknessScore += (100 - topic.consistencyScore) * 0.25;

    // Factor 3: Negative trend (0-25 points)
    // Declining performance = higher score
    if (topic.trendScore < 0) {
      weaknessScore += Math.abs(topic.trendScore) * 25;
    }

    // Only include topics with significant weakness (threshold: 20)
    if (weaknessScore >= 20) {
      topic.weaknessScore = weaknessScore;
      weakTopics.push(topic);
    }
  });

  // Sort by weakness score (highest first)
  weakTopics.sort((a, b) => b.weaknessScore - a.weaknessScore);

  // Group by subject
  const groupedBySubject: WeakTopicsBySubject = {};
  weakTopics.forEach(topic => {
    if (!groupedBySubject[topic.subject]) {
      groupedBySubject[topic.subject] = [];
    }
    groupedBySubject[topic.subject].push(topic);
  });

  return groupedBySubject;
};
