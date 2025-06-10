import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, X, Plus, Trash2 } from "lucide-react";

const testCreationSchema = z.object({
  title: z.string().min(1, "Test nomi kiritilishi kerak"),
  description: z.string().optional(),
  testImages: z.array(z.string()).max(5, "Maksimal 5 ta rasm yuklash mumkin").optional(),
  grade: z.string().min(1, "Sinf tanlanishi kerak"),
  classroom: z.string().optional(),
  type: z.enum(["simple", "open", "dtm", "certificate", "disciplinary"]),
  duration: z.number().min(1, "Test davomiyligi kiritilishi kerak"),
  totalQuestions: z.number().min(1, "Savollar soni kiritilishi kerak"),
  passingScore: z.number().min(0).max(100).optional(),
});

interface Question {
  questionText: string;
  questionImage?: string;
  options: string[];
  correctAnswer: string;
  points: number;
}

export function TestCreation() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [testImageFiles, setTestImageFiles] = useState<File[]>([]);
  const [testImagePaths, setTestImagePaths] = useState<string[]>([]);
  const [questionImageFiles, setQuestionImageFiles] = useState<{[key: number]: File}>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImageConfirmation, setShowImageConfirmation] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof testCreationSchema>>({
    resolver: zodResolver(testCreationSchema),
    defaultValues: {
      title: "",
      description: "",
      testImages: [],
      grade: "",
      classroom: "",
      type: "simple",
      duration: 30,
      totalQuestions: 10,
      passingScore: 60,
    },
  });

  const createTestMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/tests", data);
    },
    onSuccess: () => {
      toast({
        title: "Test yaratildi",
        description: "Test muvaffaqiyatli yaratildi!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      form.reset();
      setQuestions([]);
      setCurrentQuestionIndex(0);
      setTestImageFiles([]);
      setTestImagePaths([]);
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik",
        description: error.message || "Test yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const uploadTestImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('testImage', file);
    
    setUploadingImage(true);
    try {
      const response = await fetch('/api/upload/test-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Rasm yuklashda xatolik');
      }
      
      const result = await response.json();
      return result.imagePath;
    } finally {
      setUploadingImage(false);
    }
  };

  const uploadQuestionImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('questionImage', file);
    
    const response = await fetch('/api/upload/question-image', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Savol rasmi yuklashda xatolik');
    }
    
    const result = await response.json();
    return result.imagePath;
  };

  const uploadMultipleTestImages = async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('testImages', file);
    });
    
    const response = await fetch('/api/upload/test-images', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Rasmlar yuklashda xatolik');
    }
    
    const result = await response.json();
    return result.imagePaths;
  };

  const handleTestImagesUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Check if adding these files would exceed the limit
    if (testImageFiles.length + files.length > 5) {
      toast({
        title: "Xatolik",
        description: "Maksimal 5 ta rasm yuklash mumkin",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    try {
      const imagePaths = await uploadMultipleTestImages(files);
      
      const newTestImageFiles = [...testImageFiles, ...files];
      const newTestImagePaths = [...testImagePaths, ...imagePaths];
      
      setTestImageFiles(newTestImageFiles);
      setTestImagePaths(newTestImagePaths);
      form.setValue('testImages', newTestImagePaths);
      
      toast({
        title: "Rasmlar yuklandi",
        description: `${files.length} ta rasm muvaffaqiyatli yuklandi`,
      });
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const removeTestImage = (index: number) => {
    const newFiles = testImageFiles.filter((_, i) => i !== index);
    const newPaths = testImagePaths.filter((_, i) => i !== index);
    
    setTestImageFiles(newFiles);
    setTestImagePaths(newPaths);
    form.setValue('testImages', newPaths);
  };

  const confirmImages = () => {
    setShowImageConfirmation(false);
    toast({
      title: "Tasdiqlandi",
      description: "Test rasmlari tasdiqlandi",
    });
  };

  const handleQuestionImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, questionIndex: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imagePath = await uploadQuestionImage(file);
      setQuestionImageFiles(prev => ({ ...prev, [questionIndex]: file }));
      
      setQuestions(prev => prev.map((q, i) => 
        i === questionIndex ? { ...q, questionImage: imagePath } : q
      ));
      
      toast({
        title: "Rasm yuklandi",
        description: "Savol rasmi muvaffaqiyatli yuklandi",
      });
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      questionText: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: 1,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    setQuestions(prev => prev.map((q, i) => 
      i === index ? { ...q, [field]: value } : q
    ));
  };

  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions(prev => prev.map((q, i) => 
      i === questionIndex 
        ? { ...q, options: q.options.map((opt, oi) => oi === optionIndex ? value : opt) }
        : q
    ));
  };

  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
    if (currentQuestionIndex >= questions.length - 1) {
      setCurrentQuestionIndex(Math.max(0, questions.length - 2));
    }
  };

  const onSubmit = async (values: z.infer<typeof testCreationSchema>) => {
    if (questions.length === 0) {
      toast({
        title: "Xatolik",
        description: "Kamida bitta savol qo'shing",
        variant: "destructive",
      });
      return;
    }

    // Validate questions
    for (const question of questions) {
      if (!question.questionText.trim()) {
        toast({
          title: "Xatolik",
          description: "Barcha savollar to'ldirilishi kerak",
          variant: "destructive",
        });
        return;
      }
      if (!question.correctAnswer) {
        toast({
          title: "Xatolik",
          description: "Barcha savollar uchun to'g'ri javob belgilanishi kerak",
          variant: "destructive",
        });
        return;
      }
    }

    const testData = {
      ...values,
      questions,
    };

    createTestMutation.mutate(testData);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Yangi test yaratish</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Test ma'lumotlari */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test nomi</FormLabel>
                      <FormControl>
                        <Input placeholder="Test nomini kiriting" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sinf</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sinfni tanlang" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[...Array(11)].map((_, i) => (
                            <SelectItem key={i + 1} value={`${i + 1}`}>
                              {i + 1}-sinf
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tavsif</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Test haqida qisqacha ma'lumot" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Test rasmlari yuklash */}
              <div>
                <FormLabel>Test rasmlari (maksimal 5 ta)</FormLabel>
                <div className="mt-2 space-y-4">
                  {/* Yuklangan rasmlar ko'rsatish */}
                  {testImageFiles.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {testImageFiles.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Test rasmi ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removeTestImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <p className="text-xs text-gray-500 mt-1 truncate">{file.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Rasm yuklash interfeysi */}
                  {testImageFiles.length < 5 && (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleTestImagesUpload}
                        className="hidden"
                        id="test-images-upload"
                      />
                      <label
                        htmlFor="test-images-upload"
                        className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400"
                      >
                        <div className="text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-500">
                            {uploadingImage ? "Yuklanmoqda..." : 
                             `Rasmlar yuklash uchun bosing (${testImageFiles.length}/5)`}
                          </p>
                        </div>
                      </label>
                    </div>
                  )}
                  
                  {/* Tasdiqlash tugmasi */}
                  {testImageFiles.length > 0 && (
                    <div className="flex justify-center">
                      <Button
                        type="button"
                        onClick={confirmImages}
                        variant="outline"
                        className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      >
                        Rasmlarni tasdiqlash ({testImageFiles.length} ta)
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Davomiyligi (daqiqa)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                      <FormLabel>Savollar soni</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                      <FormLabel>O'tish bali (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Savollar */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Savollar</h3>
                  <Button type="button" onClick={addQuestion} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Savol qo'shish
                  </Button>
                </div>

                {questions.map((question, questionIndex) => (
                  <Card key={questionIndex} className="mb-4">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {questionIndex + 1}-savol
                        </CardTitle>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeQuestion(questionIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <FormLabel>Savol matni</FormLabel>
                        <Textarea
                          value={question.questionText}
                          onChange={(e) => updateQuestion(questionIndex, 'questionText', e.target.value)}
                          placeholder="Savol matnini kiriting"
                        />
                      </div>

                      {/* Savol rasmi yuklash */}
                      <div>
                        <FormLabel>Savol rasmi</FormLabel>
                        <div className="mt-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleQuestionImageUpload(e, questionIndex)}
                            className="hidden"
                            id={`question-image-upload-${questionIndex}`}
                          />
                          <label
                            htmlFor={`question-image-upload-${questionIndex}`}
                            className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400"
                          >
                            {questionImageFiles[questionIndex] ? (
                              <div className="text-center">
                                <img
                                  src={URL.createObjectURL(questionImageFiles[questionIndex])}
                                  alt="Savol rasmi"
                                  className="max-h-16 mx-auto mb-1"
                                />
                                <p className="text-xs text-gray-500">
                                  {questionImageFiles[questionIndex].name}
                                </p>
                              </div>
                            ) : (
                              <div className="text-center">
                                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                <p className="mt-1 text-xs text-gray-500">
                                  Rasm yuklash
                                </p>
                              </div>
                            )}
                          </label>
                        </div>
                      </div>

                      <div>
                        <FormLabel>Javob variantlari</FormLabel>
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center space-x-2">
                              <span className="text-sm font-medium w-6">
                                {String.fromCharCode(65 + optionIndex)}:
                              </span>
                              <Input
                                value={option}
                                onChange={(e) => updateQuestionOption(questionIndex, optionIndex, e.target.value)}
                                placeholder={`${String.fromCharCode(65 + optionIndex)} varianti`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <FormLabel>To'g'ri javob</FormLabel>
                        <Select
                          value={question.correctAnswer}
                          onValueChange={(value) => updateQuestion(questionIndex, 'correctAnswer', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="To'g'ri javobni tanlang" />
                          </SelectTrigger>
                          <SelectContent>
                            {['A', 'B', 'C', 'D'].map((letter) => (
                              <SelectItem key={letter} value={letter}>
                                {letter}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button type="submit" className="w-full" disabled={createTestMutation.isPending}>
                {createTestMutation.isPending ? "Yaratilmoqda..." : "Test yaratish"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}