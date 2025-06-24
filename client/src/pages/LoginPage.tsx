import React, { useState, useEffect } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import OnboardingSlides from '@/components/onboarding/OnboardingSlides';
import { Link } from 'wouter';

const LoginPage: React.FC = () => {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has already seen onboarding
    const seen = localStorage.getItem('hasSeenOnboarding');
    if (seen === 'true') {
      setShowOnboarding(false);
      setHasSeenOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
    setHasSeenOnboarding(true);
  };

  const handleShowOnboarding = () => {
    setShowOnboarding(true);
  };

  if (showOnboarding) {
    return <OnboardingSlides onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-24 h-24 bg-purple-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-10 w-16 h-16 bg-indigo-200 rounded-full opacity-20 animate-pulse delay-500"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Title Section */}
        <div className="text-center mb-8">
          <div className="relative mx-auto mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-600/30 transform rotate-3 hover:rotate-0 transition-transform duration-300">
              {/* Custom Logo based on the image provided */}
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 100 100">
                {/* Book shape */}
                <path d="M20 15 L20 85 L50 80 L80 85 L80 15 L50 20 Z" fill="currentColor" fillOpacity="0.9"/>
                {/* Tech circuit lines */}
                <g stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round">
                  <circle cx="65" cy="25" r="3"/>
                  <circle cx="75" cy="35" r="3"/>
                  <circle cx="65" cy="45" r="3"/>
                  <path d="M65 25 L75 35 L65 45"/>
                  <path d="M68 25 L72 35"/>
                  <path d="M68 35 L72 45"/>
                </g>
              </svg>
            </div>
            
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-green-500 rounded-full animate-bounce delay-300"></div>
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-3">
            O'zbek Talim
          </h1>
          <p className="text-gray-600 text-lg mb-6">Zamonaviy ta'lim platformasi</p>
          
          {/* Show Onboarding Again Button */}
          {hasSeenOnboarding && (
            <button
              onClick={handleShowOnboarding}
              className="group inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:from-blue-100 hover:to-purple-100 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">Tanishtirishni qayta ko'rish</span>
            </button>
          )}
        </div>
        
        {/* Login Form Container */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-500/10 border border-white/20 p-8 transform hover:scale-[1.02] transition-all duration-300">
          <LoginForm />
        </div>
        
        {/* Bottom Text */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Xavfsiz va ishonchli ta'lim muhiti
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
