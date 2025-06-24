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
    <div className="w-full">
      {/* Modern Mobile-First Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
          Tizimga kirish
        </h2>
        <p className="text-sm md:text-base text-gray-600">Ma'lumotlaringizni kiriting</p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-5">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm md:text-base text-gray-700 font-medium">Foydalanuvchi nomi</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="foydalanuvchi_nomi" 
                    {...field} 
                    className="h-11 md:h-12 px-3 md:px-4 text-sm md:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-gray-50 focus:bg-white transition-colors"
                  />
                </FormControl>
                <FormMessage className="text-xs md:text-sm" />
              </FormItem>
            )}
          />
            
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center mb-2">
                  <FormLabel className="text-sm md:text-base text-gray-700 font-medium">Parol</FormLabel>
                  <Link href="/forgot-password" className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Parolni unutdingizmi?
                  </Link>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••" 
                      {...field} 
                      className="h-11 md:h-12 px-3 md:px-4 pr-10 md:pr-12 text-sm md:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-gray-50 focus:bg-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1 touch-manipulation"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs md:text-sm" />
              </FormItem>
            )}
          />
            
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="mt-3 md:mt-4">
                <div className="flex items-center space-x-2 md:space-x-3">
                  <FormControl>
                    <Checkbox 
                      checked={field.value} 
                      onCheckedChange={field.onChange} 
                      className="h-4 w-4 md:h-5 md:w-5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 border-gray-300 rounded"
                      id="rememberMe"
                    />
                  </FormControl>
                  <FormLabel 
                    htmlFor="rememberMe" 
                    className="text-sm md:text-base text-gray-600 font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Meni eslab qolish
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full h-11 md:h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 mt-5 md:mt-6 text-sm md:text-base shadow-md hover:shadow-lg active:scale-[0.98]"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? 'Yuklanmoqda...' : 'Kirish'}
          </Button>
          
          <div className="text-center pt-4 md:pt-6 border-t border-gray-100 mt-6">
            <span className="text-gray-600 text-xs md:text-sm">Akkauntingiz yo'qmi? </span>
            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold text-xs md:text-sm">
              Ro'yxatdan o'tish
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default LoginForm;