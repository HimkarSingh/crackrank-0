import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, X, CheckCircle, Circle, LogIn, Target } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Problems() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<string[]>([]);

  // Fetch problems from database
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const { data, error } = await supabase
          .from('problems')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const formattedProblems = (data || []).map(p => ({
          id: p.id,
          title: p.title,
          difficulty: p.difficulty,
          topic: (p.topics as string[])?.[0] || p.topic || 'General',
          acceptanceRate: p.acceptance_rate || 0,
          solved: p.is_solved || false,
          topics: (p.topics as string[]) || []
        }));
        
        setProblems(formattedProblems);
        
        // Extract unique topics
        const allTopics = new Set<string>();
        formattedProblems.forEach(p => {
          p.topics.forEach((t: string) => allTopics.add(t));
          if (p.topic) allTopics.add(p.topic);
        });
        setTopics(Array.from(allTopics).sort());
      } catch (err) {
        console.error('Error fetching problems:', err);
        toast({
          title: "Error",
          description: "Failed to load problems",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, [toast]);

  const filteredProblems = useMemo(() => {
    return problems.filter(problem => {
      const matchesSearch = problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           problem.id.toString().includes(searchTerm);
      const matchesDifficulty = selectedDifficulty === "all" || problem.difficulty === selectedDifficulty;
      const matchesTopic = selectedTopic === "all" || problem.topic === selectedTopic;

      return matchesSearch && matchesDifficulty && matchesTopic;
    });
  }, [problems, searchTerm, selectedDifficulty, selectedTopic]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "border-emerald-400 text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 group-hover:text-emerald-500 group-hover:bg-emerald-500/20 transition-colors duration-200";
      case "Medium": return "border-amber-400 text-amber-600 dark:text-amber-300 bg-amber-500/10 group-hover:text-amber-500 group-hover:bg-amber-500/20 transition-colors duration-200";
      case "Hard": return "border-red-400 text-red-600 dark:text-red-300 bg-red-500/10 group-hover:text-red-500 group-hover:bg-red-500/20 transition-colors duration-200";
      default: return "border-border text-muted-foreground";
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDifficulty("all");
    setSelectedTopic("all");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading problems...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-inter">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Login Banner for Non-Authenticated Users */}
        {!user && (
          <Card className="mb-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Join Our Coding Community!</h3>
                  <p className="text-sm text-muted-foreground">Sign up to track your progress, save solutions, and compete with others</p>
                </div>
                <Button onClick={() => navigate('/auth')} className="shrink-0">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign Up
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                Coding Problems
              </h1>
              <p className="text-muted-foreground">
                {user ? "Solve coding challenges to improve your interview skills" : "Explore our coding challenges - sign up to track your progress!"}
              </p>
            </div>
            <Button 
              onClick={() => navigate('/roadmap')} 
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
            >
              <Target className="h-4 w-4 mr-2" />
              Coding100 Roadmap
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8 border border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-card-foreground">Filters:</span>
              </div>
              
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-40 bg-background border-border">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulty</SelectItem>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger className="w-48 bg-background border-border">
                  <SelectValue placeholder="Topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  {topics.slice(0, 8).map(topic => (
                    <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search problems..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background border-border"
                />
              </div>

              {(selectedDifficulty !== "all" || selectedTopic !== "all" || searchTerm) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="bg-transparent border-border text-foreground hover:bg-accent"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Problems Content */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Problems</TabsTrigger>
            <TabsTrigger value="roadmap">Roadmap Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
              <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-accent/30">
                <TableHead className="text-card-foreground">Problem</TableHead>
                <TableHead className="text-card-foreground">Difficulty</TableHead>
                <TableHead className="text-card-foreground">Topic</TableHead>
                <TableHead className="text-card-foreground">Acceptance Rate</TableHead>
                <TableHead className="text-card-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProblems.map((problem) => (
                <TableRow 
                  key={problem.id} 
                  className="border-border/30 hover:bg-accent/20 cursor-pointer transition-all duration-200 group"
                  onClick={() => navigate(`/problem/${problem.id}`)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <span className="text-card-foreground group-hover:text-primary transition-colors">
                        {problem.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`${getDifficultyColor(problem.difficulty)} group-hover:shadow-[0_0_8px_rgba(255,255,255,0.2)] border cursor-pointer`}
                    >
                      {problem.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground group-hover:text-card-foreground transition-colors">
                      {problem.topic}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`font-semibold px-2 py-1 rounded transition-colors duration-200
                        ${problem.acceptanceRate >= 70
                          ? 'text-emerald-600 dark:text-emerald-300 bg-emerald-500/10'
                          : problem.acceptanceRate >= 40
                          ? 'text-amber-600 dark:text-amber-300 bg-amber-500/10'
                          : 'text-red-600 dark:text-red-300 bg-red-500/10'}
                        group-hover:bg-opacity-30 group-hover:shadow-md
                      `}
                    >
                      {problem.acceptanceRate}%
                    </span>
                  </TableCell>
                  <TableCell>
                    {problem.solved ? (
                      <CheckCircle className="h-5 w-5 text-emerald-500 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
              </TableBody>
            </Table>
          </Card>
          </TabsContent>
          
          <TabsContent value="roadmap">
            <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Target className="h-16 w-16 mx-auto mb-4 text-primary" />
                  <h3 className="text-xl font-semibold mb-2">Coding100 Roadmap</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Follow our structured learning path with carefully selected problems 
                    arranged in optimal order for interview preparation.
                  </p>
                  <Button onClick={() => navigate('/roadmap')} size="lg">
                    Start Your Journey
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {filteredProblems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No problems found matching your criteria.</p>
            <Button 
              variant="outline" 
              onClick={clearFilters} 
              className="mt-4 bg-transparent border-border text-foreground hover:bg-accent"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}