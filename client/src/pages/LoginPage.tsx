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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 16l-5 2.72L7 16v-3.73L12 15l5-2.73V16z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">O'zbek Talim</h1>
          <p className="text-gray-600">Ta'lim platformasi</p>
          
          {/* Show Onboarding Again Button */}
          {hasSeenOnboarding && (
            <button
              onClick={handleShowOnboarding}
              className="mt-4 flex items-center mx-auto text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">Tanishtirishni qayta ko'rish</span>
            </button>
          )}
        </div>
        
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
