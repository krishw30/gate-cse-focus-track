import ChatBot from "react-chatbotify";
import { useToast } from "@/hooks/use-toast";

interface PerformanceData {
  totalRevisions: number;
  totalQuestions: number;
  overallAccuracy: string;
  avgQuestionsPerDay: number;
  subjectAnalysis: Record<string, { totalCorrect: number; totalQuestions: number; attempts: number; accuracy: number }>;
  typeAnalysis: Record<string, { totalCorrect: number; totalQuestions: number; attempts: number; accuracy: number }>;
  weakTopics: Array<{
    topic: string;
    subject: string;
    averageAccuracy: number;
    concernLevel: string;
    totalSessions: number;
    consistencyScore: number;
    trend: string;
  }>;
}

interface Props {
  performanceData: PerformanceData;
}

const GEMINI_API_KEY = "AIzaSyCEeS50KOonYdd0TalKulImhM4jKd4SFQ8";

export default function PerformanceAnalystChat({ performanceData }: Props) {
  const { toast } = useToast();

  const flow = {
    start: {
      message: "Hi! I'm your AI Performance Analyst. I can help you understand your GATE CSE preparation progress. Ask me anything!",
      path: "process_question"
    },
    process_question: {
      message: async (params: any) => {
        try {
          const userMessage = params.userInput;
          
          // Create a concise summary instead of full data dump
          const summary = {
            overview: {
              revisions: performanceData.totalRevisions,
              questions: performanceData.totalQuestions,
              accuracy: performanceData.overallAccuracy + "%",
              avgPerDay: Math.round(performanceData.avgQuestionsPerDay)
            },
            subjects: Object.entries(performanceData.subjectAnalysis).map(([name, data]) => ({
              name,
              accuracy: Math.round(data.accuracy) + "%",
              questions: data.totalQuestions
            })),
            weakTopics: performanceData.weakTopics.slice(0, 5).map(t => ({
              topic: t.topic,
              subject: t.subject,
              accuracy: Math.round(t.averageAccuracy) + "%",
              concern: t.concernLevel
            }))
          };

          const systemPrompt = "You are a GATE CSE performance analyst. Provide concise, actionable insights based on student data. Keep responses under 150 words.";
          
          const prompt = `${systemPrompt}\n\nStudent Data: ${JSON.stringify(summary)}\n\nQuestion: ${userMessage}\n\nProvide a brief, helpful response:`;

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.7,
                  maxOutputTokens: 2048,
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
          console.log("Gemini Response:", data);
          
          // Handle different response structures
          let aiResponse = "I apologize, but I couldn't generate a response. Please try again.";
          
          if (data.candidates && data.candidates.length > 0) {
            const candidate = data.candidates[0];
            
            if (candidate.content?.parts?.[0]?.text) {
              aiResponse = candidate.content.parts[0].text;
            } else if (candidate.finishReason === "MAX_TOKENS") {
              aiResponse = "Response was too long. Please ask a more specific question about your performance.";
            } else if (candidate.finishReason === "SAFETY") {
              aiResponse = "I couldn't process that question. Please rephrase it.";
            }
          }

          return aiResponse;
        } catch (error) {
          console.error("Chat error:", error);
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
      storageKey: "performance_analyst_history"
    },
    header: {
      title: "AI Performance Analyst",
      showAvatar: true
    },
    tooltip: {
      mode: "NEVER" as const
    },
    chatButton: {
      icon: "🤖"
    }
  };

  return (
    <ChatBot 
      flow={flow}
      settings={settings}
    />
  );
}
