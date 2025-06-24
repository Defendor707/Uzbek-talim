import React from 'react';
import RegisterForm from '@/components/auth/RegisterForm';
import { Link } from 'wouter';

const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left side - Image and Welcome Text - Hidden on mobile */}
      <div className="login-bg hidden md:flex md:w-1/2 p-10 text-white justify-center items-center">
        <div className="max-w-md">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 mr-4 rounded-2xl overflow-hidden">
              <img 
                src="/attached_assets/IMG_20250624_114711_600_1750757183585.jpg" 
                alt="O'zbek Talim Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-4xl font-heading font-bold">O'zbek Talim</h1>
          </div>
          <p className="text-xl mb-6">O'zbekistondagi ta'lim jarayonini zamonaviylashtirish va samaradorligini oshirish uchun yagona platforma</p>
          <div className="space-y-4 mt-8">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Ro'yxatdan o'tish afzalliklari</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Shaxsiy ta'lim materiallariga kirish</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Interaktiv testlar va mashqlar</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Shaxsiy rivojlanish statistikasi</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Ta'lim jarayonini boshqarish</span>
                </li>
              </ul>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Mavjud foydalanuvchi?</h3>
              <p className="mb-4">Agar sizda akkaunt bo'lsa, shaxsiy kabinetingizga kiring</p>
              <Link href="/login" className="inline-flex items-center justify-center px-4 py-2 bg-white text-blue-600 rounded-lg transition duration-200 hover:bg-opacity-90">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Tizimga kirish
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Header - Only visible on mobile */}
      <div className="md:hidden bg-white border-b border-gray-200 px-6 py-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Ro'yxatdan o'tish</h1>
          <p className="text-gray-600 text-sm">O'zbek Talim platformasidan foydalanish uchun ro'yxatdan o'ting</p>
        </div>
      </div>
      
      {/* Right side - Register Form */}
      <div className="w-full md:w-1/2 flex justify-center items-start px-6 py-8 md:p-10 bg-white md:bg-gray-50 overflow-y-auto">
        <RegisterForm />
      </div>
    </div>
  );
};

export default RegisterPage;
