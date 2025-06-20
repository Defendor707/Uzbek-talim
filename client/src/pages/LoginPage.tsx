import React from 'react';
import LoginForm from '@/components/auth/LoginForm';
import { Link } from 'wouter';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Left side - Simple Brand Section */}
      <div className="lg:w-1/2 bg-blue-600 flex items-center justify-center p-8 lg:p-16">
        <div className="max-w-md text-center lg:text-left text-white">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-lg mb-6">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3z"/>
              </svg>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">
              O'zbek Talim
            </h1>
            <p className="text-lg text-blue-100 mb-8">
              Ta'lim platformasi
            </p>
          </div>

          {/* Simple Feature List */}
          <div className="space-y-4">
            <div className="flex items-center text-blue-100">
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>O'qituvchilar uchun test yaratish</span>
            </div>
            <div className="flex items-center text-blue-100">
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>O'quvchilar uchun online testlar</span>
            </div>
            <div className="flex items-center text-blue-100">
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>Ota-onalar uchun natijalarni kuzatish</span>
            </div>
            <div className="flex items-center text-blue-100">
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>O'quv markazlari uchun boshqaruv</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Simple Login Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-white">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
