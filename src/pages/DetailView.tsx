import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RevisionData } from "@/lib/chartUtils";

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

const questionTypes = ["DPP", "PYQ", "Unacademy Workbook", "Other"];
const importanceLevels = ["1", "2", "3"];
const periodFilters = ["Last 7 days", "Last 30 days", "This Month", "This Year", "All Time"];

interface Question {
  id: string;
  subject: string;
  type: string;
  question: string;
  remarks: string;
  importanceLevel: number;
  timestamp: any;
}

const DetailView = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get initial filters from URL params
  const initialSubject = searchParams.get('subject') || '';
  const initialType = searchParams.get('type') || '';
  const dataSource = searchParams.get('source') || 'revisions'; // 'revisions' or 'questions'
  
  // Filters state
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);
  const [selectedType, setSelectedType] = useState(initialType);
  const [customType, setCustomType] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('All Time');
  const [selectedImportance, setSelectedImportance] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data state
  const [revisions, setRevisions] = useState<RevisionData[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterData();
  }, [revisions, questions, selectedSubject, selectedType, selectedPeriod, selectedImportance, searchQuery, dataSource]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch revisions
      if (dataSource === 'revisions' || dataSource === 'all') {
        const revisionsQuery = query(collection(db, "revisions"), orderBy("timestamp", "desc"));
        const revisionsSnapshot = await getDocs(revisionsQuery);
        const revisionsData = revisionsSnapshot.docs.map(doc => doc.data()) as RevisionData[];
        setRevisions(revisionsData);
      }

      // Fetch questions
      if (dataSource === 'questions' || dataSource === 'all') {
        const questionsQuery = query(collection(db, "questions"), orderBy("timestamp", "desc"));
        const questionsSnapshot = await getDocs(questionsQuery);
        const questionsData = questionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Question[];
        setQuestions(questionsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterData = () => {
    let data: any[] = [];
    
    if (dataSource === 'revisions') {
      data = revisions.map(rev => ({ ...rev, dataType: 'revision' }));
    } else if (dataSource === 'questions') {
      data = questions.map(q => ({ ...q, dataType: 'question' }));
    } else {
      data = [
        ...revisions.map(rev => ({ ...rev, dataType: 'revision' })),
        ...questions.map(q => ({ ...q, dataType: 'question' }))
      ];
    }

    // Apply filters
    let filtered = data;

    // Subject filter
    if (selectedSubject) {
      filtered = filtered.filter(item => item.subject === selectedSubject);
    }

    // Type filter
    if (selectedType) {
      const typeToFilter = selectedType === 'Other' ? customType : selectedType;
      filtered = filtered.filter(item => item.type === typeToFilter);
    }

    // Period filter
    if (selectedPeriod !== 'All Time') {
      const now = new Date();
      let cutoffDate = new Date();
      
      switch (selectedPeriod) {
        case 'Last 7 days':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'Last 30 days':
          cutoffDate.setDate(now.getDate() - 30);
          break;
        case 'This Month':
          cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'This Year':
          cutoffDate = new Date(now.getFullYear(), 0, 1);
          break;
      }

      filtered = filtered.filter(item => {
        const itemDate = item.dataType === 'revision' 
          ? new Date(item.date) 
          : item.timestamp?.toDate ? item.timestamp.toDate() : new Date(item.timestamp);
        return itemDate >= cutoffDate;
      });
    }

    // Importance filter (for questions)
    if (selectedImportance && dataSource !== 'revisions') {
      filtered = filtered.filter(item => 
        item.dataType === 'question' && 
        item.importanceLevel?.toString() === selectedImportance
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        (item.question && item.question.toLowerCase().includes(query)) ||
        (item.remarks && item.remarks.toLowerCase().includes(query)) ||
        (item.weakTopics && item.weakTopics.toLowerCase().includes(query))
      );
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const exportCSV = () => {
    if (filteredData.length === 0) {
      toast({
        title: "Warning",
        description: "No data to export",
        variant: "destructive"
      });
      return;
    }

    let csvContent = '';
    if (dataSource === 'questions') {
      csvContent = 'Date,Subject,Type,Question,Remarks,Importance Level\n';
      filteredData.forEach(item => {
        const date = item.timestamp?.toDate ? item.timestamp.toDate().toISOString().split('T')[0] : '';
        csvContent += `"${date}","${item.subject}","${item.type}","${item.question?.replace(/"/g, '""') || ''}","${item.remarks?.replace(/"/g, '""') || ''}","${item.importanceLevel || ''}"\n`;
      });
    } else {
      csvContent = 'Date,Subject,Type,Total Questions,Correct,Wrong,Accuracy (%),Weak Topics,Remarks\n';
      filteredData.forEach(item => {
        if (item.dataType === 'revision') {
          const accuracy = item.numQuestions > 0 ? ((item.numCorrect / item.numQuestions) * 100).toFixed(1) : '0';
          const wrong = item.numQuestions - item.numCorrect;
          csvContent += `"${item.date}","${item.subject}","${item.type || 'Other'}","${item.numQuestions}","${item.numCorrect}","${wrong}","${accuracy}","${item.weakTopics || ''}","${item.remarks || ''}"\n`;
        }
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataSource}-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">
            {dataSource === 'questions' ? 'Questions' : dataSource === 'revisions' ? 'Revisions' : 'All Data'} Detail View
          </h1>
        </div>
        <Button variant="outline" onClick={exportCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Subject Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  {questionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Type Input */}
            {selectedType === 'Other' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Custom Type</label>
                <Input
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  placeholder="Enter custom type"
                />
              </div>
            )}

            {/* Period Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodFilters.map((period) => (
                    <SelectItem key={period} value={period}>
                      {period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Importance Filter (only for questions) */}
            {dataSource !== 'revisions' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Importance</label>
                <Select value={selectedImportance} onValueChange={setSelectedImportance}>
                  <SelectTrigger>
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All levels</SelectItem>
                    {importanceLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        Level {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions, remarks..."
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            Results ({filteredData.length} {filteredData.length === 1 ? 'item' : 'items'})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No data matches your current filters.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedData.map((item, index) => (
                  <Card key={`${item.dataType}-${item.id || index}`} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      {item.dataType === 'revision' ? (
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg">{item.subject}</h3>
                              <p className="text-sm text-muted-foreground">
                                {item.date} • {item.type || 'Other'}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">
                                {((item.numCorrect / item.numQuestions) * 100).toFixed(1)}%
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {item.numCorrect}/{item.numQuestions} correct
                              </div>
                            </div>
                          </div>
                          
                          {item.weakTopics && (
                            <div>
                              <p className="text-sm font-medium">Weak Topics:</p>
                              <p className="text-sm text-muted-foreground">{item.weakTopics}</p>
                            </div>
                          )}
                          
                          {item.remarks && (
                            <div>
                              <p className="text-sm font-medium">Remarks:</p>
                              <p className="text-sm text-muted-foreground">{item.remarks}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{item.subject}</h3>
                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                  {item.type}
                                </span>
                                <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded">
                                  Level {item.importanceLevel}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleDateString() : ''}
                              </p>
                              <div className="bg-muted/30 p-3 rounded-lg">
                                <p className="text-sm">{item.question}</p>
                              </div>
                            </div>
                          </div>
                          
                          {item.remarks && (
                            <div>
                              <p className="text-sm font-medium">Remarks:</p>
                              <p className="text-sm text-muted-foreground">{item.remarks}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DetailView;