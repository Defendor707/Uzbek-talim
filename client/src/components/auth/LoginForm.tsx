import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'wouter';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { MobileInput, MobileButton, MobileCard } from '@/components/ui/mobile-form';
import { Checkbox } from '@/components/ui/checkbox';
import useAuth from '@/hooks/useAuth';

const loginSchema = z.object({
  username: z.string().min(3, 'Foydalanuvchi nomi kamida 3 ta belgidan iborat bo\'lishi kerak'),
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
  rememberMe: z.boolean().optional().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login, isLoggingIn } = useAuth();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
  });
  
  const onSubmit = (values: LoginFormValues) => {
    login({
      username: values.username,
      password: values.password,
    });
    
    if (onSuccess) {
      onSuccess();
    }
  };
  
  return (
    <div className="w-full max-w-md px-4">
      <MobileCard className="p-6 md:p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Tizimga kirish</h2>
        <p className="text-neutral-medium">O'zbek Talim platformasidan foydalanish uchun tizimga kiring</p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-neutral-medium">Foydalanuvchi nomi</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="foydalanuvchi_nomi" 
                    {...field} 
                    className="px-4 py-2 border border-neutral-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between mb-1">
                  <FormLabel className="text-neutral-medium">Parol</FormLabel>
                  <Link href="/forgot-password" className="text-sm text-primary hover:text-primary-dark">
                    Parolni unutdingizmi?
                  </Link>
                </div>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    {...field} 
                    className="px-4 py-2 border border-neutral-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange} 
                    className="h-4 w-4 text-primary focus:ring-primary border-neutral-light rounded"
                  />
                </FormControl>
                <FormLabel className="text-sm text-neutral-medium">Meni eslab qolish</FormLabel>
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg transition duration-200"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <>
                <span className="material-icons animate-spin mr-2">refresh</span>
                Yuklanmoqda...
              </>
            ) : (
              'Kirish'
            )}
          </Button>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-light"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-neutral-medium">Yoki</span>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 gap-3">
              <Link href="/register">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full flex justify-center items-center py-2 px-4 border border-neutral-light rounded-lg text-neutral-medium hover:bg-neutral-ultralight transition duration-200"
                >
                  <span className="material-icons mr-2 text-sm">person_add</span>
                  Ro'yxatdan o'tish
                </Button>
              </Link>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default LoginForm;