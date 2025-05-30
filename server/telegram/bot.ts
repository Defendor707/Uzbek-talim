import { Telegraf, session, Scenes, Markup } from 'telegraf';
import { storage } from '../storage';
import { generateToken, verifyToken } from '../utils/auth';
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
      
      if (messageText.length < 6) {
        await ctx.reply('❌ Parol kamida 6 ta belgidan iborat bo\'lishi kerak. Qaytadan kiriting:');
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
  await ctx.reply(
    'O\'zbek Ta\'lim platformasi buyruqlari:\n\n' +
    '/start - Botni qayta ishga tushirish\n' +
    '/login - Tizimga kirish\n' +
    '/register - Ro\'yxatdan o\'tish\n' +
    '/profile - Profilingizni ko\'rish\n' +
    '/lessons - Darslar ro\'yxati\n' +
    '/tests - Testlar ro\'yxati\n' +
    '/logout - Tizimdan chiqish'
  );
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

// Profile command
bot.command('profile', async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.reply(
      '❌ Siz tizimga kirmagansiz. Iltimos, avval tizimga kiring:',
      Markup.keyboard([
        ['🔑 Kirish', '📝 Ro\'yxatdan o\'tish'],
        ['ℹ️ Ma\'lumot', '📊 Statistika']
      ]).resize()
    );
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
        profileDetails = `🎓 Fanlar: ${teacherProfile.subjects.join(', ')}\n`;
        if (teacherProfile.centerId) {
          profileDetails += `🏢 O'quv markazi ID: ${teacherProfile.centerId}\n`;
        }
      }
    } else if (user.role === 'student') {
      const studentProfile = await storage.getStudentProfile(user.id);
      if (studentProfile) {
        profileDetails = `🎓 Sinf: ${studentProfile.grade}\n` +
                         `🏫 Sinf: ${studentProfile.classroom}\n`;
        if (studentProfile.parentId) {
          profileDetails += `👨‍👩‍👧‍👦 Ota-ona ID: ${studentProfile.parentId}\n`;
        }
        if (studentProfile.centerId) {
          profileDetails += `🏢 O'quv markazi ID: ${studentProfile.centerId}\n`;
        }
      }
    }
    
    await ctx.reply(
      `👤 *Profil ma'lumotlari*\n\n` +
      `👤 Ism: ${user.fullName}\n` +
      `📧 Email: ${user.email}\n` +
      `🔑 Foydalanuvchi nomi: ${user.username}\n` +
      `🧩 Rol: ${getRoleNameInUzbek(user.role)}\n` +
      `📅 Ro'yxatdan o'tgan sana: ${new Date(user.createdAt).toLocaleDateString('uz-UZ')}\n\n` +
      profileDetails,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error fetching profile:', error);
    await ctx.reply('❌ Profil ma\'lumotlarini olishda xatolik yuz berdi.');
  }
});

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
      lessons = await storage.getLessonsByGrade(profile.grade);
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
      tests = await storage.getActiveTestsForStudent(profile.grade, profile.classroom);
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
      ['👶 Farzandim', '📊 Statistika'],
      ['💳 To\'lovlar', '⚡ Boshqalar']
    ];
  } else if (role === 'center') {
    return [
      ['👨‍🏫 O\'qituvchilar', '👨‍🎓 O\'quvchilar'],
      ['📊 Hisobotlar', '⚡ Boshqalar']
    ];
  }
  
  // Default keyboard
  return [
    ['👤 Profil', '📚 Darslar'],
    ['📝 Testlar', '⚡ Boshqalar']
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

// Role-specific menu handlers

// TEACHER MENU HANDLERS
bot.hears('1️⃣ Profil', async (ctx) => {
  if (!ctx.session.userId || ctx.session.role !== 'teacher') {
    await ctx.reply('❌ Bu funksiya faqat o\'qituvchilar uchun.');
    return;
  }
  
  await ctx.reply(
    '👤 *Profil bo\'limi*\n\nQuyidagi amallardan birini tanlang:',
    {
      parse_mode: 'Markdown',
      ...Markup.keyboard([
        ['🖼️ Shaxsiy rasm', '👤 Ism familiya'],
        ['📜 Sertifikat', '🎂 Yoshi'],
        ['💼 Tajribasi', 'ℹ️ Haqida'],
        ['🔙 Orqaga']
      ]).resize()
    }
  );
});

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

// STUDENT MENU HANDLERS  
bot.hears('1️⃣ Profil', async (ctx) => {
  if (!ctx.session.userId || ctx.session.role !== 'student') {
    await ctx.reply('❌ Bu funksiya faqat o\'quvchilar uchun.');
    return;
  }
  
  await ctx.reply(
    '👤 *Profil bo\'limi*\n\nQuyidagi amallardan birini tanlang:',
    {
      parse_mode: 'Markdown',
      ...Markup.keyboard([
        ['👤 Ism familiya', '🖼️ Shaxsiy rasmi'],
        ['📜 Sertifikatlar', 'ℹ️ Haqida'],
        ['🔙 Orqaga']
      ]).resize()
    }
  );
});

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

// Additional menu handlers for each role
bot.hears(['👤 Profil', '📚 Darslik', '📝 Testlar', '📊 Statistika'], async (ctx) => {
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