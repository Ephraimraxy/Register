import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Building, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getSponsors, type Sponsor } from "@/lib/firebaseService";

export default function SponsorsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: sponsors = [], isLoading } = useQuery({
    queryKey: ['sponsors'],
    queryFn: getSponsors,
  });

  const filteredSponsors = sponsors.filter(sponsor =>
    sponsor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sponsor.description && sponsor.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sponsors...</p>
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
                    <Building className="mr-2 text-blue-600" size={24} />
                    Sponsors Management
                  </CardTitle>
                  <CardDescription>
                    View and manage training sponsors ({filteredSponsors.length} total)
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Search */}
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search sponsors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Sponsors Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSponsors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <div className="text-gray-500">
                          <Building className="mx-auto h-12 w-12 mb-4 opacity-20" />
                          {sponsors.length === 0 ? "No sponsors registered yet" : "No sponsors match your search"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSponsors.map((sponsor) => (
                      <TableRow key={sponsor.id}>
                        <TableCell className="font-medium">
                          {sponsor.name}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {sponsor.description || "No description"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={sponsor.isActive ? "default" : "secondary"}>
                            {sponsor.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(sponsor.createdAt).toLocaleDateString()}
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
                    {filteredSponsors.length}
                  </div>
                  <p className="text-sm text-gray-600">Total Sponsors</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">
                    {filteredSponsors.filter(s => s.isActive).length}
                  </div>
                  <p className="text-sm text-gray-600">Active Sponsors</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-gray-600">
                    {filteredSponsors.filter(s => !s.isActive).length}
                  </div>
                  <p className="text-sm text-gray-600">Inactive Sponsors</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  const form = useForm<SponsorFormData>({
    resolver: zodResolver(sponsorSchema),
    defaultValues: {
      name: "",
      description: "",
      batchId: "",
    },
  });

  const batchForm = useForm<BatchFormData>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      name: "",
      year: new Date().getFullYear(),
      description: "",
    },
  });

  const { data: sponsors = [], isLoading } = useQuery({
    queryKey: ["/api/sponsors"],
    queryFn: async () => {
      const response = await fetch("/api/sponsors");
      if (!response.ok) {
        throw new Error("Failed to fetch sponsors");
      }
      return response.json() as Promise<Sponsor[]>;
    },
  });

  const { data: batches = [] } = useQuery({
    queryKey: ["/api/batches"],
    queryFn: async () => {
      const response = await fetch("/api/batches");
      if (!response.ok) {
        throw new Error("Failed to fetch batches");
      }
      return response.json() as Promise<Batch[]>;
    },
  });

  const { data: activeBatch } = useQuery({
    queryKey: ["/api/batches/active"],
    queryFn: async () => {
      const response = await fetch("/api/batches/active");
      if (!response.ok) {
        throw new Error("Failed to fetch active batch");
      }
      return response.json() as Promise<Batch | null>;
    },
  });

  const createSponsorMutation = useMutation({
    mutationFn: async (data: SponsorFormData) => {
      const response = await apiRequest("POST", "/api/sponsors", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors"] });
      toast({
        title: "Success",
        description: "Sponsor created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to create sponsor",
        variant: "destructive",
      });
    },
  });

  const updateSponsorMutation = useMutation({
    mutationFn: async (data: { id: string; updates: SponsorFormData }) => {
      const response = await apiRequest("PATCH", `/api/sponsors/${data.id}`, data.updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors"] });
      toast({
        title: "Success",
        description: "Sponsor updated successfully",
      });
      setIsDialogOpen(false);
      setEditingSponsor(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to update sponsor",
        variant: "destructive",
      });
    },
  });

  const deleteSponsorMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/sponsors/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors"] });
      toast({
        title: "Success",
        description: "Sponsor deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to delete sponsor",
        variant: "destructive",
      });
    },
  });

  const createBatchMutation = useMutation({
    mutationFn: async (data: BatchFormData) => {
      const response = await apiRequest("POST", "/api/batches", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/batches"] });
      toast({
        title: "Success",
        description: "Batch created successfully",
      });
      setIsBatchDialogOpen(false);
      batchForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create batch",
        variant: "destructive",
      });
    },
  });

  const activateBatchMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/batches/${id}/activate`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/batches/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/batches"] });
      toast({
        title: "Success",
        description: "Batch activated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to activate batch",
        variant: "destructive",
      });
    },
  });

  const filteredSponsors = sponsors.filter(sponsor =>
    sponsor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sponsor.description && sponsor.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEdit = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    form.setValue("name", sponsor.name);
    form.setValue("description", sponsor.description || "");
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      deleteSponsorMutation.mutate(id);
    }
  };

  const onSubmit = (data: SponsorFormData) => {
    if (editingSponsor) {
      updateSponsorMutation.mutate({ id: editingSponsor.id, updates: data });
    } else {
      createSponsorMutation.mutate(data);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingSponsor(null);
    form.reset();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading sponsors...</div>
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
                <h2 className="text-2xl font-bold text-gray-900">Sponsors Management</h2>
                <p className="text-gray-600">Manage training program sponsors</p>
              </div>
              <div className="flex space-x-3">
                <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsDialogOpen(true)}>
                      <Plus className="mr-2" size={16} />
                      Add Sponsor
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingSponsor ? "Edit Sponsor" : "Add New Sponsor"}
                      </DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sponsor Name *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g., Oyo State Government" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description (Optional)</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="Brief description about the sponsor" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex space-x-3">
                          <Button 
                            type="submit" 
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={createSponsorMutation.isPending || updateSponsorMutation.isPending}
                          >
                            {editingSponsor ? "Update" : "Create"} Sponsor
                          </Button>
                          <Button type="button" variant="outline" onClick={handleDialogClose}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                <Link href="/">
                  <Button variant="outline" className="bg-gray-600 text-white hover:bg-gray-700">
                    <ArrowLeft className="mr-2" size={16} />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>

            {/* Current Batch Status */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-blue-900">Current Registration Batch</h3>
                  <p className="text-blue-700">
                    {activeBatch ? `${activeBatch.name} ${activeBatch.year}` : "No active batch set"}
                  </p>
                </div>
                <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Settings className="mr-2" size={16} />
                      Manage Batches
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Batch Management</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      {/* Create New Batch Form */}
                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-3">Create New Batch</h4>
                        <Form {...batchForm}>
                          <form onSubmit={batchForm.handleSubmit((data) => createBatchMutation.mutate(data))} className="flex gap-3">
                            <FormField
                              control={batchForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input {...field} placeholder="Batch name (e.g., Batch A)" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={batchForm.control}
                              name="year"
                              render={({ field }) => (
                                <FormItem className="w-24">
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      {...field} 
                                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                                      placeholder="2025" 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button 
                              type="submit" 
                              disabled={createBatchMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Plus size={16} />
                            </Button>
                          </form>
                        </Form>
                      </div>

                      {/* Existing Batches */}
                      <div>
                        <h4 className="font-semibold mb-3">Existing Batches</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {batches.map((batch) => (
                            <div key={batch.id} className={`flex justify-between items-center p-3 border rounded-lg ${batch.isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                              <div className="flex items-center space-x-3">
                                <Calendar size={16} className={batch.isActive ? 'text-green-600' : 'text-gray-400'} />
                                <div>
                                  <span className="font-medium">{batch.name} {batch.year}</span>
                                  {batch.isActive && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>}
                                </div>
                              </div>
                              {!batch.isActive && (
                                <Button 
                                  size="sm" 
                                  onClick={() => activateBatchMutation.mutate(batch.id)}
                                  disabled={activateBatchMutation.isPending}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  Set Active
                                </Button>
                              )}
                            </div>
                          ))}
                          {batches.length === 0 && (
                            <p className="text-gray-500 text-center py-4">No batches created yet</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input 
                  placeholder="Search sponsors..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Sponsors Table */}
            {filteredSponsors.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No sponsors found</p>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                      <Plus className="mr-2" size={16} />
                      Add First Sponsor
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSponsors.map((sponsor) => (
                      <TableRow key={sponsor.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{sponsor.name}</TableCell>
                        <TableCell>
                          {sponsor.description || (
                            <span className="text-gray-400 italic">No description</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(sponsor.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-blue-600 hover:text-blue-900"
                              onClick={() => handleEdit(sponsor)}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-600 hover:text-red-900"
                              onClick={() => handleDelete(sponsor.id, sponsor.name)}
                              disabled={deleteSponsorMutation.isPending}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}