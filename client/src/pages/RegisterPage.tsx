import React from 'react';
import RegisterForm from '@/components/auth/RegisterForm';
import { Link } from 'wouter';

const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Image and Welcome Text */}
      <div className="login-bg hidden md:flex md:w-1/2 p-10 text-white justify-center items-center">
        <div className="max-w-md">
          <h1 className="text-4xl font-heading font-bold mb-4">O'zbek Talim</h1>
          <p className="text-xl mb-6">O'zbekistondagi ta'lim jarayonini zamonaviylashtirish va samaradorligini oshirish uchun yagona platforma</p>
          <div className="space-y-4 mt-8">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Ro'yxatdan o'tish afzalliklari</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="material-icons mr-2">check_circle</span>
                  <span>Shaxsiy ta'lim materiallariga kirish</span>
                </li>
                <li className="flex items-center">
                  <span className="material-icons mr-2">check_circle</span>
                  <span>Interaktiv testlar va mashqlar</span>
                </li>
                <li className="flex items-center">
                  <span className="material-icons mr-2">check_circle</span>
                  <span>Shaxsiy rivojlanish statistikasi</span>
                </li>
                <li className="flex items-center">
                  <span className="material-icons mr-2">check_circle</span>
                  <span>Ta'lim jarayonini boshqarish</span>
                </li>
              </ul>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Mavjud foydalanuvchi?</h3>
              <p className="mb-4">Agar sizda akkaunt bo'lsa, shaxsiy kabinetingizga kiring</p>
              <Link href="/login" className="inline-flex items-center justify-center px-4 py-2 bg-white text-primary rounded-lg transition duration-200 hover:bg-opacity-90">
                <span className="material-icons mr-2">login</span>
                Tizimga kirish
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Register Form */}
      <div className="w-full md:w-1/2 flex justify-center items-center p-4 md:p-10 bg-white">
        <RegisterForm />
      </div>
    </div>
  );
};

export default RegisterPage;
