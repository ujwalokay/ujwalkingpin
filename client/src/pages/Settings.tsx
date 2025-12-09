import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Save, X, User, Users, Lock, Edit, Trash2, Plus, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DeviceConfigCard } from "@/components/DeviceConfigCard";
import { PricingTable } from "@/components/PricingTable";
import { HappyHoursPricing } from "@/components/HappyHoursPricing";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { DeviceConfig, PricingConfig, HappyHoursConfig, HappyHoursPricing as HappyHoursPricingType } from "@shared/schema";
import { localDb, isTauri } from "@/lib/tauri-db";
import { getCurrentUser } from "@/lib/auth-client";

interface UserProfile {
  id: string;
  username: string;
  role: string;
  createdAt: string;
}

interface StaffMember {
  id: string;
  username: string;
  role: string;
  createdAt: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
}

export default function Settings() {
  const { toast } = useToast();
  
  // Fetch device configs
  const { data: deviceConfigs } = useQuery<DeviceConfig[]>({
    queryKey: ['/api/device-config'],
  });

  // Fetch pricing configs
  const { data: pricingConfigs } = useQuery<PricingConfig[]>({
    queryKey: ['/api/pricing-config'],
  });

  // Fetch happy hours configs
  const { data: happyHoursConfigs } = useQuery<HappyHoursConfig[]>({
    queryKey: ['/api/happy-hours-config'],
  });

  // Fetch happy hours pricing
  const { data: happyHoursPricing } = useQuery<HappyHoursPricingType[]>({
    queryKey: ['/api/happy-hours-pricing'],
  });

  // Local state for device configs
  const [pcConfig, setPcConfig] = useState({ count: 30, seats: [] as { name: string; visible: boolean }[] });
  const [ps5Config, setPs5Config] = useState({ count: 20, seats: [] as { name: string; visible: boolean }[] });

  // Local state for pricing
  const [pcPricing, setPcPricing] = useState<{ duration: string; price: number; personCount?: number }[]>([]);
  const [ps5Pricing, setPs5Pricing] = useState<{ duration: string; price: number; personCount?: number }[]>([]);

  // Local state for happy hours time slots
  const [pcHappyHoursEnabled, setPcHappyHoursEnabled] = useState(true);
  const [ps5HappyHoursEnabled, setPs5HappyHoursEnabled] = useState(true);
  const [pcTimeSlots, setPcTimeSlots] = useState<TimeSlot[]>([]);
  const [ps5TimeSlots, setPs5TimeSlots] = useState<TimeSlot[]>([]);

  // Local state for happy hours pricing
  const [pcHappyHoursPricing, setPcHappyHoursPricing] = useState<{ duration: string; price: number; personCount?: number }[]>([]);
  const [ps5HappyHoursPricing, setPs5HappyHoursPricing] = useState<{ duration: string; price: number; personCount?: number }[]>([]);

  // Auth and user state
  const { user: authUser } = useAuth();
  const isAdmin = authUser?.role === 'admin';
  const isAuthLoaded = authUser !== null && authUser !== undefined;

  // Fetch user profile (with Tauri offline support)
  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ['/api/profile'],
    queryFn: async () => {
      if (isTauri()) {
        // In Tauri mode, get the profile from local session
        const currentUser = await getCurrentUser();
        if (currentUser) {
          // Fetch full user details from local database
          const userDetails = await localDb.getUserById(currentUser.id);
          if (userDetails) {
            return {
              id: userDetails.id,
              username: userDetails.username,
              role: userDetails.role,
              createdAt: userDetails.createdAt || new Date().toISOString(),
            };
          }
          // Fallback to session data
          return {
            id: currentUser.id,
            username: currentUser.username,
            role: currentUser.role,
            createdAt: new Date().toISOString(),
          };
        }
        throw new Error('No user session found');
      }
      const response = await fetch('/api/profile', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
  });

  // Fetch staff members (admin only - only enabled when auth is loaded AND user is admin)
  const { data: staffMembers, isLoading: staffLoading } = useQuery<StaffMember[]>({
    queryKey: ['/api/staff'],
    queryFn: async () => {
      if (isTauri()) {
        const staff = await localDb.getAllStaff();
        return staff.map((s: { id: string; username: string; role: string; createdAt: string }) => ({
          id: s.id,
          username: s.username,
          role: s.role,
          createdAt: s.createdAt,
        }));
      }
      const response = await fetch('/api/staff', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch staff');
      return response.json();
    },
    enabled: isAuthLoaded && isAdmin === true,
  });

  // Profile management state
  const [profileForm, setProfileForm] = useState({
    username: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Staff management state
  const [newStaffForm, setNewStaffForm] = useState({
    username: '',
    password: '',
  });
  const [editStaffForm, setEditStaffForm] = useState({
    id: '',
    username: '',
  });
  const [resetPasswordForm, setResetPasswordForm] = useState({
    staffId: '',
    newPassword: '',
  });
  const [isAddStaffDialogOpen, setIsAddStaffDialogOpen] = useState(false);
  const [isEditStaffDialogOpen, setIsEditStaffDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showNewStaffPassword, setShowNewStaffPassword] = useState(false);
  const [showResetStaffPassword, setShowResetStaffPassword] = useState(false);

  // Initialize profile form when profile data loads
  useEffect(() => {
    if (profile) {
      setProfileForm({
        username: profile.username || '',
      });
    }
  }, [profile]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { username?: string }) => {
      return apiRequest("PATCH", "/api/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      toast({ title: "Success", description: "Profile updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
      if (isTauri()) {
        if (!profile?.id) throw new Error("User not found");
        const user = await localDb.validatePassword(profile.username, data.currentPassword);
        if (!user) throw new Error("Current password is incorrect");
        await localDb.updateUser(profile.id, { password: data.newPassword });
        return { success: true };
      }
      return apiRequest("POST", "/api/profile/change-password", data);
    },
    onSuccess: () => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast({ title: "Success", description: "Password changed successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    },
  });

  // Create staff mutation
  const createStaffMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      if (isTauri()) {
        const existingUser = await localDb.getUserByUsername(data.username);
        if (existingUser) throw new Error("Username already exists");
        return localDb.createUser({ username: data.username, password: data.password, role: 'staff' });
      }
      return apiRequest("POST", "/api/staff", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      setNewStaffForm({ username: '', password: '' });
      setIsAddStaffDialogOpen(false);
      toast({ title: "Success", description: "Staff member created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create staff member",
        variant: "destructive",
      });
    },
  });

  // Update staff mutation
  const updateStaffMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { username?: string } }) => {
      return apiRequest("PATCH", `/api/staff/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      setIsEditStaffDialogOpen(false);
      toast({ title: "Success", description: "Staff member updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update staff member",
        variant: "destructive",
      });
    },
  });

  // Reset staff password mutation
  const resetStaffPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      if (isTauri()) {
        return localDb.updateUser(id, { password: newPassword });
      }
      return apiRequest("POST", `/api/staff/${id}/reset-password`, { newPassword });
    },
    onSuccess: () => {
      setResetPasswordForm({ staffId: '', newPassword: '' });
      setIsResetPasswordDialogOpen(false);
      toast({ title: "Success", description: "Password reset successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  // Delete staff mutation
  const deleteStaffMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isTauri()) {
        await localDb.deleteUser(id);
        return { success: true };
      }
      return apiRequest("DELETE", `/api/staff/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      setStaffToDelete(null);
      setIsDeleteDialogOpen(false);
      toast({ title: "Success", description: "Staff member deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete staff member",
        variant: "destructive",
      });
    },
  });

  // Validation helpers
  const validateUsername = (username: string): string | null => {
    if (!username || username.trim().length < 3) {
      return "Username must be at least 3 characters";
    }
    if (username.length > 50) {
      return "Username must be less than 50 characters";
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return "Username can only contain letters, numbers, underscores, and hyphens";
    }
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password || password.length < 8) {
      return "Password must be at least 8 characters";
    }
    return null;
  };

  // Profile handlers
  const handleUpdateProfile = () => {
    // Validate username if changed
    if (profileForm.username && profileForm.username !== profile?.username) {
      const usernameError = validateUsername(profileForm.username);
      if (usernameError) {
        toast({ title: "Error", description: usernameError, variant: "destructive" });
        return;
      }
    }

    const updates: any = {};
    if (profileForm.username && profileForm.username !== profile?.username) {
      updates.username = profileForm.username;
    }

    if (Object.keys(updates).length === 0) {
      toast({ title: "Info", description: "No changes to save" });
      return;
    }

    updateProfileMutation.mutate(updates);
  };

  const handleChangePassword = () => {
    // Validate new password
    const passwordError = validatePassword(passwordForm.newPassword);
    if (passwordError) {
      toast({ title: "Error", description: passwordError, variant: "destructive" });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }
    changePasswordMutation.mutate(passwordForm);
  };

  // Staff handlers
  const handleCreateStaff = () => {
    // Validate username
    const usernameError = validateUsername(newStaffForm.username);
    if (usernameError) {
      toast({ title: "Error", description: usernameError, variant: "destructive" });
      return;
    }

    // Validate password
    const passwordError = validatePassword(newStaffForm.password);
    if (passwordError) {
      toast({ title: "Error", description: passwordError, variant: "destructive" });
      return;
    }

    createStaffMutation.mutate(newStaffForm);
  };

  const handleEditStaff = (staff: StaffMember) => {
    setEditStaffForm({
      id: staff.id,
      username: staff.username,
    });
    setIsEditStaffDialogOpen(true);
  };

  const handleUpdateStaff = () => {
    const originalStaff = staffMembers?.find(s => s.id === editStaffForm.id);
    
    // Validate username if changed
    if (editStaffForm.username && editStaffForm.username !== originalStaff?.username) {
      const usernameError = validateUsername(editStaffForm.username);
      if (usernameError) {
        toast({ title: "Error", description: usernameError, variant: "destructive" });
        return;
      }
    }

    const updates: any = {};
    if (editStaffForm.username && editStaffForm.username !== originalStaff?.username) {
      updates.username = editStaffForm.username;
    }

    if (Object.keys(updates).length === 0) {
      toast({ title: "Info", description: "No changes to save" });
      return;
    }

    updateStaffMutation.mutate({ id: editStaffForm.id, data: updates });
  };

  const handleResetStaffPassword = (staff: StaffMember) => {
    setResetPasswordForm({ staffId: staff.id, newPassword: '' });
    setIsResetPasswordDialogOpen(true);
  };

  const handleConfirmResetPassword = () => {
    const passwordError = validatePassword(resetPasswordForm.newPassword);
    if (passwordError) {
      toast({ title: "Error", description: passwordError, variant: "destructive" });
      return;
    }
    resetStaffPasswordMutation.mutate({ id: resetPasswordForm.staffId, newPassword: resetPasswordForm.newPassword });
  };

  const handleDeleteStaff = (staff: StaffMember) => {
    setStaffToDelete(staff);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (staffToDelete) {
      deleteStaffMutation.mutate(staffToDelete.id);
    }
  };

  // Initialize local state from API data
  useEffect(() => {
    if (deviceConfigs) {
      const pc = deviceConfigs.find((c) => c.category === "PC");
      const ps5 = deviceConfigs.find((c) => c.category === "PS5");

      if (pc) {
        setPcConfig({
          count: pc.count,
          seats: pc.seats.map((name) => ({ name, visible: true })),
        });
      }

      if (ps5) {
        setPs5Config({
          count: ps5.count,
          seats: ps5.seats.map((name) => ({ name, visible: true })),
        });
      }
    }
  }, [deviceConfigs]);

  useEffect(() => {
    if (pricingConfigs) {
      const pcConfigs = pricingConfigs.filter((c) => c.category === "PC");
      const ps5Configs = pricingConfigs.filter((c) => c.category === "PS5");

      setPcPricing(pcConfigs.map((c) => ({ duration: c.duration, price: parseFloat(c.price), personCount: c.personCount })));
      setPs5Pricing(ps5Configs.map((c) => ({ duration: c.duration, price: parseFloat(c.price), personCount: c.personCount })));
    }
  }, [pricingConfigs]);

  useEffect(() => {
    if (happyHoursConfigs) {
      const pcConfigs = happyHoursConfigs.filter((c) => c.category === "PC");
      const ps5Configs = happyHoursConfigs.filter((c) => c.category === "PS5");

      setPcHappyHoursEnabled(pcConfigs.length > 0 && pcConfigs[0].enabled === 1);
      setPs5HappyHoursEnabled(ps5Configs.length > 0 && ps5Configs[0].enabled === 1);

      setPcTimeSlots(pcConfigs.map((c) => ({ startTime: c.startTime, endTime: c.endTime })));
      setPs5TimeSlots(ps5Configs.map((c) => ({ startTime: c.startTime, endTime: c.endTime })));
    }
  }, [happyHoursConfigs]);

  useEffect(() => {
    if (happyHoursPricing) {
      const pcPricing = happyHoursPricing.filter((c) => c.category === "PC");
      const ps5Pricing = happyHoursPricing.filter((c) => c.category === "PS5");

      setPcHappyHoursPricing(pcPricing.map((c) => ({ duration: c.duration, price: parseFloat(c.price), personCount: c.personCount })));
      setPs5HappyHoursPricing(ps5Pricing.map((c) => ({ duration: c.duration, price: parseFloat(c.price), personCount: c.personCount })));
    }
  }, [happyHoursPricing]);

  // Save mutations
  const saveDeviceConfigMutation = useMutation({
    mutationFn: async ({ category, count, seats }: { category: string; count: number; seats: string[] }) => {
      return apiRequest("POST", "/api/device-config", { category, count, seats });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/device-config'] });
      queryClient.invalidateQueries({ queryKey: ['device-configs'] });
      toast({ title: "Success", description: "Device configuration saved" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save device configuration",
        variant: "destructive" 
      });
    },
  });

  const deleteDeviceConfigMutation = useMutation({
    mutationFn: async (category: string) => {
      if (isTauri()) {
        await localDb.deleteDeviceConfig(category);
        return { success: true };
      }
      return apiRequest("DELETE", `/api/device-config/${category}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/device-config'] });
      queryClient.invalidateQueries({ queryKey: ['device-configs'] });
      toast({ title: "Success", description: "Device category deleted" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete device category",
        variant: "destructive" 
      });
    },
  });

  const handleDeleteDeviceConfig = (category: string) => {
    if (confirm(`Are you sure you want to delete the ${category} category? This will remove all ${category} devices.`)) {
      deleteDeviceConfigMutation.mutate(category);
      if (category === "PC") {
        setPcConfig({ count: 0, seats: [] });
      } else if (category === "PS5") {
        setPs5Config({ count: 0, seats: [] });
      }
    }
  };

  const savePricingMutation = useMutation({
    mutationFn: async ({ category, configs }: { category: string; configs: { duration: string; price: number; personCount?: number }[] }) => {
      return apiRequest("POST", "/api/pricing-config", {
        category,
        configs: configs.map((c) => ({ duration: c.duration, price: c.price.toString(), personCount: c.personCount || 1 })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pricing-config'] });
      toast({ title: "Success", description: "Pricing configuration saved" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save pricing configuration",
        variant: "destructive" 
      });
    },
  });

  const saveHappyHoursConfigMutation = useMutation({
    mutationFn: async ({ category, enabled, timeSlots }: { category: string; enabled: boolean; timeSlots: TimeSlot[] }) => {
      return apiRequest("POST", "/api/happy-hours-config", {
        category,
        configs: timeSlots.map((slot) => ({ startTime: slot.startTime, endTime: slot.endTime, enabled: enabled ? 1 : 0 })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/happy-hours-config'] });
      toast({ title: "Success", description: "Happy hours configuration saved" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save happy hours configuration",
        variant: "destructive" 
      });
    },
  });

  const saveHappyHoursPricingMutation = useMutation({
    mutationFn: async ({ category, configs }: { category: string; configs: { duration: string; price: number; personCount?: number }[] }) => {
      return apiRequest("POST", "/api/happy-hours-pricing", {
        category,
        configs: configs.map((c) => ({ duration: c.duration, price: c.price.toString(), personCount: c.personCount || 1 })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/happy-hours-pricing'] });
      toast({ title: "Success", description: "Happy hours pricing saved" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save happy hours pricing",
        variant: "destructive" 
      });
    },
  });

  const handleSaveAll = async () => {
    try {
      // Save all configurations in parallel
      const savePromises = [
        // Device configs
        apiRequest("POST", "/api/device-config", {
          category: "PC",
          count: pcConfig.count,
          seats: pcConfig.seats.map((s) => s.name),
        }),
        apiRequest("POST", "/api/device-config", {
          category: "PS5",
          count: ps5Config.count,
          seats: ps5Config.seats.map((s) => s.name),
        }),
        // Pricing
        apiRequest("POST", "/api/pricing-config", {
          category: "PC",
          configs: pcPricing.map((c) => ({ duration: c.duration, price: c.price.toString(), personCount: c.personCount || 1 })),
        }),
        apiRequest("POST", "/api/pricing-config", {
          category: "PS5",
          configs: ps5Pricing.map((c) => ({ duration: c.duration, price: c.price.toString(), personCount: c.personCount || 1 })),
        }),
        // Happy hours config
        apiRequest("POST", "/api/happy-hours-config", {
          category: "PC",
          configs: (pcTimeSlots.length > 0 ? pcTimeSlots : [{ startTime: "11:00", endTime: "14:00" }])
            .map((slot) => ({ startTime: slot.startTime, endTime: slot.endTime, enabled: pcHappyHoursEnabled ? 1 : 0 })),
        }),
        apiRequest("POST", "/api/happy-hours-config", {
          category: "PS5",
          configs: (ps5TimeSlots.length > 0 ? ps5TimeSlots : [{ startTime: "11:00", endTime: "14:00" }])
            .map((slot) => ({ startTime: slot.startTime, endTime: slot.endTime, enabled: ps5HappyHoursEnabled ? 1 : 0 })),
        }),
      ];

      // Add happy hours pricing if exists
      if (pcHappyHoursPricing.length > 0) {
        savePromises.push(
          apiRequest("POST", "/api/happy-hours-pricing", {
            category: "PC",
            configs: pcHappyHoursPricing.map((c) => ({ duration: c.duration, price: c.price.toString(), personCount: c.personCount || 1 })),
          })
        );
      }
      if (ps5HappyHoursPricing.length > 0) {
        savePromises.push(
          apiRequest("POST", "/api/happy-hours-pricing", {
            category: "PS5",
            configs: ps5HappyHoursPricing.map((c) => ({ duration: c.duration, price: c.price.toString(), personCount: c.personCount || 1 })),
          })
        );
      }

      // Wait for all saves to complete
      await Promise.all(savePromises);

      // Invalidate all queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/device-config'] });
      queryClient.invalidateQueries({ queryKey: ['device-configs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pricing-config'] });
      queryClient.invalidateQueries({ queryKey: ['/api/happy-hours-config'] });
      queryClient.invalidateQueries({ queryKey: ['/api/happy-hours-pricing'] });

      // Show single success toast
      toast({
        title: "Settings Saved",
        description: "All configurations have been saved successfully!",
      });
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save some settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePcCountChange = (newCount: number) => {
    const newSeats = Array.from({ length: newCount }, (_, i) => ({
      name: `PC-${i + 1}`,
      visible: i < pcConfig.seats.length ? pcConfig.seats[i].visible : true,
    }));
    setPcConfig({ count: newCount, seats: newSeats });
  };

  const handlePs5CountChange = (newCount: number) => {
    const newSeats = Array.from({ length: newCount }, (_, i) => ({
      name: `PS5-${i + 1}`,
      visible: i < ps5Config.seats.length ? ps5Config.seats[i].visible : true,
    }));
    setPs5Config({ count: newCount, seats: newSeats });
  };

  const handlePcToggleVisibility = (seatName: string) => {
    setPcConfig((prev) => ({
      ...prev,
      seats: prev.seats.map((s) => (s.name === seatName ? { ...s, visible: !s.visible } : s)),
    }));
  };

  const handlePs5ToggleVisibility = (seatName: string) => {
    setPs5Config((prev) => ({
      ...prev,
      seats: prev.seats.map((s) => (s.name === seatName ? { ...s, visible: !s.visible } : s)),
    }));
  };

  const addPcTimeSlot = () => {
    setPcTimeSlots([...pcTimeSlots, { startTime: "11:00", endTime: "14:00" }]);
  };

  const addPs5TimeSlot = () => {
    setPs5TimeSlots([...ps5TimeSlots, { startTime: "11:00", endTime: "14:00" }]);
  };

  const removePcTimeSlot = (index: number) => {
    setPcTimeSlots(pcTimeSlots.filter((_, i) => i !== index));
  };

  const removePs5TimeSlot = (index: number) => {
    setPs5TimeSlots(ps5TimeSlots.filter((_, i) => i !== index));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-settings-title">Settings</h1>
          <p className="text-muted-foreground">Configure devices and pricing</p>
        </div>
        <Button onClick={handleSaveAll} data-testid="button-save-changes">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Device Configuration */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Device Configuration</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {!isTauri() && (
            <DeviceConfigCard
              title="PC"
              description={`Configure PC devices`}
              count={pcConfig.count}
              onCountChange={handlePcCountChange}
              seats={pcConfig.seats}
              onToggleVisibility={handlePcToggleVisibility}
              onDelete={() => handleDeleteDeviceConfig("PC")}
            />
          )}
          <DeviceConfigCard
            title="PS5"
            description={`Configure PS5 devices`}
            count={ps5Config.count}
            onCountChange={handlePs5CountChange}
            seats={ps5Config.seats}
            onToggleVisibility={handlePs5ToggleVisibility}
            onDelete={() => handleDeleteDeviceConfig("PS5")}
          />
        </div>
      </div>

      {/* Pricing Configuration */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Pricing Configuration</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {!isTauri() && (
            <PricingTable category="PC" slots={pcPricing} onUpdateSlots={setPcPricing} />
          )}
          <PricingTable category="PS5" slots={ps5Pricing} onUpdateSlots={setPs5Pricing} />
        </div>
      </div>

      {/* Happy Hours Time Slots */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Happy Hours Time Slots</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Define when happy hours are active. Enable/disable and set time periods for special pricing.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {!isTauri() && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>PC</CardTitle>
                    <CardDescription>Configure happy hours time slots and pricing</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="pc-enabled">Enabled</Label>
                    <Switch id="pc-enabled" checked={pcHappyHoursEnabled} onCheckedChange={setPcHappyHoursEnabled} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {pcTimeSlots.map((slot, index) => (
                  <div key={index} className="space-y-2 p-3 rounded-md border">
                    <div className="flex items-start justify-between gap-2">
                      <div className="grid grid-cols-2 gap-2 flex-1">
                        <div>
                          <Label className="text-xs">Start Time</Label>
                          <Input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => {
                              const newSlots = [...pcTimeSlots];
                              newSlots[index].startTime = e.target.value;
                              setPcTimeSlots(newSlots);
                            }}
                            data-testid={`input-pc-start-${index}`}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">End Time</Label>
                          <Input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => {
                              const newSlots = [...pcTimeSlots];
                              newSlots[index].endTime = e.target.value;
                              setPcTimeSlots(newSlots);
                            }}
                            data-testid={`input-pc-end-${index}`}
                          />
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removePcTimeSlot(index)}
                        className="mt-5"
                        data-testid={`button-remove-pc-timeslot-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={addPcTimeSlot} data-testid="button-add-pc-timeslot">
                  + Add Time Slot
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>PS5</CardTitle>
                  <CardDescription>Configure happy hours time slots and pricing</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="ps5-enabled">Enabled</Label>
                  <Switch id="ps5-enabled" checked={ps5HappyHoursEnabled} onCheckedChange={setPs5HappyHoursEnabled} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {ps5TimeSlots.map((slot, index) => (
                <div key={index} className="space-y-2 p-3 rounded-md border">
                  <div className="flex items-start justify-between gap-2">
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <div>
                        <Label className="text-xs">Start Time</Label>
                        <Input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => {
                            const newSlots = [...ps5TimeSlots];
                            newSlots[index].startTime = e.target.value;
                            setPs5TimeSlots(newSlots);
                          }}
                          data-testid={`input-ps5-start-${index}`}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">End Time</Label>
                        <Input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => {
                            const newSlots = [...ps5TimeSlots];
                            newSlots[index].endTime = e.target.value;
                            setPs5TimeSlots(newSlots);
                          }}
                          data-testid={`input-ps5-end-${index}`}
                        />
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removePs5TimeSlot(index)}
                      className="mt-5"
                      data-testid={`button-remove-ps5-timeslot-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={addPs5TimeSlot} data-testid="button-add-ps5-timeslot">
                + Add Time Slot
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Happy Hours Pricing */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Happy Hours Pricing</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Set pricing tiers that apply during happy hours time slots. These prices are active only when happy hours are enabled and within the configured time periods.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {!isTauri() && (
            <HappyHoursPricing category="PC" slots={pcHappyHoursPricing} onUpdateSlots={setPcHappyHoursPricing} />
          )}
          <HappyHoursPricing category="PS5" slots={ps5HappyHoursPricing} onUpdateSlots={setPs5HappyHoursPricing} />
        </div>
      </div>

      {/* Profile Management - hidden from staff in Tauri desktop mode */}
      {!(isTauri() && !isAdmin) && (
        <>
          <Separator className="my-8" />

          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <User className="h-6 w-6" />
              Profile Management
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Update your profile information and change your password.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Profile Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile && (
                <div className="mb-4">
                  <Badge variant="secondary" data-testid="badge-user-role">
                    {profile.role.toUpperCase()}
                  </Badge>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="profile-username">Username</Label>
                <Input
                  id="profile-username"
                  value={profileForm.username}
                  onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                  placeholder="Enter username"
                  data-testid="input-profile-username"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleUpdateProfile} 
                disabled={updateProfileMutation.isPending}
                data-testid="button-update-profile"
              >
                {updateProfileMutation.isPending ? "Saving..." : "Update Profile"}
              </Button>
            </CardFooter>
          </Card>

          {/* Change Password Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    data-testid="input-current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    data-testid="button-toggle-current-password"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Enter new password (min 8 characters)"
                    data-testid="input-new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    data-testid="button-toggle-new-password"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    data-testid="input-confirm-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    data-testid="button-toggle-confirm-password"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleChangePassword} 
                disabled={changePasswordMutation.isPending || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                data-testid="button-change-password"
              >
                {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
              </Button>
            </CardFooter>
          </Card>
            </div>
          </div>
        </>
      )}

      {/* Staff Management (Admin only) */}
      {isAuthLoaded && isAdmin && (
        <>
          <Separator className="my-8" />
          <div>
            <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  Staff Management
                </h2>
                <p className="text-sm text-muted-foreground">
                  Manage staff accounts - add, edit, or remove staff members.
                </p>
              </div>
              <Dialog open={isAddStaffDialogOpen} onOpenChange={setIsAddStaffDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-staff">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Staff Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Staff Member</DialogTitle>
                    <DialogDescription>
                      Create a new staff account. Staff members can manage sessions and view reports.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-staff-username">Username *</Label>
                      <Input
                        id="new-staff-username"
                        value={newStaffForm.username}
                        onChange={(e) => setNewStaffForm({ ...newStaffForm, username: e.target.value })}
                        placeholder="Enter username"
                        data-testid="input-new-staff-username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-staff-password">Password *</Label>
                      <div className="relative">
                        <Input
                          id="new-staff-password"
                          type={showNewStaffPassword ? "text" : "password"}
                          value={newStaffForm.password}
                          onChange={(e) => setNewStaffForm({ ...newStaffForm, password: e.target.value })}
                          placeholder="Enter password (min 8 characters)"
                          data-testid="input-new-staff-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0"
                          onClick={() => setShowNewStaffPassword(!showNewStaffPassword)}
                        >
                          {showNewStaffPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddStaffDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateStaff} 
                      disabled={createStaffMutation.isPending}
                      data-testid="button-confirm-add-staff"
                    >
                      {createStaffMutation.isPending ? "Creating..." : "Create Staff"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Staff List */}
            <div className="grid gap-4">
              {staffLoading ? (
                <Card>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground text-center">Loading staff members...</p>
                  </CardContent>
                </Card>
              ) : staffMembers && staffMembers.length > 0 ? (
                staffMembers.map((staff) => (
                  <Card key={staff.id} data-testid={`card-staff-${staff.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium" data-testid={`text-staff-username-${staff.id}`}>
                                {staff.username}
                              </p>
                              <Badge variant="outline" className="text-xs">Staff</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Staff member
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditStaff(staff)}
                            data-testid={`button-edit-staff-${staff.id}`}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetStaffPassword(staff)}
                            data-testid={`button-reset-password-${staff.id}`}
                          >
                            <Lock className="h-4 w-4 mr-1" />
                            Reset Password
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteStaff(staff)}
                            data-testid={`button-delete-staff-${staff.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground text-center">No staff members found. Add your first staff member above.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Edit Staff Dialog */}
          <Dialog open={isEditStaffDialogOpen} onOpenChange={setIsEditStaffDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Staff Member</DialogTitle>
                <DialogDescription>
                  Update staff member information.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-staff-username">Username</Label>
                  <Input
                    id="edit-staff-username"
                    value={editStaffForm.username}
                    onChange={(e) => setEditStaffForm({ ...editStaffForm, username: e.target.value })}
                    placeholder="Enter username"
                    data-testid="input-edit-staff-username"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditStaffDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateStaff} 
                  disabled={updateStaffMutation.isPending}
                  data-testid="button-confirm-edit-staff"
                >
                  {updateStaffMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Reset Password Dialog */}
          <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset Staff Password</DialogTitle>
                <DialogDescription>
                  Enter a new password for this staff member.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-staff-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="reset-staff-password"
                      type={showResetStaffPassword ? "text" : "password"}
                      value={resetPasswordForm.newPassword}
                      onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, newPassword: e.target.value })}
                      placeholder="Enter new password (min 8 characters)"
                      data-testid="input-reset-staff-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={() => setShowResetStaffPassword(!showResetStaffPassword)}
                    >
                      {showResetStaffPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleConfirmResetPassword} 
                  disabled={resetStaffPasswordMutation.isPending}
                  data-testid="button-confirm-reset-password"
                >
                  {resetStaffPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Staff Member</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this staff member? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              {staffToDelete && (
                <div className="py-4">
                  <p className="text-sm">
                    You are about to delete <strong>{staffToDelete.username}</strong>.
                  </p>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleConfirmDelete} 
                  disabled={deleteStaffMutation.isPending}
                  data-testid="button-confirm-delete-staff"
                >
                  {deleteStaffMutation.isPending ? "Deleting..." : "Delete Staff"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
