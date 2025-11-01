import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

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
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your AI Performance Analyst. I can help you understand your GATE CSE preparation progress based on your actual revision data. Ask me anything about your performance, weak areas, or study strategy!"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Prepare the performance data summary
      const dataSummary = {
        summary: {
          totalRevisions: performanceData.totalRevisions,
          totalQuestions: performanceData.totalQuestions,
          overallAccuracy: performanceData.overallAccuracy,
          avgQuestionsPerDay: performanceData.avgQuestionsPerDay
        },
        subjectWisePerformance: performanceData.subjectAnalysis,
        typeWisePerformance: performanceData.typeAnalysis,
        weakTopics: performanceData.weakTopics
      };

      // Construct the prompt with system message, data, and user question
      const systemMessage = "You are a helpful GATE CSE performance analyst. You analyze student performance data and provide personalized insights, recommendations, and study strategies. Always base your responses on the provided performance data. Be encouraging but honest about areas that need improvement.";
      
      const contextPrompt = `Here is the student's performance data:

${JSON.stringify(dataSummary, null, 2)}

Based on this data, please answer the following question: ${userMessage}`;

      // Call Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: systemMessage },
                  { text: contextPrompt }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get response from AI");
      }

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, but I couldn't generate a response. Please try again.";

      setMessages(prev => [...prev, { role: "assistant", content: aiResponse }]);
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="rounded-xl shadow-md border-0 hover:shadow-lg transition-all duration-300 h-[500px] flex flex-col" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <CardHeader className="pb-3">
        <CardTitle className="font-semibold text-foreground flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          AI Performance Analyst
        </CardTitle>
        <CardDescription>
          Ask me anything about your performance and study strategy
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 px-6 pb-6 overflow-hidden">
        <ScrollArea className="flex-1 pr-4 mb-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your performance..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
