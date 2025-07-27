import { Link } from "wouter";
import { 
  GraduationCap, 
  UserPlus, 
  Users, 
  Bus, 
  Presentation, 
  BarChart3, 
  Settings 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <GraduationCap className="text-2xl text-blue-600 mr-3" size={32} />
              <h1 className="text-xl font-semibold text-gray-900">Training Management System</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900 font-medium">
                  <i className="fas fa-sign-in-alt mr-2"></i>Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Training Management Portal</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Streamline your training operations with our comprehensive management system. 
            Register participants, manage resources, and track progress all in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Registration Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="text-2xl text-blue-600" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Registration</h3>
                <p className="text-gray-600 mb-6">Register new users in the system as staff, resource persons, or trainees.</p>
                <Link href="/registration">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Start Registration
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* View Trainees Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="text-2xl text-green-600" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">View Trainees</h3>
                <p className="text-gray-600 mb-6">Manage registered trainees, view their details, room assignments, and tag numbers.</p>
                <Link href="/trainees">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    View Trainees
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* View Staff Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bus className="text-2xl text-purple-600" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">View Staff</h3>
                <p className="text-gray-600 mb-6">Access and manage staff member information and roles.</p>
                <Button className="w-full bg-gray-400 cursor-not-allowed" disabled>
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* View Resource Persons Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Presentation className="text-2xl text-amber-600" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">View Resource Persons</h3>
                <p className="text-gray-600 mb-6">Manage resource persons and their training specializations.</p>
                <Button className="w-full bg-gray-400 cursor-not-allowed" disabled>
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reports Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="text-2xl text-red-600" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Reports</h3>
                <p className="text-gray-600 mb-6">Generate comprehensive reports and analytics for training programs.</p>
                <Button className="w-full bg-gray-400 cursor-not-allowed" disabled>
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sponsors Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="text-2xl text-orange-600" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Sponsors</h3>
                <p className="text-gray-600 mb-6">Manage training sponsors and funding organizations.</p>
                <Link href="/sponsors">
                  <Button className="w-full bg-orange-600 hover:bg-orange-700">
                    Manage Sponsors
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Settings Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="text-2xl text-gray-600" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Settings</h3>
                <p className="text-gray-600 mb-6">Configure system settings and manage administrative preferences.</p>
                <Button className="w-full bg-gray-400 cursor-not-allowed" disabled>
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
