import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RevisionData } from "@/lib/chartUtils";
import { format } from "date-fns";

interface TopicDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string;
  revisions: RevisionData[];
}

const TopicDetailModal = ({ isOpen, onClose, topic, revisions }: TopicDetailModalProps) => {
  // Filter revisions that contain this topic (exact phrase match)
  const topicRevisions = revisions.filter(rev => 
    rev.remarks?.toLowerCase().includes(topic.toLowerCase())
  );

  // Sort by date, most recent first
  const sortedRevisions = [...topicRevisions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold capitalize">{topic}</DialogTitle>
          <DialogDescription>
            All revision sessions related to this topic ({sortedRevisions.length} sessions)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {sortedRevisions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No revision sessions found for this topic.
            </div>
          ) : (
            sortedRevisions.map((revision, index) => {
              const accuracy = revision.numQuestions > 0 
                ? ((revision.numCorrect / revision.numQuestions) * 100).toFixed(1)
                : '0';
              
              return (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-3">
                      {/* Header: Date and Subject */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-medium">
                            {revision.subject}
                          </Badge>
                          <Badge variant="secondary">
                            {revision.type || 'Other'}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(revision.date), 'MMM dd, yyyy')}
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 py-3 px-4 bg-muted/30 rounded-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-chart-accent">
                            {revision.numQuestions}
                          </div>
                          <div className="text-xs text-muted-foreground">Questions</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-chart-accent">
                            {revision.numCorrect}
                          </div>
                          <div className="text-xs text-muted-foreground">Correct</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-chart-accent">
                            {accuracy}%
                          </div>
                          <div className="text-xs text-muted-foreground">Accuracy</div>
                        </div>
                      </div>

                      {/* Remarks */}
                      {revision.remarks && (
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground font-medium mb-1">Remarks:</p>
                          <p className="text-sm">{revision.remarks}</p>
                        </div>
                      )}

                      {/* Time if available */}
                      {revision.timeSpentMinutes && (
                        <div className="text-sm text-muted-foreground">
                          ⏱️ Time: {revision.timeSpentMinutes} minutes
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TopicDetailModal;
