import { useState } from "react";
import { Link } from "wouter";
import { Users2, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { registerResourcePerson } from "@/lib/firebaseService";

export default function ResourcePersonRegistrationPage() {
  const [currentStep, setCurrentStep] = useState<'id' | 'details'>('id');
  const [resourcePersonId, setResourcePersonId] = useState('');
  const [isValidId, setIsValidId] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    firstName: '',
    surname: '',
    middleName: '',
    email: '',
    phoneNumber: '',
    specialization: '',
    experience: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const validateResourcePersonId = (id: string) => {
    const resourcePersonIdPattern = /^RS-0C0S0S\d+$/;
    return resourcePersonIdPattern.test(id);
  };

  const handleIdChange = (value: string) => {
    setResourcePersonId(value);
    const isValid = validateResourcePersonId(value);
    setIsValidId(isValid);
    if (isValid) {
      setFormData(prev => ({ ...prev, id: value }));
    }
  };

  const handleNextStep = () => {
    if (isValidId) {
      setCurrentStep('details');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      await registerResourcePerson(formData);
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Error submitting resource person registration:', error);
      setSubmitError('Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCurrentStep('id');
    setResourcePersonId('');
    setIsValidId(false);
    setFormData({
      id: '',
      firstName: '',
      surname: '',
      middleName: '',
      email: '',
      phoneNumber: '',
      specialization: '',
      experience: ''
    });
    setSubmitSuccess(false);
    setSubmitError('');
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
              <p className="text-gray-600 mb-6">
                Resource person with ID <Badge variant="secondary">{formData.id}</Badge> has been successfully registered.
              </p>
              <div className="space-y-2">
                                 <Button onClick={resetForm} className="w-full">
                   Register Another Resource Person
                 </Button>
                 <Link href="/registration">
                   <Button variant="outline" className="w-full">
                     Back to Registration
                   </Button>
                 </Link>
                <Link href="/">
                  <Button variant="ghost" className="w-full">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              <Users2 className="text-2xl text-amber-600 mr-3" size={32} />
              <h1 className="text-xl font-semibold text-gray-900">Resource Person Registration</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={currentStep === 'id' ? 'default' : 'secondary'}>Step 1: ID</Badge>
              <Badge variant={currentStep === 'details' ? 'default' : 'secondary'}>Step 2: Details</Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Resource Person Registration</h2>
          <p className="text-gray-600">
            {currentStep === 'id' 
              ? "Enter your generated resource person ID to begin registration."
              : "Complete your resource person registration details."
            }
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users2 className="text-amber-600" size={20} />
              {currentStep === 'id' ? 'Enter Resource Person ID' : 'Resource Person Details'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 'id' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resource Person ID
                  </label>
                  <Input
                    value={resourcePersonId}
                    onChange={(e) => handleIdChange(e.target.value)}
                    placeholder="Enter your resource person ID (e.g., RS-0C0S0S1)"
                    className={`w-full ${isValidId ? 'border-green-500' : resourcePersonId ? 'border-red-500' : ''}`}
                  />
                  {resourcePersonId && !isValidId && (
                    <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                      <AlertCircle size={16} />
                      Invalid resource person ID format. Expected format: RS-0C0S0S1, RS-0C0S0S2, etc.
                    </div>
                  )}
                  {isValidId && (
                    <div className="flex items-center gap-2 mt-2 text-green-600 text-sm">
                      <CheckCircle size={16} />
                      Valid resource person ID format.
                    </div>
                  )}
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg">
                  <h4 className="font-medium text-amber-900 mb-2">How to get your Resource Person ID:</h4>
                  <ol className="text-sm text-amber-800 space-y-1">
                    <li>1. Go to the <Link href="/resource-person-id-generation" className="underline">Resource Person ID Generation</Link> page</li>
                    <li>2. Click "Generate Resource Person ID" to create a new ID</li>
                    <li>3. Copy the generated ID and return here</li>
                    <li>4. Enter the ID above to continue registration</li>
                  </ol>
                </div>

                <Button 
                  onClick={handleNextStep}
                  disabled={!isValidId}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  Continue to Details
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="First Name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Surname *
                    </label>
                    <Input
                      value={formData.surname}
                      onChange={(e) => handleInputChange('surname', e.target.value)}
                      placeholder="Surname"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Middle Name
                  </label>
                  <Input
                    value={formData.middleName}
                    onChange={(e) => handleInputChange('middleName', e.target.value)}
                    placeholder="Middle Name (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Email address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <Input
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    placeholder="Phone number"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specialization
                    </label>
                    <Input
                      value={formData.specialization}
                      onChange={(e) => handleInputChange('specialization', e.target.value)}
                      placeholder="Area of expertise"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience
                    </label>
                    <Input
                      value={formData.experience}
                      onChange={(e) => handleInputChange('experience', e.target.value)}
                      placeholder="Years of experience"
                    />
                  </div>
                </div>

                                 {submitError && (
                   <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                     <div className="flex items-center gap-2 text-red-600">
                       <AlertCircle size={16} />
                       <span className="text-sm">{submitError}</span>
                     </div>
                   </div>
                 )}

                 <div className="flex gap-2 pt-4">
                   <Button 
                     variant="outline" 
                     onClick={() => setCurrentStep('id')}
                     className="flex-1"
                     disabled={isSubmitting}
                   >
                     Back
                   </Button>
                   <Button 
                     onClick={handleSubmit}
                     disabled={isSubmitting || !formData.firstName || !formData.surname || !formData.email || !formData.phoneNumber}
                     className="flex-1 bg-amber-600 hover:bg-amber-700"
                   >
                     {isSubmitting ? 'Submitting...' : 'Submit Registration'}
                   </Button>
                 </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 