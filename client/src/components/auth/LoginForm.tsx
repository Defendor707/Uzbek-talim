import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'wouter';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  const [showPassword, setShowPassword] = useState(false);
  
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
    <div className="w-full" role="main" aria-labelledby="login-title">
      {/* Accessible Header with clear hierarchy */}
      <div className="text-center mb-8">
        <h1 id="login-title" className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
          Tizimga kirish
        </h1>
        <p className="text-base text-gray-600 leading-relaxed" aria-describedby="login-description">
          <span id="login-description">Tizimga kirish uchun ma'lumotlaringizni kiriting</span>
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-gray-700 font-medium">Foydalanuvchi nomi</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="foydalanuvchi_nomi" 
                    {...field} 
                    className="h-11 px-3 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </FormControl>
                <FormMessage className="text-sm" />
              </FormItem>
            )}
          />
            
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <FormLabel 
                    className="text-sm font-semibold text-gray-800 block"
                    htmlFor="password-input"
                  >
                    Parol
                    <span className="text-red-500 ml-1" aria-label="majburiy maydon">*</span>
                  </FormLabel>
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-1 py-0.5"
                    aria-label="Parolni unutdingizmi? Tiklash uchun bosing"
                  >
                    Parolni unutdingizmi?
                  </Link>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input 
                      id="password-input"
                      type={showPassword ? "text" : "password"}
                      placeholder="Parolingizni kiriting" 
                      {...field} 
                      className="h-11 px-3 pr-10 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 text-gray-900 bg-white transition-all duration-200 hover:border-gray-400"
                      aria-describedby="password-error password-help"
                      aria-invalid={!!form.formState.errors.password}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded p-1"
                      aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                      tabIndex={0}
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </FormControl>
                <div id="password-help" className="text-xs text-gray-500">
                  Kamida 6 ta belgi bo'lishi kerak
                </div>
                <FormMessage id="password-error" className="text-sm font-medium" />
              </FormItem>
            )}
          />
            


          <Button 
            type="submit" 
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold text-base rounded-lg transition-all duration-200 mt-6 shadow-lg hover:shadow-xl focus:outline-none focus:ring-3 focus:ring-blue-500/30 focus:ring-offset-2"
            disabled={isLoggingIn}
            aria-describedby={isLoggingIn ? "loading-status" : undefined}
          >
            {isLoggingIn ? (
              <div className="flex items-center justify-center" role="status" aria-live="polite">
                <svg 
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span id="loading-status">Yuklanmoqda...</span>
              </div>
            ) : (
              'Tizimga kirish'
            )}
          </Button>
          
          <div className="text-center pt-6 border-t border-gray-200 mt-8">
            <p className="text-gray-600 text-sm mb-2">
              Akkauntingiz yo'qmi?
            </p>
            <Link 
              href="/register" 
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
              aria-label="Yangi akkount yaratish"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Ro'yxatdan o'tish
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default LoginForm;