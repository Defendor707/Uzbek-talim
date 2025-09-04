import React, { useState } from 'react';
import { Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import useAuth from '@/hooks/useAuth';
import { Eye, EyeOff, ArrowLeft, Info } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(3, 'Foydalanuvchi nomi kamida 3 ta belgidan iborat bo\'lishi kerak'),
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface MobileLoginPageProps {
  onShowPresentation?: () => void;
}

const MobileLoginPage: React.FC<MobileLoginPageProps> = ({ onShowPresentation }) => {
  const { login, isLoggingIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });
  
  const onSubmit = (values: LoginFormValues) => {
    login({
      username: values.username,
      password: values.password,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Header with Logo */}
      <div className="flex-shrink-0 bg-white shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 overflow-hidden shadow-lg">
              <img 
                src="/logo.jpg" 
                alt="O'zbek Talim Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">O'zbek Talim</h1>
            <p className="text-sm text-gray-600">Zamonaviy ta'lim platformasi</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 pb-8">
        <div className="w-full max-w-sm">
          <Card className="bg-white shadow-xl border-0 rounded-3xl overflow-hidden">
            <div className="p-6">
              {/* Welcome Section */}
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Xush kelibsiz
                </h2>
                <p className="text-sm text-gray-600">
                  Tizimga kirish uchun ma'lumotlaringizni kiriting
                </p>
              </div>

              {/* Login Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Foydalanuvchi nomi
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="foydalanuvchi_nomi" 
                            {...field} 
                            className="h-12 px-4 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-200"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                    
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center mb-2">
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Parol
                          </FormLabel>
                          <Link 
                            href="/forgot-password" 
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Parolingizni unutdingizmi?
                          </Link>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"}
                              placeholder="Parolingizni kiriting" 
                              {...field} 
                              className="h-12 px-4 pr-12 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-200"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                            >
                              {showPassword ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                    disabled={isLoggingIn}
                  >
                    {isLoggingIn ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Tekshirilmoqda...</span>
                      </div>
                    ) : (
                      'Tizimga kirish'
                    )}
                  </Button>
                </form>
              </Form>

              {/* Register Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 mb-3">
                  Hisobingiz yo'qmi?
                </p>
                <Link 
                  href="/register" 
                  className="inline-flex items-center justify-center w-full h-12 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-xl transition-all duration-200"
                >
                  Ro'yxatdan o'tish
                </Link>
              </div>
            </div>
          </Card>

          {/* Info and Presentation Link */}
          <div className="mt-6 space-y-3">
            {onShowPresentation && (
              <button
                onClick={onShowPresentation}
                className="w-full flex items-center justify-center space-x-2 text-blue-600 hover:text-blue-700 font-medium py-3 rounded-xl hover:bg-white hover:bg-opacity-50 transition-all duration-200"
              >
                <Info className="w-4 h-4" />
                <span className="text-sm">Platformani tanishtirishni ko'rish</span>
              </button>
            )}
            
            <div className="text-center">
              <p className="text-xs text-gray-500">
                © 2025 O'zbek Talim. Barcha huquqlar himoyalangan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileLoginPage;