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
      setNewWeakSubject("");
      
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Add Full Length Mock Test
          </h1>
          <p className="text-xl text-muted-foreground">
            Record your mock test performance and track your progress
          </p>
        </div>
        
        <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-semibold text-center">FLMT Performance Record</CardTitle>
            <CardDescription className="text-center text-base">
              Enter your Full Length Mock Test details to analyze your performance
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">{/* Basic Information */}
              <div className="bg-muted/30 p-6 rounded-xl border border-muted">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Test Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Test Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal h-11 bg-background",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Select test date</span>
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
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
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
                        <FormLabel className="text-sm font-medium">Test Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., GATE 2025 Mock Test 1" 
                            className="h-11 bg-background"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-muted/30 p-6 rounded-xl border border-muted">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Performance Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="correct"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Correct Answers</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="65" 
                            placeholder="0"
                            className="h-11 bg-background"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
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
                        <FormLabel className="text-sm font-medium">Incorrect Answers</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="65" 
                            placeholder="0"
                            className="h-11 bg-background"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
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
                        <FormLabel className="text-sm font-medium">Total Marks</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.1" 
                            placeholder="0"
                            className="h-11 bg-background"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Time and Auto-calculated Stats */}
              <div className="bg-muted/30 p-6 rounded-xl border border-muted">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Time & Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="timeSpent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Time Spent (minutes)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            max="300" 
                            placeholder="180"
                            className="h-11 bg-background"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Auto-calculated Stats */}
                  <div className="space-y-4">
                    <div className="p-6 bg-primary/5 rounded-lg border border-primary/10">
                      <h4 className="text-base font-semibold text-foreground mb-4">Auto-calculated Statistics</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{unattempted}</div>
                          <div className="text-sm text-muted-foreground mt-1">Unattempted</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{accuracy}%</div>
                          <div className="text-sm text-muted-foreground mt-1">Accuracy</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{marksPerMinute}</div>
                          <div className="text-sm text-muted-foreground mt-1">Marks/Min</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weak Subjects */}
              <div className="bg-muted/30 p-6 rounded-xl border border-muted">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Weak Subjects</h3>
                <div className="flex gap-2 mb-4">
                  <Input
                    value={newWeakSubject}
                    onChange={(e) => setNewWeakSubject(e.target.value)}
                    placeholder="Enter a subject you found challenging"
                    className="h-11 bg-background"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addWeakSubject();
                      }
                    }}
                  />
                  <Button type="button" onClick={addWeakSubject} className="px-6">
                    Add
                  </Button>
                </div>
                {weakSubjects.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {weakSubjects.map((subject, index) => (
                      <div key={index} className="flex items-center gap-2 bg-background px-3 py-2 rounded-lg border text-sm">
                        {subject}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => removeWeakSubject(index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>


              {/* Remarks */}
              <div className="bg-muted/30 p-6 rounded-xl border border-muted">
                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold text-foreground">Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Share your thoughts, observations, or areas for improvement from this test..."
                          className="min-h-[120px] bg-background border-muted text-sm leading-relaxed"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium" 
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting Test Data...
                    </div>
                  ) : (
                    "Submit FLMT Performance"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default AddFLMT;