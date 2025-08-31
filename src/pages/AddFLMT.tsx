import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const formSchema = z.object({
  date: z.date({
    required_error: "Please select a date",
  }),
  testName: z.string().min(1, "Test name is required"),
  correct: z.number().min(0, "Must be 0 or greater").max(65, "Cannot exceed 65"),
  incorrect: z.number().min(0, "Must be 0 or greater").max(65, "Cannot exceed 65"),
  marks: z.number().min(0, "Must be 0 or greater"),
  timeSpent: z.number().min(1, "Must be at least 1 minute"),
  remarks: z.string().optional(),
}).refine((data) => {
  return data.correct + data.incorrect <= 65;
}, {
  message: "Total of correct and incorrect cannot exceed 65",
  path: ["incorrect"],
});

type FormData = z.infer<typeof formSchema>;

const AddFLMT = () => {
  const [weakSubjects, setWeakSubjects] = useState<string[]>([]);
  const [newWeakSubject, setNewWeakSubject] = useState("");
  const [importantQuestions, setImportantQuestions] = useState<string[]>([]);
  const [newImportantQuestion, setNewImportantQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      testName: "",
      correct: 0,
      incorrect: 0,
      marks: 0,
      timeSpent: 180, // Default 3 hours
      remarks: "",
    },
  });

  const watchedValues = form.watch(['correct', 'incorrect', 'marks', 'timeSpent']);
  const [correct, incorrect, marks, timeSpent] = watchedValues;

  // Auto-calculated values
  const unattempted = Math.max(0, 65 - (correct || 0) - (incorrect || 0));
  const accuracy = correct ? ((correct / 65) * 100).toFixed(1) : '0.0';
  const marksPerMinute = (timeSpent && timeSpent > 0) ? (marks / timeSpent).toFixed(2) : '0.00';

  const addWeakSubject = () => {
    if (newWeakSubject.trim() && !weakSubjects.includes(newWeakSubject.trim())) {
      setWeakSubjects([...weakSubjects, newWeakSubject.trim()]);
      setNewWeakSubject("");
    }
  };

  const removeWeakSubject = (index: number) => {
    setWeakSubjects(weakSubjects.filter((_, i) => i !== index));
  };

  const addImportantQuestion = () => {
    if (newImportantQuestion.trim()) {
      setImportantQuestions([...importantQuestions, newImportantQuestion.trim()]);
      setNewImportantQuestion("");
    }
  };

  const removeImportantQuestion = (index: number) => {
    setImportantQuestions(importantQuestions.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      const flmtData = {
        date: format(data.date, 'yyyy-MM-dd'),
        testName: data.testName,
        correct: data.correct,
        incorrect: data.incorrect,
        marks: data.marks,
        timeSpent: data.timeSpent,
        weakSubjects,
        remarks: data.remarks,
        importantQuestions,
        timestamp: new Date(),
        // Auto-calculated fields are calculated on the frontend during display
      };

      await addDoc(collection(db, "fmt"), flmtData);
      
      toast({
        title: "Success",
        description: "Full Length Mock Test added successfully!",
      });

      // Reset form
      form.reset();
      setWeakSubjects([]);
      setImportantQuestions([]);
      setNewWeakSubject("");
      setNewImportantQuestion("");
      
    } catch (error) {
      console.error("Error adding FLMT:", error);
      toast({
        title: "Error",
        description: "Failed to add Full Length Mock Test. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center font-semibold">Add Full Length Mock Test</h1>
      
      <Card className="shadow-lg border-0 rounded-xl" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-xl font-semibold text-foreground">FLMT Details</CardTitle>
          <CardDescription>
            Track your Full Length Mock Test performance and insights
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Date and Test Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date()}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="testName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. GATE 2025 Mock Test 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="correct"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correct Answers</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="65" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="incorrect"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incorrect Answers</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="65" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="marks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Marks</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Time Spent */}
              <FormField
                control={form.control}
                name="timeSpent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Spent (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        placeholder="e.g. 180 (3 hours)"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Auto-calculated Display */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-medium text-sm text-muted-foreground mb-2">Auto-calculated Values</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Unattempted:</span>
                    <span className="font-medium">{unattempted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Accuracy:</span>
                    <span className="font-medium">{accuracy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Marks/Minute:</span>
                    <span className="font-medium">{marksPerMinute}</span>
                  </div>
                </div>
              </div>

              {/* Weak Subjects */}
              <div className="space-y-3">
                <FormLabel>Weak Subjects</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add weak subject"
                    value={newWeakSubject}
                    onChange={(e) => setNewWeakSubject(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addWeakSubject())}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addWeakSubject}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {weakSubjects.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {weakSubjects.map((subject, index) => (
                      <div key={index} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm">
                        {subject}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 w-4 h-4"
                          onClick={() => removeWeakSubject(index)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Important Questions */}
              <div className="space-y-3">
                <FormLabel>Important Questions</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add important question"
                    value={newImportantQuestion}
                    onChange={(e) => setNewImportantQuestion(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImportantQuestion())}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addImportantQuestion}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {importantQuestions.length > 0 && (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {importantQuestions.map((question, index) => (
                      <div key={index} className="flex items-start gap-2 bg-muted/50 p-2 rounded-md text-sm">
                        <span className="flex-1">{question}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 w-4 h-4 mt-0.5"
                          onClick={() => removeImportantQuestion(index)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Remarks */}
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional notes about this test..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full font-medium" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding..." : "Add FLMT Record"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddFLMT;