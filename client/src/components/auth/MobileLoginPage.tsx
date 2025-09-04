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
import { Eye, EyeOff, ArrowLeft, Info, BookOpen, Users, GraduationCap, Building, Shield, CheckCircle } from 'lucide-react';

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
    <div className="gov-theme min-h-screen">
      {/* Header */}
      <div className="gov-header">
        <div className="gov-header-content">
          <div className="flex items-center justify-center py-6">
            <div className="gov-logo">
              <div className="gov-logo-icon">
                <img 
                  src="/logo.jpg" 
                  alt="O'zbek Talim Logo" 
                  className="w-12 h-12 rounded object-cover"
                />
              </div>
              <div>
                <div className="gov-logo-text">O'zbek Talim</div>
                <div className="gov-logo-subtitle">Zamonaviy ta'lim platformasi</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="gov-main">
        <div className="gov-container">
          <div className="max-w-md mx-auto">
            <div className="gov-card gov-fade-in">
              <div className="gov-card-header">
                <h2 className="gov-card-title">Tizimga kirish</h2>
                <p className="gov-card-subtitle">
                  Ma'lumotlaringizni kiriting
                </p>
              </div>

              <div className="gov-card-content">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="gov-label">
                            Foydalanuvchi nomi
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="foydalanuvchi_nomi" 
                              {...field} 
                              className="gov-input"
                            />
                          </FormControl>
                          <FormMessage className="text-xs text-red-600" />
                        </FormItem>
                      )}
                    />
                      
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="gov-label">
                            Parol
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Parolingizni kiriting" 
                                {...field} 
                                className="gov-input pr-12"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                              >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-xs text-red-600" />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      disabled={isLoggingIn}
                      className="w-full gov-btn gov-btn-primary"
                    >
                      {isLoggingIn ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Kiring...</span>
                        </div>
                      ) : (
                        'Tizimga kirish'
                      )}
                    </Button>
                  </form>
                </Form>

                {/* Divider */}
                <div className="my-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500 font-medium">yoki</span>
                    </div>
                  </div>
                </div>

                {/* Register Link */}
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Hali ro'yxatdan o'tmaganmisiz?
                  </p>
                  <Link href="/register">
                    <Button 
                      variant="outline" 
                      className="w-full gov-btn gov-btn-secondary"
                    >
                      Ro'yxatdan o'tish
                    </Button>
                  </Link>
                </div>

                {/* Forgot Password */}
                <div className="text-center mt-4">
                  <Link href="/forgot-password">
                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
                      Parolni unutdingizmi?
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Role Cards */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="gov-card gov-fade-in">
                <div className="gov-card-content text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <GraduationCap className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">O'qituvchi</h3>
                  <p className="text-xs text-gray-600">Darslar va testlar</p>
                </div>
              </div>
              
              <div className="gov-card gov-fade-in">
                <div className="gov-card-content text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">O'quvchi</h3>
                  <p className="text-xs text-gray-600">O'qish va testlar</p>
                </div>
              </div>
              
              <div className="gov-card gov-fade-in">
                <div className="gov-card-content text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Ota-ona</h3>
                  <p className="text-xs text-gray-600">Bolalar kuzatish</p>
                </div>
              </div>
              
              <div className="gov-card gov-fade-in">
                <div className="gov-card-content text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Building className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Markaz</h3>
                  <p className="text-xs text-gray-600">Boshqarish</p>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-6 gov-card gov-fade-in">
              <div className="gov-card-content">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">Xavfsizlik</h4>
                    <p className="text-xs text-gray-600">
                      Barcha ma'lumotlaringiz xavfsiz saqlanadi va faqat sizga tegishli.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileLoginPage;
