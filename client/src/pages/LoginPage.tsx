import React, { useState } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import MobileLoginPage from '@/components/auth/MobileLoginPage';
import OnboardingSlides from '@/components/onboarding/OnboardingSlides';

const LoginPage: React.FC = () => {
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('visited');
  });
  
  const [showPresentation, setShowPresentation] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('visited', 'true');
    setShowOnboarding(false);
  };

  const handleShowPresentation = () => {
    setShowPresentation(true);
  };

  const handlePresentationComplete = () => {
    setShowPresentation(false);
  };

  if (showOnboarding) {
    return <OnboardingSlides onComplete={handleOnboardingComplete} />;
  }

  if (showPresentation) {
    return <OnboardingSlides onComplete={handlePresentationComplete} />;
  }

  // Mobile version - unified experience
  if (isMobile) {
    return <MobileLoginPage onShowPresentation={handleShowPresentation} />;
  }

  // Desktop version - original design
  return (
    <div className="min-h-screen flex">
      {/* Left side - Logo and O'zbek Talim branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-32 right-16 w-12 h-12 bg-white rounded-full animate-pulse delay-75"></div>
          <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-white rounded-full animate-pulse delay-150"></div>
          <div className="absolute bottom-32 right-1/3 w-8 h-8 bg-white rounded-full animate-pulse delay-300"></div>
        </div>
        
        <div className="flex flex-col items-center justify-center h-full px-8 relative z-10 text-white text-center">
          <div className="w-32 h-32 bg-white bg-opacity-20 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white border-opacity-30 overflow-hidden mb-8">
            <img 
              src="/logo.jpg" 
              alt="O'zbek Talim Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <h1 className="text-5xl font-bold mb-4">O'zbek Talim</h1>
          <p className="text-xl mb-8 opacity-90">Zamonaviy ta'lim platformasi</p>
          
          <div className="space-y-4 mb-8">
            <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
              <p className="font-semibold">✨ O'qituvchilar uchun</p>
              <p className="text-sm opacity-80">Test va darslarni yarating</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
              <p className="font-semibold">📚 O'quvchilar uchun</p>
              <p className="text-sm opacity-80">Bilimingizni sinab ko'ring</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
              <p className="font-semibold">👨‍👩‍👧‍👦 Ota-onalar uchun</p>
              <p className="text-sm opacity-80">Farzandingizni kuzatib boring</p>
            </div>
          </div>
          
          <button
            onClick={handleShowPresentation}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-6 py-3 rounded-lg backdrop-blur-sm border border-white border-opacity-30 transition-all duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a2 2 0 011.5 1.5V13" />
            </svg>
            <span>Tanishtirishni qayta ko'rish</span>
          </button>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;