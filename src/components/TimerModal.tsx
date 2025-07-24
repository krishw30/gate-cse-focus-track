import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

interface TimerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartSession: (subject: string) => void;
}

const TimerModal = ({ open, onOpenChange, onStartSession }: TimerModalProps) => {
  const [selectedSubject, setSelectedSubject] = useState("");
  const { toast } = useToast();

  const handleStartSession = () => {
    if (!selectedSubject) {
      toast({
        title: "Error",
        description: "Please select a subject",
        variant: "destructive"
      });
      return;
    }

    // Store session data in localStorage
    const sessionData = {
      subject: selectedSubject,
      startTime: new Date().toISOString()
    };
    localStorage.setItem('revisionSession', JSON.stringify(sessionData));
    
    onStartSession(selectedSubject);
    onOpenChange(false);
    setSelectedSubject("");
    
    toast({
      title: "Session Started",
      description: `Revision session started for ${selectedSubject}`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start Revision Session</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleStartSession} className="flex-1">
              Start Session
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimerModal;