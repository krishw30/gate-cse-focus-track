import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const questionTypes = [
  "DPP",
  "PYQ",
  "Unacademy Workbook",
  "Other"
];

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddQuestionModal = ({ isOpen, onClose }: AddQuestionModalProps) => {
  const [subject, setSubject] = useState("");
  const [type, setType] = useState("");
  const [customType, setCustomType] = useState("");
  const [importanceLevel, setImportanceLevel] = useState("");
  const [question, setQuestion] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject || !type || !importanceLevel || !question.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (type === "Other" && !customType.trim()) {
      toast({
        title: "Error",
        description: "Please enter custom type when 'Other' is selected",
        variant: "destructive"
      });
      return;
    }

    const importance = parseInt(importanceLevel);
    if (importance < 1 || importance > 3) {
      toast({
        title: "Error",
        description: "Importance level must be between 1 and 3",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const finalType = type === "Other" ? customType : type;
      await addDoc(collection(db, "questions"), {
        subject,
        type: finalType,
        importanceLevel: importance,
        question: question.trim(),
        remarks: remarks.trim(),
        timestamp: serverTimestamp()
      });

      toast({
        title: "Success",
        description: "Question saved successfully!"
      });

      // Reset form
      setSubject("");
      setType("");
      setCustomType("");
      setImportanceLevel("");
      setQuestion("");
      setRemarks("");
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save question",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setSubject("");
    setType("");
    setCustomType("");
    setImportanceLevel("");
    setQuestion("");
    setRemarks("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Question</DialogTitle>
          <DialogDescription>
            Save important questions for future reference and review
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
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
            <Label htmlFor="type">Type *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select question type" />
              </SelectTrigger>
              <SelectContent>
                {questionTypes.map((qType) => (
                  <SelectItem key={qType} value={qType}>
                    {qType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === "Other" && (
            <div className="space-y-2">
              <Label htmlFor="customType">Enter custom type *</Label>
              <Input
                id="customType"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="Enter custom question type"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="importanceLevel">Importance Level (1-3) *</Label>
            <Select value={importanceLevel} onValueChange={setImportanceLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select importance level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Low</SelectItem>
                <SelectItem value="2">2 - Medium</SelectItem>
                <SelectItem value="3">3 - High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="question">Question *</Label>
            <Textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter the question text..."
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add any additional notes or remarks..."
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Saving..." : "Save Question"}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddQuestionModal;