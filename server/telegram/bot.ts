import { Telegraf, session, Scenes, Markup } from 'telegraf';
import { storage } from '../storage';
import { generateToken, verifyToken } from '../utils/auth';
import { botNotificationService } from '../sync/botNotifications';
import bcrypt from 'bcrypt';
import * as schema from '@shared/schema';
import { db } from '../db';
import { eq } from 'drizzle-orm';

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
    currentQuestionIndex?: number;
    answers?: { questionId: number, answer: string }[];
  };
  editingField?: 'fullName' | 'phoneNumber' | 'specialty' | 'bio' | 'experience';
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
        // For parent, update phone number in user table directly
        if (field === 'phoneNumber') {
          await storage.updateUser(user.id, { phone: validatedValue });
        }
      }

      // Clear editing state
      delete ctx.session.editingField;

      const fieldNames = {
        fullName: 'Ism-familya',
        phoneNumber: 'Telefon raqam',
        specialty: 'Mutaxassislik',
        bio: 'Haqida bo\'limi',
        experience: 'Tajriba'
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
bot.hears('📊 Statistika', async (ctx) => {
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
      ['📝 Testlar', '📊 Statistika'],
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
          ['📋 Mavjud testlar', '📊 Test natijalari'],
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
        ['📋 Mavjud testlar', '📊 Test natijalari'],
        ['🔙 Orqaga']
      ]).resize()
    }
  );
});

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