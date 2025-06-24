import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'wouter';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import useAuth from '@/hooks/useAuth';

// Static parol kuchini hisoblash funksiyasi
const calculatePasswordStrengthStatic = (password: string) => {
  let strength = 0;
  if (password.length >= 6) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/\d/.test(password)) strength += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;
  return strength;
};

const registerSchema = z.object({
  username: z.string()
    .min(3, 'Foydalanuvchi nomi kamida 3 ta belgidan iborat bo\'lishi kerak')
    .max(20, 'Foydalanuvchi nomi 20 ta belgidan oshmasligi kerak')
    .regex(/^[a-zA-Z0-9_]+$/, 'Foydalanuvchi nomida faqat harflar, raqamlar va pastki chiziq bo\'lishi mumkin'),
  fullName: z.string()
    .min(4, 'To\'liq ism kamida 4 ta harfdan iborat bo\'lishi kerak')
    .max(20, 'To\'liq ism 20 ta harfdan oshmasligi kerak')
    .regex(/^[a-zA-ZўқғҳҚҒҲЎ\s]+$/, 'To\'liq ismda faqat harflar va bo\'sh joy bo\'lishi mumkin'),
  password: z.string()
    .min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak')
    .refine((password) => {
      // O'rtacha darajada parol: kamida 6 belgi va kamida bitta harf yoki raqam
      return password.length >= 6 && (/[a-zA-Z]/.test(password) || /\d/.test(password));
    }, 'Parol kamida 6 ta belgi va kamida bitta harf yoki raqam bo\'lishi kerak'),
  confirmPassword: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
  role: z.enum(['teacher', 'student', 'parent', 'center'], {
    required_error: 'Iltimos, rolni tanlang',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Parollar mos kelmadi',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const { register, isRegistering } = useAuth();
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      fullName: '',
      password: '',
      confirmPassword: '',
      role: 'student',
    },
  });

  // Parol kuchini hisoblash funksiyasi
  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;
    return strength;
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength <= 1) return { text: 'Juda zaif', color: 'text-red-600' };
    if (strength <= 2) return { text: 'Zaif', color: 'text-orange-600' };
    if (strength <= 3) return { text: 'O\'rtacha', color: 'text-yellow-600' };
    if (strength <= 4) return { text: 'Kuchli', color: 'text-green-600' };
    return { text: 'Juda kuchli', color: 'text-green-700' };
  };
  
  // No longer need role-specific fields
  
  const onSubmit = (values: RegisterFormValues) => {
    const registerData = {
      username: values.username,
      fullName: values.fullName,
      password: values.password,
      confirmPassword: values.confirmPassword,
      role: values.role,
    };
    
    register(registerData);
  };
  
  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
        {/* Desktop header - hidden on mobile since it's in the page header */}
        <div className="hidden md:block text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Ro'yxatdan o'tish</h2>
          <p className="text-gray-600">O'zbek Talim platformasidan foydalanish uchun ro'yxatdan o'ting</p>
        </div>
      
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-semibold text-gray-800">Foydalanuvchi turi</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => field.onChange('teacher')}
                        className={`p-3 text-sm border rounded-md cursor-pointer transition-all duration-200 text-center ${
                          field.value === 'teacher' 
                            ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' 
                            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                        }`}
                      >
                        Ustoz
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange('student')}
                        className={`p-3 text-sm border rounded-md cursor-pointer transition-all duration-200 text-center ${
                          field.value === 'student' 
                            ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' 
                            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                        }`}
                      >
                        O'quvchi
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange('parent')}
                        className={`p-3 text-sm border rounded-md cursor-pointer transition-all duration-200 text-center ${
                          field.value === 'parent' 
                            ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' 
                            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                        }`}
                      >
                        Ota-ona
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange('center')}
                        className={`p-3 text-sm border rounded-md cursor-pointer transition-all duration-200 text-center ${
                          field.value === 'center' 
                            ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' 
                            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                        }`}
                      >
                        O'quv markaz
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-800">To'liq ism</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ism Familiya" 
                      {...field} 
                      className="h-11 px-3 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-800">Foydalanuvchi nomi</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="foydalanuvchi_nomi" 
                      {...field} 
                      className="h-11 px-3 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-800">Parol</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••" 
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setPasswordStrength(calculatePasswordStrength(e.target.value));
                        }}
                        className="h-11 px-3 pr-10 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                      >
                        {showPassword ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </FormControl>
                  {field.value && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">Parol kuchi:</span>
                        <span className={`text-sm font-medium ${getPasswordStrengthText(passwordStrength).color}`}>
                          {getPasswordStrengthText(passwordStrength).text}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength <= 1 ? 'bg-red-500' :
                            passwordStrength <= 2 ? 'bg-orange-500' :
                            passwordStrength <= 3 ? 'bg-yellow-500' :
                            passwordStrength <= 4 ? 'bg-green-500' : 'bg-green-600'
                          }`}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        />
                      </div>
                      <div className="mt-2 text-xs text-gray-600">
                        <p>Parol quyidagilarni o'z ichiga olishi kerak:</p>
                        <ul className="mt-1 space-y-1">
                          <li className={field.value.length >= 6 ? 'text-green-600' : 'text-gray-500'}>
                            ✓ Kamida 6 ta belgi
                          </li>
                          <li className={/[a-zA-Z]/.test(field.value) || /\d/.test(field.value) ? 'text-green-600' : 'text-gray-500'}>
                            ✓ Kamida bitta harf yoki raqam
                          </li>
                          <li className={/[a-z]/.test(field.value) ? 'text-green-600' : 'text-gray-500'}>
                            + Kichik harf (a-z) - ixtiyoriy
                          </li>
                          <li className={/[A-Z]/.test(field.value) ? 'text-green-600' : 'text-gray-500'}>
                            + Katta harf (A-Z) - ixtiyoriy
                          </li>
                          <li className={/\d/.test(field.value) ? 'text-green-600' : 'text-gray-500'}>
                            + Raqam (0-9) - ixtiyoriy
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-800">Parolni tasdiqlang</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      {...field} 
                      className="h-11 px-3 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition duration-200 mt-6"
              disabled={isRegistering}
            >
              {isRegistering ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Yuklanmoqda...
                </>
              ) : (
                'Ro\'yxatdan o\'tish'
              )}
            </Button>
            
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Akkountingiz bormi?{' '}
                <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Tizimga kirish
                </Link>
              </p>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default RegisterForm;
