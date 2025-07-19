import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";

interface WeakTopic {
  id: string;
  topic: string;
  subject: string;
  status: string;
  isResolved: boolean;
}

const WeakTopicsModal = () => {
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const fetchWeakTopics = async () => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "weak topics"));
      const topics = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as WeakTopic));
      setWeakTopics(topics);
    } catch (error) {
      console.error("Error fetching weak topics:", error);
      toast({
        title: "Error",
        description: "Failed to fetch weak topics",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveToggle = async (topicId: string, currentStatus: boolean) => {
    try {
      const topicRef = doc(db, "weak topics", topicId);
      await updateDoc(topicRef, {
        isResolved: !currentStatus
      });

      setWeakTopics(prev => 
        prev.map(topic => 
          topic.id === topicId 
            ? { ...topic, isResolved: !currentStatus }
            : topic
        )
      );

      toast({
        title: "Success",
        description: `Topic marked as ${!currentStatus ? 'resolved' : 'unresolved'}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update topic status",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchWeakTopics();
    }
  }, [isOpen]);

  // Group topics by subject
  const groupedTopics = weakTopics.reduce((acc, topic) => {
    if (!acc[topic.subject]) {
      acc[topic.subject] = [];
    }
    acc[topic.subject].push(topic);
    return acc;
  }, {} as Record<string, WeakTopic[]>);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="font-medium">
          🔍 Weak Topics
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Weak Topics Management
          </DialogTitle>
          <DialogDescription>
            Track and manage your weak topics across different subjects. Check off topics when you've mastered them.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Loading weak topics...</span>
          </div>
        ) : Object.keys(groupedTopics).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="mb-4">📚</div>
            <h3 className="text-lg font-medium mb-2">No weak topics recorded</h3>
            <p>Add weak topics in your revision forms to track them here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTopics).map(([subject, topics]) => (
              <div key={subject} className="space-y-3">
                <h3 className="text-lg font-semibold border-b pb-2">
                  {subject}
                </h3>
                <div className="space-y-2">
                  {topics.map((topic) => (
                    <div
                      key={topic.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={topic.id}
                          checked={topic.isResolved}
                          onCheckedChange={() => handleResolveToggle(topic.id, topic.isResolved)}
                        />
                        <label
                          htmlFor={topic.id}
                          className={`font-medium cursor-pointer ${
                            topic.isResolved 
                              ? 'line-through text-muted-foreground' 
                              : ''
                          }`}
                        >
                          {topic.topic}
                        </label>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {topic.isResolved ? '✅ Resolved' : '❌ Weak'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Text format summary */}
            <div className="mt-8 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Summary (Text Format):</h4>
              <div className="text-sm space-y-1 font-mono">
                {Object.entries(groupedTopics).map(([subject, topics]) => (
                  <div key={subject}>
                    {topics.map((topic) => (
                      <div key={topic.id} className={topic.isResolved ? 'text-muted-foreground' : ''}>
                        {subject} → {topic.topic} {topic.isResolved ? '(✅ Resolved)' : '(❌ Weak)'}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WeakTopicsModal;