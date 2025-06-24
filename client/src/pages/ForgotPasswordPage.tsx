import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'wouter';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';

const forgotPasswordSchema = z.object({
  username: z.string().min(1, 'Foydalanuvchi nomini kiriting'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [resetUrl, setResetUrl] = useState('');

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      username: '',
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message);
        if (data.resetUrl) {
          setResetUrl(data.resetUrl);
        }
      } else {
        setMessage(data.error || 'Xatolik yuz berdi');
      }
    } catch (error) {
      setMessage('Tarmoq xatoligi yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl overflow-hidden">
            <img 
              src="/logo.jpg" 
              alt="O'zbek Talim Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Parolni tiklash
          </h1>
          <p className="text-gray-600">
            Foydalanuvchi nomingizni kiriting, sizga parol tiklash kodi beramiz
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {message ? (
            <div className={`p-4 rounded-lg mb-6 ${
              message.includes('yuborildi') || message.includes('muvaffaqiyatli') 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <p className="text-sm">{message}</p>
              {resetUrl && (
                <div className="mt-3">
                  <p className="text-xs text-gray-600 mb-2">Development uchun:</p>
                  <Link 
                    href={resetUrl}
                    className="inline-block px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Parolni tiklash
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-800">
                        Foydalanuvchi nomi
                      </FormLabel>
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

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm rounded-lg transition-all duration-200 mt-6"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Tekshirilmoqda...' : 'Parol tiklash kodini olish'}
                </Button>
              </form>
            </Form>
          )}

          <div className="text-center mt-6 pt-4 border-t border-gray-200">
            <Link 
              href="/login" 
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              ← Tizimga kirish sahifasiga qaytish
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;