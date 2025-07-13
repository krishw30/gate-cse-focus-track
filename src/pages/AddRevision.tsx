import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const subjects = [
  "Engineering Mathematics",
  "Digital Logic", 
  "Computer Organization and Architecture",
  "C Programming",
  "Data Structures",
  "Algorithms",
  "Theory of Computation",
  "Compiler Design",
  "Operating System",
  "Databases",
  "Computer Networks",
  "Discrete Mathematics"
];

const revisionTypes = [
  "DPP",
  "PYQ", 
  "Mock Test",
  "Other"
];

const AddRevision = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [subject, setSubject] = useState("");
  const [type, setType] = useState("");
  const [totalQuestions, setTotalQuestions] = useState("");
  const [correctAnswers, setCorrectAnswers] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !subject || !type || !totalQuestions || !correctAnswers) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (parseInt(correctAnswers) > parseInt(totalQuestions)) {
      toast({
        title: "Error", 
        description: "Correct answers cannot exceed total questions",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await addDoc(collection(db, "revisions"), {
        date: format(date, "yyyy-MM-dd"),
        subject,
        type,
        numQuestions: parseInt(totalQuestions),
        numCorrect: parseInt(correctAnswers),
        remarks,
        timestamp: serverTimestamp()
      });

      toast({
        title: "Success",
        description: "Revision data saved successfully!"
      });

      // Reset form
      setDate(new Date());
      setSubject("");
      setType("");
      setTotalQuestions("");
      setCorrectAnswers("");
      setRemarks("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save revision data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Add Revision</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger>
              <SelectValue placeholder="Select a subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subj) => (
                <SelectItem key={subj} value={subj}>
                  {subj}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="Select revision type" />
            </SelectTrigger>
            <SelectContent>
              {revisionTypes.map((revType) => (
                <SelectItem key={revType} value={revType}>
                  {revType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="totalQuestions">Total Questions</Label>
          <Input
            id="totalQuestions"
            type="number"
            min="1"
            value={totalQuestions}
            onChange={(e) => setTotalQuestions(e.target.value)}
            placeholder="Enter total questions"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="correctAnswers">Correct Answers</Label>
          <Input
            id="correctAnswers"
            type="number"
            min="0"
            value={correctAnswers}
            onChange={(e) => setCorrectAnswers(e.target.value)}
            placeholder="Enter correct answers"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="remarks">Remarks (Optional)</Label>
          <Textarea
            id="remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add any remarks or notes..."
            rows={3}
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Saving..." : "Save Revision"}
        </Button>
      </form>
    </div>
  );
};

export default AddRevision;