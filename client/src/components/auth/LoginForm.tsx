import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'wouter';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import useAuth from '@/hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email('Yaroqli email kiriting'),
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
  rememberMe: z.boolean().optional().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login, isLoggingIn } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });
  
  const onSubmit = (values: LoginFormValues) => {
    login({
      email: values.email,
      password: values.password,
    });
    
    if (onSuccess) {
      onSuccess();
    }
  };
  
  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
  };
  
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-heading font-bold text-neutral-dark mb-2">Tizimga kirish</h2>
        <p className="text-neutral-medium">O'zbek Talim platformasidan foydalanish uchun tizimga kiring</p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                <div className="flex justify-between mb-1">
                  <FormLabel className="text-neutral-medium">Parol</FormLabel>
                  <Link href="/forgot-password" className="text-sm text-primary hover:text-primary-dark">
                    Parolni unutdingizmi?
                  </Link>
                </div>
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
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange} 
                    className="h-4 w-4 text-primary focus:ring-primary border-neutral-light rounded"
                  />
                </FormControl>
                <FormLabel className="text-sm text-neutral-medium">Meni eslab qolish</FormLabel>
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg transition duration-200"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <>
                <span className="material-icons animate-spin mr-2">refresh</span>
                Yuklanmoqda...
              </>
            ) : (
              'Kirish'
            )}
          </Button>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-light"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-neutral-medium">Yoki</span>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 gap-3">
              <Link href="/register">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full flex justify-center items-center py-2 px-4 border border-neutral-light rounded-lg text-neutral-medium hover:bg-neutral-ultralight transition duration-200"
                >
                  <span className="material-icons mr-2 text-sm">person_add</span>
                  Ro'yxatdan o'tish
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <div className="text-sm text-neutral-medium mb-4">Foydalanuvchi rolini tanlang:</div>
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <Button
                type="button"
                variant={selectedRole === 'teacher' ? 'default' : 'outline'}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                  selectedRole === 'teacher' 
                    ? 'bg-primary text-white' 
                    : 'text-primary bg-white border border-primary hover:bg-primary hover:text-white'
                }`}
                onClick={() => handleRoleSelect('teacher')}
              >
                Ustoz
              </Button>
              <Button
                type="button"
                variant={selectedRole === 'student' ? 'default' : 'outline'}
                className={`px-4 py-2 text-sm font-medium border-t border-b ${
                  selectedRole === 'student' 
                    ? 'bg-primary text-white' 
                    : 'text-primary bg-white border-primary hover:bg-primary hover:text-white'
                }`}
                onClick={() => handleRoleSelect('student')}
              >
                O'quvchi
              </Button>
              <Button
                type="button"
                variant={selectedRole === 'parent' ? 'default' : 'outline'}
                className={`px-4 py-2 text-sm font-medium border-t border-b ${
                  selectedRole === 'parent' 
                    ? 'bg-primary text-white' 
                    : 'text-primary bg-white border-primary hover:bg-primary hover:text-white'
                }`}
                onClick={() => handleRoleSelect('parent')}
              >
                Ota-ona
              </Button>
              <Button
                type="button"
                variant={selectedRole === 'center' ? 'default' : 'outline'}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                  selectedRole === 'center' 
                    ? 'bg-primary text-white' 
                    : 'text-primary bg-white border border-primary hover:bg-primary hover:text-white'
                }`}
                onClick={() => handleRoleSelect('center')}
              >
                O'quv markaz
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default LoginForm;
