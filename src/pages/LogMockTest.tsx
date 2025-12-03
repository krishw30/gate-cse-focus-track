import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, FileJson, BarChart2, ArrowLeft } from "lucide-react";

// --- STRICT TYPE DEFINITION ---
export interface SubjectPerformance {
  subject: string;
  score: number;       // REQUIRED: The primary metric (marks or computed gained-lost)
  correct: number;     // Secondary (default 0)
  wrong: number;       // Secondary (default 0)
  unattempted: number; // Secondary (default 0)
  // Optional fields that can be provided by JSON input (not used in manual UI)
  totalMarks?: number;
  gainedMarks?: number;
  lostMarks?: number;
}

const GATE_SUBJECTS = [
  "Algorithms", "Aptitude", "C Programming", "Computer Networks", 
  "Computer Organization", "Data Structures", "Databases", 
  "Discrete Mathematics", "Digital Logic", "Engineering Math", 
  "Operating System", "Theory of Computation", "Compiler Design"
];

const LogMockTest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [provider, setProvider] = useState("");
  const [testType, setTestType] = useState<string>("FMT");
  const [testName, setTestName] = useState("");
  
  // Score State (Global)
  const [totalScore, setTotalScore] = useState("");
  const [totalMarks, setTotalMarks] = useState("100");
  const [totalQuestions, setTotalQuestions] = useState("65");
  const [totalCorrect, setTotalCorrect] = useState("");
  const [totalIncorrect, setTotalIncorrect] = useState("");
  const [totalUnattempted, setTotalUnattempted] = useState("");

  // Subject Breakdown State
  const [subjects, setSubjects] = useState<SubjectPerformance[]>([]);
  const [jsonInput, setJsonInput] = useState("");
  const [remarks, setRemarks] = useState("");

  // Auto-fill defaults for FMT
  useEffect(() => {
    if (testType === 'FMT') {
      setTotalMarks("100");
      setTotalQuestions("65");
      
      // FIX: Auto-populate ALL subjects for Full Mock Test
      const allSubjects = GATE_SUBJECTS.map(subject => ({
        subject: subject,
        score: 0,
        correct: 0,
        wrong: 0,
        unattempted: 0
      }));
      setSubjects(allSubjects);
      
    } else {
      // For Mixed tests, clear the list so you can add specific ones manually
      setTotalMarks("");
      setTotalQuestions("");
      setSubjects([]); 
    }
  }, [testType]);

  // When subjects are present, derive global counts from them
  useEffect(() => {
    if (subjects.length > 0) {
      const sumCorrect = subjects.reduce((acc, s) => acc + (Number(s.correct) || 0), 0);
      const sumWrong = subjects.reduce((acc, s) => acc + (Number(s.wrong) || 0), 0);
      const sumUnatt = subjects.reduce((acc, s) => acc + (Number(s.unattempted) || 0), 0);

      setTotalCorrect(String(sumCorrect));
      setTotalIncorrect(String(sumWrong));
      setTotalUnattempted(String(sumUnatt));
    }
  }, [subjects]);

  // Always keep totalQuestions as the sum of correct + incorrect + unattempted
  useEffect(() => {
    const a = Number(totalCorrect) || 0;
    const b = Number(totalIncorrect) || 0;
    const c = Number(totalUnattempted) || 0;
    setTotalQuestions(String(a + b + c));
  }, [totalCorrect, totalIncorrect, totalUnattempted]);

  // Helper: Add a blank subject row
  const addSubjectRow = () => {
    setSubjects([...subjects, { subject: "", score: 0, correct: 0, wrong: 0, unattempted: 0 }]);
  };

  const removeSubjectRow = (index: number) => {
    const newSubjects = [...subjects];
    newSubjects.splice(index, 1);
    setSubjects(newSubjects);
  };

  const updateSubject = (index: number, field: keyof SubjectPerformance, value: any) => {
    const newSubjects = [...subjects];
    newSubjects[index] = { ...newSubjects[index], [field]: value };
    setSubjects(newSubjects);
  };

  // Helper: Parse JSON Input from Gemini
  const handleJsonParse = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (Array.isArray(parsed)) {
        // Validation & tolerant mapping: subject is required; other fields are optional and can use multiple key names.
        const cleanData: SubjectPerformance[] = (parsed as any[]).map((item: any) => {
          const subject = item.subject || item.name || item.subjectName || "Unknown";

          const totalMarks = item.totalMarks ?? item.total_marks ?? item.max ?? item.total ?? item.totalMark;
          const gained = item.gained ?? item.gainedMarks ?? item.gained_marks ?? item.gained_mark ?? item.gain ?? item.gains;
          const lost = item.lost ?? item.lostMarks ?? item.lost_marks ?? item.lost_mark ?? item.loss ?? item.loses;

          // Score priority: explicit `score` > computed (gained - lost) > `marks` field > 0
          let scoreVal: number | undefined = undefined;
          if (item.score !== undefined) scoreVal = Number(item.score);
          else if (gained !== undefined || lost !== undefined) scoreVal = (Number(gained) || 0) - (Number(lost) || 0);
          else if (item.marks !== undefined) scoreVal = Number(item.marks);

          const correct = Number(item.correct ?? item.correctCount ?? item.corrects ?? 0) || 0;
          const wrong = Number(item.wrong ?? item.incorrect ?? item.incorrectCount ?? 0) || 0;
          const unattempted = Number(item.unattempted ?? item.unattempted_questions ?? item.unattemptedQs ?? 0) || 0;

          return {
            subject,
            score: Number(scoreVal ?? 0),
            correct,
            wrong,
            unattempted,
            totalMarks: totalMarks !== undefined ? Number(totalMarks) : undefined,
            gainedMarks: gained !== undefined ? Number(gained) : undefined,
            lostMarks: lost !== undefined ? Number(lost) : undefined,
          };
        });
        setSubjects(cleanData);
        toast({ title: "Success", description: "Subject data loaded successfully!" });
        // Optional: Switch back to manual tab so user can verify
      } else {
        throw new Error("Format invalid");
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Invalid JSON", description: "Please check the format. Expected array of objects." });
    }
  };

  const handleSubmit = async () => {
    if (!provider || !testName || !totalScore) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please fill in Provider, Test Name, and Total Score." });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "mockTest"), {
        date,
        provider,
        testType,
        testName,
        totalScore: Number(totalScore),
        totalMarks: Number(totalMarks),
        totalQuestions: Number(totalQuestions),
        totalCorrect: Number(totalCorrect),
        totalIncorrect: Number(totalIncorrect),
        subjectDetails: subjects, // Saves the breakdown
        sillyMistakes: remarks,
        timestamp: new Date()
      });

      toast({ title: "Saved!", description: "Mock test logged successfully." });
      navigate("/"); 
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Failed to save log." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20">
      
      {/* Header Section */}
      <div className="max-w-3xl mx-auto p-6 pb-0 pt-8">
        <div className="flex items-center justify-between gap-4">
           <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-primary">Log New Mock Test</h1>
                <p className="text-muted-foreground text-sm">Gate CSE 2025 Mock Center</p>
              </div>
           </div>
           <Link to="/mock-analysis">
             <Button variant="outline" className="gap-2">
               <BarChart2 className="h-4 w-4" />
               View Analysis
             </Button>
           </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        
        {/* Section 1: Test Details */}
        <Card>
          <CardHeader><CardTitle>Test Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Provider</label>
              <Select onValueChange={setProvider}>
                <SelectTrigger><SelectValue placeholder="Select Provider" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Made Easy">Made Easy</SelectItem>
                  <SelectItem value="GO Classes">GO Classes</SelectItem>
                  <SelectItem value="PW">Physics Wallah</SelectItem>
                  <SelectItem value="Applied GATE">Applied GATE</SelectItem>
                  <SelectItem value="Unacademy">Unacademy</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Test Type</label>
              <Select onValueChange={setTestType} value={testType}>
                <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FMT">Full Mock Test (FMT)</SelectItem>
                  <SelectItem value="Mixed">Mixed / Multi-Subject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Test Name</label>
              <Input placeholder="e.g. Full Mock Test 3" value={testName} onChange={(e) => setTestName(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Score Overview */}
        <Card>
          <CardHeader><CardTitle>Score Overview</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Total Score</label>
              <Input type="number" step="0.01" placeholder="0" value={totalScore} onChange={(e) => setTotalScore(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Marks</label>
              <Input type="number" placeholder="100" value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Total Qs</label>
              <Input type="number" placeholder="65" value={totalQuestions} onChange={(e) => setTotalQuestions(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-green-600">Correct</label>
              <Input type="number" className="border-green-200" value={totalCorrect} onChange={(e) => setTotalCorrect(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-red-600">Incorrect</label>
              <Input type="number" className="border-red-200" value={totalIncorrect} onChange={(e) => setTotalIncorrect(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Unattempted</label>
              <Input type="number" className="border-yellow-200" value={totalUnattempted} onChange={(e) => setTotalUnattempted(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Subject Breakdown (Marks First) */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="manual">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                <TabsTrigger value="json">JSON Paste (Smart)</TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="space-y-4">
                {subjects.map((sub, idx) => (
                  <div key={idx} className="flex flex-wrap gap-2 items-end border-b pb-4">
                    <div className="flex-1 min-w-[150px] space-y-1">
                      <label className="text-xs">Subject</label>
                      <Select onValueChange={(v) => updateSubject(idx, 'subject', v)} value={sub.subject}>
                        <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                        <SelectContent>
                          {GATE_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* MARKS - THE MOST IMPORTANT FIELD */}
                    <div className="w-24 space-y-1">
                      <label className="text-xs font-bold text-primary">Marks</label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        className="font-semibold"
                        value={sub.score} 
                        onChange={(e) => updateSubject(idx, 'score', Number(e.target.value))} 
                      />
                    </div>

                    <div className="w-16 space-y-1">
                      <label className="text-xs text-green-600">Corr.</label>
                      <Input type="number" value={sub.correct} onChange={(e) => updateSubject(idx, 'correct', Number(e.target.value))} />
                    </div>
                    <div className="w-16 space-y-1">
                      <label className="text-xs text-red-600">Wrong</label>
                      <Input type="number" value={sub.wrong} onChange={(e) => updateSubject(idx, 'wrong', Number(e.target.value))} />
                    </div>
                    <div className="w-16 space-y-1">
                      <label className="text-xs text-gray-500">Unatt.</label>
                      <Input type="number" value={sub.unattempted} onChange={(e) => updateSubject(idx, 'unattempted', Number(e.target.value))} />
                    </div>
                    
                    <Button variant="ghost" size="icon" className="text-destructive mb-0.5" onClick={() => removeSubjectRow(idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full dashed border-dashed" onClick={addSubjectRow}>
                  <Plus className="h-4 w-4 mr-2" /> Add Subject Row
                </Button>
              </TabsContent>

              <TabsContent value="json" className="space-y-4">
                <div className="p-4 bg-muted rounded-md text-sm text-muted-foreground">
                  Paste JSON array here (from Gemini). Only <strong>subject</strong> is required — other fields are optional.
                  <br />Accepted fields: <code>totalMarks</code>, <code>gainedMarks</code>, <code>lostMarks</code>, <code>score</code>, <code>correct</code>, <code>wrong</code>, <code>unattempted</code>.
                  <br />Example: <code>{`[{"subject":"OS","totalMarks":10,"gainedMarks":8,"lostMarks":2,"score":6},{"subject":"DS"}]`}</code>
                </div>
                <Textarea 
                  rows={8} 
                  placeholder="Paste JSON here..." 
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                />
                <Button onClick={handleJsonParse} className="w-full gap-2">
                  <FileJson className="h-4 w-4" /> Parse & Load Data
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Section 4: Analysis */}
        <Card>
          <CardHeader><CardTitle>Analysis & Remarks</CardTitle></CardHeader>
          <CardContent>
            <Textarea 
              rows={6} 
              placeholder="List your silly mistakes, calculation errors, and what you learned from this test..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </CardContent>
        </Card>

        <Button size="lg" className="w-full text-lg mb-12" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : (
            <>
              <Save className="mr-2 h-5 w-5" /> Save Mock Log
            </>
          )}
        </Button>

      </div>
    </div>
  );
};

export default LogMockTest;