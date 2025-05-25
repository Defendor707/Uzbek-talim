import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

const testSchema = z.object({
  title: z.string().min(3, 'Test nomi kamida 3 ta belgidan iborat bo\'lishi kerak'),
  description: z.string().optional(),
  type: z.string().min(1, 'Test turini tanlang'),
  duration: z.coerce.number().min(1, 'Davomiyligi kamida 1 daqiqa bo\'lishi kerak'),
  totalQuestions: z.coerce.number().min(1, 'Kamida 1 ta savol bo\'lishi kerak'),
  grade: z.string().min(1, 'Sinfni tanlang'),
  classroom: z.string().optional(),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  status: z.string().default('draft'),
  passingScore: z.coerce.number().min(0).max(100).optional(),
});

type TestFormValues = z.infer<typeof testSchema>;

interface TestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TestFormValues) => void;
  initialData?: Partial<TestFormValues>;
  isSubmitting?: boolean;
}

const TestForm: React.FC<TestFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
}) => {
  const form = useForm<TestFormValues>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      type: initialData?.type || '',
      duration: initialData?.duration || 30,
      totalQuestions: initialData?.totalQuestions || 10,
      grade: initialData?.grade || '',
      classroom: initialData?.classroom || '',
      startDate: initialData?.startDate ? new Date(initialData.startDate) : null,
      endDate: initialData?.endDate ? new Date(initialData.endDate) : null,
      status: initialData?.status || 'draft',
      passingScore: initialData?.passingScore || 70,
    },
  });
  
  const handleSubmit = (values: TestFormValues) => {
    onSubmit(values);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading font-bold text-neutral-dark">
            {initialData?.id ? 'Testni tahrirlash' : 'Yangi test yaratish'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-neutral-medium">Test nomi</FormLabel>
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
                    <Textarea 
                      placeholder="Test haqida qisqacha ma'lumot" 
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-medium">Test turi</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Test turini tanlang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="multiple_choice">Test (bir javobli)</SelectItem>
                        <SelectItem value="true_false">To'g'ri/Noto'g'ri</SelectItem>
                        <SelectItem value="matching">Moslashtirish</SelectItem>
                        <SelectItem value="short_answer">Qisqa javob</SelectItem>
                        <SelectItem value="essay">Esse</SelectItem>
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
                        <SelectItem value="completed">Yakunlangan</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                name="classroom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-medium">Guruh (ixtiyoriy)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="A, B, 1-guruh, ..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="passingScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-medium">O'tish bali (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="0"
                        max="100"
                        placeholder="70" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-medium">Davomiyligi (daqiqa)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="1"
                        placeholder="30" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="totalQuestions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-medium">Savollar soni</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="1"
                        placeholder="10" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-neutral-medium">Boshlanish vaqti</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Sanani tanlang</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Test qachon boshlanishi kerak
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-neutral-medium">Tugash vaqti</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Sanani tanlang</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) => {
                            const startDate = form.watch('startDate');
                            return startDate ? date < startDate : date < new Date();
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Test qachon tugashi kerak
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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

export default TestForm;
