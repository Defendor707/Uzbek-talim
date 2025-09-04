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
import { Eye, EyeOff, ArrowLeft, Info, BookOpen, Users, GraduationCap, Building, Flag, Star, Heart } from 'lucide-react';

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
    <div className="min-h-screen uzbek-gradient-flag uzbek-pattern flex flex-col relative overflow-hidden">
      {/* O'zbekiston milliy elementlari */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Milliy bayroq ranglari bilan floating elementlar */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-uzbek-green/20 rounded-full uzbek-float"></div>
        <div className="absolute top-40 right-16 w-16 h-16 bg-uzbek-gold/20 rounded-full uzbek-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-20 w-12 h-12 bg-uzbek-red/20 rounded-full uzbek-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-uzbek-blue/20 rounded-full uzbek-float" style={{animationDelay: '0.5s'}}></div>
        
        {/* Milliy naqshlar */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 border-4 border-uzbek-gold/30 rounded-full uzbek-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 border-4 border-uzbek-green/30 rounded-full uzbek-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Header with Logo */}
      <div className="flex-shrink-0 nav-uzbek relative z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-4 overflow-hidden shadow-uzbek-lg uzbek-float">
              <img 
                src="/logo.jpg" 
                alt="O'zbek Talim Logo" 
                className="w-full h-full object-cover rounded-3xl"
              />
            </div>
            <h1 className="text-3xl font-bold text-uzbek-green mb-2 drop-shadow-lg">O'zbek Talim</h1>
            <p className="text-uzbek-blue text-lg font-semibold">Zamonaviy ta'lim platformasi</p>
            <div className="flex items-center justify-center space-x-2 mt-2">
              <Flag className="w-5 h-5 text-uzbek-gold" />
              <Star className="w-5 h-5 text-uzbek-gold" />
              <Heart className="w-5 h-5 text-uzbek-red" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 pb-8 relative z-10">
        <div className="w-full max-w-sm">
          <Card className="card-uzbek rounded-3xl overflow-hidden shadow-uzbek-lg">
            <div className="p-8">
              {/* Welcome Section */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-uzbek-green mb-3">
                  Xush kelibsiz
                </h2>
                <p className="text-uzbek-blue">
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
                        <FormLabel className="text-sm font-semibold text-uzbek-green">
                          Foydalanuvchi nomi
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="foydalanuvchi_nomi" 
                            {...field} 
                            className="h-14 px-4 text-base border-2 border-uzbek-green rounded-2xl focus:outline-none focus:ring-2 focus:ring-uzbek-green focus:border-uzbek-green bg-gray-50 focus:bg-white transition-all duration-300 shadow-sm"
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
                        <FormLabel className="text-sm font-semibold text-uzbek-green">
                          Parol
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Parolingizni kiriting" 
                              {...field} 
                              className="h-14 px-4 pr-12 text-base border-2 border-uzbek-green rounded-2xl focus:outline-none focus:ring-2 focus:ring-uzbek-green focus:border-uzbek-green bg-gray-50 focus:bg-white transition-all duration-300 shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-uzbek-green hover:text-uzbek-blue transition-colors"
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
                    className="w-full h-14 btn-uzbek-primary rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:transform-none"
                  >
                    {isLoggingIn ? (
                      <div className="flex items-center space-x-2">
                        <div className="uzbek-spinner w-4 h-4"></div>
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
                    <div className="w-full border-t-2 border-uzbek-gold"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-uzbek-blue font-semibold">yoki</span>
                  </div>
                </div>
              </div>

              {/* Register Link */}
              <div className="text-center">
                <p className="text-sm text-uzbek-blue mb-4">
                  Hali ro'yxatdan o'tmaganmisiz?
                </p>
                <Link href="/register">
                  <Button 
                    variant="outline" 
                    className="w-full h-12 border-2 border-uzbek-green text-uzbek-green hover:bg-green-50 font-semibold rounded-2xl transition-all duration-300"
                  >
                    Ro'yxatdan o'tish
                  </Button>
                </Link>
              </div>

              {/* Forgot Password */}
              <div className="text-center mt-4">
                <Link href="/forgot-password">
                  <button className="text-sm text-uzbek-blue hover:text-uzbek-green font-medium transition-colors">
                    Parolni unutdingizmi?
                  </button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Role Cards - O'zbekiston milliy temasi */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="card-uzbek-green rounded-2xl p-4 text-center uzbek-float">
              <div className="w-12 h-12 bg-uzbek-green/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <GraduationCap className="w-6 h-6 text-uzbek-green" />
              </div>
              <h3 className="text-sm font-semibold text-uzbek-green mb-1">O'qituvchi</h3>
              <p className="text-xs text-uzbek-blue">Darslar va testlar</p>
            </div>
            
            <div className="card-uzbek-gold rounded-2xl p-4 text-center uzbek-float" style={{animationDelay: '0.5s'}}>
              <div className="w-12 h-12 bg-uzbek-gold/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6 text-uzbek-gold" />
              </div>
              <h3 className="text-sm font-semibold text-uzbek-gold mb-1">O'quvchi</h3>
              <p className="text-xs text-uzbek-blue">O'qish va testlar</p>
            </div>
            
            <div className="card-uzbek-blue rounded-2xl p-4 text-center uzbek-float" style={{animationDelay: '1s'}}>
              <div className="w-12 h-12 bg-uzbek-blue/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-uzbek-blue" />
              </div>
              <h3 className="text-sm font-semibold text-uzbek-blue mb-1">Ota-ona</h3>
              <p className="text-xs text-uzbek-green">Bolalar kuzatish</p>
            </div>
            
            <div className="card-uzbek rounded-2xl p-4 text-center uzbek-float" style={{animationDelay: '1.5s'}}>
              <div className="w-12 h-12 bg-uzbek-red/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Building className="w-6 h-6 text-uzbek-red" />
              </div>
              <h3 className="text-sm font-semibold text-uzbek-red mb-1">Markaz</h3>
              <p className="text-xs text-uzbek-blue">Boshqarish</p>
            </div>
          </div>

          {/* Milliy motivatsiya matni */}
          <div className="mt-6 text-center">
            <p className="text-sm text-uzbek-blue font-medium">
              🇺🇿 O'zbekiston kelajagi - ta'limda! 🇺🇿
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileLoginPage;
