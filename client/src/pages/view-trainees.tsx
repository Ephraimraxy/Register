import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Download, Edit, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TraineeWithUser } from "@/lib/types";

export default function ViewTraineesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  const { data: trainees = [], isLoading } = useQuery({
    queryKey: ["/api/trainees"],
    queryFn: async () => {
      const response = await fetch("/api/trainees");
      if (!response.ok) {
        throw new Error("Failed to fetch trainees");
      }
      return response.json() as Promise<TraineeWithUser[]>;
    },
  });

  const deleteTraineeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/trainees/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainees"] });
      toast({
        title: "Success",
        description: "Trainee deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to delete trainee",
        variant: "destructive",
      });
    },
  });

  const filteredTrainees = trainees.filter(trainee => {
    const matchesSearch = searchTerm === "" || 
      `${trainee.user.firstName} ${trainee.user.surname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainee.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainee.tagNumber.includes(searchTerm);
    
    const matchesGender = genderFilter === "" || trainee.gender === genderFilter;
    const matchesState = stateFilter === "" || trainee.state === stateFilter;
    
    return matchesSearch && matchesGender && matchesState;
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      deleteTraineeMutation.mutate(id);
    }
  };

  const formatRoomAssignment = (trainee: TraineeWithUser) => {
    if (trainee.roomBlock && trainee.roomNumber) {
      return `${trainee.roomBlock} Room ${trainee.roomNumber}`;
    }
    return "Not assigned";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading trainees...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Registered Trainees</h2>
                <p className="text-gray-600">Manage and view all registered trainees</p>
              </div>
              <div className="flex space-x-3">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Download className="mr-2" size={16} />
                  Export
                </Button>
                <Link href="/">
                  <Button variant="outline" className="bg-gray-600 text-white hover:bg-gray-700">
                    <ArrowLeft className="mr-2" size={16} />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="mb-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input 
                  placeholder="Search trainees..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Genders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All States</SelectItem>
                  <SelectItem value="lagos">Lagos</SelectItem>
                  <SelectItem value="fct">FCT Abuja</SelectItem>
                  <SelectItem value="kano">Kano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Trainees Table */}
            {filteredTrainees.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No trainees found</p>
                <Link href="/registration/trainee">
                  <Button className="mt-4 bg-green-600 hover:bg-green-700">
                    Register First Trainee
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tag #</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Sponsor</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrainees.map((trainee) => (
                      <TableRow key={trainee.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{trainee.tagNumber}</TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {trainee.user.firstName} {trainee.user.surname}
                          </div>
                          <div className="text-sm text-gray-500">{trainee.dateOfBirth}</div>
                        </TableCell>
                        <TableCell className="capitalize">{trainee.gender}</TableCell>
                        <TableCell>{formatRoomAssignment(trainee)}</TableCell>
                        <TableCell>
                          {trainee.sponsor ? trainee.sponsor.name : "Self Sponsored"}
                        </TableCell>
                        <TableCell>
                          {trainee.batch ? `${trainee.batch.name} ${trainee.batch.year}` : "No Batch"}
                        </TableCell>
                        <TableCell className="capitalize">{trainee.state}</TableCell>
                        <TableCell>{trainee.user.email}</TableCell>
                        <TableCell>{trainee.user.phone}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-blue-600 hover:text-blue-900"
                              onClick={() => {
                                // TODO: Implement edit functionality
                                toast({
                                  title: "Coming Soon",
                                  description: "Edit functionality will be available soon",
                                });
                              }}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-600 hover:text-red-900"
                              onClick={() => handleDelete(trainee.id, `${trainee.user.firstName} ${trainee.user.surname}`)}
                              disabled={deleteTraineeMutation.isPending}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {filteredTrainees.length > 0 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to{" "}
                  <span className="font-medium">{filteredTrainees.length}</span> of{" "}
                  <span className="font-medium">{filteredTrainees.length}</span> results
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button size="sm" className="bg-blue-600">
                    1
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
