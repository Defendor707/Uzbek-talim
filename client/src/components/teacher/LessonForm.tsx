import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const lessonSchema = z.object({
  title: z.string().min(3, 'Darslik nomi kamida 3 ta belgidan iborat bo\'lishi kerak'),
  description: z.string().optional(),
  content: z.string().min(10, 'Darslik mazmuni kamida 10 ta belgidan iborat bo\'lishi kerak'),
  subjectId: z.string().optional(),
  grade: z.string().min(1, 'Sinfni tanlang'),
  status: z.string().default('draft'),
});

type LessonFormValues = z.infer<typeof lessonSchema>;

interface LessonFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LessonFormValues) => void;
  initialData?: Partial<LessonFormValues>;
  isSubmitting?: boolean;
}

const LessonForm: React.FC<LessonFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
}) => {
  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      content: initialData?.content || '',
      subjectId: initialData?.subjectId?.toString() || '',
      grade: initialData?.grade || '',
      status: initialData?.status || 'draft',
    },
  });
  
  const handleSubmit = (values: LessonFormValues) => {
    onSubmit(values);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading font-bold text-neutral-dark">
            {initialData?.id ? 'Darslikni tahrirlash' : 'Yangi darslik yaratish'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-neutral-medium">Darslik nomi</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Kvadrat tenglamalar" 
                      {...field} 
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
                  <FormLabel className="text-neutral-medium">Qisqacha ta'rif</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Darslik haqida qisqacha ma'lumot" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-medium">Sinf</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sinfni tanlang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'].map((grade) => (
                          <SelectItem key={grade} value={grade}>
                            {grade}-sinf
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-medium">Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Statusni tanlang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Qoralama</SelectItem>
                        <SelectItem value="active">Faol</SelectItem>
                        <SelectItem value="archived">Arxivlangan</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-neutral-medium">Darslik mazmuni</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Darslik mazmunini kiriting..." 
                      {...field} 
                      className="min-h-[200px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="mr-2"
              >
                Bekor qilish
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary-dark text-white"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-icons animate-spin mr-2">refresh</span>
                    Saqlanmoqda...
                  </>
                ) : (
                  'Saqlash'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default LessonForm;
