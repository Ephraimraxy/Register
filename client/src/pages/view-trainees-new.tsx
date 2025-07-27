import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Search, 
  ArrowLeft,
  Users,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTrainees, type Trainee } from "@/lib/firebaseService";

export default function ViewTraineesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");

  const { data: trainees = [], isLoading } = useQuery({
    queryKey: ['trainees'],
    queryFn: getTrainees,
  });

  const filteredTrainees = trainees.filter(trainee => {
    const matchesSearch = searchTerm === "" || 
      `${trainee.firstName} ${trainee.surname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainee.tagNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainee.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGender = genderFilter === "" || genderFilter === "all" || trainee.gender === genderFilter;
    const matchesState = stateFilter === "" || stateFilter === "all" || trainee.state === stateFilter;
    
    return matchesSearch && matchesGender && matchesState;
  });

  const exportToCSV = () => {
    const headers = ['Tag Number', 'Name', 'Email', 'Phone', 'Gender', 'State', 'LGA', 'Room'];
    const csvContent = [
      headers.join(','),
      ...filteredTrainees.map((trainee, index) => [
        trainee.tagNumber,
        `${trainee.firstName} ${trainee.surname}`,
        trainee.email,
        trainee.phone,
        trainee.gender,
        trainee.state,
        trainee.lga,
        trainee.roomNumber ? `${trainee.roomBlock}-${trainee.roomNumber}` : 'Not assigned'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trainees.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading trainees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="mr-2" size={16} />
                    Back to Home
                  </Button>
                </Link>
                <div>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 text-blue-600" size={24} />
                    Registered Trainees
                  </CardTitle>
                  <CardDescription>
                    View and manage all registered trainees ({filteredTrainees.length} total)
                  </CardDescription>
                </div>
              </div>
              <Button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700">
                <Download className="mr-2" size={16} />
                Export CSV
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, tag, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>

              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {Array.from(new Set(trainees.map(t => t.state))).map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setGenderFilter("all");
                  setStateFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </div>

            {/* Trainees Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tag Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrainees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-gray-500">
                          <Users className="mx-auto h-12 w-12 mb-4 opacity-20" />
                          {trainees.length === 0 ? "No trainees registered yet" : "No trainees match your filters"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTrainees.map((trainee) => (
                      <TableRow key={trainee.id}>
                        <TableCell className="font-mono font-medium">
                          {trainee.tagNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {trainee.firstName} {trainee.surname}
                            </div>
                            {trainee.middleName && (
                              <div className="text-sm text-gray-500">
                                {trainee.middleName}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{trainee.email}</div>
                            <div className="text-gray-500">{trainee.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={trainee.gender === "male" ? "default" : "secondary"}>
                            {trainee.gender}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{trainee.state}</div>
                            <div className="text-gray-500">{trainee.lga}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {trainee.roomNumber && trainee.roomBlock ? (
                            <Badge variant="outline">
                              {trainee.roomBlock}-{trainee.roomNumber}
                            </Badge>
                          ) : (
                            <span className="text-gray-500 text-sm">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={trainee.isVerified ? "default" : "destructive"}>
                            {trainee.isVerified ? "Verified" : "Pending"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">
                    {filteredTrainees.length}
                  </div>
                  <p className="text-sm text-gray-600">Total Trainees</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">
                    {filteredTrainees.filter(t => t.roomNumber).length}
                  </div>
                  <p className="text-sm text-gray-600">Assigned Rooms</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-purple-600">
                    {filteredTrainees.filter(t => t.isVerified).length}
                  </div>
                  <p className="text-sm text-gray-600">Verified</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}