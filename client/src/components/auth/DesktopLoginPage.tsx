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
import { Eye, EyeOff, Info, BookOpen, Users, GraduationCap, School, Shield, Zap, Globe } from 'lucide-react';

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
    <div className="min-h-screen animated-bg flex items-center justify-center p-8 relative overflow-hidden">
      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full floating"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-white/10 rounded-full floating" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-32 w-20 h-20 bg-white/10 rounded-full floating" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-white/10 rounded-full floating" style={{animationDelay: '0.5s'}}></div>
      </div>

      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Left side - Branding and Features */}
        <div className="space-y-8 text-white">
          {/* Logo and Title */}
          <div className="text-center lg:text-left">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto lg:mx-0 mb-6 overflow-hidden shadow-role-lg floating">
              <img 
                src="/logo.jpg" 
                alt="O'zbek Talim Logo" 
                className="w-full h-full object-cover rounded-3xl"
              />
            </div>
            <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">O'zbek Talim</h1>
            <p className="text-xl text-white/90 mb-2">Zamonaviy ta'lim platformasi</p>
            <p className="text-lg text-white/80">
              O'zbekiston ta'lim tizimi uchun professional yechim
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">O'qituvchilar</h3>
              <p className="text-sm text-white/80">Darslar va testlar yaratish</p>
            </div>
            
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">O'quvchilar</h3>
              <p className="text-sm text-white/80">O'qish va testlar</p>
            </div>
            
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Ota-onalar</h3>
              <p className="text-sm text-white/80">Bolalar kuzatish</p>
            </div>
            
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <School className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Markazlar</h3>
              <p className="text-sm text-white/80">Boshqarish</p>
            </div>
          </div>

          {/* Additional Features */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-white/90">Xavfsiz va ishonchli</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-white/90">Tez va samarali</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <span className="text-white/90">Har joyda ishlaydi</span>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="flex justify-center lg:justify-end">
          <Card className="glass-card w-full max-w-md rounded-3xl overflow-hidden shadow-role-lg">
            <div className="p-10">
              {/* Welcome Section */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Xush kelibsiz
                </h2>
                <p className="text-gray-600 text-lg">
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
              <div className="my-8">
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
                <p className="text-gray-600 mb-4">
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
              <div className="text-center mt-6">
                <Link href="/forgot-password">
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                    Parolni unutdingizmi?
                  </button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DesktopLoginPage;
