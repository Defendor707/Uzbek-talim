import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface OnboardingSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  icon: JSX.Element;
  gradient: string;
  bgPattern: string;
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    title: "O'zbek Talim",
    subtitle: "Zamonaviy ta'lim ekotizimi",
    description: "O'zbekistondagi ta'lim jarayonini zamonaviylashtirish va samaradorligini oshirish uchun yagona platforma",
    features: [
      "Online test tizimi",
      "Real vaqtda natijalar",
      "Telegram bot integratsiyasi",
      "Ko'p foydalanuvchi tizimi"
    ],
    icon: (
      <svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 16l-5 2.72L7 16v-3.73L12 15l5-2.73V16z"/>
      </svg>
    ),
    gradient: "from-blue-600 via-purple-600 to-blue-800",
    bgPattern: "opacity-20"
  },
  {
    id: 2,
    title: "O'qituvchilar uchun",
    subtitle: "Samarali dars berish vositalari",
    description: "Test yaratish, talabalarni baholash va dars jarayonini boshqarish uchun keng imkoniyatlar",
    features: [
      "Oson test yaratish",
      "Ko'p turdagi savollar",
      "Avtomatik baholash",
      "Natijalar statistikasi"
    ],
    icon: (
      <svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM17 12H7v-2h10v2zm0-4H7V6h10v2z"/>
      </svg>
    ),
    gradient: "from-green-500 via-emerald-600 to-teal-700",
    bgPattern: "opacity-15"
  },
  {
    id: 3,
    title: "O'quvchilar uchun",
    subtitle: "Bilimlarni sinab ko'rish",
    description: "Online testlar orqali bilimlarni mustahkamlash va o'z darajasini aniqlash imkoniyati",
    features: [
      "Qiziqarli testlar",
      "Darhol natijalar",
      "Xatolarni tahlil qilish",
      "O'sish ko'rsatkichlari"
    ],
    icon: (
      <svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    ),
    gradient: "from-orange-500 via-red-500 to-pink-600",
    bgPattern: "opacity-25"
  },
  {
    id: 4,
    title: "Ota-onalar uchun",
    subtitle: "Farzandingiz yutuqlarini kuzatib boring",
    description: "Bolangizning ta'lim jarayonidagi muvaffaqiyatlari va rivojlanishini real vaqtda kuzatish",
    features: [
      "Darhol xabar olish",
      "Batafsil hisobotlar",
      "O'sish dinamikasi",
      "O'qituvchi bilan aloqa"
    ],
    icon: (
      <svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H16c-.8 0-1.54.37-2 1l-3 4v7h3v6h6v-4zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2 16v-6H10l-2.54-7.63A1.5 1.5 0 0 0 6.04 8H3.5c-.8 0-1.54.37-2 1L0 13v7h3v6h4.5z"/>
      </svg>
    ),
    gradient: "from-purple-500 via-indigo-600 to-blue-700",
    bgPattern: "opacity-20"
  },
  {
    id: 5,
    title: "O'quv markazlari uchun",
    subtitle: "Ta'lim jarayonini boshqaring",
    description: "Markazingizning barcha ta'lim jarayonlarini yagona platformada samarali boshqarish",
    features: [
      "Talabalar bazasi",
      "O'qituvchilarni boshqarish",
      "Umumiy statistika",
      "Moliyaviy hisobotlar"
    ],
    icon: (
      <svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3zm0 2.5L19.5 13H18v6h-2v-6H8v6H6v-6H4.5L12 5.5z"/>
      </svg>
    ),
    gradient: "from-cyan-500 via-blue-600 to-indigo-700",
    bgPattern: "opacity-30"
  }
];

interface OnboardingSlidesProps {
  onComplete: () => void;
}

const OnboardingSlides: React.FC<OnboardingSlidesProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
            return 0;
          } else {
            onComplete();
            return 100;
          }
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentSlide, isPaused, onComplete]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
      setProgress(0);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
      setProgress(0);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`}>
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        
        {/* Animated Background Pattern - Responsive */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-5 left-5 md:top-10 md:left-10 w-16 h-16 md:w-32 md:h-32 bg-white bg-opacity-10 rounded-full animate-pulse"></div>
          <div className="absolute top-20 right-10 md:top-40 md:right-20 w-12 h-12 md:w-24 md:h-24 bg-white bg-opacity-15 rounded-full animate-bounce delay-1000"></div>
          <div className="absolute bottom-16 left-10 md:bottom-32 md:left-20 w-10 h-10 md:w-20 md:h-20 bg-white bg-opacity-5 rounded-full animate-pulse delay-500"></div>
          <div className="absolute bottom-10 right-16 md:bottom-20 md:right-32 w-14 h-14 md:w-28 md:h-28 bg-white bg-opacity-10 rounded-full animate-bounce delay-700"></div>
          <div className="absolute top-1/2 left-1/4 w-8 h-8 md:w-16 md:h-16 bg-white bg-opacity-5 rounded-full animate-ping delay-1500"></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-white bg-opacity-20">
          <div 
            className="h-full bg-white transition-all duration-100 ease-linear"
            style={{ width: `${((currentSlide * 100) + progress) / slides.length}%` }}
          ></div>
        </div>

        {/* Header Controls */}
        <div className="flex justify-between items-center p-4 md:p-6">
          <div className="flex space-x-1.5 md:space-x-2">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-30'
                }`}
              />
            ))}
          </div>
          
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="text-white hover:bg-white hover:bg-opacity-20 transition-colors text-sm md:text-base px-3 md:px-4 py-2"
          >
            O'tkazib yuborish
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 md:px-8">
          <div className="max-w-4xl w-full text-center text-white">
            {/* Icon */}
            <div className="mb-6 md:mb-8 flex justify-center">
              <div className="p-4 md:p-6 bg-white bg-opacity-20 rounded-2xl md:rounded-3xl backdrop-blur-sm border border-white border-opacity-30">
                <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20">
                  {React.cloneElement(slide.icon, { 
                    className: "w-full h-full text-white"
                  })}
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4 leading-tight px-2">
              {slide.title}
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white text-opacity-90 mb-6 md:mb-8 px-2">
              {slide.subtitle}
            </p>

            {/* Description */}
            <p className="text-base sm:text-lg md:text-xl text-white text-opacity-80 mb-8 md:mb-12 max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto leading-relaxed px-4">
              {slide.description}
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 max-w-sm sm:max-w-lg md:max-w-2xl mx-auto mb-8 md:mb-12 px-4">
              {slide.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center justify-center sm:justify-start bg-white bg-opacity-10 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-4 border border-white border-opacity-20"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span className="text-sm md:text-base lg:text-lg font-medium text-center sm:text-left">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex justify-between items-center p-4 md:p-6">
          <Button
            onClick={handlePrevious}
            disabled={currentSlide === 0}
            variant="ghost"
            className="text-white hover:bg-white hover:bg-opacity-20 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] px-3 md:px-4"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm md:text-base">Orqaga</span>
          </Button>

          <div className="flex items-center space-x-2 md:space-x-4">
            <Button
              onClick={() => setIsPaused(!isPaused)}
              variant="ghost"
              className="text-white hover:bg-white hover:bg-opacity-20 min-h-[44px] min-w-[44px] p-2"
              aria-label={isPaused ? "Davom ettirish" : "To'xtatish"}
            >
              {isPaused ? (
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              )}
            </Button>

            <Button
              onClick={handleNext}
              className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl transition-all duration-200 transform hover:scale-105 min-h-[44px] text-sm md:text-base"
            >
              <span>{currentSlide === slides.length - 1 ? 'Boshlash' : 'Keyingisi'}</span>
              <svg className="w-4 h-4 md:w-5 md:h-5 ml-1 md:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSlides;