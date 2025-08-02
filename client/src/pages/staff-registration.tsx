import { useState } from "react";
import { Link } from "wouter";
import { UserCheck, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  validateAndActivateId, 
  activateId, 
  finalizeIdActivation 
} from "@/lib/firebaseService";

export default function StaffRegistrationPage() {
  const [currentStep, setCurrentStep] = useState<'id' | 'details'>('id');
  const [staffId, setStaffId] = useState('');
  const [isValidId, setIsValidId] = useState(false);
  const [isValidatingId, setIsValidatingId] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [formData, setFormData] = useState({
    id: '',
    firstName: '',
    surname: '',
    middleName: '',
    email: '',
    phoneNumber: '',
    department: '',
    position: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const validateStaffId = (id: string) => {
    const staffIdPattern = /^ST-0C0S0S\d+$/;
    return staffIdPattern.test(id);
  };

  const handleIdChange = (value: string) => {
    setStaffId(value);
    const isValid = validateStaffId(value);
    setIsValidId(isValid);
    setValidationMessage('');
    if (isValid) {
      setFormData(prev => ({ ...prev, id: value }));
    }
  };

  const handleValidateId = async () => {
    if (!isValidId || !formData.email) {
      setValidationMessage('Please enter a valid ID and email first.');
      return;
    }

    setIsValidatingId(true);
    setValidationMessage('');

    try {
      const result = await validateAndActivateId(staffId, formData.email);
      
      if (result.isValid) {
        // Activate the ID
        await activateId(staffId, formData.email);
        setValidationMessage('ID validated and activated successfully!');
        setIsValidId(true);
      } else {
        setValidationMessage(result.message);
        setIsValidId(false);
      }
    } catch (error) {
      console.error('Error validating ID:', error);
      setValidationMessage('Error validating ID. Please try again.');
      setIsValidId(false);
    } finally {
      setIsValidatingId(false);
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
      await finalizeIdActivation(staffId, {
        firstName: formData.firstName,
        surname: formData.surname,
        middleName: formData.middleName,
        email: formData.email,
        phone: formData.phoneNumber,
        department: formData.department,
        position: formData.position
      });
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Error submitting staff registration:', error);
      setSubmitError('Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCurrentStep('id');
    setStaffId('');
    setIsValidId(false);
    setFormData({
      id: '',
      firstName: '',
      surname: '',
      middleName: '',
      email: '',
      phoneNumber: '',
      department: '',
      position: ''
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
                Staff member with ID <Badge variant="secondary">{formData.id}</Badge> has been successfully registered.
              </p>
              <div className="space-y-2">
                                 <Button onClick={resetForm} className="w-full">
                   Register Another Staff
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
              <UserCheck className="text-2xl text-blue-600 mr-3" size={32} />
              <h1 className="text-xl font-semibold text-gray-900">Staff Registration</h1>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Staff Registration</h2>
          <p className="text-gray-600">
            {currentStep === 'id' 
              ? "Enter your generated staff ID to begin registration."
              : "Complete your staff registration details."
            }
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="text-blue-600" size={20} />
              {currentStep === 'id' ? 'Enter Staff ID' : 'Staff Details'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 'id' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Staff ID
                  </label>
                  <Input
                    value={staffId}
                    onChange={(e) => handleIdChange(e.target.value)}
                    placeholder="Enter your staff ID (e.g., ST-0C0S0S1)"
                    className={`w-full ${isValidId ? 'border-green-500' : staffId ? 'border-red-500' : ''}`}
                  />
                  {staffId && !isValidId && (
                    <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                      <AlertCircle size={16} />
                      Invalid staff ID format. Expected format: ST-0C0S0S1, ST-0C0S0S2, etc.
                    </div>
                  )}
                  {isValidId && (
                    <div className="flex items-center gap-2 mt-2 text-green-600 text-sm">
                      <CheckCircle size={16} />
                      Valid staff ID format.
                    </div>
                  )}
                </div>

                {validationMessage && (
                  <div className={`p-3 rounded-lg text-sm ${
                    validationMessage.includes('successfully') 
                      ? 'bg-green-50 border border-green-200 text-green-800' 
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}>
                    {validationMessage}
                  </div>
                )}
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">How to get your Staff ID:</h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Go to the <Link href="/staff-id-generation" className="underline">Staff ID Generation</Link> page</li>
                    <li>2. Click "Generate Staff ID" to create a new ID</li>
                    <li>3. Copy the generated ID and return here</li>
                    <li>4. Enter your email and the ID above</li>
                    <li>5. Click "Validate ID" to check if it's available</li>
                  </ol>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleValidateId}
                    disabled={!isValidId || !formData.email || isValidatingId}
                    variant="outline"
                    className="flex-1"
                  >
                    {isValidatingId ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      'Validate ID'
                    )}
                  </Button>
                  <Button 
                    onClick={handleNextStep}
                    disabled={!isValidId || !validationMessage.includes('successfully')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Continue to Details
                  </Button>
                </div>
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
                      Department
                    </label>
                    <Input
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      placeholder="Department"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position
                    </label>
                    <Input
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      placeholder="Position"
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
                    disabled={isSubmitting || !formData.firstName || !formData.surname || !formData.phoneNumber}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
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