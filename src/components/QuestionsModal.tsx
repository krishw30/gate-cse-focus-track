import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Search, Filter, SortAsc } from "lucide-react";

const subjects = [
  "All Subjects",
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

const questionTypes = ["DPP", "PYQ", "Unacademy Workbook", "Other"];
const importanceLevels = ["1", "2", "3"];
const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "type-asc", label: "Type (A-Z)" },
  { value: "type-desc", label: "Type (Z-A)" },
  { value: "importance-high", label: "Importance (High → Low)" },
  { value: "importance-low", label: "Importance (Low → High)" }
];

interface Question {
  id: string;
  subject: string;
  type: string;
  importanceLevel: number;
  question: string;
  remarks: string;
  timestamp: any;
}

const QuestionsModal = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedImportance, setSelectedImportance] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, "questions"), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const questionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Question));
      setQuestions(questionsData);
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch questions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchQuestions();
    }
  }, [isOpen]);

  useEffect(() => {
    let filtered = [...questions];

    // Filter by subject
    if (selectedSubject !== "All Subjects") {
      filtered = filtered.filter(q => q.subject === selectedSubject);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(q => 
        q.question.toLowerCase().includes(query) ||
        q.remarks.toLowerCase().includes(query)
      );
    }

    // Filter by types
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(q => selectedTypes.includes(q.type));
    }

    // Filter by importance levels
    if (selectedImportance.length > 0) {
      filtered = filtered.filter(q => selectedImportance.includes(q.importanceLevel.toString()));
    }

    // Sort
    switch (sortBy) {
      case "oldest":
        filtered.sort((a, b) => a.timestamp?.seconds - b.timestamp?.seconds);
        break;
      case "type-asc":
        filtered.sort((a, b) => a.type.localeCompare(b.type));
        break;
      case "type-desc":
        filtered.sort((a, b) => b.type.localeCompare(a.type));
        break;
      case "importance-high":
        filtered.sort((a, b) => b.importanceLevel - a.importanceLevel);
        break;
      case "importance-low":
        filtered.sort((a, b) => a.importanceLevel - b.importanceLevel);
        break;
      default: // newest
        filtered.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);
    }

    setFilteredQuestions(filtered);
  }, [questions, selectedSubject, searchQuery, selectedTypes, selectedImportance, sortBy]);

  const handleTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setSelectedTypes(prev => [...prev, type]);
    } else {
      setSelectedTypes(prev => prev.filter(t => t !== type));
    }
  };

  const handleImportanceChange = (level: string, checked: boolean) => {
    if (checked) {
      setSelectedImportance(prev => [...prev, level]);
    } else {
      setSelectedImportance(prev => prev.filter(l => l !== level));
    }
  };

  const clearFilters = () => {
    setSelectedSubject("All Subjects");
    setSearchQuery("");
    setSelectedTypes([]);
    setSelectedImportance([]);
    setSortBy("newest");
  };

  const getImportanceColor = (level: number) => {
    switch (level) {
      case 1: return "bg-green-100 text-green-800 border-green-200";
      case 2: return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 3: return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getImportanceLabel = (level: number) => {
    switch (level) {
      case 1: return "Low";
      case 2: return "Medium";
      case 3: return "High";
      default: return "Unknown";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="font-medium">
          📝 Questions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Questions Library
          </DialogTitle>
          <DialogDescription>
            Browse and search through your saved questions
          </DialogDescription>
        </DialogHeader>

        {/* Filters and Search */}
        <div className="space-y-4 border-b pb-4">
          {/* Subject and Search */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue />
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
            <div className="space-y-2">
              <Label>Search Questions</Label>
              <Input
                placeholder="Search in questions and remarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Sort and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Question Types</Label>
              <div className="flex flex-wrap gap-2">
                {questionTypes.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={selectedTypes.includes(type)}
                      onCheckedChange={(checked) => handleTypeChange(type, !!checked)}
                    />
                    <label htmlFor={`type-${type}`} className="text-sm">
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Importance Level</Label>
              <div className="flex flex-wrap gap-2">
                {importanceLevels.map((level) => (
                  <div key={level} className="flex items-center space-x-2">
                    <Checkbox
                      id={`importance-${level}`}
                      checked={selectedImportance.includes(level)}
                      onCheckedChange={(checked) => handleImportanceChange(level, !!checked)}
                    />
                    <label htmlFor={`importance-${level}`} className="text-sm">
                      {level}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Showing {filteredQuestions.length} of {questions.length} questions
            </div>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2">Loading questions...</span>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="mb-4">📝</div>
              <h3 className="text-lg font-medium mb-2">
                {questions.length === 0 ? "No questions found" : "No questions match your filters"}
              </h3>
              <p>
                {questions.length === 0 
                  ? "Add questions to see them here." 
                  : "Try adjusting your search or filter criteria."
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredQuestions.map((question) => (
                <Card key={question.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{question.subject}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{question.type}</Badge>
                          <Badge 
                            className={getImportanceColor(question.importanceLevel)}
                            variant="outline"
                          >
                            {getImportanceLabel(question.importanceLevel)} Priority
                          </Badge>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Question:</h4>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {question.question}
                        </p>
                      </div>
                      {question.remarks && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Remarks:</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {question.remarks}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionsModal;