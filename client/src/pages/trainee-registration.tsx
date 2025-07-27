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
import { 
  createTrainee, 
  createUser, 
  getActiveSponsors, 
  getActiveBatches, 
  generateTagNumber, 
  allocateRoom,
  type Trainee,
  type BaseUser,
  type Sponsor,
  type Batch
} from "@/lib/firebaseService";
import { signUpWithEmail } from "@/lib/firebaseAuth";
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
  const { data: sponsors = [] } = useQuery({
    queryKey: ['/api/sponsors'],
    queryFn: getActiveSponsors,
  });

  const { data: batches = [] } = useQuery({
    queryKey: ['/api/batches'],
    queryFn: getActiveBatches,
  });

  const selectedState = form.watch("state");
  const availableLGAs = selectedState ? STATES_LGAS[selectedState] || [] : [];

  const onSubmit = async (data: TraineeRegistrationData) => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      return;
    }

    setIsLoading(true);
    try {
      // Create Firebase auth user
      const user = await signUpWithEmail(data.email, data.password, `${data.firstName} ${data.surname}`);
      
      // Generate tag number and allocate room
      const tagNumber = await generateTagNumber();
      const roomAllocation = await allocateRoom(data.gender);
      
      // Create user record in Firestore
      const baseUserData: Omit<BaseUser, 'id' | 'createdAt'> = {
        firstName: data.firstName,
        surname: data.surname,
        middleName: data.middleName,
        email: data.email,
        phone: data.phone,
        role: "trainee",
        isVerified: true, // Since we're using Firebase Auth
      };
      
      const userId = await createUser(baseUserData);
      
      // Create trainee record
      const traineeData: Omit<Trainee, 'id' | 'createdAt'> = {
        ...baseUserData,
        role: "trainee",
        tagNumber,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        state: data.state,
        lga: data.lga,
        sponsorId: data.sponsorId || undefined,
        batchId: data.batchId || undefined,
        roomNumber: roomAllocation?.roomNumber || undefined,
        roomBlock: roomAllocation?.roomBlock || undefined,
        verificationMethod: data.verificationMethod,
      };
      
      await createTrainee(traineeData);
      
      toast({
        title: "Registration Successful!",
        description: `Welcome ${data.firstName}! Your tag number is ${tagNumber}. ${roomAllocation ? `Room: ${roomAllocation.roomBlock}-${roomAllocation.roomNumber}` : 'Room allocation pending.'}`,
      });
      
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
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
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!selectedState}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select LGA" />
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
                        {sponsors.map((sponsor) => (
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
                        {batches.map((batch) => (
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
                    onClick={goBack}
                    className="flex items-center"
                  >
                    <ArrowLeft className="mr-2" size={16} />
                    {currentStep === 1 ? "Back to Options" : "Previous"}
                  </Button>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? (
                      "Processing..."
                    ) : currentStep === 3 ? (
                      "Complete Registration"
                    ) : (
                      <>
                        Next
                        <ArrowRight className="ml-2" size={16} />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

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

  const handleSendCode = () => {
    if (!selectedMethod) {
      toast({
        title: "Error",
        description: "Please select a verification method",
        variant: "destructive",
      });
      return;
    }

    const identifier = selectedMethod === "email" ? form.getValues("email") : form.getValues("phone");
    sendCodeMutation.mutate({ identifier, method: selectedMethod });
  };

  const handleVerifyCode = () => {
    if (!selectedMethod || verificationCode.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a 6-character verification code",
        variant: "destructive",
      });
      return;
    }

    const identifier = selectedMethod === "email" ? form.getValues("email") : form.getValues("phone");
    verifyCodeMutation.mutate({ identifier, code: verificationCode });
  };

  const onSubmit = (data: TraineeRegistrationData) => {
    if (!isVerified) {
      toast({
        title: "Error",
        description: "Please verify your identity before submitting",
        variant: "destructive",
      });
      return;
    }

    registrationMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <MultiStepForm steps={steps} currentStep={currentStep}>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Step 1: Personal Information */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
                        <p className="text-gray-600">Please provide your basic details</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name *</FormLabel>
                              <FormControl>
                                <Input {...field} />
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
                              <FormLabel>Surname *</FormLabel>
                              <FormControl>
                                <Input {...field} />
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
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="dateOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Birth *</FormLabel>
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
                              <FormLabel>Gender *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button type="button" onClick={handleNext}>
                          Next Step <ArrowRight className="ml-2" size={16} />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Location Information */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-900">Location Information</h3>
                        <p className="text-gray-600">Please provide your location details</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sponsored State *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select State" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {NIGERIAN_STATES.map(state => (
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
                              <FormLabel>Sponsored LGA *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select LGA" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {selectedState && STATES_LGAS[selectedState] ? 
                                    STATES_LGAS[selectedState].map(lga => (
                                      <SelectItem key={lga.toLowerCase().replace(/\s+/g, '-')} value={lga.toLowerCase().replace(/\s+/g, '-')}>
                                        {lga}
                                      </SelectItem>
                                    )) : 
                                    <SelectItem value="" disabled>Select a state first</SelectItem>
                                  }
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address *</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} />
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
                              <FormLabel>Phone Number *</FormLabel>
                              <FormControl>
                                <Input type="tel" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="sponsorId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sponsor</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select sponsor or choose self-sponsored" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="self-sponsored">Self Sponsored</SelectItem>
                                {sponsors.map((sponsor: Sponsor) => (
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

                      <div className="flex justify-between">
                        <Button type="button" variant="outline" onClick={handlePrevious}>
                          <ArrowLeft className="mr-2" size={16} />
                          Previous
                        </Button>
                        <Button type="button" onClick={handleNext}>
                          Next Step <ArrowRight className="ml-2" size={16} />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Verification */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-900">Verification</h3>
                        <p className="text-gray-600">Verify your identity to complete registration</p>
                      </div>

                      <FormField
                        control={form.control}
                        name="verificationMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Send verification code to *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="email">Email Address</SelectItem>
                                <SelectItem value="phone">Phone Number</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div>
                        <FormField
                          control={form.control}
                          name="verificationCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Verification Code</FormLabel>
                              <div className="flex space-x-3">
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    placeholder="Enter 6-digit code"
                                    maxLength={6}
                                    className="flex-1"
                                  />
                                </FormControl>
                                <Button 
                                  type="button" 
                                  onClick={handleSendCode}
                                  disabled={!selectedMethod || sendCodeMutation.isPending}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  {sendCodeMutation.isPending ? "Sending..." : "Send Code"}
                                </Button>
                                <Button 
                                  type="button" 
                                  onClick={handleVerifyCode}
                                  disabled={verificationCode.length !== 6 || verifyCodeMutation.isPending}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {verifyCodeMutation.isPending ? "Verifying..." : "Verify"}
                                </Button>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {isVerified && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                          <div className="flex items-center">
                            <Check className="mr-2" size={16} />
                            Verification successful! You can now submit your registration.
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <Button type="button" variant="outline" onClick={handlePrevious}>
                          <ArrowLeft className="mr-2" size={16} />
                          Previous
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={!isVerified || registrationMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {registrationMutation.isPending ? "Submitting..." : "Complete Registration"}
                          <Check className="ml-2" size={16} />
                        </Button>
                      </div>
                    </div>
                  )}
                </form>
              </Form>
            </MultiStepForm>

            <div className="text-center mt-8">
              <Link href="/registration">
                <Button variant="outline" className="bg-gray-600 text-white hover:bg-gray-700">
                  <ArrowLeft className="mr-2" size={16} />
                  Back to Registration Options
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
