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
import { Eye, EyeOff, Info, BookOpen, Users, GraduationCap, School } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(3, 'Foydalanuvchi nomi kamida 3 ta belgidan iborat bo\'lishi kerak'),
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface DesktopLoginPageProps {
  onShowPresentation?: () => void;
}

const DesktopLoginPage: React.FC<DesktopLoginPageProps> = ({ onShowPresentation }) => {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-8">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Left side - Branding and Features */}
        <div className="space-y-8">
          {/* Logo and Title */}
          <div className="text-center lg:text-left">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto lg:mx-0 mb-6 overflow-hidden shadow-lg">
              <img 
                src="/logo.jpg" 
                alt="O'zbek Talim Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              O'zbek Talim
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Zamonaviy ta'lim platformasi
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">O'qituvchilar uchun</h3>
                  <p className="text-sm text-gray-600">Test va darslarni yarating, o'quvchilar bilan ishlang</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">O'quvchilar uchun</h3>
                  <p className="text-sm text-gray-600">Testlar va darslar orqali bilimingizni sinab ko'ring</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Ota-onalar uchun</h3>
                  <p className="text-sm text-gray-600">Farzandingizning o'qish jarayonini kuzatib boring</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <School className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">O'quv markazlari</h3>
                  <p className="text-sm text-gray-600">Ta'lim muassasangizni samarali boshqaring</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Presentation Button */}
          {onShowPresentation && (
            <div className="text-center lg:text-left">
              <button
                onClick={onShowPresentation}
                className="inline-flex items-center space-x-3 bg-white/80 hover:bg-white text-gray-800 px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg backdrop-blur-sm"
              >
                <Info className="w-5 h-5" />
                <span>Platformani tanishtirishni ko'rish</span>
              </button>
            </div>
          )}
        </div>

        {/* Right side - Login Form */}
        <div className="flex justify-center lg:justify-end">
          <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
            <div className="p-8">
              {/* Form Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Xush kelibsiz
                </h2>
                <p className="text-gray-600">
                  Tizimga kirish uchun ma'lumotlaringizni kiriting
                </p>
              </div>

              {/* Login Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700">
                          Foydalanuvchi nomi
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="foydalanuvchi_nomi" 
                            {...field} 
                            className="h-12 px-4 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-200"
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
                      <FormItem>
                        <div className="flex justify-between items-center mb-2">
                          <FormLabel className="text-sm font-semibold text-gray-700">
                            Parol
                          </FormLabel>
                          <Link 
                            href="/forgot-password" 
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Unutdingizmi?
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
                        <FormMessage className="text-sm" />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                    disabled={isLoggingIn}
                  >
                    {isLoggingIn ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Tekshirilmoqda...</span>
                      </div>
                    ) : (
                      'Tizimga kirish'
                    )}
                  </Button>
                </form>
              </Form>

              {/* Register Link */}
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Hisobingiz yo'qmi?
                </p>
                <Link 
                  href="/register" 
                  className="inline-flex items-center justify-center w-full h-12 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-xl transition-all duration-200"
                >
                  Ro'yxatdan o'tish
                </Link>
              </div>

              {/* Footer */}
              <div className="mt-8 text-center">
                <p className="text-xs text-gray-500">
                  © 2025 O'zbek Talim. Barcha huquqlar himoyalangan.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DesktopLoginPage;