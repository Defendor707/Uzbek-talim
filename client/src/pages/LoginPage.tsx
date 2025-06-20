import React from 'react';
import LoginForm from '@/components/auth/LoginForm';
import { Link } from 'wouter';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-20 h-20 bg-white bg-opacity-10 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-32 w-16 h-16 bg-blue-300 bg-opacity-20 rounded-full animate-bounce delay-1000"></div>
        <div className="absolute bottom-32 left-16 w-12 h-12 bg-purple-300 bg-opacity-15 rounded-full animate-pulse delay-500"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-white bg-opacity-5 rounded-full animate-bounce delay-700"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        {/* Left side - Brand Section */}
        <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
          <div className="max-w-md text-center lg:text-left text-white">
            {/* Logo */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm mb-6">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 16l-5 2.72L7 16v-3.73L12 15l5-2.73V16z"/>
                </svg>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                O'zbek Talim
              </h1>
              <p className="text-xl lg:text-2xl text-blue-100 mb-8 leading-relaxed">
                Zamonaviy ta'lim ekotizimi
              </p>
              <p className="text-blue-200 text-lg mb-12">
                O'zbekistondagi ta'lim jarayonini zamonaviylashtirish va samaradorligini oshirish uchun yagona platforma
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-20">
                <div className="w-12 h-12 bg-blue-400 bg-opacity-30 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3z"/>
                  </svg>
                </div>
                <h3 className="text-white font-semibold mb-1">O'qituvchilar</h3>
                <p className="text-blue-200 text-sm">Darslarni samarali tashkil qilish</p>
              </div>
              
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-20">
                <div className="w-12 h-12 bg-purple-400 bg-opacity-30 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H16c-.8 0-1.54.37-2 1l-3 4v7h3v6h6v-4z"/>
                  </svg>
                </div>
                <h3 className="text-white font-semibold mb-1">O'quvchilar</h3>
                <p className="text-blue-200 text-sm">Bilimlarni mustahkamlash</p>
              </div>
              
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-20">
                <div className="w-12 h-12 bg-green-400 bg-opacity-30 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm2.5 3h-1.86l-.33 1H19c.55 0 1 .45 1 1v6c0 .55-.45 1-1 1h-3.5v7h-2v-7H10v7H8v-7H4.5c-.55 0-1-.45-1-1V9c0-.55.45-1 1-1h2.69l-.33-1H5C4.45 7 4 6.55 4 6s.45-1 1-1h14c.55 0 1 .45 1 1s-.45 1-1 1z"/>
                  </svg>
                </div>
                <h3 className="text-white font-semibold mb-1">Ota-onalar</h3>
                <p className="text-blue-200 text-sm">Farzand yutuqlarini kuzatish</p>
              </div>
              
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-20">
                <div className="w-12 h-12 bg-orange-400 bg-opacity-30 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 2.5L19.5 13H18v6H6v-6H4.5L12 5.5z"/>
                  </svg>
                </div>
                <h3 className="text-white font-semibold mb-1">Markazlar</h3>
                <p className="text-blue-200 text-sm">Ta'lim jarayonini boshqarish</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side - Login Form */}
        <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
