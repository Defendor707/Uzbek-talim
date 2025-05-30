import React from 'react';
import LoginForm from '@/components/auth/LoginForm';
import { Link } from 'wouter';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left side - Image and Welcome Text - Hidden on mobile */}
      <div className="login-bg hidden md:flex md:w-1/2 p-10 text-white justify-center items-center">
        <div className="max-w-md">
          <h1 className="text-4xl font-heading font-bold mb-4">O'zbek Talim</h1>
          <p className="text-xl mb-6">O'zbekistondagi ta'lim jarayonini zamonaviylashtirish va samaradorligini oshirish uchun yagona platforma</p>
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <span className="material-icons text-4xl">school</span>
              <h3 className="text-lg font-medium mt-2">O'qituvchilar uchun</h3>
              <p className="text-sm mt-1">Darslarni samarali tashkil qilish va nazorat qilish</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <span className="material-icons text-4xl">person</span>
              <h3 className="text-lg font-medium mt-2">O'quvchilar uchun</h3>
              <p className="text-sm mt-1">Bilimlarni mustahkamlash va baholash</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <span className="material-icons text-4xl">people</span>
              <h3 className="text-lg font-medium mt-2">Ota-onalar uchun</h3>
              <p className="text-sm mt-1">Farzandingiz yutuqlarini kuzatib borish</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <span className="material-icons text-4xl">business</span>
              <h3 className="text-lg font-medium mt-2">O'quv markazlari</h3>
              <p className="text-sm mt-1">Ta'lim jarayonini boshqarish va nazorat qilish</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Header - Only visible on mobile */}
      <div className="md:hidden bg-white border-b border-gray-200 px-6 py-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Tizimga kirish</h1>
          <p className="text-gray-600 text-sm">O'zbek Talim platformasidan foydalanish uchun tizimga kiring</p>
        </div>
      </div>
      
      {/* Right side - Login Form */}
      <div className="w-full md:w-1/2 flex justify-center items-center px-6 py-8 md:p-10 bg-white md:bg-gray-50">
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
