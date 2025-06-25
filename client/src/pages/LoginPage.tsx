import React, { useState } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import MobileLoginPage from '@/components/auth/MobileLoginPage';
import DesktopLoginPage from '@/components/auth/DesktopLoginPage';
import OnboardingSlides from '@/components/onboarding/OnboardingSlides';

const LoginPage: React.FC = () => {
  const [showOnboarding, setShowOnboarding] = useState(() => {
    // Force skip onboarding for now to fix mobile issue
    return false;
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

  // Desktop version - new beautiful design
  return <DesktopLoginPage onShowPresentation={handleShowPresentation} />;
};

export default LoginPage;