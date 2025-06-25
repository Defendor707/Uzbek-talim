import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import useAuth from '@/hooks/useAuth';
import ResponsiveDashboard from '@/components/dashboard/ResponsiveDashboard';
import { apiRequest } from '@/lib/queryClient';
import { Bell, MessageSquare, Globe, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const notificationSettingsSchema = z.object({
  enableTelegram: z.boolean(),
  enableWebsite: z.boolean(),
  minScoreNotification: z.number().min(0).max(100),
  maxScoreNotification: z.number().min(0).max(100),
  notifyOnlyFailed: z.boolean(),
  notifyOnlyPassed: z.boolean(),
  instantNotification: z.boolean(),
  dailyDigest: z.boolean(),
  weeklyDigest: z.boolean(),
}).refine((data) => {
  return data.minScoreNotification <= data.maxScoreNotification;
}, {
  message: "Minimal ball maksimal balldan kichik bo'lishi kerak",
  path: ["maxScoreNotification"],
}).refine((data) => {
  return !(data.notifyOnlyFailed && data.notifyOnlyPassed);
}, {
  message: "Faqat muvaffaqiyatsiz va faqat muvaffaqiyatli bildirishnomalarni bir vaqtda yoqib bo'lmaydi",
  path: ["notifyOnlyPassed"],
});

type NotificationSettingsForm = z.infer<typeof notificationSettingsSchema>;

interface NotificationSettings extends NotificationSettingsForm {
  id: number;
  parentId: number;
  createdAt: string;
  updatedAt: string;
}

const NotificationSettings: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/parent/notification-settings'],
    enabled: !!user,
  });

  const form = useForm<NotificationSettingsForm>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: settings || {
      enableTelegram: true,
      enableWebsite: true,
      minScoreNotification: 0,
      maxScoreNotification: 100,
      notifyOnlyFailed: false,
      notifyOnlyPassed: false,
      instantNotification: true,
      dailyDigest: false,
      weeklyDigest: false,
    },
  });

  // Update form when settings are loaded
  React.useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [settings, form]);

  // Update form when settings are loaded
  React.useEffect(() => {
    if (settings) {
      form.reset({
        enableTelegram: settings.enableTelegram,
        enableWebsite: settings.enableWebsite,
        minScoreNotification: settings.minScoreNotification,
        maxScoreNotification: settings.maxScoreNotification,
        notifyOnlyFailed: settings.notifyOnlyFailed,
        notifyOnlyPassed: settings.notifyOnlyPassed,
        instantNotification: settings.instantNotification,
        dailyDigest: settings.dailyDigest,
        weeklyDigest: settings.weeklyDigest,
      });
    }
  }, [settings, form]);

  const updateSettingsMutation = useMutation({
    mutationFn: (data: NotificationSettingsForm) =>
      apiRequest('/api/parent/notification-settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: "Sozlamalar saqlandi",
        description: "Bildirishnoma sozlamalari muvaffaqiyatli yangilandi",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/parent/notification-settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik",
        description: error.message || "Sozlamalarni saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NotificationSettingsForm) => {
    updateSettingsMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Dashboard sections for parent navigation
  const dashboardSections = [
    {
      id: 'dashboard',
      title: 'Bosh sahifa',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      ),
      href: '/parent/dashboard',
    },
    {
      id: 'children',
      title: 'Farzandlar',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      href: '/parent/children',
    },
    {
      id: 'results',
      title: 'Natijalar',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: '/parent/results',
    },
    {
      id: 'notification-settings',
      title: 'Bildirishnoma',
      icon: <Bell className="w-5 h-5" />,
      href: '/parent/notification-settings',
    }
  ];

  return (
    <ResponsiveDashboard 
      userRole="parent" 
      sections={dashboardSections}
      currentPage="Bildirishnoma sozlamalari"
    >
      <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="w-6 h-6" />
          Bildirishnoma sozlamalari
        </h1>
        <p className="text-gray-600 mt-2">
          Farzandlaringizning test natijalari haqidagi bildirishnomalarni sozlang
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Notification Channels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Bildirishnoma kanallari
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="enableTelegram"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Telegram bildirishnomalar</FormLabel>
                      <FormDescription>
                        Test natijalari haqida Telegram orqali bildirishnoma olish
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enableWebsite"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Veb-sayt bildirishnomalar
                      </FormLabel>
                      <FormDescription>
                        Test natijalari haqida veb-saytda bildirishnoma ko'rish
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Score Range Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Ball chegaralari
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minScoreNotification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimal ball</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Faqat shu balldan yuqori natijalar uchun bildirishnoma
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxScoreNotification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maksimal ball</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 100)}
                        />
                      </FormControl>
                      <FormDescription>
                        Faqat shu balldan past natijalar uchun bildirishnoma
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Bildirishnoma filtrlari
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="notifyOnlyFailed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Faqat muvaffaqiyatsiz testlar</FormLabel>
                      <FormDescription>
                        Faqat 60% dan past natijalar uchun bildirishnoma yuborish
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notifyOnlyPassed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Faqat muvaffaqiyatli testlar</FormLabel>
                      <FormDescription>
                        Faqat 60% dan yuqori natijalar uchun bildirishnoma yuborish
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Timing Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Bildirishnoma vaqti
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="instantNotification"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Tezkor bildirishnoma</FormLabel>
                      <FormDescription>
                        Test yakunlanganidan so'ng darhol bildirishnoma yuborish
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dailyDigest"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Kunlik xulosa</FormLabel>
                      <FormDescription>
                        Har kuni kechqurun test natijalari xulosasi
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weeklyDigest"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Haftalik xulosa</FormLabel>
                      <FormDescription>
                        Har hafta oxirida test natijalari xulosasi
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={updateSettingsMutation.isPending}
              className="px-8"
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saqlanmoqda...
                </>
              ) : (
                'Sozlamalarni saqlash'
              )}
            </Button>
          </div>
        </form>
      </Form>
      </div>
    </ResponsiveDashboard>
  );
};

export default NotificationSettings;