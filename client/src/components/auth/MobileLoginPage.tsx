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
import { Eye, EyeOff, ArrowLeft, Info, BookOpen, Users, GraduationCap, Building } from 'lucide-react';

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
    <div className="min-h-screen animated-bg flex flex-col">
      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full floating"></div>
        <div className="absolute top-40 right-16 w-16 h-16 bg-white/10 rounded-full floating" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-20 w-12 h-12 bg-white/10 rounded-full floating" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-white/10 rounded-full floating" style={{animationDelay: '0.5s'}}></div>
      </div>

      {/* Header with Logo */}
      <div className="flex-shrink-0 glass-nav">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-4 overflow-hidden shadow-role-lg floating">
              <img 
                src="/logo.jpg" 
                alt="O'zbek Talim Logo" 
                className="w-full h-full object-cover rounded-3xl"
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">O'zbek Talim</h1>
            <p className="text-white/90 text-lg">Zamonaviy ta'lim platformasi</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 pb-8 relative z-10">
        <div className="w-full max-w-sm">
          <Card className="glass-card rounded-3xl overflow-hidden shadow-role-lg">
            <div className="p-8">
              {/* Welcome Section */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
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
                            className="h-14 px-4 text-base border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-300 shadow-sm"
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
                        <FormLabel className="text-sm font-semibold text-gray-700">
                          Parol
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Parolingizni kiriting" 
                              {...field} 
                              className="h-14 px-4 pr-12 text-base border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-300 shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={isLoggingIn}
                    className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:transform-none"
                  >
                    {isLoggingIn ? 'Kiring...' : 'Tizimga kirish'}
                  </Button>
                </form>
              </Form>

              {/* Divider */}
              <div className="my-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">yoki</span>
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
                    className="w-full h-12 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold rounded-2xl transition-all duration-300"
                  >
                    Ro'yxatdan o'tish
                  </Button>
                </Link>
              </div>

              {/* Forgot Password */}
              <div className="text-center mt-4">
                <Link href="/forgot-password">
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                    Parolni unutdingizmi?
                  </button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Role Cards */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-4 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">O'qituvchi</h3>
              <p className="text-xs text-gray-600">Darslar va testlar</p>
            </div>
            
            <div className="glass-card rounded-2xl p-4 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">O'quvchi</h3>
              <p className="text-xs text-gray-600">O'qish va testlar</p>
            </div>
            
            <div className="glass-card rounded-2xl p-4 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Ota-ona</h3>
              <p className="text-xs text-gray-600">Bolalar kuzatish</p>
            </div>
            
            <div className="glass-card rounded-2xl p-4 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Building className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Markaz</h3>
              <p className="text-xs text-gray-600">Boshqarish</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileLoginPage;
