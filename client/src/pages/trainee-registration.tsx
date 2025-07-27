import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiStepForm } from "@/components/ui/multi-step-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { NIGERIAN_STATES, STATES_LGAS } from "@/lib/constants";
import type { TraineeRegistrationData, VerificationResponse, ApiResponse, Sponsor } from "@/lib/types";

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
  verificationMethod: z.enum(["email", "phone"], { required_error: "Verification method is required" }),
  verificationCode: z.string().length(6, "Verification code must be 6 characters"),
  sponsorId: z.string().optional(),
});

const steps = [
  { title: "Personal Info", description: "Basic personal information" },
  { title: "Location", description: "State and contact details" },
  { title: "Verification", description: "Verify your identity" },
];

export default function TraineeRegistrationPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isVerified, setIsVerified] = useState(false);
  const [sentCode, setSentCode] = useState("");

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
      verificationMethod: undefined,
      verificationCode: "",
      sponsorId: "",
    },
  });

  const selectedState = form.watch("state");
  const selectedMethod = form.watch("verificationMethod");
  const verificationCode = form.watch("verificationCode");

  // Fetch sponsors for selection
  const { data: sponsors = [] } = useQuery({
    queryKey: ["/api/sponsors"],
    queryFn: async () => {
      const response = await fetch("/api/sponsors");
      if (!response.ok) {
        throw new Error("Failed to fetch sponsors");
      }
      return response.json() as Promise<Sponsor[]>;
    },
  });

  const sendCodeMutation = useMutation({
    mutationFn: async (data: { identifier: string; method: 'email' | 'phone' }) => {
      const response = await apiRequest("POST", "/api/verification/send", data);
      return response.json() as Promise<VerificationResponse>;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Code Sent",
          description: data.message,
        });
        if (data.code) {
          setSentCode(data.code); // For development
          toast({
            title: "Development Mode",
            description: `Demo code: ${data.code}`,
            variant: "default",
          });
        }
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send verification code",
        variant: "destructive",
      });
    },
  });

  const verifyCodeMutation = useMutation({
    mutationFn: async (data: { identifier: string; code: string }) => {
      const response = await apiRequest("POST", "/api/verification/verify", data);
      return response.json() as Promise<VerificationResponse>;
    },
    onSuccess: (data) => {
      if (data.success) {
        setIsVerified(true);
        toast({
          title: "Verification Successful",
          description: data.message,
        });
      } else {
        toast({
          title: "Verification Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Verification failed",
        variant: "destructive",
      });
    },
  });

  const registrationMutation = useMutation({
    mutationFn: async (data: TraineeRegistrationData) => {
      const response = await apiRequest("POST", "/api/trainees/register", data);
      return response.json() as Promise<ApiResponse>;
    },
    onSuccess: (data) => {
      toast({
        title: "Registration Successful",
        description: "Your registration has been completed successfully!",
      });
      setTimeout(() => {
        setLocation("/");
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

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
                                <SelectItem value="">Self Sponsored</SelectItem>
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
