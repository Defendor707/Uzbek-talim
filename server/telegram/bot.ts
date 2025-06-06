import { Telegraf, session, Scenes, Markup } from 'telegraf';
import { storage } from '../storage';
import { generateToken, verifyToken } from '../utils/auth';
import { botNotificationService } from '../sync/botNotifications';
import bcrypt from 'bcrypt';
import * as schema from '@shared/schema';
import { db } from '../db';
import { eq, and, sql } from 'drizzle-orm';

// Type for our session data
interface BotSessionData extends Scenes.SceneSession {
  userId?: number;
  role?: string;
  token?: string;
  loginStep?: 'username' | 'password';
  registrationStep?: 'role' | 'fullName' | 'email' | 'username' | 'password' | 'confirmPassword';
  registrationData?: {
    username?: string;
    password?: string;
    confirmPassword?: string;
    role?: 'teacher' | 'student' | 'parent' | 'center';
    fullName?: string;
    email?: string;
  };
  tempLoginData?: {
    username?: string;
  };
  testAttempt?: {
    testId?: number;
    attemptId?: number;
    currentPage?: number;
    totalQuestions?: number;
    answers?: { questionId: number, answer: string }[];
    questions?: any[];
    selectedQuestionId?: number;
  };
  editingField?: 'fullName' | 'phoneNumber' | 'specialty' | 'bio' | 'experience' | 'addChild' | 'testCode';
  testCreation?: {
    step?: 'title' | 'type' | 'questionCount' | 'answers' | 'inputMethod' | 'imageUpload';
    testType?: 'public' | 'private';
    questionCount?: number;
    answers?: string[];
    currentQuestionIndex?: number;
    testCode?: string;
    testData?: {
      title?: string;
      description?: string;
      imageUrl?: string;
    };
  };
}

// Create custom context type
interface BotContext extends Scenes.SceneContext {
  session: BotSessionData;
}

// Check for Telegram bot token
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN environment variable is not set');
  process.exit(1);
}

// Initialize the bot
const bot = new Telegraf<BotContext>(process.env.TELEGRAM_BOT_TOKEN);

// Use session middleware
bot.use(session());

// Initialize session data
bot.use((ctx, next) => {
  if (!ctx.session) {
    ctx.session = {};
  }
  return next();
});

// Main message handler for login and registration flows
bot.on('text', async (ctx, next) => {
  const messageText = ctx.message.text;
  
  // Handle login flow
  if (ctx.session.loginStep) {
    if (ctx.session.loginStep === 'username') {
      ctx.session.tempLoginData = { username: messageText };
      ctx.session.loginStep = 'password';
      await ctx.reply('🔐 Parolingizni kiriting:');
      return;
    }
    
    if (ctx.session.loginStep === 'password') {
      try {
        const username = ctx.session.tempLoginData?.username;
        if (!username) {
          await ctx.reply('❌ Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
          ctx.session.loginStep = undefined;
          ctx.session.tempLoginData = undefined;
          return;
        }
        
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          await ctx.reply('❌ Bunday foydalanuvchi topilmadi. Qaytadan urinib ko\'ring.');
          ctx.session.loginStep = undefined;
          ctx.session.tempLoginData = undefined;
          return;
        }
        
        const isPasswordValid = await bcrypt.compare(messageText, user.password);
        
        if (!isPasswordValid) {
          await ctx.reply('❌ Noto\'g\'ri parol. Qaytadan urinib ko\'ring.');
          ctx.session.loginStep = undefined;
          ctx.session.tempLoginData = undefined;
          return;
        }
        
        // Login successful
        const token = generateToken(user.id, user.role);
        ctx.session.userId = user.id;
        ctx.session.role = user.role;
        ctx.session.token = token;
        ctx.session.loginStep = undefined;
        ctx.session.tempLoginData = undefined;
        
        await ctx.reply(
          `✅ Xush kelibsiz, ${user.fullName}!\n\n` +
          `🎯 Siz ${getRoleNameInUzbek(user.role)} sifatida tizimga kirdingiz.\n\n` +
          'Quyidagi funksiyalardan foydalanishingiz mumkin:',
          Markup.keyboard(getKeyboardByRole(user.role)).resize()
        );
      } catch (error) {
        console.error('Login error:', error);
        await ctx.reply('❌ Tizimga kirishda xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
        ctx.session.loginStep = undefined;
        ctx.session.tempLoginData = undefined;
      }
      return;
    }
  }
  
  // Handle registration flow
  if (ctx.session.registrationStep) {
    if (ctx.session.registrationStep === 'fullName') {
      if (!ctx.session.registrationData) ctx.session.registrationData = {};
      ctx.session.registrationData.fullName = messageText;
      ctx.session.registrationStep = 'username';
      await ctx.reply('👤 Foydalanuvchi nomini kiriting:');
      return;
    }
    
    if (ctx.session.registrationStep === 'username') {
      if (!ctx.session.registrationData) ctx.session.registrationData = {};
      
      // Check if username already exists
      try {
        const existingUser = await storage.getUserByUsername(messageText);
        if (existingUser) {
          await ctx.reply('❌ Bu foydalanuvchi nomi allaqachon mavjud. Boshqa nom kiriting:');
          return;
        }
        
        ctx.session.registrationData.username = messageText;
        ctx.session.registrationStep = 'password';
        await ctx.reply('🔐 Parol yarating (kamida 6 ta belgi):');
        return;
      } catch (error) {
        console.error('Username check error:', error);
        await ctx.reply('❌ Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
        return;
      }
    }
    
    if (ctx.session.registrationStep === 'password') {
      if (!ctx.session.registrationData) ctx.session.registrationData = {};
      
      // Password validation
      if (messageText.length < 6) {
        await ctx.reply('❌ Parol kamida 6 ta belgidan iborat bo\'lishi kerak. Qaytadan kiriting:');
        return;
      }
      
      // Check password strength (at least one letter or number)
      if (!/[a-zA-Z]/.test(messageText) && !/\d/.test(messageText)) {
        await ctx.reply('❌ Parol kamida bitta harf yoki raqam bo\'lishi kerak. Qaytadan kiriting:');
        return;
      }
      
      ctx.session.registrationData.password = messageText;
      ctx.session.registrationStep = 'confirmPassword';
      await ctx.reply('🔐 Parolni tasdiqlang:');
      return;
    }
    
    if (ctx.session.registrationStep === 'confirmPassword') {
      if (!ctx.session.registrationData) ctx.session.registrationData = {};
      
      if (messageText !== ctx.session.registrationData.password) {
        await ctx.reply('❌ Parollar mos kelmadi. Qaytadan tasdiqlang:');
        return;
      }
      
      // Registration complete
      try {
        // Don't hash password here - storage layer will handle it
        // Create email from username - match website format
        const email = `${ctx.session.registrationData.username}@uzbektalim.uz`;
        
        const newUser = await storage.createUser({
          username: ctx.session.registrationData.username!,
          password: ctx.session.registrationData.password!,
          email: email,
          role: ctx.session.registrationData.role!,
          fullName: ctx.session.registrationData.fullName!
        });
        
        // Auto login
        const token = generateToken(newUser.id, newUser.role);
        ctx.session.userId = newUser.id;
        ctx.session.role = newUser.role;
        ctx.session.token = token;
        ctx.session.registrationStep = undefined;
        ctx.session.registrationData = undefined;
        
        await ctx.reply(
          `🎉 Tabriklaymiz! Siz muvaffaqiyatli ro'yxatdan o'tdingiz.\n\n` +
          `👤 Ism: ${newUser.fullName}\n` +
          `🎯 Rol: ${getRoleNameInUzbek(newUser.role)}\n\n` +
          'Quyidagi funksiyalardan foydalanishingiz mumkin:',
          Markup.keyboard(getKeyboardByRole(newUser.role)).resize()
        );
      } catch (error) {
        console.error('Registration error:', error);
        await ctx.reply('❌ Ro\'yxatdan o\'tishda xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
        ctx.session.registrationStep = undefined;
        ctx.session.registrationData = undefined;
      }
      return;
    }
  }
  
  // Handle test code search
  if (ctx.session.editingField === 'testCode') {
    const testCode = messageText.trim();
    
    if (!/^\d{6}$/.test(testCode)) {
      await ctx.reply('❌ Test kodi 6 ta raqamdan iborat bo\'lishi kerak. Qaytadan kiriting:');
      return;
    }
    
    try {
      // Search for test with this code
      const tests = await storage.getTestsByGradeAndClassroom('10'); // Search in all tests
      const foundTest = tests.find(test => test.description && test.description.includes(testCode));
      
      if (!foundTest) {
        await ctx.reply('❌ Bunday kodli test topilmadi. Qaytadan urinib ko\'ring:');
        return;
      }
      
      if (foundTest.status !== 'active') {
        await ctx.reply('❌ Bu test hozirda faol emas.');
        ctx.session.editingField = undefined;
        return;
      }
      
      // Show test details and start option
      await ctx.reply(
        `📝 *Test topildi!*\n\n` +
        `📋 Nomi: ${foundTest.title}\n` +
        `📊 Savollar soni: ${foundTest.totalQuestions}\n` +
        `⏰ Davomiyligi: Cheklanmagan\n` +
        `🎓 Sinf: ${foundTest.grade}\n\n` +
        'Testni boshlashni xohlaysizmi?',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('▶️ Testni boshlash', `start_test_${foundTest.id}`)],
            [Markup.button.callback('🔙 Orqaga', 'back_to_menu')]
          ])
        }
      );
      
      ctx.session.editingField = undefined;
      return;
    } catch (error) {
      console.error('Error searching test by code:', error);
      await ctx.reply('❌ Test qidirishda xatolik yuz berdi.');
      ctx.session.editingField = undefined;
      return;
    }
  }
  
  // Handle test creation flow
  if (ctx.session.testCreation) {
    if (ctx.session.testCreation.step === 'title') {
      const title = messageText.trim();
      
      if (title.length < 3 || title.length > 100) {
        await ctx.reply('❌ Test nomi 3 dan 100 ta belgigacha bo\'lishi kerak. Qaytadan kiriting:');
        return;
      }
      
      if (!ctx.session.testCreation.testData) {
        ctx.session.testCreation.testData = {};
      }
      ctx.session.testCreation.testData.title = title;
      
      // Ommaviy test uchun rasm yuklash talab qilish
      if (ctx.session.testCreation.testType === 'public') {
        ctx.session.testCreation.step = 'imageUpload';
        await ctx.reply(
          '🖼️ *Test rasmi*\n\n' +
          'Ommaviy test uchun test rasmini yuklang:\n\n' +
          '📸 Rasm yuklash uchun rasmni bu chatga yuboring.',
          {
            parse_mode: 'Markdown',
            ...Markup.keyboard([['⏭️ O\'tkazib yuborish', '🔙 Orqaga']]).resize()
          }
        );
        return;
      } else {
        ctx.session.testCreation.step = 'questionCount';
        await ctx.reply(
          '📊 *Savollar soni*\n\n' +
          'Test nechta savoldan iborat bo\'lsin?\n' +
          '(5 dan 90 tagacha raqam kiriting)',
          {
            parse_mode: 'Markdown',
            ...Markup.keyboard([['🔙 Orqaga']]).resize()
          }
        );
        return;
      }
    }
    
    if (ctx.session.testCreation.step === 'questionCount') {
      const questionCount = parseInt(messageText);
      
      if (isNaN(questionCount) || questionCount < 5 || questionCount > 90) {
        await ctx.reply('❌ Savollar soni 5 dan 90 gacha bo\'lishi kerak. Qaytadan kiriting:');
        return;
      }
      
      ctx.session.testCreation.questionCount = questionCount;
      ctx.session.testCreation.step = 'inputMethod';
      
      // Faqat tugmalar orqali kiritish usulini taklif qilish
      ctx.session.testCreation.currentQuestionIndex = 0;
      await ctx.reply(
        '📝 *Javoblarni belgilash*\n\n' +
        'Har bir savol uchun to\'g\'ri javobni belgilang:',
        {
          parse_mode: 'Markdown',
          ...Markup.keyboard([['🔙 Orqaga']]).resize()
        }
      );
      await showQuestionButtons(ctx);
      return;
    }
    
    if (ctx.session.testCreation.step === 'answers') {
      // Handle single line answers (1a2b3c4d format or abcda format)
      const cleanText = messageText.toLowerCase().replace(/[^abcd0-9]/g, '');
      const answers: string[] = [];
      
      // Try to parse different formats
      let parsed = false;
      
      // Format 1: 1a2b3c4d5a... (with numbers)
      if (/^\d+[abcd]/.test(cleanText)) {
        const matches = cleanText.match(/\d+[abcd]/g);
        if (matches) {
          for (const match of matches) {
            const answer = match.slice(-1).toUpperCase();
            answers.push(answer);
          }
          parsed = true;
        }
      }
      
      // Format 2: abcda... (letters only)
      if (!parsed && /^[abcd]+$/.test(cleanText)) {
        for (const char of cleanText) {
          answers.push(char.toUpperCase());
        }
        parsed = true;
      }
      
      if (!parsed || answers.length !== ctx.session.testCreation.questionCount) {
        await ctx.reply(
          `❌ Javoblar noto'g'ri formatda yoki soni mos kelmaydi.\n\n` +
          `Kerakli savollar soni: ${ctx.session.testCreation.questionCount}\n` +
          `Sizning javoblaringiz soni: ${answers.length}\n\n` +
          'Qaytadan kiriting:'
        );
        return;
      }
      
      ctx.session.testCreation.answers = answers;
      await saveTest(ctx);
      return;
    }
    
    // Handle individual question answers
    if (ctx.session.testCreation.step === 'inputMethod' && 
        ctx.session.testCreation.currentQuestionIndex !== undefined) {
      const answer = messageText.toUpperCase();
      
      if (!['A', 'B', 'C', 'D'].includes(answer)) {
        await ctx.reply('❌ Faqat A, B, C yoki D harflarini kiriting:');
        return;
      }
      
      if (!ctx.session.testCreation.answers) {
        ctx.session.testCreation.answers = [];
      }
      
      ctx.session.testCreation.answers[ctx.session.testCreation.currentQuestionIndex] = answer;
      ctx.session.testCreation.currentQuestionIndex++;
      
      const questionCount = ctx.session.testCreation.questionCount || 0;
      
      if (ctx.session.testCreation.currentQuestionIndex >= questionCount) {
        await saveTest(ctx);
        return;
      }
      
      const nextQuestionNum = ctx.session.testCreation.currentQuestionIndex + 1;
      await ctx.reply(
        `📝 *${nextQuestionNum}-savol javobini kiriting*\n\n` +
        'A, B, C yoki D harflaridan birini kiriting:',
        {
          parse_mode: 'Markdown',
          ...Markup.keyboard([['A', 'B', 'C', 'D'], ['🔙 Orqaga']]).resize()
        }
      );
      return;
    }
  }
  
  return next();
});

// Role selection handlers for registration
bot.hears(['👨‍🏫 O\'qituvchi', '👨‍🎓 O\'quvchi', '👨‍👩‍👧‍👦 Ota-ona', '🏫 O\'quv markazi'], async (ctx) => {
  if (ctx.session.registrationStep === 'role') {
    const roleMap: Record<string, schema.User['role']> = {
      '👨‍🏫 O\'qituvchi': 'teacher',
      '👨‍🎓 O\'quvchi': 'student',
      '👨‍👩‍👧‍👦 Ota-ona': 'parent',
      '🏫 O\'quv markazi': 'center'
    };
    
    if (!ctx.session.registrationData) {
      ctx.session.registrationData = {};
    }
    
    const messageText = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    ctx.session.registrationData.role = roleMap[messageText];
    ctx.session.registrationStep = 'fullName';
    
    await ctx.reply(
      `✅ Siz ${messageText} sifatida ro'yxatdan o'tyapsiz.\n\n` +
      '👤 To\'liq ismingizni kiriting:'
    );
  }
});

// Back button handler
bot.hears('🔙 Orqaga', async (ctx) => {
  // Check if user is logged in - return to their dashboard
  if (ctx.session.userId && ctx.session.role) {
    await ctx.reply(
      'Asosiy menyuga qaytdingiz.',
      Markup.keyboard(getKeyboardByRole(ctx.session.role)).resize()
    );
    return;
  }
  
  // If not logged in, clear session and return to login menu
  ctx.session.loginStep = undefined;
  ctx.session.registrationStep = undefined;
  ctx.session.registrationData = undefined;
  ctx.session.tempLoginData = undefined;
  
  await ctx.reply(
    'Bosh menyuga qaytdingiz.\n\nQuyidagi amallardan birini tanlang:',
    Markup.keyboard([
      ['🔑 Kirish', '📝 Ro\'yxatdan o\'tish'],
      ['ℹ️ Ma\'lumot', '📊 Statistika']
    ]).resize()
  );
});

// Command handlers

// Start command - entry point
bot.start(async (ctx) => {
  ctx.session = {}; // Reset session
  await ctx.reply(
    'Assalomu alaykum! O\'zbek Ta\'lim platformasiga xush kelibsiz! 🎓\n\n' +
    'Iltimos, quyidagi amallardan birini tanlang:',
    Markup.keyboard([
      ['🔑 Kirish', '📝 Ro\'yxatdan o\'tish'],
      ['ℹ️ Ma\'lumot', '📊 Statistika']
    ]).resize()
  );
});

// Help command
bot.help(async (ctx) => {
  let helpText = 'O\'zbek Ta\'lim platformasi buyruqlari:\n\n' +
    '/start - Botni qayta ishga tushirish\n' +
    '/login - Tizimga kirish\n' +
    '/register - Ro\'yxatdan o\'tish\n' +
    '/profile - Profilingizni ko\'rish\n' +
    '/lessons - Darslar ro\'yxati\n' +
    '/tests - Testlar ro\'yxati\n' +
    '/logout - Tizimdan chiqish\n\n';
  
  // Add role-specific commands
  if (ctx.session.userId && ctx.session.role === 'teacher') {
    helpText += '*O\'qituvchi uchun qo\'shimcha buyruqlar:*\n' +
      '/profile_edit - Profil ma\'lumotlarini tahrirlash\n' +
      '/specialty - Mutaxassislikni o\'zgartirish\n' +
      '/bio - Haqida bo\'limini o\'zgartirish\n' +
      '/experience - Tajribani o\'zgartirish';
  } else if (ctx.session.userId && ctx.session.role === 'student') {
    helpText += '*O\'quvchi uchun qo\'shimcha buyruqlar:*\n' +
      '/student_edit - Profil ma\'lumotlarini tahrirlash';
  } else if (ctx.session.userId && ctx.session.role === 'parent') {
    helpText += '*Ota-ona uchun qo\'shimcha buyruqlar:*\n' +
      '/parent_edit - Profil ma\'lumotlarini tahrirlash';
  }
  
  await ctx.reply(helpText, { parse_mode: 'Markdown' });
});

// Login handlers
bot.hears('🔑 Kirish', async (ctx) => {
  await startLogin(ctx);
});

bot.command('login', async (ctx) => {
  await startLogin(ctx);
});

async function startLogin(ctx: BotContext) {
  ctx.session.loginStep = 'username';
  await ctx.reply(
    '🔑 *Tizimga kirish*\n\nFoydalanuvchi nomingizni kiriting:',
    { parse_mode: 'Markdown' }
  );
}

// Registration handlers
bot.hears('📝 Ro\'yxatdan o\'tish', async (ctx) => {
  await startRegistration(ctx);
});

bot.command('register', async (ctx) => {
  await startRegistration(ctx);
});

async function startRegistration(ctx: BotContext) {
  ctx.session.registrationData = {};
  ctx.session.registrationStep = 'role';
  
  await ctx.reply(
    '📝 *Ro\'yxatdan o\'tish*\n\nO\'z rolingizni tanlang:',
    {
      parse_mode: 'Markdown',
      ...Markup.keyboard([
        ['👨‍🏫 O\'qituvchi', '👨‍🎓 O\'quvchi'],
        ['👨‍👩‍👧‍👦 Ota-ona', '🏫 O\'quv markazi'],
        ['🔙 Orqaga']
      ]).resize()
    }
  );
}



// Lessons commands
bot.command('lessons', async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Siz tizimga kirmagansiz. Iltimos, avval tizimga kiring.');
    return;
  }
  
  try {
    let lessons;
    const user = await storage.getUser(ctx.session.userId);
    
    if (!user) {
      await ctx.reply('❌ Foydalanuvchi ma\'lumotlari topilmadi.');
      return;
    }
    
    if (user.role === 'teacher') {
      lessons = await storage.getLessonsByTeacherId(user.id);
    } else if (user.role === 'student') {
      const profile = await storage.getStudentProfile(user.id);
      if (!profile) {
        await ctx.reply('❌ O\'quvchi profili topilmadi.');
        return;
      }
      // O'quvchi uchun barcha darslarni ko'rsatish
      lessons = [];
    } else {
      await ctx.reply('❌ Sizning rolingiz darslarni ko\'rishga ruxsat bermaydi.');
      return;
    }
    
    if (!lessons || lessons.length === 0) {
      await ctx.reply('ℹ️ Hozircha darslar mavjud emas.');
      return;
    }
    
    for (const lesson of lessons.slice(0, 5)) {
      // Get subject name if subjectId is available
      let subjectName = "Mavjud emas";
      if (lesson.subjectId) {
        const subject = await db.select().from(schema.subjects).where(eq(schema.subjects.id, lesson.subjectId)).limit(1);
        if (subject && subject.length > 0) {
          subjectName = subject[0].name;
        }
      }

      await ctx.reply(
        `📚 *${lesson.title}*\n\n` +
        `📝 *Tavsif*: ${lesson.description || 'Tavsif mavjud emas'}\n` +
        `🎓 *Sinf*: ${lesson.grade}\n` +
        `📚 *Fan*: ${subjectName}\n` +
        `📅 *Yaratilgan sana*: ${new Date(lesson.createdAt).toLocaleDateString('uz-UZ')}`,
        { parse_mode: 'Markdown' }
      );
    }
    
    if (lessons.length > 5) {
      await ctx.reply(`... va yana ${lessons.length - 5} ta darslar. To'liq ro'yxatni ko'rish uchun veb-saytdan foydalaning.`);
    }
  } catch (error) {
    console.error('Error fetching lessons:', error);
    await ctx.reply('❌ Darslar ro\'yxatini olishda xatolik yuz berdi.');
  }
});

// Tests commands
bot.command('tests', async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Siz tizimga kirmagansiz. Iltimos, avval tizimga kiring.');
    return;
  }
  
  try {
    let tests;
    const user = await storage.getUser(ctx.session.userId);
    
    if (!user) {
      await ctx.reply('❌ Foydalanuvchi ma\'lumotlari topilmadi.');
      return;
    }
    
    if (user.role === 'teacher') {
      // Check if teacher profile exists, create if not
      let teacherProfile = await storage.getTeacherProfile(user.id);
      if (!teacherProfile) {
        teacherProfile = await storage.createTeacherProfile({
          userId: user.id,
          phoneNumber: null,
          specialty: null,
          subjects: [],
          bio: null,
          experience: null,
          certificates: [],
          centerId: null
        });
      }
      tests = await storage.getTestsByTeacherId(user.id);
    } else if (user.role === 'student') {
      const profile = await storage.getStudentProfile(user.id);
      if (!profile) {
        await ctx.reply('❌ O\'quvchi profili topilmadi.');
        return;
      }
      // O'quvchi uchun barcha testlarni ko'rsatish
      tests = [];
    } else {
      await ctx.reply('❌ Sizning rolingiz testlarni ko\'rishga ruxsat bermaydi.');
      return;
    }
    
    if (!tests || tests.length === 0) {
      await ctx.reply('ℹ️ Hozircha testlar mavjud emas.');
      return;
    }
    
    // Create inline keyboard for tests
    const testButtons = await Promise.all(tests.slice(0, 10).map(async test => {
      // Get subject name if subjectId is available
      let subjectName = "Mavjud emas";
      if (test.subjectId) {
        const subject = await db.select().from(schema.subjects).where(eq(schema.subjects.id, test.subjectId)).limit(1);
        if (subject && subject.length > 0) {
          subjectName = subject[0].name;
        }
      }
      return [Markup.button.callback(`${test.title} (${subjectName})`, `view_test_${test.id}`)];
    }));
    
    await ctx.reply(
      '📝 *Mavjud testlar ro\'yxati*\n\n' +
      'Test haqida batafsil ma\'lumot olish uchun tugmani bosing:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(testButtons)
      }
    );
    
    if (tests.length > 10) {
      await ctx.reply(`... va yana ${tests.length - 10} ta testlar. To'liq ro'yxatni ko'rish uchun veb-saytdan foydalaning.`);
    }
  } catch (error) {
    console.error('Error fetching tests:', error);
    await ctx.reply('❌ Testlar ro\'yxatini olishda xatolik yuz berdi.');
  }
});

// Test view callback
bot.action(/view_test_(\d+)/, async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Siz tizimga kirmagansiz. Iltimos, avval tizimga kiring.');
    return;
  }
  
  const match = ctx.match[1];
  const testId = parseInt(match);
  
  try {
    const test = await storage.getTestById(testId);
    if (!test) {
      await ctx.reply('❌ Test topilmadi.');
      return;
    }
    
    // Get subject name if subjectId is available
    let subjectName = "Mavjud emas";
    if (test.subjectId) {
      const subject = await db.select().from(schema.subjects).where(eq(schema.subjects.id, test.subjectId)).limit(1);
      if (subject && subject.length > 0) {
        subjectName = subject[0].name;
      }
    }

    await ctx.reply(
      `📝 *${test.title}*\n\n` +
      `📚 *Fan*: ${subjectName}\n` +
      `🎓 *Sinf*: ${test.grade}\n` +
      `🏫 *Sinf xonasi*: ${test.classroom || 'Barcha sinflar'}\n` +
      `⏱ *Davomiyligi*: ${test.duration} daqiqa\n` +
      `📊 *Holati*: ${getTestStatusInUzbek(test.status)}\n` +
      `📅 *Yaratilgan sana*: ${new Date(test.createdAt).toLocaleDateString('uz-UZ')}`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('Testni boshlash', `start_test_${test.id}`)]
        ])
      }
    );
  } catch (error) {
    console.error('Error fetching test details:', error);
    await ctx.reply('❌ Test ma\'lumotlarini olishda xatolik yuz berdi.');
  }
});

// Profile edit command (only for teachers)
bot.command('profile_edit', async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Siz tizimga kirmagansiz. Iltimos, avval tizimga kiring.');
    return;
  }

  try {
    const user = await storage.getUser(ctx.session.userId);
    if (!user) {
      await ctx.reply('❌ Foydalanuvchi ma\'lumotlari topilmadi.');
      return;
    }

    if (user.role !== 'teacher') {
      await ctx.reply('❌ Bu funksiya faqat o\'qituvchilar uchun mavjud.');
      return;
    }

    // Get existing profile
    const existingProfile = await storage.getTeacherProfile(user.id);
    
    let message = '📝 *Profil tahrirlash*\n\n';
    message += 'Quyidagi buyruqlardan birini tanlang:\n\n';
    message += '/specialty - Mutaxassislikni o\'zgartirish\n';
    message += '/bio - Haqida bo\'limini o\'zgartirish\n';
    message += '/experience - Tajribani o\'zgartirish\n';
    
    if (existingProfile) {
      message += '\n*Joriy ma\'lumotlar:*\n';
      message += `🔬 Mutaxassislik: ${existingProfile.specialty || 'Kiritilmagan'}\n`;
      message += `⏱️ Tajriba: ${existingProfile.experience || 0} yil\n`;
      message += `📝 Haqida: ${existingProfile.bio || 'Kiritilmagan'}`;
    } else {
      message += '\n❌ Profil ma\'lumotlari hali kiritilmagan.';
    }

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in profile_edit:', error);
    await ctx.reply('❌ Profil tahrirlashda xatolik yuz berdi.');
  }
});

// Student profile edit command
bot.command('student_edit', async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Siz tizimga kirmagansiz. Iltimos, avval tizimga kiring.');
    return;
  }

  try {
    const user = await storage.getUser(ctx.session.userId);
    if (!user) {
      await ctx.reply('❌ Foydalanuvchi ma\'lumotlari topilmadi.');
      return;
    }

    if (user.role !== 'student') {
      await ctx.reply('❌ Bu funksiya faqat o\'quvchilar uchun mavjud.');
      return;
    }

    await ctx.reply(
      '📝 *O\'quvchi profili tahrirlash*\n\n' +
      'Quyidagi ma\'lumotlardan birini o\'zgartiring:',
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard([
          ['✏️ Ismni o\'zgartirish', '📞 Telefon raqam'],
          ['📄 Haqida', '🔙 Orqaga']
        ]).resize()
      }
    );
  } catch (error) {
    console.error('Error in student_edit:', error);
    await ctx.reply('❌ Profil tahrirlashda xatolik yuz berdi.');
  }
});

// Parent profile edit command
bot.command('parent_edit', async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Siz tizimga kirmagansiz. Iltimos, avval tizimga kiring.');
    return;
  }

  try {
    const user = await storage.getUser(ctx.session.userId);
    if (!user) {
      await ctx.reply('❌ Foydalanuvchi ma\'lumotlari topilmadi.');
      return;
    }

    if (user.role !== 'parent') {
      await ctx.reply('❌ Bu funksiya faqat ota-onalar uchun mavjud.');
      return;
    }

    await ctx.reply(
      '📝 *Ota-ona profili tahrirlash*\n\n' +
      'Quyidagi ma\'lumotlardan birini o\'zgartiring:',
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard([
          ['✏️ Ismni o\'zgartirish', '📞 Telefon raqam'],
          ['🔙 Orqaga']
        ]).resize()
      }
    );
  } catch (error) {
    console.error('Error in parent_edit:', error);
    await ctx.reply('❌ Profil tahrirlashda xatolik yuz berdi.');
  }
});

// Specialty edit command
bot.command('specialty', async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Siz tizimga kirmagansiz.');
    return;
  }

  const user = await storage.getUser(ctx.session.userId);
  if (!user || user.role !== 'teacher') {
    await ctx.reply('❌ Bu funksiya faqat o\'qituvchilar uchun mavjud.');
    return;
  }

  ctx.session.editingField = 'specialty';
  await ctx.reply(
    '🔬 *Mutaxassislik o\'zgartirish*\n\n' +
    'Yangi mutaxassisligingizni kiriting (maksimal 20 harf):\n' +
    'Masalan: Matematika, Fizika, IT, Kimyo...',
    { parse_mode: 'Markdown' }
  );
});

// Bio edit command
bot.command('bio', async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Siz tizimga kirmagansiz.');
    return;
  }

  const user = await storage.getUser(ctx.session.userId);
  if (!user || user.role !== 'teacher') {
    await ctx.reply('❌ Bu funksiya faqat o\'qituvchilar uchun mavjud.');
    return;
  }

  ctx.session.editingField = 'bio';
  await ctx.reply(
    '📝 *Haqida bo\'limi o\'zgartirish*\n\n' +
    'O\'zingiz haqingizda qisqacha ma\'lumot kiriting (maksimal 200 harf):\n' +
    'Masalan: tajriba, yutuqlar, qiziqishlar...',
    { parse_mode: 'Markdown' }
  );
});

// Experience edit command
bot.command('experience', async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Siz tizimga kirmagansiz.');
    return;
  }

  const user = await storage.getUser(ctx.session.userId);
  if (!user || user.role !== 'teacher') {
    await ctx.reply('❌ Bu funksiya faqat o\'qituvchilar uchun mavjud.');
    return;
  }

  ctx.session.editingField = 'experience';
  await ctx.reply(
    '⏱️ *Tajriba o\'zgartirish*\n\n' +
    'Ish tajribangizni yillarda kiriting (faqat raqam):\n' +
    'Masalan: 5, 10, 15...',
    { parse_mode: 'Markdown' }
  );
});

// Profile editing button handlers
bot.hears('✏️ Ismni o\'zgartirish', async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Siz tizimga kirmagansiz.');
    return;
  }

  const user = await storage.getUser(ctx.session.userId);
  if (!user) {
    await ctx.reply('❌ Foydalanuvchi ma\'lumotlari topilmadi.');
    return;
  }

  ctx.session.editingField = 'fullName';
  await ctx.reply(
    `📝 Ismni o'zgartirish\n\n` +
    `Joriy ism: ${user.fullName}\n\n` +
    `Yangi ism va familyangizni kiriting:`,
    Markup.keyboard([['🔙 Orqaga']]).resize()
  );
});



bot.hears('📞 Telefon raqam', async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Siz tizimga kirmagansiz.');
    return;
  }

  const user = await storage.getUser(ctx.session.userId);
  if (!user) {
    await ctx.reply('❌ Foydalanuvchi ma\'lumotlari topilmadi.');
    return;
  }

  let currentPhone = 'Kiritilmagan';
  
  if (user.role === 'teacher') {
    const profile = await storage.getTeacherProfile(user.id);
    currentPhone = profile?.phoneNumber || 'Kiritilmagan';
  } else if (user.role === 'student') {
    const profile = await storage.getStudentProfile(user.id);
    currentPhone = profile?.phoneNumber || 'Kiritilmagan';
  } else if (user.role === 'parent') {
    currentPhone = user.phone || 'Kiritilmagan';
  }

  ctx.session.editingField = 'phoneNumber';
  await ctx.reply(
    `📞 Telefon raqam o'zgartirish\n\n` +
    `Joriy telefon: ${currentPhone}\n\n` +
    `Yangi telefon raqamingizni kiriting (+998901234567):`,
    Markup.keyboard([['🔙 Orqaga']]).resize()
  );
});

// Bio editing for students
bot.hears('📄 Haqida', async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Siz tizimga kirmagansiz.');
    return;
  }

  const user = await storage.getUser(ctx.session.userId);
  if (!user) {
    await ctx.reply('❌ Foydalanuvchi ma\'lumotlari topilmadi.');
    return;
  }

  let currentBio = 'Kiritilmagan';
  
  if (user.role === 'teacher') {
    const profile = await storage.getTeacherProfile(user.id);
    currentBio = profile?.bio || 'Kiritilmagan';
  } else if (user.role === 'student') {
    const profile = await storage.getStudentProfile(user.id);
    currentBio = profile?.bio || 'Kiritilmagan';
  }

  ctx.session.editingField = 'bio';
  await ctx.reply(
    `📄 Haqida o'zgartirish\n\n` +
    `Joriy ma'lumot: ${currentBio}\n\n` +
    `O'zingiz haqingizda ma'lumot kiriting (maksimal 200 harf):`,
    Markup.keyboard([['🔙 Orqaga']]).resize()
  );
});

bot.hears('🔬 Mutaxassislik', async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Siz tizimga kirmagansiz.');
    return;
  }

  const user = await storage.getUser(ctx.session.userId);
  if (!user || user.role !== 'teacher') {
    await ctx.reply('❌ Bu funksiya faqat o\'qituvchilar uchun mavjud.');
    return;
  }

  const profile = await storage.getTeacherProfile(user.id);
  ctx.session.editingField = 'specialty';
  await ctx.reply(
    `🔬 Mutaxassislik o'zgartirish\n\n` +
    `Joriy mutaxassislik: ${profile?.specialty || 'Kiritilmagan'}\n\n` +
    `Yangi mutaxassislikni kiriting (maksimal 20 harf):`,
    Markup.keyboard([['🔙 Orqaga']]).resize()
  );
});

bot.hears('📝 Haqida', async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Siz tizimga kirmagansiz.');
    return;
  }

  const user = await storage.getUser(ctx.session.userId);
  if (!user || user.role !== 'teacher') {
    await ctx.reply('❌ Bu funksiya faqat o\'qituvchilar uchun mavjud.');
    return;
  }

  const profile = await storage.getTeacherProfile(user.id);
  ctx.session.editingField = 'bio';
  await ctx.reply(
    `📝 Haqida o'zgartirish\n\n` +
    `Joriy ma'lumot: ${profile?.bio || 'Kiritilmagan'}\n\n` +
    `O'zingiz haqingizda ma'lumot kiriting (maksimal 200 harf):`,
    Markup.keyboard([['🔙 Orqaga']]).resize()
  );
});

bot.hears('⏱️ Tajriba', async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Siz tizimga kirmagansiz.');
    return;
  }

  const user = await storage.getUser(ctx.session.userId);
  if (!user || user.role !== 'teacher') {
    await ctx.reply('❌ Bu funksiya faqat o\'qituvchilar uchun mavjud.');
    return;
  }

  const profile = await storage.getTeacherProfile(user.id);
  ctx.session.editingField = 'experience';
  await ctx.reply(
    `⏱️ Tajriba o'zgartirish\n\n` +
    `Joriy tajriba: ${profile?.experience || 0} yil\n\n` +
    `Ish tajribangizni yillarda kiriting (faqat raqam):`,
    Markup.keyboard([['🔙 Orqaga']]).resize()
  );
});

// Handle image upload for test creation
bot.hears('⏭️ O\'tkazib yuborish', async (ctx) => {
  if (ctx.session.testCreation && ctx.session.testCreation.step === 'imageUpload') {
    ctx.session.testCreation.step = 'questionCount';
    await ctx.reply(
      '📊 *Savollar soni*\n\n' +
      'Test nechta savoldan iborat bo\'lsin?\n' +
      '(5 dan 90 tagacha raqam kiriting)',
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard([['🔙 Orqaga']]).resize()
      }
    );
  }
});

// Handle photo upload for test
bot.on('photo', async (ctx, next) => {
  if (ctx.session.testCreation && ctx.session.testCreation.step === 'imageUpload') {
    if (!ctx.session.testCreation.testData) {
      ctx.session.testCreation.testData = {};
    }
    
    // Store photo file_id for later use
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    ctx.session.testCreation.testData.imageUrl = photo.file_id;
    
    ctx.session.testCreation.step = 'questionCount';
    await ctx.reply(
      '✅ *Test rasmi saqlandi*\n\n' +
      '📊 *Savollar soni*\n\n' +
      'Test nechta savoldan iborat bo\'lsin?\n' +
      '(5 dan 90 tagacha raqam kiriting)',
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard([['🔙 Orqaga']]).resize()
      }
    );
    return;
  }
  
  return next();
});

// Handle profile field editing
bot.on('text', async (ctx, next) => {
  if (ctx.session.editingField && ctx.session.userId) {
    const field = ctx.session.editingField;
    const value = ctx.message.text;

    // Check for back button
    if (value === '🔙 Orqaga') {
      delete ctx.session.editingField;
      await ctx.reply(
        'Tahrirlash bekor qilindi.',
        Markup.keyboard(getKeyboardByRole(ctx.session.role || 'teacher')).resize()
      );
      return;
    }

    try {
      const user = await storage.getUser(ctx.session.userId);
      if (!user) {
        await ctx.reply('❌ Foydalanuvchi ma\'lumotlari topilmadi.');
        return;
      }

      // Validate input based on field
      let validatedValue: any = value;
      let errorMessage = '';

      if (field === 'fullName') {
        if (value.length < 2 || value.length > 50) {
          errorMessage = 'Ism-familya 2-50 harf orasida bo\'lishi kerak.';
        }
      } else if (field === 'phoneNumber') {
        if (value.length > 0 && !/^[\+]?[0-9\s\-\(\)]{9,15}$/.test(value)) {
          errorMessage = 'Telefon raqam noto\'g\'ri formatda. Masalan: +998901234567';
        }
      } else if (field === 'specialty') {
        if (value.length > 20) {
          errorMessage = 'Mutaxassislik 20 harfdan oshmasligi kerak.';
        } else if (value.length > 0 && !/^[a-zA-ZўқғҳҚҒҲЎ\s]+$/.test(value)) {
          errorMessage = 'Mutaxassislikda faqat harflar bo\'lishi mumkin.';
        }
      } else if (field === 'bio') {
        if (value.length > 200) {
          errorMessage = 'Haqida bo\'limi 200 harfdan oshmasligi kerak.';
        }
      } else if (field === 'experience') {
        const num = parseInt(value);
        if (isNaN(num) || num < 0) {
          errorMessage = 'Tajriba musbat raqam bo\'lishi kerak.';
        } else {
          validatedValue = num;
        }
      } else if (field === 'addChild') {
        if (value.length < 3) {
          errorMessage = 'Username kamida 3 ta belgidan iborat bo\'lishi kerak.';
        }
      }

      if (errorMessage) {
        await ctx.reply(`❌ ${errorMessage}\n\nIltimos, qaytadan kiriting:`);
        return;
      }

      // Save to database
      if (field === 'fullName') {
        // Update user's full name
        await storage.updateUser(user.id, { fullName: validatedValue });
      } else if (user.role === 'teacher') {
        // Update teacher profile
        let profile = await storage.getTeacherProfile(user.id);
        const profileData: any = { userId: user.id };

        if (profile) {
          // Update existing profile
          profileData[field] = validatedValue;
          await storage.updateTeacherProfile(user.id, profileData);
        } else {
          // Create new profile with default values
          profileData.phoneNumber = field === 'phoneNumber' ? validatedValue : undefined;
          profileData.specialty = field === 'specialty' ? validatedValue : undefined;
          profileData.bio = field === 'bio' ? validatedValue : undefined;
          profileData.experience = field === 'experience' ? validatedValue : undefined;
          profileData.subjects = field === 'specialty' ? [validatedValue] : undefined;
          
          await storage.createTeacherProfile(profileData);
        }
      } else if (user.role === 'student') {
        // Update student profile
        let profile = await storage.getStudentProfile(user.id);
        const profileData: any = { userId: user.id };

        if (profile) {
          // Update existing profile
          profileData[field] = validatedValue;
          await storage.updateStudentProfile(user.id, profileData);
        } else {
          // Create new profile with required values
          profileData.phoneNumber = field === 'phoneNumber' ? validatedValue : undefined;
          profileData.bio = field === 'bio' ? validatedValue : undefined;
          
          await storage.createStudentProfile(profileData);
        }
      } else if (user.role === 'parent') {
        // For parent, update phone number in user table directly or handle add child
        if (field === 'phoneNumber') {
          await storage.updateUser(user.id, { phone: validatedValue });
        } else if (field === 'addChild') {
          // Add child to parent
          await storage.addChildToParent(user.id, validatedValue);
        }
      }

      // Clear editing state
      delete ctx.session.editingField;

      const fieldNames = {
        fullName: 'Ism-familya',
        phoneNumber: 'Telefon raqam',
        specialty: 'Mutaxassislik',
        bio: 'Haqida bo\'limi',
        experience: 'Tajriba',
        addChild: 'Farzand'
      };

      await ctx.reply(
        `✅ ${fieldNames[field as keyof typeof fieldNames]} muvaffaqiyatli yangilandi!`,
        Markup.keyboard(getKeyboardByRole(user.role)).resize()
      );

    } catch (error) {
      console.error('Error saving profile field:', error);
      await ctx.reply('❌ Ma\'lumotni saqlashda xatolik yuz berdi.');
      delete ctx.session.editingField;
    }
  } else {
    return next();
  }
});

// Profile button handler
bot.hears('👤 Profil', async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Siz tizimga kirmagansiz. Iltimos, avval tizimga kiring.');
    return;
  }
  
  try {
    const user = await storage.getUser(ctx.session.userId);
    if (!user) {
      await ctx.reply('❌ Foydalanuvchi ma\'lumotlari topilmadi.');
      return;
    }
    
    let profileDetails = '';
    
    if (user.role === 'teacher') {
      const teacherProfile = await storage.getTeacherProfile(user.id);
      if (teacherProfile) {
        if (teacherProfile.phoneNumber) {
          profileDetails += `📞 Telefon: ${teacherProfile.phoneNumber}\n`;
        }
        if (teacherProfile.specialty) {
          profileDetails += `🔬 Mutaxassislik: ${teacherProfile.specialty}\n`;
        }
        if (teacherProfile.experience) {
          profileDetails += `⏱️ Tajriba: ${teacherProfile.experience} yil\n`;
        }
        if (teacherProfile.bio) {
          profileDetails += `📝 Haqida: ${teacherProfile.bio}\n`;
        }
        if (teacherProfile.centerId) {
          profileDetails += `🏢 O'quv markazi ID: ${teacherProfile.centerId}\n`;
        }
        
        if (!profileDetails) {
          profileDetails = `❗ Profil ma'lumotlari to'ldirilmagan.\n`;
        }
      } else {
        profileDetails = `❗ O'qituvchi profili yaratilmagan.\n`;
      }
    } else if (user.role === 'student') {
      const studentProfile = await storage.getStudentProfile(user.id);
      if (studentProfile) {
        profileDetails = '';
        if (studentProfile.phoneNumber) {
          profileDetails += `📞 Telefon: ${studentProfile.phoneNumber}\n`;
        }
        if (studentProfile.bio) {
          profileDetails += `📄 Haqida: ${studentProfile.bio}\n`;
        }
        if (studentProfile.parentId) {
          profileDetails += `👨‍👩‍👧‍👦 Ota-ona ID: ${studentProfile.parentId}\n`;
        }
        if (studentProfile.centerId) {
          profileDetails += `🏢 O'quv markazi ID: ${studentProfile.centerId}\n`;
        }
        if (!profileDetails) {
          profileDetails = `❗ Profil ma'lumotlari to'ldirilmagan.\n`;
        }
      } else {
        profileDetails = `❗ O'quvchi profili yaratilmagan.\n`;
      }
    }
    
    let keyboard;
    if (user.role === 'teacher') {
      keyboard = [
        ['✏️ Ismni o\'zgartirish', '📞 Telefon raqam'],
        ['🔬 Mutaxassislik', '⏱️ Tajriba'],
        ['📝 Haqida', '🔙 Orqaga']
      ];
    } else if (user.role === 'student') {
      keyboard = [
        ['✏️ Ismni o\'zgartirish', '📞 Telefon raqam'],
        ['📝 Haqida', '🔙 Orqaga']
      ];
    } else if (user.role === 'parent') {
      keyboard = [
        ['✏️ Ismni o\'zgartirish', '📞 Telefon raqam'],
        ['🔙 Orqaga']
      ];
    } else {
      keyboard = [['🔙 Orqaga']];
    }

    await ctx.reply(
      `👤 Profil ma'lumotlari\n\n` +
      `👤 Ism: ${user.fullName}\n` +
      `🔑 Foydalanuvchi nomi: ${user.username}\n` +
      `🧩 Rol: ${getRoleNameInUzbek(user.role)}\n` +
      `📅 Ro'yxatdan o'tgan sana: ${new Date(user.createdAt).toLocaleDateString('uz-UZ')}\n\n` +
      profileDetails,
      Markup.keyboard(keyboard).resize()
    );
  } catch (error) {
    console.error('Error fetching profile:', error);
    await ctx.reply('❌ Profil ma\'lumotlarini olishda xatolik yuz berdi.');
  }
});

// Logout command
bot.command('logout', async (ctx) => {
  ctx.session = {};
  await ctx.reply(
    '✅ Siz tizimdan muvaffaqiyatli chiqdingiz.\n\n' +
    'Iltimos, quyidagi amallardan birini tanlang:',
    Markup.keyboard([
      ['🔑 Kirish', '📝 Ro\'yxatdan o\'tish'],
      ['ℹ️ Ma\'lumot', '📊 Statistika']
    ]).resize()
  );
});

// Information command
bot.hears('ℹ️ Ma\'lumot', async (ctx) => {
  await ctx.reply(
    '*O\'zbek Ta\'lim platformasi haqida*\n\n' +
    'O\'zbek Ta\'lim - bu o\'qituvchilar, o\'quvchilar, ota-onalar va o\'quv markazlari uchun yaratilgan ko\'p foydalanuvchili ta\'lim platformasi. ' +
    'Platformamiz orqali siz quyidagi imkoniyatlarga ega bo\'lasiz:\n\n' +
    '👨‍🏫 *O\'qituvchilar uchun*:\n' +
    '• Darslar yaratish va boshqarish\n' +
    '• Turli xil testlar tayyorlash\n' +
    '• O\'quvchilar natijalarini kuzatish\n\n' +
    '👨‍🎓 *O\'quvchilar uchun*:\n' +
    '• Darslarni o\'rganish\n' +
    '• Testlarni yechish\n' +
    '• O\'z natijalarini kuzatish\n\n' +
    '👨‍👩‍👧‍👦 *Ota-onalar uchun*:\n' +
    '• Farzandlarining o\'quv jarayonini kuzatish\n' +
    '• O\'qituvchilar bilan aloqa\n\n' +
    '🏫 *O\'quv markazlari uchun*:\n' +
    '• O\'quv dasturlarini boshqarish\n' +
    '• O\'qituvchilar va o\'quvchilarni ro\'yxatga olish\n\n' +
    'Platformadan foydalanish uchun ro\'yxatdan o\'ting yoki tizimga kiring!',
    { parse_mode: 'Markdown' }
  );
});

// Statistics command
bot.hears('📊 Hisobotlar', async (ctx) => {
  try {
    const teacherCount = (await storage.getUsersByRole('teacher')).length;
    const studentCount = (await storage.getUsersByRole('student')).length;
    const parentCount = (await storage.getUsersByRole('parent')).length;
    const centerCount = (await storage.getUsersByRole('center')).length;
    
    await ctx.reply(
      '*📊 Platforma statistikasi*\n\n' +
      `👨‍🏫 O'qituvchilar: ${teacherCount} ta\n` +
      `👨‍🎓 O'quvchilar: ${studentCount} ta\n` +
      `👨‍👩‍👧‍👦 Ota-onalar: ${parentCount} ta\n` +
      `🏫 O'quv markazlari: ${centerCount} ta\n\n` +
      '📚 O\'rganishga tayyormisiz? Hoziroq platformamizga qo\'shiling!',
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error fetching statistics:', error);
    await ctx.reply('❌ Statistika ma\'lumotlarini olishda xatolik yuz berdi.');
  }
});

// Parent-specific button handlers
bot.hears('👶 Farzandlarim', async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Siz tizimga kirmagansiz. Iltimos, avval tizimga kiring.');
    return;
  }
  
  try {
    const user = await storage.getUser(ctx.session.userId);
    if (!user || user.role !== 'parent') {
      await ctx.reply('❌ Bu funksiya faqat ota-onalar uchun mavjud.');
      return;
    }
    
    const keyboard = [
      ['👶 Farzandlar ro\'yxati', '➕ Farzand qo\'shish'],
      ['🔙 Orqaga']
    ];
    
    await ctx.reply(
      '👶 *Farzandlarim bo\'limi*\n\n' +
      'Quyidagi amallardan birini tanlang:',
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard(keyboard).resize()
      }
    );
  } catch (error) {
    console.error('Error in farzandlarim menu:', error);
    await ctx.reply('❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
  }
});

bot.hears('👶 Farzandlar ro\'yxati', async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Siz tizimga kirmagansiz. Iltimos, avval tizimga kiring.');
    return;
  }
  
  try {
    const user = await storage.getUser(ctx.session.userId);
    if (!user || user.role !== 'parent') {
      await ctx.reply('❌ Bu funksiya faqat ota-onalar uchun mavjud.');
      return;
    }
    
    // Get children using storage method
    const children = await storage.getChildrenByParentId(user.id);
    
    if (!children || children.length === 0) {
      await ctx.reply(
        '👶 Hozircha sizning farzandlaringiz ro\'yxatga olinmagan.\n\n' +
        'Farzand qo\'shish uchun "➕ Farzand qo\'shish" tugmasini bosing.',
        Markup.keyboard([
          ['➕ Farzand qo\'shish'],
          ['🔙 Orqaga']
        ]).resize()
      );
      return;
    }
    
    let childrenInfo = '👶 *Farzandlarim ro\'yxati*\n\n';
    for (const child of children) {
      childrenInfo += `👤 *${child.fullName}*\n`;
      childrenInfo += `🔑 Username: ${child.username}\n`;
      if (child.phoneNumber) {
        childrenInfo += `📞 Telefon: ${child.phoneNumber}\n`;
      }
      if (child.bio) {
        childrenInfo += `📄 Haqida: ${child.bio}\n`;
      }
      childrenInfo += '\n';
    }
    
    await ctx.reply(childrenInfo, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error fetching children:', error);
    await ctx.reply('❌ Farzandlar ma\'lumotini olishda xatolik yuz berdi.');
  }
});

bot.hears('➕ Farzand qo\'shish', async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Siz tizimga kirmagansiz. Iltimos, avval tizimga kiring.');
    return;
  }
  
  try {
    const user = await storage.getUser(ctx.session.userId);
    if (!user || user.role !== 'parent') {
      await ctx.reply('❌ Bu funksiya faqat ota-onalar uchun mavjud.');
      return;
    }
    
    ctx.session.editingField = 'addChild';
    await ctx.reply(
      '➕ *Farzand qo\'shish*\n\n' +
      'Farzandingizning username (foydalanuvchi nomi) ni kiriting:\n\n' +
      '💡 *Eslatma:* Farzandingiz avval o\'quvchi sifatida ro\'yxatdan o\'tgan bo\'lishi kerak.',
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard([['🔙 Orqaga']]).resize()
      }
    );
  } catch (error) {
    console.error('Error in add child handler:', error);
    await ctx.reply('❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
  }
});

bot.hears('📊 Test natijalari', async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Siz tizimga kirmagansiz. Iltimos, avval tizimga kiring.');
    return;
  }
  
  try {
    const user = await storage.getUser(ctx.session.userId);
    if (!user || user.role !== 'parent') {
      await ctx.reply('❌ Bu funksiya faqat ota-onalar uchun mavjud.');
      return;
    }
    
    // Get children's test attempts
    const testResults = await db.select({
      studentName: schema.users.fullName,
      testTitle: schema.tests.title,
      score: schema.testAttempts.score,
      totalQuestions: schema.testAttempts.totalQuestions,
      endTime: schema.testAttempts.endTime,
      status: schema.testAttempts.status
    })
    .from(schema.testAttempts)
    .innerJoin(schema.users, eq(schema.testAttempts.studentId, schema.users.id))
    .innerJoin(schema.studentProfiles, eq(schema.users.id, schema.studentProfiles.userId))
    .innerJoin(schema.tests, eq(schema.testAttempts.testId, schema.tests.id))
    .where(eq(schema.studentProfiles.parentId, user.id))
    .orderBy(schema.testAttempts.endTime);
    
    if (!testResults || testResults.length === 0) {
      await ctx.reply('📊 Hozircha farzandlaringizning test natijalari mavjud emas.');
      return;
    }
    
    let resultsText = '📊 *Farzandlarning test natijalari*\n\n';
    for (const result of testResults.slice(0, 10)) {
      resultsText += `👤 *${result.studentName}*\n`;
      resultsText += `📝 Test: ${result.testTitle}\n`;
      if (result.score !== null && result.totalQuestions) {
        const scoreNum = Number(result.score);
        const percentage = Math.round((scoreNum / result.totalQuestions) * 100);
        resultsText += `💯 Natija: ${scoreNum}/${result.totalQuestions} (${percentage}%)\n`;
      }
      resultsText += `📅 Sana: ${result.endTime ? new Date(result.endTime).toLocaleDateString('uz-UZ') : 'Yakunlanmagan'}\n`;
      resultsText += `📊 Holat: ${getTestStatusInUzbek(result.status)}\n\n`;
    }
    
    if (testResults.length > 10) {
      resultsText += `... va yana ${testResults.length - 10} ta natija. To'liq ro'yxatni ko'rish uchun veb-saytdan foydalaning.`;
    }
    
    await ctx.reply(resultsText, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error fetching test results:', error);
    await ctx.reply('❌ Test natijalarini olishda xatolik yuz berdi.');
  }
});

bot.hears('📈 Hisobotlar', async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Siz tizimga kirmagansiz. Iltimos, avval tizimga kiring.');
    return;
  }
  
  try {
    const user = await storage.getUser(ctx.session.userId);
    if (!user || user.role !== 'parent') {
      await ctx.reply('❌ Bu funksiya faqat ota-onalar uchun mavjud.');
      return;
    }
    
    // Get children data for basic report
    const children = await db.select()
      .from(schema.studentProfiles)
      .where(eq(schema.studentProfiles.parentId, user.id));
    
    // Get all test attempts by children
    const allAttempts = await db.select({
      status: schema.testAttempts.status,
      score: schema.testAttempts.score,
      totalQuestions: schema.testAttempts.totalQuestions
    })
    .from(schema.testAttempts)
    .innerJoin(schema.studentProfiles, eq(schema.testAttempts.studentId, schema.studentProfiles.userId))
    .where(eq(schema.studentProfiles.parentId, user.id));
    
    const childrenCount = children.length;
    const totalAttempts = allAttempts.length;
    const completedAttempts = allAttempts.filter(a => a.status === 'completed').length;
    
    // Calculate average score for completed tests
    const completedTests = allAttempts.filter(a => a.status === 'completed' && a.score !== null && a.totalQuestions > 0);
    let avgScore = 0;
    if (completedTests.length > 0) {
      const totalPercentage = completedTests.reduce((sum, test) => {
        const scoreNum = Number(test.score);
        return sum + (scoreNum / test.totalQuestions) * 100;
      }, 0);
      avgScore = Math.round(totalPercentage / completedTests.length);
    }
    
    const reportText = '📈 *Umumiy hisobot*\n\n' +
      `👶 Farzandlar soni: ${childrenCount}\n` +
      `📝 Jami test urinishlari: ${totalAttempts}\n` +
      `✅ Tugallangan testlar: ${completedAttempts}\n` +
      `💯 O'rtacha ball: ${avgScore}%\n\n` +
      'Batafsil hisobot uchun veb-saytdan foydalaning.';
    
    await ctx.reply(reportText, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error generating report:', error);
    await ctx.reply('❌ Hisobot yaratishda xatolik yuz berdi.');
  }
});

// TEST CREATION HANDLERS

// Oddiy test yaratish
bot.hears('📝 Oddiy test', async (ctx) => {
  if (!ctx.session.userId || ctx.session.role !== 'teacher') {
    await ctx.reply('❌ Bu funksiya faqat o\'qituvchilar uchun.');
    return;
  }

  // Initialize test creation session
  ctx.session.testCreation = {
    step: 'type',
    answers: []
  };

  await ctx.reply(
    '📝 *Oddiy test yaratish*\n\n' +
    'Test turini tanlang:',
    {
      parse_mode: 'Markdown',
      ...Markup.keyboard([
        ['🌐 Ommaviy test', '🔢 Maxsus raqamli test'],
        ['🔙 Orqaga']
      ]).resize()
    }
  );
});

// Test turi tanlash
bot.hears(['🌐 Ommaviy test', '🔢 Maxsus raqamli test'], async (ctx) => {
  if (!ctx.session.testCreation || ctx.session.testCreation.step !== 'type') {
    return;
  }

  const messageText = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  ctx.session.testCreation.testType = messageText === '🌐 Ommaviy test' ? 'public' : 'private';
  ctx.session.testCreation.step = 'title';

  // Maxsus raqamli test uchun kod generatsiya qilish
  if (ctx.session.testCreation.testType === 'private') {
    ctx.session.testCreation.testCode = Math.floor(100000 + Math.random() * 900000).toString();
  }

  await ctx.reply(
    '📝 *Test nomi*\n\n' +
    'Test nomini kiriting:',
    {
      parse_mode: 'Markdown',
      ...Markup.keyboard([['🔙 Orqaga']]).resize()
    }
  );
});

// Javob kiritish usulini tanlash
bot.hears(['1️⃣ Bitta qatorda', '2️⃣ Har bir savolni alohida', '3️⃣ Tugmalar orqali'], async (ctx) => {
  if (!ctx.session.testCreation || ctx.session.testCreation.step !== 'inputMethod') {
    return;
  }

  const messageText = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  
  if (messageText === '1️⃣ Bitta qatorda') {
    await ctx.reply(
      '📝 *Javoblarni kiriting*\n\n' +
      `${ctx.session.testCreation.questionCount} ta savolning javoblarini ketma-ket kiriting:\n\n` +
      'Misol: 1a2b3c4d5a...\n' +
      'yoki: abcda...\n\n' +
      'Har bir javob A, B, C yoki D bo\'lishi kerak.',
      Markup.keyboard([['🔙 Orqaga']]).resize()
    );
  } else if (messageText === '2️⃣ Har bir savolni alohida') {
    ctx.session.testCreation.currentQuestionIndex = 0;
    await ctx.reply(
      `📝 *1-savol javobini kiriting*\n\n` +
      'A, B, C yoki D harflaridan birini kiriting:',
      Markup.keyboard([['A', 'B', 'C', 'D'], ['🔙 Orqaga']]).resize()
    );
  } else if (messageText === '3️⃣ Tugmalar orqali') {
    ctx.session.testCreation.currentQuestionIndex = 0;
    await showQuestionButtons(ctx);
  }
});

// Helper function to generate question buttons text
function generateQuestionButtonsText(ctx: BotContext): string {
  if (!ctx.session.testCreation || !ctx.session.testCreation.questionCount) return '';
  
  const totalQuestions = ctx.session.testCreation.questionCount;
  const answers = ctx.session.testCreation.answers || [];
  const currentBatch = Math.floor((ctx.session.testCreation.currentQuestionIndex || 0) / 10);
  const totalBatches = Math.ceil(totalQuestions / 10);
  
  const batchStart = currentBatch * 10;
  const batchEnd = Math.min(batchStart + 10, totalQuestions);
  const currentBatchAnswered = answers.slice(batchStart, batchEnd).filter(a => a).length;
  const currentBatchComplete = currentBatchAnswered === (batchEnd - batchStart);
  const totalAnswered = answers.filter(a => a).length;
  
  return `📝 *Test yaratish - Javoblarni belgilash*\n\n` +
    `📊 To'plam: ${currentBatch + 1}/${totalBatches}\n` +
    `📋 Savollar: ${batchStart + 1}-${batchEnd}\n` +
    `✅ Belgilangan: ${currentBatchAnswered}/${batchEnd - batchStart}\n` +
    `📈 Umumiy: ${totalAnswered}/${totalQuestions}\n\n` +
    `${!currentBatchComplete ? '⚠️ Keyingi to\'plamga o\'tish uchun joriy to\'plamdagi barcha javoblarni belgilang!' : ''}`;
}

// Helper function to generate question buttons keyboard
function generateQuestionButtonsKeyboard(ctx: BotContext): any[][] {
  if (!ctx.session.testCreation || !ctx.session.testCreation.questionCount) return [];
  
  const totalQuestions = ctx.session.testCreation.questionCount;
  const answers = ctx.session.testCreation.answers || [];
  const currentBatch = Math.floor((ctx.session.testCreation.currentQuestionIndex || 0) / 10);
  const totalBatches = Math.ceil(totalQuestions / 10);
  
  const batchStart = currentBatch * 10;
  const batchEnd = Math.min(batchStart + 10, totalQuestions);
  
  const keyboard: any[][] = [];
  
  // Create batch header
  keyboard.push([
    Markup.button.callback(`📊 To'plam ${currentBatch + 1}/${totalBatches} (${batchStart + 1}-${batchEnd})`, 'batch_info')
  ]);
  
  // Add questions with A, B, C, D buttons for current batch
  for (let i = batchStart; i < batchEnd; i++) {
    const questionNum = i + 1;
    
    // Question header
    keyboard.push([
      Markup.button.callback(`${questionNum}-savol`, `question_${i}`)
    ]);
    
    // Answer options row
    const answerRow: any[] = [];
    ['A', 'B', 'C', 'D'].forEach(option => {
      const isSelected = answers[i] === option;
      const buttonText = isSelected ? `${option} ✅` : option;
      answerRow.push(Markup.button.callback(buttonText, `creation_answer_${i}_${option}`));
    });
    keyboard.push(answerRow);
  }
  
  // Navigation buttons
  const navButtons: any[] = [];
  if (currentBatch > 0) {
    navButtons.push(Markup.button.callback('⬅️ Oldingi', `batch_prev_${currentBatch - 1}`));
  }
  
  // Check if current batch is complete
  const currentBatchAnswered = answers.slice(batchStart, batchEnd).filter(a => a).length;
  const currentBatchComplete = currentBatchAnswered === (batchEnd - batchStart);
  
  if (currentBatch < totalBatches - 1 && currentBatchComplete) {
    navButtons.push(Markup.button.callback('Keyingi ➡️', `batch_next_${currentBatch + 1}`));
  }
  
  if (navButtons.length > 0) {
    keyboard.push(navButtons);
  }
  
  // Submit button if all questions are answered
  const totalAnswered = answers.filter(a => a).length;
  if (totalAnswered === totalQuestions) {
    keyboard.push([Markup.button.callback('✅ Testni saqlash', 'save_test')]);
  }
  
  return keyboard;
}

// Tugmalar orqali javob kiritish
async function showQuestionButtons(ctx: BotContext) {
  if (!ctx.session.testCreation || !ctx.session.testCreation.questionCount) return;
  
  const text = generateQuestionButtonsText(ctx);
  const keyboard = generateQuestionButtonsKeyboard(ctx);
  
  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: keyboard
    }
  });
}

// Inline tugma bosilganda javobni saqlash (test creation)
bot.action(/creation_answer_(\d+)_([ABCD])/, async (ctx) => {
  if (!ctx.session.testCreation) return;
  
  const questionIndex = parseInt(ctx.match[1]);
  const answer = ctx.match[2];
  
  // Javobni saqlash
  if (!ctx.session.testCreation.answers) {
    ctx.session.testCreation.answers = [];
  }
  ctx.session.testCreation.answers[questionIndex] = answer;
  
  await ctx.answerCbQuery(`${questionIndex + 1}-savol: ${answer} tanlandi`);
  
  // Update the same message with new state
  try {
    const text = generateQuestionButtonsText(ctx);
    const keyboard = generateQuestionButtonsKeyboard(ctx);
    
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  } catch (error) {
    await showQuestionButtons(ctx);
  }
});

// Batch navigation handlers
bot.action(/batch_prev_(\d+)/, async (ctx) => {
  if (!ctx.session.testCreation) return;
  
  const batchIndex = parseInt(ctx.match[1]);
  ctx.session.testCreation.currentQuestionIndex = batchIndex * 10;
  
  await ctx.answerCbQuery('Oldingi to\'plam');
  
  try {
    const text = generateQuestionButtonsText(ctx);
    const keyboard = generateQuestionButtonsKeyboard(ctx);
    
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  } catch (error) {
    await showQuestionButtons(ctx);
  }
});

bot.action(/batch_next_(\d+)/, async (ctx) => {
  if (!ctx.session.testCreation) return;
  
  const batchIndex = parseInt(ctx.match[1]);
  const batchStart = batchIndex * 10;
  const answers = ctx.session.testCreation.answers || [];
  
  // Check if current batch is complete
  const currentBatch = Math.floor((ctx.session.testCreation.currentQuestionIndex || 0) / 10);
  const currentBatchStart = currentBatch * 10;
  const currentBatchEnd = Math.min(currentBatchStart + 10, ctx.session.testCreation.questionCount || 0);
  const currentBatchAnswered = answers.slice(currentBatchStart, currentBatchEnd).filter(a => a).length;
  const currentBatchComplete = currentBatchAnswered === (currentBatchEnd - currentBatchStart);
  
  if (!currentBatchComplete) {
    await ctx.answerCbQuery('Avval joriy to\'plamdagi barcha javoblarni belgilang!', { show_alert: true });
    return;
  }
  
  ctx.session.testCreation.currentQuestionIndex = batchStart;
  
  await ctx.answerCbQuery('Keyingi to\'plam');
  
  try {
    const text = generateQuestionButtonsText(ctx);
    const keyboard = generateQuestionButtonsKeyboard(ctx);
    
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  } catch (error) {
    await showQuestionButtons(ctx);
  }
});

// Save test handler
bot.action('save_test', async (ctx) => {
  if (!ctx.session.testCreation) return;
  
  await ctx.answerCbQuery('Test saqlanmoqda...');
  await saveTest(ctx);
});

// Testni saqlash funksiyasi
async function saveTest(ctx: BotContext) {
  if (!ctx.session.testCreation || !ctx.session.userId) return;
  
  try {
    const user = await storage.getUser(ctx.session.userId);
    if (!user) {
      await ctx.reply('❌ Foydalanuvchi ma\'lumotlari topilmadi.');
      return;
    }
    
    // Check if teacher profile exists, create if not
    let teacherProfile = await storage.getTeacherProfile(user.id);
    if (!teacherProfile) {
      teacherProfile = await storage.createTeacherProfile({
        userId: user.id,
        phoneNumber: undefined,
        specialty: undefined,
        subjects: [],
        bio: undefined,
        experience: undefined,
        certificates: [],
        centerId: undefined
      });
    }
    
    // Test ma'lumotlarini yaratish
    const testTitle = ctx.session.testCreation.testData?.title || `Oddiy test - ${new Date().toLocaleDateString('uz-UZ')}`;
    const testDescription = ctx.session.testCreation.testType === 'public' ? 'Ommaviy test' : `Maxsus test (Kod: ${ctx.session.testCreation.testCode})`;
    
    const testData = {
      title: testTitle,
      description: testDescription,
      teacherId: user.id, // Use user.id instead of teacherProfile.id
      type: 'simple' as const,
      status: 'active' as const,
      duration: 0, // Oddiy testda vaqt cheklanmagan
      totalQuestions: ctx.session.testCreation.questionCount || 0,
      grade: '10', // Default grade
      classroom: undefined
    };
    
    // Testni yaratish
    const newTest = await storage.createTest(testData);
    
    // Savollarni yaratish
    const answers = ctx.session.testCreation.answers || [];
    for (let i = 0; i < answers.length; i++) {
      const questionData = {
        testId: newTest.id,
        questionText: `${i + 1}-savol`,
        questionType: 'simple' as const,
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: answers[i],
        points: 1,
        order: i + 1
      };
      
      await storage.createQuestion(questionData);
    }
    
    // Muvaffaqiyatli xabar
    let successMessage = '✅ *Test muvaffaqiyatli yaratildi!*\n\n' +
      `📝 Test nomi: ${testData.title}\n` +
      `📊 Savollar soni: ${testData.totalQuestions}\n` +
      `⏰ Vaqt: Cheklanmagan\n` +
      `🌐 Turi: ${ctx.session.testCreation.testType === 'public' ? 'Ommaviy' : 'Maxsus raqamli'}\n`;
    
    if (ctx.session.testCreation.testCode) {
      successMessage += `🔢 Test kodi: *${ctx.session.testCreation.testCode}*\n\n`;
      successMessage += 'O\'quvchilar ushbu kod orqali testni topa olishadi.';
    }
    
    await ctx.reply(successMessage, { parse_mode: 'Markdown' });
    
    // Session tozalash
    ctx.session.testCreation = undefined;
    
    // Asosiy menyuga qaytish
    await ctx.reply(
      'Boshqa amal bajarish uchun menyudan tanlang:',
      Markup.keyboard(getKeyboardByRole(ctx.session.role || 'teacher')).resize()
    );
    
  } catch (error) {
    console.error('Error saving test:', error);
    await ctx.reply('❌ Testni saqlashda xatolik yuz berdi. Qaytadan urinib ko\'ring.');
  }
}

// Handle unexpected errors
bot.catch((err, ctx) => {
  console.error(`Bot error for ${ctx.updateType}`, err);
  ctx.reply('❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
});

// Helper functions
function getKeyboardByRole(role: string) {
  if (role === 'teacher') {
    return [
      ['👤 Profil', '📚 Darslik'],
      ['📝 Testlar', '📊 Hisobotlar'],
      ['⚡ Boshqalar']
    ];
  } else if (role === 'student') {
    return [
      ['👤 Profil', '📝 Test ishlash'],
      ['📚 Darsliklarim', '📊 Natijalarim'],
      ['⚡ Boshqalar']
    ];
  } else if (role === 'parent') {
    return [
      ['👤 Profil', '👶 Farzandlarim'],
      ['📊 Test natijalari', '📈 Hisobotlar'],
      ['⚡ Boshqalar']
    ];
  } else if (role === 'center') {
    return [
      ['👤 Profil', '👨‍🏫 O\'qituvchilar'],
      ['👥 O\'quvchilar', '📊 Davomat'],
      ['⚡ Boshqalar']
    ];
  }
  
  // Default keyboard
  return [
    ['👤 Profil', '📝 Test ishlash'],
    ['📚 Darsliklarim', '📊 Natijalarim'],
    ['⚡ Boshqalar']
  ];
}

function getRoleNameInUzbek(role: string): string {
  const roleMap: Record<string, string> = {
    'teacher': 'O\'qituvchi',
    'student': 'O\'quvchi',
    'parent': 'Ota-ona',
    'center': 'O\'quv markazi'
  };
  
  return roleMap[role] || role;
}

function getTestStatusInUzbek(status: string): string {
  const statusMap: Record<string, string> = {
    'draft': 'Qoralama',
    'active': 'Faol',
    'completed': 'Yakunlangan'
  };
  
  return statusMap[status] || status;
}

// Helper functions for student test interface
function generateStudentTestText(ctx: BotContext): string {
  if (!ctx.session.testAttempt || !ctx.session.testAttempt.questions) return '';
  
  const currentPage = ctx.session.testAttempt.currentPage || 0;
  const totalQuestions = ctx.session.testAttempt.totalQuestions || 0;
  const answers = ctx.session.testAttempt.answers || [];
  
  const questionsPerPage = 10;
  const startIndex = currentPage * questionsPerPage;
  const endIndex = Math.min(startIndex + questionsPerPage, totalQuestions);
  const totalPages = Math.ceil(totalQuestions / questionsPerPage);
  const answeredCount = answers.length;
  
  // Show question range like: 1-10, 11-20, 21-30, 31-34
  let rangeText = '';
  if (totalPages > 1) {
    rangeText = ` (${startIndex + 1}-${endIndex})`;
  }
  
  return `📊 *To'plam ${currentPage + 1}/${totalPages}${rangeText}*\n\n` +
    `Javob berilgan: ${answeredCount}/${totalQuestions}\n\n` +
    `Har bir savol uchun A, B, C, D tugmalaridan birini tanlang:`;
}

function generateStudentTestKeyboard(ctx: BotContext): any[][] {
  if (!ctx.session.testAttempt || !ctx.session.testAttempt.questions) return [];
  
  const currentPage = ctx.session.testAttempt.currentPage || 0;
  const totalQuestions = ctx.session.testAttempt.totalQuestions || 0;
  const questions = ctx.session.testAttempt.questions;
  const answers = ctx.session.testAttempt.answers || [];
  
  const questionsPerPage = 10; // 10 questions per page as requested
  const startIndex = currentPage * questionsPerPage;
  const endIndex = Math.min(startIndex + questionsPerPage, totalQuestions);
  const totalPages = Math.ceil(totalQuestions / questionsPerPage);
  
  const keyboard: any[][] = [];
  
  // Show each question with its A, B, C, D buttons below
  for (let i = startIndex; i < endIndex; i++) {
    const questionNum = i + 1;
    const question = questions[i];
    const userAnswer = answers.find(a => a.questionId === question.id)?.answer;
    
    // Question header (non-clickable, just for display)
    keyboard.push([
      Markup.button.callback(`${questionNum}-savol`, `question_info_${question.id}`)
    ]);
    
    // A, B, C, D buttons for this specific question
    const answerRow: any[] = [];
    ['A', 'B', 'C', 'D'].forEach(option => {
      const isSelected = userAnswer === option;
      const buttonText = isSelected ? `${option} ✅` : option;
      answerRow.push(Markup.button.callback(buttonText, `test_answer_${question.id}_${option}`));
    });
    keyboard.push(answerRow);
  }
  
  // Add navigation buttons only if needed
  const navButtons: any[] = [];
  if (totalPages > 1) {
    if (currentPage > 0) {
      navButtons.push(Markup.button.callback('⬅️ Oldingi', `test_prev_page_${currentPage - 1}`));
    }
    if (currentPage < totalPages - 1) {
      navButtons.push(Markup.button.callback('Keyingi ➡️', `test_next_page_${currentPage + 1}`));
    }
    if (navButtons.length > 0) {
      keyboard.push(navButtons);
    }
  }
  
  // Add submit button if all questions are answered
  const answeredCount = answers.length;
  if (answeredCount >= totalQuestions) {
    keyboard.push([Markup.button.callback('✅ Testni yakunlash', `test_submit_${ctx.session.testAttempt.attemptId}`)]);
  }
  
  return keyboard;
}

// Show test questions page with inline keyboard
async function showTestQuestionsPage(ctx: BotContext) {
  if (!ctx.session.testAttempt || !ctx.session.testAttempt.questions) return;
  
  const text = generateStudentTestText(ctx);
  const keyboard = generateStudentTestKeyboard(ctx);
  
  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: keyboard
    }
  });
}

// Check and send pending notifications to user
async function checkAndSendNotifications(ctx: BotContext) {
  if (!ctx.session.userId) return;
  
  const notifications = botNotificationService.getNotifications(ctx.session.userId);
  
  if (notifications.length > 0) {
    // Group notifications by type
    const testNotifications = notifications.filter(n => n.type === 'test_created');
    const lessonNotifications = notifications.filter(n => n.type === 'lesson_updated');
    const profileNotifications = notifications.filter(n => n.type === 'profile_updated');
    const scheduleNotifications = notifications.filter(n => n.type === 'schedule_changed');
    
    // Send notifications
    if (testNotifications.length > 0) {
      await ctx.reply(
        `🔔 *Yangi bildirishnomalar*\n\n` +
        `📝 ${testNotifications.length} ta yangi test yaratildi!\n` +
        testNotifications.map(n => `• ${n.message.replace('📝 Yangi test yaratildi: ', '')}`).join('\n'),
        { parse_mode: 'Markdown' }
      );
    }
    
    if (lessonNotifications.length > 0) {
      await ctx.reply(
        `📚 ${lessonNotifications.length} ta dars yangilandi!\n` +
        lessonNotifications.map(n => `• ${n.message.replace('📚 Dars yangilandi: ', '')}`).join('\n'),
        { parse_mode: 'Markdown' }
      );
    }
    
    if (scheduleNotifications.length > 0) {
      await ctx.reply(
        `📅 Dars jadvali o'zgartirildi!\n` +
        `${scheduleNotifications.length} ta yangilanish`,
        { parse_mode: 'Markdown' }
      );
    }
    
    if (profileNotifications.length > 0) {
      await ctx.reply('👤 Profilingiz yangilandi!');
    }
    
    // Clear notifications after sending
    botNotificationService.clearNotifications(ctx.session.userId);
  }
}

// Role-specific menu handlers

// TEACHER MENU HANDLERS (removed old numbered profile handler)

bot.hears('2️⃣ Darslik', async (ctx) => {
  if (!ctx.session.userId || ctx.session.role !== 'teacher') {
    await ctx.reply('❌ Bu funksiya faqat o\'qituvchilar uchun.');
    return;
  }
  
  await ctx.reply(
    '📚 *Darslik bo\'limi*\n\nQuyidagi amallardan birini tanlang:',
    {
      parse_mode: 'Markdown',
      ...Markup.keyboard([
        ['💻 Online darslik yaratish', '📖 Offline darslik yaratish'],
        ['📋 Mavjud darsliklar'],
        ['🔙 Orqaga']
      ]).resize()
    }
  );
});

bot.hears('3️⃣ Testlar', async (ctx) => {
  if (!ctx.session.userId || ctx.session.role !== 'teacher') {
    await ctx.reply('❌ Bu funksiya faqat o\'qituvchilar uchun.');
    return;
  }
  
  await ctx.reply(
    '📝 *Testlar bo\'limi*\n\nQuyidagi test turlaridan birini tanlang:',
    {
      parse_mode: 'Markdown',
      ...Markup.keyboard([
        ['📝 Oddiy test', '🔓 Ochiq test'],
        ['🎯 DTM test', '🏆 Sertifikat test'],
        ['⏰ Intizomli test'],
        ['🔙 Orqaga']
      ]).resize()
    }
  );
});

bot.hears('4️⃣ Boshqa', async (ctx) => {
  if (!ctx.session.userId || ctx.session.role !== 'teacher') {
    await ctx.reply('❌ Bu funksiya faqat o\'qituvchilar uchun.');
    return;
  }
  
  await ctx.reply(
    '🔧 *Boshqa funksiyalar*\n\nQuyidagi amallardan birini tanlang:',
    {
      parse_mode: 'Markdown',
      ...Markup.keyboard([
        ['👥 O\'quvchilari', '🔐 Login parol'],
        ['🗑️ Hisobi o\'chirish'],
        ['🔙 Orqaga']
      ]).resize()
    }
  );
});

// STUDENT MENU HANDLERS (removed old numbered profile handler)

bot.hears('2️⃣ Test ishlash', async (ctx) => {
  if (!ctx.session.userId || ctx.session.role !== 'student') {
    await ctx.reply('❌ Bu funksiya faqat o\'quvchilar uchun.');
    return;
  }
  
  await ctx.reply(
    '📝 *Test ishlash*\n\nQuyidagi amallardan birini tanlang:',
    {
      parse_mode: 'Markdown',
      ...Markup.keyboard([
        ['🔢 Maxsus raqam orqali', '🌐 Ommaviy testlar'],
        ['🔙 Orqaga']
      ]).resize()
    }
  );
});

bot.hears('3️⃣ Darsliklarim', async (ctx) => {
  if (!ctx.session.userId || ctx.session.role !== 'student') {
    await ctx.reply('❌ Bu funksiya faqat o\'quvchilar uchun.');
    return;
  }
  
  await ctx.reply(
    '📚 *Darsliklarim*\n\nQuyidagi amallardan birini tanlang:',
    {
      parse_mode: 'Markdown',
      ...Markup.keyboard([
        ['📖 Mavjud darsliklar', '📊 Statistika'],
        ['🔙 Orqaga']
      ]).resize()
    }
  );
});

bot.hears('4️⃣ Boshqa', async (ctx) => {
  if (!ctx.session.userId || ctx.session.role !== 'student') {
    await ctx.reply('❌ Bu funksiya faqat o\'quvchilar uchun.');
    return;
  }
  
  await ctx.reply(
    '🔧 *Boshqa funksiyalar*\n\nQuyidagi amallardan birini tanlang:',
    {
      parse_mode: 'Markdown',
      ...Markup.keyboard([
        ['📨 O\'qituvchiga murojaat', '🔍 O\'qituvchi qidirish'],
        ['📚 Darslik qidirish', '🏫 O\'quv Markaz qidirish'],
        ['🏆 Raqobat'],
        ['🔙 Orqaga']
      ]).resize()
    }
  );
});

// PARENT MENU HANDLERS
bot.hears('1️⃣ Farzand qidiruv', async (ctx) => {
  if (!ctx.session.userId || ctx.session.role !== 'parent') {
    await ctx.reply('❌ Bu funksiya faqat ota-onalar uchun.');
    return;
  }
  
  await ctx.reply('👨‍👩‍👧‍👦 Farzand qidiruv funksiyasi hozircha ishlab chiqilmoqda...');
});

bot.hears('2️⃣ Statistika', async (ctx) => {
  if (!ctx.session.userId || ctx.session.role !== 'parent') {
    await ctx.reply('❌ Bu funksiya faqat ota-onalar uchun.');
    return;
  }
  
  await ctx.reply('📊 Statistika funksiyasi hozircha ishlab chiqilmoqda...');
});

bot.hears('3️⃣ To\'lovlar', async (ctx) => {
  if (!ctx.session.userId || ctx.session.role !== 'parent') {
    await ctx.reply('❌ Bu funksiya faqat ota-onalar uchun.');
    return;
  }
  
  await ctx.reply('💳 To\'lovlar funksiyasi hozircha ishlab chiqilmoqda...');
});

bot.hears('📝 Testlar', async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Tizimga kirmagansiz.');
    return;
  }
  
  if (ctx.session.role === 'teacher') {
    await ctx.reply(
      '📝 *Testlar bo\'limi*\n\nQuyidagi test turlaridan birini tanlang:',
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard([
          ['📝 Oddiy test', '🔓 Ochiq test'],
          ['🎯 DTM test', '🏆 Sertifikat test'],
          ['⏰ Intizomli test', '📋 Mavjud testlar'],
          ['🔙 Orqaga']
        ]).resize()
      }
    );
  } else if (ctx.session.role === 'student') {
    await ctx.reply(
      '📝 *Test ishlash*\n\nQuyidagi amallardan birini tanlang:',
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard([
          ['🔢 Maxsus raqam orqali', '🌐 Ommaviy testlar'],
          ['📊 Test natijalari'],
          ['🔙 Orqaga']
        ]).resize()
      }
    );
  }
});

bot.hears('👥 O\'quvchilarim', async (ctx) => {
  if (!ctx.session.userId || ctx.session.role !== 'teacher') {
    await ctx.reply('❌ Bu funksiya faqat o\'qituvchilar uchun.');
    return;
  }
  
  await ctx.reply(
    '👥 *O\'quvchilar bo\'limi*\n\nQuyidagi amallardan birini tanlang:',
    {
      parse_mode: 'Markdown',
      ...Markup.keyboard([
        ['👤 O\'quvchi qo\'shish', '📋 Barcha o\'quvchilar'],
        ['📊 O\'quvchi statistikasi', '🔐 Login/Parol berish'],
        ['🔙 Orqaga']
      ]).resize()
    }
  );
});

// Student menu handlers
bot.hears('📚 Darsliklarim', async (ctx) => {
  if (!ctx.session.userId || ctx.session.role !== 'student') {
    await ctx.reply('❌ Bu funksiya faqat o\'quvchilar uchun.');
    return;
  }
  
  await ctx.reply(
    '📚 *Darsliklarim*\n\nQuyidagi amallardan birini tanlang:',
    {
      parse_mode: 'Markdown',
      ...Markup.keyboard([
        ['📖 Mavjud darsliklar', '📊 O\'rganish statistikasi'],
        ['🔍 Darslik qidirish', '⭐ Sevimli darsliklar'],
        ['🔙 Orqaga']
      ]).resize()
    }
  );
});

bot.hears('📝 Test ishlash', async (ctx) => {
  if (!ctx.session.userId || ctx.session.role !== 'student') {
    await ctx.reply('❌ Bu funksiya faqat o\'quvchilar uchun.');
    return;
  }
  
  await ctx.reply(
    '📝 *Test ishlash*\n\nQuyidagi amallardan birini tanlang:',
    {
      parse_mode: 'Markdown',
      ...Markup.keyboard([
        ['🔢 Maxsus raqam orqali', '🌐 Ommaviy testlar'],
        ['🔙 Orqaga']
      ]).resize()
    }
  );
});

// Maxsus raqam orqali test topish
bot.hears('🔢 Maxsus raqam orqali', async (ctx) => {
  if (!ctx.session.userId || ctx.session.role !== 'student') {
    await ctx.reply('❌ Bu funksiya faqat o\'quvchilar uchun.');
    return;
  }
  
  await ctx.reply(
    '🔢 *Maxsus test kodi*\n\n' +
    '6 raqamli test kodini kiriting:\n' +
    'Masalan: 123456',
    {
      parse_mode: 'Markdown',
      ...Markup.keyboard([['🔙 Orqaga']]).resize()
    }
  );
  
  ctx.session.editingField = 'testCode';
});

// Ommaviy testlar
bot.hears('🌐 Ommaviy testlar', async (ctx) => {
  if (!ctx.session.userId || ctx.session.role !== 'student') {
    await ctx.reply('❌ Bu funksiya faqat o\'quvchilar uchun.');
    return;
  }
  
  try {
    // Get all public tests (active status)
    const tests = await storage.getTestsByGradeAndClassroom('10'); // Default grade for now
    // Filter only active tests for public view
    const publicTests = tests.filter(test => test.status === 'active');
    
    if (!publicTests || publicTests.length === 0) {
      await ctx.reply('ℹ️ Hozircha ommaviy testlar mavjud emas.');
      return;
    }
    
    // Create inline keyboard for public tests (max 10)
    const testButtons = await Promise.all(publicTests.slice(0, 10).map(async test => {
      return [Markup.button.callback(`📝 ${test.title} (${test.totalQuestions} savol)`, `start_test_${test.id}`)];
    }));
    
    await ctx.reply(
      '🌐 *Ommaviy testlar*\n\n' +
      'Quyidagi testlardan birini tanlang:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(testButtons)
      }
    );
    
    if (publicTests.length > 10) {
      await ctx.reply(`... va yana ${publicTests.length - 10} ta testlar.`);
    }
  } catch (error) {
    console.error('Error fetching public tests:', error);
    await ctx.reply('❌ Ommaviy testlarni olishda xatolik yuz berdi.');
  }
});

// O'qituvchilar uchun mavjud testlar (REMOVED - this handler is now disabled)
// This button has been removed from the teacher test menu as requested

bot.hears('🔍 Qidiruv', async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Tizimga kirmagansiz.');
    return;
  }
  
  if (ctx.session.role === 'student') {
    await ctx.reply(
      '🔍 *Qidiruv*\n\nNimani qidiryapsiz?',
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard([
          ['👨‍🏫 O\'qituvchi qidirish', '📚 Darslik qidirish'],
          ['🏫 O\'quv markaz qidirish', '👥 Guruh qidirish'],
          ['🔙 Orqaga']
        ]).resize()
      }
    );
  } else if (ctx.session.role === 'parent') {
    await ctx.reply(
      '🔍 *Qidiruv*\n\nNimani qidiryapsiz?',
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard([
          ['👨‍👩‍👧‍👦 Farzand qidirish', '👨‍🏫 O\'qituvchi qidirish'],
          ['🏫 O\'quv markaz qidirish', '🔙 Orqaga']
        ]).resize()
      }
    );
  }
});

// Parent menu handlers
bot.hears('👨‍👩‍👧‍👦 Farzandlarim', async (ctx) => {
  if (!ctx.session.userId || ctx.session.role !== 'parent') {
    await ctx.reply('❌ Bu funksiya faqat ota-onalar uchun.');
    return;
  }
  
  await ctx.reply(
    '👨‍👩‍👧‍👦 *Farzandlarim*\n\nQuyidagi amallardan birini tanlang:',
    {
      parse_mode: 'Markdown',
      ...Markup.keyboard([
        ['👤 Farzand qo\'shish', '📋 Farzandlar ro\'yxati'],
        ['📊 Farzand statistikasi', '📝 O\'qituvchiga xabar'],
        ['🔙 Orqaga']
      ]).resize()
    }
  );
});

bot.hears('💳 To\'lovlar', async (ctx) => {
  if (!ctx.session.userId || ctx.session.role !== 'parent') {
    await ctx.reply('❌ Bu funksiya faqat ota-onalar uchun.');
    return;
  }
  
  await ctx.reply(
    '💳 *To\'lovlar*\n\nQuyidagi amallardan birini tanlang:',
    {
      parse_mode: 'Markdown',
      ...Markup.keyboard([
        ['💰 To\'lov qilish', '📋 To\'lov tarixi'],
        ['📊 To\'lov statistikasi', '🔔 To\'lov eslatmalari'],
        ['🔙 Orqaga']
      ]).resize()
    }
  );
});

// Common menu handlers
bot.hears('⚙️ Sozlamalar', async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Tizimga kirmagansiz.');
    return;
  }
  
  let settingsMenu = [
    ['🔐 Parolni o\'zgartirish', '👤 Profil tahrirlash'],
    ['🔔 Bildirishnomalar', '🌐 Til sozlamalari']
  ];
  
  if (ctx.session.role === 'teacher' || ctx.session.role === 'student') {
    settingsMenu.push(['🗑️ Hisobni o\'chirish', '🔙 Orqaga']);
  } else {
    settingsMenu.push(['🔙 Orqaga']);
  }
  
  await ctx.reply(
    '⚙️ *Sozlamalar*\n\nQuyidagi amallardan birini tanlang:',
    {
      parse_mode: 'Markdown',
      ...Markup.keyboard(settingsMenu).resize()
    }
  );
});



// Back to main menu handler
bot.hears('🔙 Orqaga', async (ctx) => {
  if (!ctx.session.userId) {
    // Not logged in, go to main menu
    ctx.session.loginStep = undefined;
    ctx.session.registrationStep = undefined;
    ctx.session.registrationData = undefined;
    ctx.session.tempLoginData = undefined;
    
    await ctx.reply(
      'Bosh menyuga qaytdingiz.\n\nQuyidagi amallardan birini tanlang:',
      Markup.keyboard([
        ['🔑 Kirish', '📝 Ro\'yxatdan o\'tish'],
        ['ℹ️ Ma\'lumot', '📊 Statistika']
      ]).resize()
    );
  } else {
    // Logged in, go to role dashboard
    await ctx.reply(
      `Dashboard'ga qaytdingiz.\n\nQuyidagi funksiyalardan foydalaning:`,
      Markup.keyboard(getKeyboardByRole(ctx.session.role!)).resize()
    );
  }
});

// ⚡ Boshqalar handler
bot.hears('⚡ Boshqalar', async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Siz tizimga kirmagansiz.');
    return;
  }
  
  await ctx.reply(
    '⚡ Boshqa funksiyalar',
    Markup.keyboard([
      ['🔔 Bildirishnomalar', '🌐 Veb-sayt'],
      ['ℹ️ Yordam', '📞 Aloqa'],
      ['🚪 Hisobdan chiqish'],
      ['🔙 Orqaga']
    ]).resize()
  );
});

// Callback handlers for test interactions
bot.action(/start_test_(\d+)/, async (ctx) => {
  if (!ctx.session.userId || ctx.session.role !== 'student') {
    await ctx.reply('❌ Bu funksiya faqat o\'quvchilar uchun.');
    return;
  }
  
  const testId = parseInt(ctx.match[1]);
  
  try {
    const test = await storage.getTestById(testId);
    if (!test) {
      await ctx.reply('❌ Test topilmadi.');
      return;
    }
    
    // Create test attempt
    const attempt = await storage.createTestAttempt({
      testId: test.id,
      studentId: ctx.session.userId,
      totalQuestions: test.totalQuestions,
      status: 'in_progress'
    });
    
    // Get test questions
    const questions = await storage.getQuestionsByTestId(test.id);
    if (!questions || questions.length === 0) {
      await ctx.reply('❌ Bu testda savollar mavjud emas.');
      return;
    }
    
    // Load existing answers if any
    const existingAnswers = await storage.getStudentAnswersByAttemptId(attempt.id);
    const sessionAnswers = existingAnswers.map(answer => ({
      questionId: answer.questionId,
      answer: answer.answer as string
    }));

    // Initialize test session
    ctx.session.testAttempt = {
      testId: test.id,
      attemptId: attempt.id,
      currentPage: 0,
      totalQuestions: test.totalQuestions,
      answers: sessionAnswers,
      questions: questions
    };
    
    // Show test image if available, just like in test creation
    if (test.testImage) {
      try {
        await ctx.replyWithPhoto(test.testImage, {
          caption: `📝 *${test.title}*\n\n` +
            `✅ Test boshlandi!\n` +
            `📊 Jami savollar: ${test.totalQuestions}\n` +
            `⏰ Vaqt: Cheklanmagan\n\n` +
            'Har bir savol uchun A, B, C, D tugmalaridan birini bosing. Javobni almashtirish uchun qaytadan tugmani bosishingiz mumkin.',
          parse_mode: 'Markdown'
        });
      } catch (error) {
        // If image fails, show text only
        await ctx.reply(
          `📝 *${test.title}*\n\n` +
          `✅ Test boshlandi!\n` +
          `📊 Jami savollar: ${test.totalQuestions}\n` +
          `⏰ Vaqt: Cheklanmagan\n\n` +
          'Har bir savol uchun A, B, C, D tugmalaridan birini bosing. Javobni almashtirish uchun qaytadan tugmani bosishingiz mumkin.',
          { parse_mode: 'Markdown' }
        );
      }
    } else {
      await ctx.reply(
        `📝 *${test.title}*\n\n` +
        `✅ Test boshlandi!\n` +
        `📊 Jami savollar: ${test.totalQuestions}\n` +
        `⏰ Vaqt: Cheklanmagan\n\n` +
        'Har bir savol uchun A, B, C, D tugmalaridan birini bosing. Javobni almashtirish uchun qaytadan tugmani bosishingiz mumkin.',
        { parse_mode: 'Markdown' }
      );
    }
    
    // Show first page of questions
    await showTestQuestionsPage(ctx);
  } catch (error) {
    console.error('Error starting test:', error);
    await ctx.reply('❌ Testni boshlashda xatolik yuz berdi.');
  }
});

bot.action(/teacher_test_(\d+)/, async (ctx) => {
  if (!ctx.session.userId || ctx.session.role !== 'teacher') {
    await ctx.reply('❌ Bu funksiya faqat o\'qituvchilar uchun.');
    return;
  }
  
  const testId = parseInt(ctx.match[1]);
  
  try {
    const test = await storage.getTestById(testId);
    if (!test) {
      await ctx.reply('❌ Test topilmadi.');
      return;
    }
    
    const statusEmoji = test.status === 'active' ? '✅' : test.status === 'draft' ? '📝' : '🔚';
    
    await ctx.reply(
      `📝 *${test.title}*\n\n` +
      `${statusEmoji} *Holati*: ${getTestStatusInUzbek(test.status)}\n` +
      `📊 *Savollar soni*: ${test.totalQuestions}\n` +
      `🎓 *Sinf*: ${test.grade}\n` +
      `📅 *Yaratilgan*: ${new Date(test.createdAt).toLocaleDateString('uz-UZ')}\n` +
      `📝 *Tavsif*: ${test.description || 'Tavsif yo\'q'}`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('📊 Test statistikasi', `test_stats_${test.id}`)],
          [Markup.button.callback('🔙 Orqaga', 'back_to_menu')]
        ])
      }
    );
  } catch (error) {
    console.error('Error viewing teacher test:', error);
    await ctx.reply('❌ Test ma\'lumotlarini olishda xatolik yuz berdi.');
  }
});

// Optimized answer selection handler
bot.action(/test_answer_(\d+)_([ABCD])/, async (ctx) => {
  if (!ctx.session.testAttempt || !ctx.session.userId) {
    await ctx.answerCbQuery('❌ Test sessiyasi topilmadi');
    return;
  }
  
  const questionId = parseInt(ctx.match[1]);
  const answer = ctx.match[2];
  
  // Update answer in session
  if (!ctx.session.testAttempt.answers) {
    ctx.session.testAttempt.answers = [];
  }
  
  // Remove existing answer for this question and add new one
  ctx.session.testAttempt.answers = ctx.session.testAttempt.answers.filter(a => a.questionId !== questionId);
  ctx.session.testAttempt.answers.push({ questionId, answer });
  
  // Save to database in background
  storage.createStudentAnswer({
    attemptId: ctx.session.testAttempt.attemptId!,
    questionId: questionId,
    answer: answer
  }).catch(error => console.error('Database save error:', error));
  
  await ctx.answerCbQuery(`✅ ${answer} javobni tanladingiz`);
  
  // Update interface with checkmark
  const text = generateStudentTestText(ctx);
  const keyboard = generateStudentTestKeyboard(ctx);
  
  try {
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  } catch (error) {
    // Send new message if edit fails
    await showTestQuestionsPage(ctx);
  }
});

// Handle test page navigation
bot.action(/test_prev_page_(\d+)/, async (ctx) => {
  if (!ctx.session.testAttempt) {
    await ctx.answerCbQuery('❌ Test sessiyasi topilmadi');
    return;
  }
  
  const page = parseInt(ctx.match[1]);
  ctx.session.testAttempt.currentPage = page;
  
  await ctx.answerCbQuery();
  await showTestQuestionsPage(ctx);
});

bot.action(/test_next_page_(\d+)/, async (ctx) => {
  if (!ctx.session.testAttempt) {
    await ctx.answerCbQuery('❌ Test sessiyasi topilmadi');
    return;
  }
  
  const page = parseInt(ctx.match[1]);
  ctx.session.testAttempt.currentPage = page;
  
  await ctx.answerCbQuery();
  await showTestQuestionsPage(ctx);
});

// Handle test submission
bot.action(/test_submit_(\d+)/, async (ctx) => {
  if (!ctx.session.testAttempt || !ctx.session.userId) {
    await ctx.answerCbQuery('❌ Test sessiyasi topilmadi');
    return;
  }
  
  const attemptId = parseInt(ctx.match[1]);
  
  try {
    // Calculate score
    const answers = ctx.session.testAttempt.answers || [];
    const questions = ctx.session.testAttempt.questions || [];
    let score = 0;
    
    for (const answer of answers) {
      const question = questions.find(q => q.id === answer.questionId);
      if (question && question.correctAnswer === answer.answer) {
        score++;
      }
    }
    
    // Update test attempt
    await storage.updateTestAttempt(attemptId, {
      score: score,
      status: 'completed',
      endTime: new Date()
    });
    
    const percentage = Math.round((score / (ctx.session.testAttempt.totalQuestions || 1)) * 100);
    
    // Send notification to parent if exists
    await notifyParentOfTestCompletion(ctx.session.userId, ctx.session.testAttempt.testId!, score, ctx.session.testAttempt.totalQuestions || 0, percentage);
    
    await ctx.reply(
      `🎉 *Test yakunlandi!*\n\n` +
      `✅ To'g'ri javoblar: ${score}/${ctx.session.testAttempt.totalQuestions}\n` +
      `📊 Natija: ${percentage}%\n\n` +
      'Tabriklaymiz!',
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard(getKeyboardByRole(ctx.session.role || 'student')).resize()
      }
    );
    
    // Clear test session
    ctx.session.testAttempt = undefined;
    
    await ctx.answerCbQuery('✅ Test yakunlandi');
    
  } catch (error) {
    console.error('Error submitting test:', error);
    await ctx.answerCbQuery('❌ Testni yakunlashda xatolik');
  }
});

bot.action('back_to_menu', async (ctx) => {
  const keyboard = getKeyboardByRole(ctx.session.role || 'student');
  await ctx.reply(
    '🏠 Bosh menyu',
    Markup.keyboard(keyboard).resize()
  );
});

// 👤 Profil handler for non-teacher roles
bot.hears('👤 Profil', async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Siz tizimga kirmagansiz.');
    return;
  }

  try {
    const user = await storage.getUser(ctx.session.userId);
    if (!user) {
      await ctx.reply('❌ Foydalanuvchi ma\'lumotlari topilmadi.');
      return;
    }

    let profileInfo = '';
    
    if (user.role === 'student') {
      const studentProfile = await storage.getStudentProfile(user.id);
      profileInfo = `👨‍🎓 *O'quvchi profili*\n\n` +
                   `👤 Ism-familya: ${user.fullName}\n` +
                   `📧 Email: ${user.email}\n` +
                   `👤 Foydalanuvchi nomi: ${user.username}\n`;
      if (studentProfile) {
        profileInfo += `📞 Telefon: ${studentProfile.phoneNumber || 'Kiritilmagan'}\n` +
                      `📄 Haqida: ${studentProfile.bio || 'Kiritilmagan'}\n`;
      }
      profileInfo += `\nProfil ma'lumotlarini o'zgartirish uchun /student_edit buyrug'idan foydalaning.`;
      
    } else if (user.role === 'parent') {
      profileInfo = `👨‍👩‍👧‍👦 *Ota-ona profili*\n\n` +
                   `👤 Ism-familya: ${user.fullName}\n` +
                   `📧 Email: ${user.email}\n` +
                   `👤 Foydalanuvchi nomi: ${user.username}\n\n` +
                   `Profil ma'lumotlarini o'zgartirish uchun /parent_edit buyrug'idan foydalaning.`;
    } else if (user.role === 'center') {
      profileInfo = `🏫 *O'quv markaz profili*\n\n` +
                   `👤 Nomi: ${user.fullName}\n` +
                   `📧 Email: ${user.email}\n` +
                   `👤 Foydalanuvchi nomi: ${user.username}\n\n` +
                   `Profil ma'lumotlarini o'zgartirish uchun veb-saytdan foydalaning.`;
    } else {
      await ctx.reply('❌ Bu funksiya sizning rolingiz uchun mavjud emas.');
      return;
    }

    await ctx.reply(
      profileInfo,
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard([
          ['🌐 Veb-saytga o\'tish'],
          ['🔙 Orqaga']
        ]).resize()
      }
    );
  } catch (error) {
    console.error('Error fetching profile:', error);
    await ctx.reply('❌ Profil ma\'lumotlarini olishda xatolik yuz berdi.');
  }
});

// Additional menu handlers for each role
bot.hears(['📚 Darslik', '📝 Testlar', '📊 Statistika'], async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Avval tizimga kiring.');
    return;
  }
  
  const action = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  
  if (action === '👤 Profil') {
    // Trigger profile command
    await ctx.reply('👤 Profil ma\'lumotlari yuklanmoqda...');
    // Reuse profile command logic
    return;
  }
  
  await ctx.reply(`${action} bo'limi hozircha ishlab chiqilmoqda. Tez orada faollashtiraman! 🚀`);
});

bot.hears(['📝 Test ishlash', '📚 Darsliklarim', '📊 Natijalarim'], async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Avval tizimga kiring.');
    return;
  }
  
  const action = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  await ctx.reply(`${action} bo'limi tez orada faollashtiraman! Veb-saytdan foydalanib ko'ring. 🌐`);
});

bot.hears(['👶 Farzandim', '💳 To\'lovlar'], async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Avval tizimga kiring.');
    return;
  }
  
  const action = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  await ctx.reply(`${action} bo'limi ishlab chiqilmoqda. Veb-saytdan to'liq funksiyalardan foydalaning! 👨‍👩‍👧‍👦`);
});

bot.hears(['👨‍🏫 O\'qituvchilar', '👨‍🎓 O\'quvchilar', '📊 Hisobotlar'], async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Avval tizimga kiring.');
    return;
  }
  
  const action = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  await ctx.reply(`${action} bo'limi boshqaruv panelida ko'rish mumkin. Veb-saytga tashrif buyuring! 🏢`);
});

// New handlers for "Boshqalar" menu items
bot.hears('🔔 Bildirishnomalar', async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply('❌ Avval tizimga kiring.');
    return;
  }
  await ctx.reply('🔔 Bildirishnomalar funksiyasi tez orada qo\'shiladi! Joriy holda veb-saytdan foydalaning.');
});

bot.hears('🌐 Veb-sayt', async (ctx) => {
  await ctx.reply('🌐 Bizning veb-saytimiz: https://your-domain.replit.app\n\nTo\'liq funksiyalardan foydalanish uchun veb-saytga tashrif buyuring!');
});

bot.hears('ℹ️ Yordam', async (ctx) => {
  await ctx.reply(
    'ℹ️ *Yordam bo\'limi*\n\n' +
    '🤖 *Bot buyruqlari:*\n' +
    '/start - Botni qayta ishga tushirish\n' +
    '/profile - Profil ma\'lumotlari\n' +
    '/lessons - Darslar ro\'yxati\n' +
    '/tests - Testlar ro\'yxati\n\n' +
    '📞 *Yordam kerakmi?*\n' +
    'Qo\'shimcha yordam uchun "📞 Aloqa" tugmasini bosing.',
    { parse_mode: 'Markdown' }
  );
});

bot.hears('📞 Aloqa', async (ctx) => {
  await ctx.reply(
    '📞 Biz bilan bog\'laning\n\n' +
    '📧 Email: info@repititor.uz\n' +
    '📱 Telegram: @repititor_support\n' +
    '🕐 Ish vaqti: 9:00-18:00 (Dush-Juma)\n\n' +
    'Sizning savollaringiz bizga muhim!'
  );
});

// 🚪 Hisobdan chiqish handler
bot.hears('🚪 Hisobdan chiqish', async (ctx) => {
  ctx.session = {};
  await ctx.reply(
    '✅ Siz hisobdan muvaffaqiyatli chiqdingiz.\n\n' +
    'Qaytadan kirish uchun quyidagi tugmalardan foydalaning:',
    Markup.keyboard([
      ['🔑 Kirish', '📝 Ro\'yxatdan o\'tish'],
      ['ℹ️ Ma\'lumot', '📊 Statistika']
    ]).resize()
  );
});

export { bot };