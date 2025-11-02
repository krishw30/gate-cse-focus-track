import ChatBot from "react-chatbotify";
import { useToast } from "@/hooks/use-toast";

interface RevisionData {
  date: string;
  subject: string;
  type?: string;
  numQuestions: number;
  numCorrect: number;
  remarks?: string;
  weakTopics?: string;
  timeSpentMinutes?: number;
  timestamp?: any;
}

interface Props {
  revisions: RevisionData[];
}

const GEMINI_API_KEY = "AIzaSyCEeS50KOonYdd0TalKulImhM4jKd4SFQ8";

export default function DetailViewChat({ revisions }: Props) {
  const { toast } = useToast();

  // Helper to call Gemini API
  const callGemini = async (prompt: string, maxTokens: number = 1024) => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: maxTokens,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", response.status, errorText);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      
      if (candidate.content?.parts?.[0]?.text) {
        return candidate.content.parts[0].text;
      } else if (candidate.finishReason === "MAX_TOKENS") {
        throw new Error("MAX_TOKENS");
      } else if (candidate.finishReason === "SAFETY") {
        throw new Error("SAFETY");
      }
    }
    
    throw new Error("No response from AI");
  };

  // Step 1: Extract intent and keywords
  const extractIntent = async (userQuestion: string) => {
    const intentPrompt = `You are a search assistant. Extract key information from this question to filter revision data.

User Question: "${userQuestion}"

Extract and return ONLY a JSON object with these fields (no markdown, no explanation):
{
  "subjects": ["subject1", "subject2"],
  "types": ["type1"],
  "topics": ["topic1"],
  "dateRange": {
    "start": "YYYY-MM-DD or null",
    "end": "YYYY-MM-DD or null"
  },
  "minAccuracy": number or null,
  "maxAccuracy": number or null
}

Available subjects: Computer Networks, Theory of Computation, Databases, Discrete Mathematics, Aptitude, Operating System, Computer Organization and Architecture, Algorithms, Data Structures, C Programming

If the user mentions "last week", calculate dates. If "September", use that month. Be smart about date parsing.
If no filter is needed, return empty arrays and nulls.`;

    const result = await callGemini(intentPrompt, 512);
    
    // Clean up response - remove markdown code blocks if present
    let cleanResult = result.trim();
    if (cleanResult.startsWith('```json')) {
      cleanResult = cleanResult.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanResult.startsWith('```')) {
      cleanResult = cleanResult.replace(/```\n?/g, '');
    }
    
    try {
      return JSON.parse(cleanResult);
    } catch (e) {
      console.error("Failed to parse intent:", cleanResult);
      return {
        subjects: [],
        types: [],
        topics: [],
        dateRange: { start: null, end: null },
        minAccuracy: null,
        maxAccuracy: null
      };
    }
  };

  // Step 2: Filter revisions locally
  const filterRevisions = (intent: any) => {
    let filtered = [...revisions];

    // Filter by subjects
    if (intent.subjects && intent.subjects.length > 0) {
      filtered = filtered.filter(r => 
        intent.subjects.some((s: string) => 
          r.subject.toLowerCase().includes(s.toLowerCase())
        )
      );
    }

    // Filter by types
    if (intent.types && intent.types.length > 0) {
      filtered = filtered.filter(r => 
        r.type && intent.types.some((t: string) => 
          r.type.toLowerCase().includes(t.toLowerCase())
        )
      );
    }

    // Filter by topics (check remarks and weakTopics)
    if (intent.topics && intent.topics.length > 0) {
      filtered = filtered.filter(r => {
        const searchText = `${r.remarks || ''} ${r.weakTopics || ''}`.toLowerCase();
        return intent.topics.some((topic: string) => 
          searchText.includes(topic.toLowerCase())
        );
      });
    }

    // Filter by date range
    if (intent.dateRange) {
      if (intent.dateRange.start) {
        filtered = filtered.filter(r => r.date >= intent.dateRange.start);
      }
      if (intent.dateRange.end) {
        filtered = filtered.filter(r => r.date <= intent.dateRange.end);
      }
    }

    // Filter by accuracy
    if (intent.minAccuracy !== null || intent.maxAccuracy !== null) {
      filtered = filtered.filter(r => {
        const accuracy = r.numQuestions > 0 ? (r.numCorrect / r.numQuestions) * 100 : 0;
        if (intent.minAccuracy !== null && accuracy < intent.minAccuracy) return false;
        if (intent.maxAccuracy !== null && accuracy > intent.maxAccuracy) return false;
        return true;
      });
    }

    return filtered;
  };

  const flow = {
    start: {
      message: "Hi! I'm your Detail View AI Assistant. Ask me specific questions about your revision history, like 'What was my accuracy in Computer Networks last week?' or 'Show me all my Algorithms sessions from October.'",
      path: "process_question"
    },
    process_question: {
      message: async (params: any) => {
        try {
          const userQuestion = params.userInput;
          
          // STEP 1: Extract intent
          const intent = await extractIntent(userQuestion);
          console.log("Extracted Intent:", intent);

          // STEP 2: Filter revisions locally
          const filteredRevisions = filterRevisions(intent);
          console.log(`Filtered ${filteredRevisions.length} revisions from ${revisions.length} total`);

          if (filteredRevisions.length === 0) {
            return "I couldn't find any revision sessions matching your criteria. Try asking about a different subject, date range, or topic!";
          }

          // Prepare concise data summary for filtered revisions
          const summary = filteredRevisions.slice(0, 30).map(r => ({
            date: r.date,
            subject: r.subject,
            type: r.type || 'Other',
            questions: r.numQuestions,
            correct: r.numCorrect,
            accuracy: r.numQuestions > 0 ? Math.round((r.numCorrect / r.numQuestions) * 100) : 0,
            time: r.timeSpentMinutes,
            remarks: r.remarks ? r.remarks.substring(0, 100) : '',
          }));

          // Calculate aggregates
          const totalQuestions = filteredRevisions.reduce((sum, r) => sum + r.numQuestions, 0);
          const totalCorrect = filteredRevisions.reduce((sum, r) => sum + r.numCorrect, 0);
          const avgAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
          const totalTime = filteredRevisions.reduce((sum, r) => sum + (r.timeSpentMinutes || 0), 0);

          // STEP 3: Get detailed answer with filtered data
          const answerPrompt = `You are a GATE CSE performance analyst. Answer the user's question based on their filtered revision data.

User Question: "${userQuestion}"

Filtered Data Summary:
- Total Sessions: ${filteredRevisions.length}
- Total Questions: ${totalQuestions}
- Total Correct: ${totalCorrect}
- Average Accuracy: ${avgAccuracy}%
- Total Time Spent: ${totalTime} minutes

Recent Sessions (up to 30):
${JSON.stringify(summary, null, 2)}

Provide a detailed, helpful answer addressing their specific question. Include numbers, dates, and specific insights. Keep it under 200 words.`;

          const answer = await callGemini(answerPrompt, 2048);
          return answer;

        } catch (error: any) {
          console.error("Chat error:", error);
          
          if (error.message === "MAX_TOKENS") {
            return "The response was too long. Please ask a more specific question!";
          } else if (error.message === "SAFETY") {
            return "I couldn't process that question. Please rephrase it.";
          }
          
          toast({
            title: "Error",
            description: "Failed to get AI response. Please try again.",
            variant: "destructive"
          });
          return "Sorry, I encountered an error. Please try asking again.";
        }
      },
      path: "process_question"
    }
  };

  const settings = {
    general: {
      embedded: false,
      primaryColor: "#6366f1",
      secondaryColor: "#8b5cf6",
    },
    chatHistory: {
      storageKey: "detail_view_chat_history"
    },
    header: {
      title: "Detail View AI Assistant",
      showAvatar: true
    },
    tooltip: {
      mode: "NEVER" as const
    },
    chatButton: {
      icon: "🔍"
    }
  };

  return (
    <ChatBot 
      flow={flow}
      settings={settings}
    />
  );
}
