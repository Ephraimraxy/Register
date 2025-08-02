import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  UserCheck,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Plus,
  Clock,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  generateStaffId, 
  getGeneratedIds, 
  GeneratedId 
} from "@/lib/firebaseService";

interface StaffRow {
  id: string;
  firstName: string;
  surname: string;
  middleName: string;
  email: string;
  phoneNumber: string;
}

export default function StaffIdGenerationPage() {
  const [generatedIds, setGeneratedIds] = useState<GeneratedId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Load generated IDs from database
  useEffect(() => {
    const loadGeneratedIds = async () => {
      try {
        setIsLoading(true);
        const ids = await getGeneratedIds('staff');
        setGeneratedIds(ids);
      } catch (error) {
        console.error('Error loading generated IDs:', error);
        setError('Failed to load generated IDs');
      } finally {
        setIsLoading(false);
      }
    };

    loadGeneratedIds();
  }, []);

  const generateStaffId = async () => {
    try {
      setIsGenerating(true);
      setError('');
      const newId = await generateStaffId();
      // Refresh the list
      const ids = await getGeneratedIds('staff');
      setGeneratedIds(ids);
    } catch (error) {
      console.error('Error generating staff ID:', error);
      setError('Failed to generate staff ID');
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="secondary">Available</Badge>;
      case 'assigned':
        return <Badge variant="outline">Assigned</Badge>;
      case 'activated':
        return <Badge variant="default">Activated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" className="mr-4">
                  <ArrowLeft className="mr-2" size={16} />
                  Back to Home
                </Button>
              </Link>
              <UserCheck className="text-2xl text-blue-600 mr-3" size={32} />
              <h1 className="text-xl font-semibold text-gray-900">Staff ID Generation</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Staff ID Management</h2>
          <p className="text-gray-600">Generate and manage staff identification numbers with their details.</p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Staff Records</h3>
              <Button 
                onClick={generateStaffId}
                disabled={isGenerating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2" size={16} />
                {isGenerating ? 'Generating...' : 'Generate Staff ID'}
              </Button>
            </div>
          </div>

                            {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle size={16} />
                        <span className="text-sm">{error}</span>
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">ID</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Assigned To</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Created</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {isLoading ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                              <div className="flex flex-col items-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                                <p className="text-lg font-medium text-gray-900 mb-2">Loading Generated IDs...</p>
                                <p className="text-gray-500">Please wait while we fetch the latest ID information.</p>
                              </div>
                            </td>
                          </tr>
                        ) : generatedIds.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                              <div className="flex flex-col items-center">
                                <UserCheck className="w-12 h-12 text-gray-300 mb-4" />
                                <p className="text-lg font-medium text-gray-900 mb-2">No Generated IDs Found</p>
                                <p className="text-gray-500 mb-4">No staff IDs have been generated yet.</p>
                                <Button 
                                  onClick={generateStaffId}
                                  disabled={isGenerating}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  {isGenerating ? 'Generating...' : 'Generate First ID'}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          generatedIds.map((idData, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <span className="font-mono text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                                  {idData.id}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {getStatusBadge(idData.status)}
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">
                                  {idData.assignedTo ? (
                                    <div className="flex items-center gap-2">
                                      <User className="w-4 h-4 text-gray-500" />
                                      {idData.assignedTo}
                                    </div>
                                  ) : (
                                    <span className="text-gray-500">Not assigned</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-500">
                                  {idData.createdAt?.toDate().toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-2">
                                  {idData.status === 'available' && (
                                    <Button size="sm" variant="outline" title="Available for Registration">
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {idData.status === 'assigned' && (
                                    <Button size="sm" variant="outline" title="Assigned - Pending Activation">
                                      <Clock className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {idData.status === 'activated' && (
                                    <Button size="sm" variant="outline" title="Activated">
                                      <User className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
        </div>
      </main>
    </div>
  );
} 