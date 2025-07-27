import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { NIGERIAN_STATES, STATES_LGAS } from "@/lib/constants";

const registrationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  surname: z.string().min(1, "Surname is required"),
  middleName: z.string().optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female"], { required_error: "Gender is required" }),
  state: z.string().min(1, "State is required"),
  lga: z.string().min(1, "LGA is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(/^(\+234|0)[789][01]\d{8}$/, "Please enter a valid Nigerian phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  verificationMethod: z.enum(["email", "phone"], { required_error: "Verification method is required" }),
  sponsorId: z.string().optional(),
  batchId: z.string().optional(),
});

type TraineeRegistrationData = z.infer<typeof registrationSchema>;

const steps = [
  { title: "Personal Info", description: "Basic personal information" },
  { title: "Location", description: "State and contact details" },
  { title: "Account Setup", description: "Create your account" },
];

export default function TraineeRegistrationPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TraineeRegistrationData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: "",
      surname: "",
      middleName: "",
      dateOfBirth: "",
      gender: undefined,
      state: "",
      lga: "",
      email: "",
      phone: "",
      password: "",
      verificationMethod: undefined,
      sponsorId: "",
      batchId: "",
    },
  });

  // Fetch sponsors and batches
  const { data: sponsors = [] } = useQuery<any[]>({
    queryKey: ['/api/sponsors', 'active-batch'],
  });

  const { data: batches = [] } = useQuery<any[]>({
    queryKey: ['/api/batches'],
  });

  const selectedState = form.watch("state");
  const selectedLGA = form.watch("lga");
  const availableLGAs = selectedState ? STATES_LGAS[selectedState] || [] : [];
  
  // Debug logging
  console.log("Selected State:", selectedState);
  console.log("Selected LGA:", selectedLGA);
  console.log("Available LGAs:", availableLGAs.length);

  // Step validation functions
  const validateStep1 = () => {
    const fields = ["firstName", "surname", "dateOfBirth", "gender"] as const;
    const isValid = fields.every(field => {
      const value = form.getValues(field);
      return value && value.toString().trim() !== "";
    });
    return isValid;
  };

  const validateStep2 = () => {
    const fields = ["state", "lga", "email", "phone"] as const;
    const isValid = fields.every(field => {
      const value = form.getValues(field);
      return value && value.toString().trim() !== "";
    });
    
    if (!isValid) return false;

    // Validate email format
    const email = form.getValues("email");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;

    // Validate phone format
    const phone = form.getValues("phone");
    const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
    if (!phoneRegex.test(phone)) return false;

    return true;
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields in Step 1",
        variant: "destructive",
      });
      return;
    }

    if (currentStep === 2 && !validateStep2()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly in Step 2",
        variant: "destructive",
      });
      return;
    }

    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: TraineeRegistrationData) => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      return;
    }

    setIsLoading(true);
    try {
      // First, send verification code
      const verificationResponse = await apiRequest("POST", "/api/verification/send", {
        identifier: data.verificationMethod === "email" ? data.email : data.phone,
        method: data.verificationMethod
      });
      
      const verificationResult = await verificationResponse.json();
      
      if (!verificationResult.success) {
        throw new Error(verificationResult.message);
      }

      // For development, automatically use the returned code
      const verificationCode = verificationResult.code;
      
      // Register trainee with backend API
      const registrationResponse = await apiRequest("POST", "/api/trainees/register", {
        firstName: data.firstName,
        surname: data.surname,
        middleName: data.middleName,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        state: data.state,
        lga: data.lga,
        email: data.email,
        phone: data.phone,
        verificationMethod: data.verificationMethod,
        verificationCode: verificationCode,
        sponsorId: data.sponsorId || undefined,
        batchId: data.batchId || undefined
      });
      
      const result = await registrationResponse.json();
      
      toast({
        title: "Registration Successful!",
        description: `Welcome ${data.firstName}! Your tag number is ${result.trainee.tagNumber}. ${result.trainee.roomBlock ? `Room: ${result.trainee.roomBlock} ${result.trainee.roomNumber}` : 'Room allocation pending.'}`,
      });
      
      // Invalidate and refetch trainees list
      queryClient.invalidateQueries({ queryKey: ['/api/trainees'] });
      
      // Redirect to dashboard
      setLocation("/dashboard");
      
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      setLocation("/registration");
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="surname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Surname</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter surname" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="middleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Middle Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter middle name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex space-x-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="male" id="male" />
                          <Label htmlFor="male">Male</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="female" id="female" />
                          <Label htmlFor="female">Female</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Location & Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Reset LGA when state changes
                        form.setValue("lga", "");
                      }} 
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state">
                            {field.value ? NIGERIAN_STATES.find(state => state.value === field.value)?.label : "Select state"}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NIGERIAN_STATES.map((state) => (
                          <SelectItem key={state.value} value={state.value}>
                            {state.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lga"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local Government Area</FormLabel>
                    <Select
                      key={selectedState} // Force re-render when state changes
                      onValueChange={field.onChange}
                      value={field.value || ""}
                      disabled={!selectedState}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select LGA">
                            {field.value || "Select LGA"}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableLGAs.map((lga) => (
                          <SelectItem key={lga} value={lga}>
                            {lga}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+234 or 0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="verificationMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Verification Method</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex space-x-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="email" id="email" />
                        <Label htmlFor="email">Email</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="phone" id="phone" />
                        <Label htmlFor="phone">SMS</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Account Setup</h3>
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Create a secure password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {sponsors.length > 0 && (
              <FormField
                control={form.control}
                name="sponsorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sponsor (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sponsor if applicable" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sponsors.map((sponsor: any) => (
                          <SelectItem key={sponsor.id} value={sponsor.id}>
                            {sponsor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {batches.length > 0 && (
              <FormField
                control={form.control}
                name="batchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Training Batch (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select training batch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {batches.map((batch: any) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.name} ({batch.year})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                You're almost done! Click "Complete Registration" to create your account and receive your trainee details.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-lg">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Trainee Registration</h2>
              <p className="text-gray-600">Complete the form to register as a trainee</p>
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-4 md:space-x-8">
                {steps.map((step, index) => {
                  const stepNumber = index + 1;
                  const isActive = currentStep === stepNumber;
                  const isCompleted = currentStep > stepNumber;

                  return (
                    <div key={stepNumber} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors ${
                            isCompleted
                              ? "bg-green-600 border-green-600 text-white"
                              : isActive
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-gray-300 text-gray-500"
                          }`}
                        >
                          {isCompleted ? (
                            <Check size={16} />
                          ) : (
                            stepNumber
                          )}
                        </div>
                        <div className="mt-2 text-center">
                          <div
                            className={`text-sm font-medium ${
                              isActive || isCompleted ? "text-gray-900" : "text-gray-500"
                            }`}
                          >
                            {step.title}
                          </div>
                          <div className="text-xs text-gray-500 hidden md:block">
                            {step.description}
                          </div>
                        </div>
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className={`w-16 h-px mx-4 ${
                            isCompleted ? "bg-green-600" : "bg-gray-300"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {renderStepContent()}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={currentStep === 1 ? goBack : handlePrevious}
                    className="flex items-center"
                  >
                    <ArrowLeft className="mr-2" size={16} />
                    {currentStep === 1 ? "Back to Options" : "Previous"}
                  </Button>

                  {currentStep === 3 ? (
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center bg-blue-600 hover:bg-blue-700"
                    >
                      {isLoading ? "Processing..." : "Complete Registration"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="flex items-center bg-blue-600 hover:bg-blue-700"
                    >
                      Next
                      <ArrowRight className="ml-2" size={16} />
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
