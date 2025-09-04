import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import useAuth from '@/hooks/useAuth';
import { Eye, EyeOff, ChevronLeft, ChevronRight, Play, BookOpen, Users, GraduationCap, Building, Shield, CheckCircle, X } from 'lucide-react';

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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showPresentation, setShowPresentation] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
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

  const presentationSlides = [
    {
      title: "O'zbek Talim",
      subtitle: "Zamonaviy ta'lim platformasi",
      description: "O'zbekiston ta'lim tizimi uchun innovatsion yechim. Barcha o'quv jarayonlarini boshqaring va natijalarni kuzating.",
      icon: <GraduationCap className="w-20 h-20 text-white" />,
      color: "from-blue-500 to-blue-700"
    },
    {
      title: "O'qituvchilar uchun",
      subtitle: "Darslarni boshqaring",
      description: "Testlar yarating, o'quvchilarni kuzating va natijalarni tahlil qiling. Darslaringizni onlayn boshqaring.",
      icon: <BookOpen className="w-20 h-20 text-white" />,
      color: "from-green-500 to-green-700"
    },
    {
      title: "O'quvchilar uchun",
      subtitle: "O'rganing va rivoqlaning",
      description: "Darslarni ko'ring, testlarni bajaring va bilimingizni oshiring. O'z rivojlanishingizni kuzating.",
      icon: <Users className="w-20 h-20 text-white" />,
      color: "from-purple-500 to-purple-700"
    },
    {
      title: "Ota-onalar uchun",
      subtitle: "Farzandingizni kuzating",
      description: "Bolangizning o'qish jarayonini kuzatib boring va natijalarni ko'ring. Farzandingizning rivojlanishini kuzating.",
      icon: <Building className="w-20 h-20 text-white" />,
      color: "from-orange-500 to-orange-700"
    }
  ];

  // Avtomatik slide o'tishi
  useEffect(() => {
    if (showPresentation && isAutoPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % presentationSlides.length);
      }, 4000); // 4 soniyada bir marta
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [showPresentation, isAutoPlaying, presentationSlides.length]);

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % presentationSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + presentationSlides.length) % presentationSlides.length);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  if (showPresentation) {
    return (
      <div className="gov-theme min-h-screen">
        {/* Presentation Header */}
        <div className="gov-header">
          <div className="gov-header-content">
            <div className="flex items-center justify-between py-4">
              <Button
                variant="ghost"
                onClick={() => setShowPresentation(false)}
                className="text-white hover:bg-white/20"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Orqaga
              </Button>
              <div className="text-white">
                <h1 className="text-xl font-bold">O'zbek Talim</h1>
                <p className="text-sm text-white/80">Ta'lim platformasi</p>
              </div>
              <Button
                variant="ghost"
                onClick={toggleAutoPlay}
                className="text-white hover:bg-white/20"
              >
                {isAutoPlaying ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Presentation Content */}
        <div className="gov-main">
          <div className="gov-container">
            <div className="max-w-4xl mx-auto">
              <div 
                className="gov-card gov-fade-in relative overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="gov-card-content">
                  <div className="text-center mb-8">
                    <div className={`w-40 h-40 mx-auto mb-8 rounded-full bg-gradient-to-r ${presentationSlides[currentSlide].color} flex items-center justify-center text-white shadow-2xl`}>
                      {presentationSlides[currentSlide].icon}
                    </div>
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                      {presentationSlides[currentSlide].title}
                    </h2>
                    <h3 className="text-2xl text-gray-600 mb-6">
                      {presentationSlides[currentSlide].subtitle}
                    </h3>
                    <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
                      {presentationSlides[currentSlide].description}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentSlide + 1) / presentationSlides.length) * 100}%` }}
                    ></div>
                  </div>

                  {/* Slide Navigation */}
                  <div className="flex items-center justify-center space-x-4 mb-8">
                    <Button
                      variant="outline"
                      onClick={prevSlide}
                      className="gov-btn gov-btn-secondary"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Oldingi
                    </Button>
                    
                    <div className="flex space-x-3">
                      {presentationSlides.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentSlide(index)}
                          className={`w-4 h-4 rounded-full transition-all duration-300 ${
                            index === currentSlide ? 'bg-blue-600 scale-125' : 'bg-gray-300 hover:bg-gray-400'
                          }`}
                        />
                      ))}
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={nextSlide}
                      className="gov-btn gov-btn-secondary"
                    >
                      Keyingi
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>

                  {/* Auto Play Indicator */}
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center space-x-2 text-sm text-gray-600">
                      <div className={`w-2 h-2 rounded-full ${isAutoPlaying ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span>{isAutoPlaying ? 'Avtomatik o\'tish yoqilgan' : 'Avtomatik o\'tish o\'chirilgan'}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="text-center">
                    <Button
                      onClick={() => setShowPresentation(false)}
                      className="gov-btn gov-btn-primary mr-4"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Tizimga kirish
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowPresentation(false)}
                      className="gov-btn gov-btn-secondary"
                    >
                      Orqaga qaytish
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            {/* Presentation Button */}
            <div className="text-center mb-6">
              <Button
                onClick={() => setShowPresentation(true)}
                variant="outline"
                className="gov-btn gov-btn-secondary"
              >
                <Play className="w-4 h-4 mr-2" />
                Platforma haqida ma'lumot
              </Button>
            </div>

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
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileLoginPage;
