import React, { useState, useEffect } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import OnboardingSlides from '@/components/onboarding/OnboardingSlides';

const LoginPage: React.FC = () => {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0); // 0 = logo/intro, 1 = login form
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

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

  // Touch and mouse event handlers for swipe navigation
  const handleStart = (clientX: number) => {
    setStartX(clientX);
    setCurrentX(clientX);
    setIsDragging(true);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    setCurrentX(clientX);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    
    const diff = currentX - startX;
    const threshold = 50; // minimum swipe distance
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentSlide === 1) {
        // Swipe right - go to logo/intro page
        setCurrentSlide(0);
      } else if (diff < 0 && currentSlide === 0) {
        // Swipe left - go to login page
        setCurrentSlide(1);
      }
    }
    
    setIsDragging(false);
    setStartX(0);
    setCurrentX(0);
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  if (showOnboarding) {
    return <OnboardingSlides onComplete={handleOnboardingComplete} />;
  }

  const translateX = isDragging ? (currentX - startX) * 0.3 : 0;

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={isDragging ? handleMouseMove : undefined}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
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

      {/* Slide Container */}
      <div className="relative w-full h-full flex transition-transform duration-300 ease-out"
           style={{ 
             transform: `translateX(${-currentSlide * 100 + translateX}vw)`,
           }}>
        
        {/* Page 1: Logo and Introduction */}
        <div className="w-screen h-screen flex items-center justify-center p-4 flex-shrink-0">
          <div className="w-full max-w-md text-center relative z-10">
            {/* Logo and Title Section */}
            <div className="mb-8">
              <div className="relative mx-auto mb-6">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-600/30 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  {/* Custom Logo based on the image provided */}
                  <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 100 100">
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
              
              <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4">
                O'zbek Talim
              </h1>
              <p className="text-gray-600 text-xl mb-8">Zamonaviy ta'lim platformasi</p>
              
              {/* Show Onboarding Again Button */}
              {hasSeenOnboarding && (
                <button
                  onClick={handleShowOnboarding}
                  className="group inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:from-blue-100 hover:to-purple-100 transition-all duration-300 shadow-md hover:shadow-lg mb-8"
                >
                  <svg className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Tanishtirishni qayta ko'rish</span>
                </button>
              )}
            </div>
            
            {/* Swipe Indicator */}
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="flex items-center text-gray-500">
                <svg className="w-5 h-5 mr-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm">Chapga torting</span>
              </div>
            </div>
            
            {/* Page Indicators */}
            <div className="flex justify-center space-x-2">
              <div className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === 0 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            </div>
          </div>
        </div>

        {/* Page 2: Login Form */}
        <div className="w-screen h-screen flex items-center justify-center p-4 flex-shrink-0">
          <div className="w-full max-w-md relative z-10">
            {/* Simple header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 100 100">
                  <path d="M20 15 L20 85 L50 80 L80 85 L80 15 L50 20 Z" fill="currentColor" fillOpacity="0.9"/>
                  <g stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round">
                    <circle cx="65" cy="25" r="2"/>
                    <circle cx="75" cy="35" r="2"/>
                    <circle cx="65" cy="45" r="2"/>
                    <path d="M65 25 L75 35 L65 45"/>
                  </g>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tizimga kirish</h2>
              <p className="text-gray-600">Ma'lumotlaringizni kiriting</p>
            </div>
            
            {/* Login Form Container */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-500/10 border border-white/20 p-8">
              <LoginForm />
            </div>
            
            {/* Swipe Indicator */}
            <div className="flex items-center justify-center space-x-2 mt-6">
              <div className="flex items-center text-gray-500">
                <svg className="w-5 h-5 mr-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-sm">O'nga torting</span>
              </div>
            </div>
            
            {/* Page Indicators */}
            <div className="flex justify-center space-x-2 mt-4">
              <div className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === 0 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
