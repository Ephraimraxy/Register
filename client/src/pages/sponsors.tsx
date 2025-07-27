import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { ArrowLeft, Plus, Edit, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const sponsorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

type SponsorFormData = z.infer<typeof sponsorSchema>;

interface Sponsor {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function SponsorsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);

  const form = useForm<SponsorFormData>({
    resolver: zodResolver(sponsorSchema),
    defaultValues: {
      name: "",
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