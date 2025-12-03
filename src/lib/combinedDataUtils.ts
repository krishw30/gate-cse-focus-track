// ...new utility functions for mock-test analysis...

import { MockTestData, SubjectPerformance } from "@/lib/chartUtils";

export interface AggregatedSubject {
  subject: string;
  totalCorrect: number;
  totalWrong: number;
  totalUnattempted: number;
  totalQuestions: number;
  attempts: number; // number of mocks where this subject appeared
  accuracy: number;

  // NEW mark-related aggregates
  totalMarksSum: number;     // sum of totalMarks fields when provided
  totalGainedMarks: number;  // sum of gainedMarks when provided
  totalLostMarks: number;    // sum of lostMarks when provided
  totalScoreSum: number;     // sum of `score` values when provided
  avgScore: number;          // average score (totalScoreSum / attempts) when present
}

export interface MockOverview {
  totalMocks: number;
  totalQuestions: number;
  totalCorrect: number;
  overallAccuracy: number;
  avgScorePerMock: number | null;
}

export interface ProgressPoint {
  date: string; // YYYY-MM-DD or whatever stored
  totalQuestions: number;
  totalCorrect: number;
}

/**
 * Aggregate subject-wise stats across an array of MockTestData.
 */
export const aggregateMockSubjects = (mocks: MockTestData[]): AggregatedSubject[] => {
  const map = new Map<string, AggregatedSubject>();

  mocks.forEach(mock => {
    (mock.subjectDetails || []).forEach((s: SubjectPerformance) => {
      const subject = s.subject || "Unknown";
      const correct = Number(s.correct || 0);
      const wrong = Number(s.wrong || 0);
      const unattempted = Number(s.unattempted || 0);
      const attempted = correct + wrong;

      if (!map.has(subject)) {
        map.set(subject, {
          subject,
          totalCorrect: 0,
          totalWrong: 0,
          totalUnattempted: 0,
          totalQuestions: 0,
          attempts: 0,
          accuracy: 0,
          totalMarksSum: 0,
          totalGainedMarks: 0,
          totalLostMarks: 0,
          totalScoreSum: 0,
          avgScore: 0
        });
      }

      const agg = map.get(subject)!;
      agg.totalCorrect += correct;
      agg.totalWrong += wrong;
      agg.totalUnattempted += unattempted;
      agg.totalQuestions += attempted + unattempted;
      agg.attempts += 1;

      // marks/score accounting (tolerant: values may be undefined)
      if (typeof s.totalMarks === "number" && !isNaN(s.totalMarks)) {
        agg.totalMarksSum += s.totalMarks;
      }
      if (typeof s.gainedMarks === "number" && !isNaN(s.gainedMarks)) {
        agg.totalGainedMarks += s.gainedMarks;
      }
      if (typeof s.lostMarks === "number" && !isNaN(s.lostMarks)) {
        agg.totalLostMarks += s.lostMarks;
      }
      if (typeof s.score === "number" && !isNaN(s.score)) {
        agg.totalScoreSum += s.score;
      }
    });
  });

  const result: AggregatedSubject[] = [];
  map.forEach(v => {
    v.accuracy = v.totalQuestions > 0 ? (v.totalCorrect / v.totalQuestions) * 100 : 0;
    v.avgScore = v.attempts > 0 ? v.totalScoreSum / v.attempts : 0;
    result.push(v);
  });

  // sort by totalQuestions desc to show most-practiced first
  return result.sort((a, b) => b.totalQuestions - a.totalQuestions);
};

/**
 * Compute overall mock overview metrics.
 */
export const computeMockOverview = (mocks: MockTestData[]): MockOverview => {
  const totalMocks = mocks.length;
  let totalQuestions = 0;
  let totalCorrect = 0;
  let sumScores = 0;
  let scoredCount = 0;

  mocks.forEach(m => {
    totalQuestions += Number(m.totalQuestions || 0);
    totalCorrect += Number(m.totalCorrect || 0);
    if (typeof m.totalScore === "number") {
      sumScores += m.totalScore;
      scoredCount += 1;
    }
  });

  const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
  const avgScorePerMock = scoredCount > 0 ? sumScores / scoredCount : null;

  return {
    totalMocks,
    totalQuestions,
    totalCorrect,
    overallAccuracy,
    avgScorePerMock
  };
};

/**
 * Build progress series (date -> totals) for mocks.
 */
export const computeMockProgress = (mocks: MockTestData[]): ProgressPoint[] => {
  const map = new Map<string, { totalQuestions: number; totalCorrect: number }>();

  mocks.forEach(m => {
    const date = m.date;
    if (!map.has(date)) map.set(date, { totalQuestions: 0, totalCorrect: 0 });
    const cur = map.get(date)!;
    cur.totalQuestions += Number(m.totalQuestions || 0);
    cur.totalCorrect += Number(m.totalCorrect || 0);
  });

  return Array.from(map.entries())
    .map(([date, data]) => ({ date, totalQuestions: data.totalQuestions, totalCorrect: data.totalCorrect }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Identify weak subjects:
 * - low accuracy (below threshold) OR
 * - low attempts (rarely practiced) but low accuracy.
 *
 * Returns top N subjects sorted by concern (accuracy asc then attempts asc).
 */
export const identifyWeakSubjects = (aggregated: AggregatedSubject[], options?: { accuracyThreshold?: number; minAttempts?: number; topN?: number }) => {
  const { accuracyThreshold = 65, minAttempts = 2, topN = 10 } = options || {};

  const candidates = aggregated
    .map(s => ({
      ...s,
      concernScore: (100 - s.accuracy) + (s.attempts < minAttempts ? 20 : 0) // simple scoring
    }))
    .filter(s => s.accuracy < accuracyThreshold || s.attempts < minAttempts)
    .sort((a, b) => b.concernScore - a.concernScore);

  return candidates.slice(0, topN);
};
