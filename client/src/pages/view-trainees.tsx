import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Download, Edit, Trash2, Search, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getTrainees, deleteDocument, synchronizeAllocations, migrateExistingTrainees } from "@/lib/firebaseService";
import type { Trainee } from "@/lib/firebaseService";

export default function ViewTraineesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [allocationFilter, setAllocationFilter] = useState("");

  const { data: trainees = [], isLoading } = useQuery({
    queryKey: ["trainees"],
    queryFn: getTrainees,
  });

  // Debug: Log trainees data
  console.log("Trainees data:", trainees);

  const synchronizeMutation = useMutation({
    mutationFn: synchronizeAllocations,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      toast({
        title: "Synchronization Complete",
        description: `Allocated: ${result.allocated}, No Rooms: ${result.noRooms}, No Tags: ${result.noTags}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Synchronization Failed",
        description: "Failed to synchronize allocations. Please try again.",
        variant: "destructive",
      });
    },
  });

  const migrateMutation = useMutation({
    mutationFn: migrateExistingTrainees,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      toast({
        title: "Migration Complete",
        description: "Existing trainees have been updated with allocation status.",
      });
    },
    onError: (error) => {
      toast({
        title: "Migration Failed",
        description: "Failed to migrate existing trainees. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteTraineeMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteDocument("trainees", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
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
      `${trainee.firstName} ${trainee.surname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainee.tagNumber.includes(searchTerm);
    
    const matchesGender = genderFilter === "" || trainee.gender === genderFilter;
    const matchesState = stateFilter === "" || trainee.state === stateFilter;
    const matchesAllocation = allocationFilter === "" || trainee.allocationStatus === allocationFilter;
    
    return matchesSearch && matchesGender && matchesState && matchesAllocation;
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      deleteTraineeMutation.mutate(id);
    }
  };

  const formatRoomAssignment = (trainee: Trainee) => {
    console.log("Formatting room assignment for trainee:", trainee);
    if (trainee.roomBlock && trainee.roomNumber && trainee.roomBlock !== 'pending' && trainee.roomNumber !== 'pending') {
      const bedSpace = trainee.bedSpace && trainee.bedSpace !== 'pending' ? ` (${trainee.bedSpace})` : '';
      return `${trainee.roomBlock} Room ${trainee.roomNumber}${bedSpace}`;
    }
    return "Pending allocation";
  };

  const formatTagNumber = (trainee: Trainee) => {
    console.log("Formatting tag number for trainee:", trainee);
    if (trainee.tagNumber && trainee.tagNumber !== 'pending' && trainee.tagNumber !== '') {
      return trainee.tagNumber;
    }
    return "Pending allocation";
  };

  const getStatusBadge = (trainee: Trainee) => {
    console.log("Getting status badge for trainee:", trainee);
    console.log("Allocation status:", trainee.allocationStatus);
    
    // Handle trainees that don't have allocationStatus yet
    if (!trainee.allocationStatus) {
      // Determine status based on existing data
      if (trainee.tagNumber && trainee.tagNumber !== 'pending' && 
          trainee.roomNumber && trainee.roomNumber !== 'pending') {
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Allocated</Badge>;
      } else if (!trainee.tagNumber || trainee.tagNumber === 'pending') {
        return <Badge variant="destructive">No Tags</Badge>;
      } else if (!trainee.roomNumber || trainee.roomNumber === 'pending') {
        return <Badge variant="destructive">No Rooms</Badge>;
      } else {
        return <Badge variant="outline" className="text-yellow-600">Pending</Badge>;
      }
    }
    
    switch (trainee.allocationStatus) {
      case 'allocated':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Allocated</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600">Pending</Badge>;
      case 'no_rooms':
        return <Badge variant="destructive">No Rooms</Badge>;
      case 'no_tags':
        return <Badge variant="destructive">No Tags</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
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
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => synchronizeMutation.mutate()}
                  disabled={synchronizeMutation.isPending}
                >
                  <RefreshCw className={`mr-2 ${synchronizeMutation.isPending ? 'animate-spin' : ''}`} size={16} />
                  {synchronizeMutation.isPending ? 'Synchronizing...' : 'Sync Allocations'}
                </Button>
                <Button 
                  className="bg-orange-600 hover:bg-orange-700"
                  onClick={() => migrateMutation.mutate()}
                  disabled={migrateMutation.isPending}
                >
                  <AlertCircle className={`mr-2 ${migrateMutation.isPending ? 'animate-spin' : ''}`} size={16} />
                  {migrateMutation.isPending ? 'Migrating...' : 'Migrate Data'}
                </Button>
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
              <Select value={allocationFilter} onValueChange={setAllocationFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="allocated">Allocated</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="no_rooms">No Rooms</SelectItem>
                  <SelectItem value="no_tags">No Tags</SelectItem>
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
                      <TableHead>Status</TableHead>
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
                        <TableCell>{getStatusBadge(trainee)}</TableCell>
                        <TableCell className="font-medium">{formatTagNumber(trainee)}</TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {trainee.firstName} {trainee.surname}
                          </div>
                          <div className="text-sm text-gray-500">{trainee.dateOfBirth}</div>
                        </TableCell>
                        <TableCell className="capitalize">{trainee.gender}</TableCell>
                        <TableCell>{formatRoomAssignment(trainee)}</TableCell>
                        <TableCell>
                          {trainee.sponsorId ? `Sponsor ID: ${trainee.sponsorId}` : "Self Sponsored"}
                        </TableCell>
                        <TableCell>
                          {trainee.batchId ? `Batch ID: ${trainee.batchId}` : "No Batch"}
                        </TableCell>
                        <TableCell className="capitalize">{trainee.state}</TableCell>
                        <TableCell>{trainee.email}</TableCell>
                        <TableCell>{trainee.phone}</TableCell>
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
                              onClick={() => handleDelete(trainee.id, `${trainee.firstName} ${trainee.surname}`)}
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
