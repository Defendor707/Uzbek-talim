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
import { Textarea } from '@/components/ui/textarea';

const registerSchema = z.object({
  username: z.string().min(3, 'Foydalanuvchi nomi kamida 3 ta belgidan iborat bo\'lishi kerak'),
  fullName: z.string().min(2, 'To\'liq ism kamida 2 ta belgidan iborat bo\'lishi kerak'),
  email: z.string().email('Yaroqli email kiriting'),
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
  confirmPassword: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
  role: z.enum(['teacher', 'student', 'parent', 'center'], {
    required_error: 'Iltimos, rolni tanlang',
  }),
  // Conditional fields based on role
  grade: z.string().optional(),
  classroom: z.string().optional(),
  subjects: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Parollar mos kelmadi',
  path: ['confirmPassword'],
}).refine(
  (data) => {
    if (data.role === 'student') {
      return !!data.grade && !!data.classroom;
    }
    return true;
  },
  {
    message: 'Sinf va guruh majburiy',
    path: ['grade'],
  }
).refine(
  (data) => {
    if (data.role === 'teacher') {
      return !!data.subjects;
    }
    return true;
  },
  {
    message: 'Fanlarni kiriting',
    path: ['subjects'],
  }
).refine(
  (data) => {
    if (data.role === 'center') {
      return !!data.address;
    }
    return true;
  },
  {
    message: 'Manzilni kiriting',
    path: ['address'],
  }
);

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const { register, isRegistering } = useAuth();
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'student',
      grade: '',
      classroom: '',
      subjects: '',
      address: '',
      description: '',
      phone: '',
    },
  });
  
  const selectedRole = form.watch('role');
  
  const onSubmit = (values: RegisterFormValues) => {
    const registerData: any = {
      username: values.username,
      fullName: values.fullName,
      email: values.email,
      password: values.password,
      confirmPassword: values.confirmPassword,
      role: values.role,
      phone: values.phone,
    };
    
    // Add role-specific profile data
    if (values.role === 'student') {
      registerData.studentProfile = {
        grade: values.grade,
        classroom: values.classroom,
      };
    } else if (values.role === 'teacher') {
      registerData.teacherProfile = {
        subjects: values.subjects?.split(',').map(s => s.trim()),
      };
    } else if (values.role === 'center') {
      registerData.centerProfile = {
        address: values.address,
        description: values.description,
      };
    }
    
    register(registerData);
    
    if (onSuccess) {
      onSuccess();
    }
  };
  
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-heading font-bold text-neutral-dark mb-2">Ro'yxatdan o'tish</h2>
        <p className="text-neutral-medium">O'zbek Talim platformasidan foydalanish uchun ro'yxatdan o'ting</p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-neutral-medium">Foydalanuvchi turi</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="teacher" id="teacher" />
                      <label htmlFor="teacher" className="cursor-pointer text-sm">Ustoz</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="student" id="student" />
                      <label htmlFor="student" className="cursor-pointer text-sm">O'quvchi</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="parent" id="parent" />
                      <label htmlFor="parent" className="cursor-pointer text-sm">Ota-ona</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="center" id="center" />
                      <label htmlFor="center" className="cursor-pointer text-sm">O'quv markaz</label>
                    </div>
                  </RadioGroup>
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
                <FormLabel className="text-neutral-medium">Foydalanuvchi nomi</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="foydalanuvchi_nomi" 
                    {...field} 
                    className="px-4 py-2 border border-neutral-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
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
                <FormLabel className="text-neutral-medium">To'liq ism</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ism Familiya" 
                    {...field} 
                    className="px-4 py-2 border border-neutral-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-neutral-medium">Email manzil</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="email@example.com" 
                    {...field} 
                    className="px-4 py-2 border border-neutral-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    type="email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-neutral-medium">Telefon raqam</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="+998 XX XXX XX XX" 
                    {...field} 
                    className="px-4 py-2 border border-neutral-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {selectedRole === 'student' && (
            <>
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-medium">Sinf</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="9" 
                        {...field} 
                        className="px-4 py-2 border border-neutral-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="classroom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-medium">Guruh</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="A" 
                        {...field} 
                        className="px-4 py-2 border border-neutral-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
          
          {selectedRole === 'teacher' && (
            <FormField
              control={form.control}
              name="subjects"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-neutral-medium">Fanlar (vergul bilan ajrating)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Matematika, Fizika" 
                      {...field} 
                      className="px-4 py-2 border border-neutral-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          {selectedRole === 'center' && (
            <>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-medium">Manzil</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Toshkent sh., Yunusobod tumani, 4-mavze" 
                        {...field} 
                        className="px-4 py-2 border border-neutral-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-medium">Ta'rif</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="O'quv markaz haqida qisqacha ma'lumot" 
                        {...field} 
                        className="px-4 py-2 border border-neutral-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-neutral-medium">Parol</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    {...field} 
                    className="px-4 py-2 border border-neutral-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-neutral-medium">Parolni tasdiqlang</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    {...field} 
                    className="px-4 py-2 border border-neutral-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg transition duration-200"
            disabled={isRegistering}
          >
            {isRegistering ? (
              <>
                <span className="material-icons animate-spin mr-2">refresh</span>
                Yuklanmoqda...
              </>
            ) : (
              'Ro\'yxatdan o\'tish'
            )}
          </Button>
          
          <div className="text-center mt-4">
            <p className="text-sm text-neutral-medium">
              Akkountingiz bormi?{' '}
              <Link href="/login" className="text-primary hover:text-primary-dark font-medium">
                Tizimga kirish
              </Link>
            </p>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default RegisterForm;
