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
  registrationData?: {
    username?: string;
    password?: string;
    role?: 'teacher' | 'student' | 'parent' | 'center';
    fullName?: string;
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
  await ctx.reply('Foydalanuvchi nomingizni kiriting:');
  bot.use(async (ctx, next) => {
    if (!ctx.session.userId && ctx.message && 'text' in ctx.message) {
      // First message after login request should be username
      if (!ctx.session.registrationData) {
        ctx.session.registrationData = {};
      }
      
      if (!ctx.session.registrationData.username) {
        ctx.session.registrationData.username = ctx.message.text;
        await ctx.reply('Parolingizni kiriting:');
        return;
      }
      
      // Second message should be password
      if (ctx.session.registrationData.username && !ctx.session.registrationData.password) {
        ctx.session.registrationData.password = ctx.message.text;
        
        // Try to log in
        try {
          const user = await storage.getUserByUsername(ctx.session.registrationData.username);
          
          if (!user) {
            await ctx.reply('❌ Bunday foydalanuvchi topilmadi. Qaytadan urinib ko\'ring.');
            ctx.session.registrationData = {};
            return;
          }
          
          const isPasswordValid = await bcrypt.compare(
            ctx.session.registrationData.password, 
            user.password
          );
          
          if (!isPasswordValid) {
            await ctx.reply('❌ Noto\'g\'ri parol. Qaytadan urinib ko\'ring.');
            ctx.session.registrationData = {};
            return;
          }
          
          // Login successful
          const token = generateToken(user.id, user.role);
          ctx.session.userId = user.id;
          ctx.session.role = user.role;
          ctx.session.token = token;
          ctx.session.registrationData = {};
          
          await ctx.reply(
            `✅ Tizimga muvaffaqiyatli kirdingiz, ${user.fullName}!\n\n` +
            'Quyidagi amallardan birini tanlang:',
            Markup.keyboard(getKeyboardByRole(user.role)).resize()
          );
        } catch (error) {
          console.error('Login error:', error);
          await ctx.reply('❌ Tizimga kirishda xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
          ctx.session.registrationData = {};
        }
      }
    }
    return next();
  });
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
  
  await ctx.reply(
    'Ro\'yxatdan o\'tish uchun o\'z rolingizni tanlang:',
    Markup.keyboard([
      ['👨‍🏫 O\'qituvchi', '👨‍🎓 O\'quvchi'],
      ['👨‍👩‍👧‍👦 Ota-ona', '🏫 O\'quv markazi'],
      ['🔙 Orqaga']
    ]).resize()
  );
  
  // Setup role selection handler
  bot.hears(['👨‍🏫 O\'qituvchi', '👨‍🎓 O\'quvchi', '👨‍👩‍👧‍👦 Ota-ona', '🏫 O\'quv markazi'], async (ctx) => {
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
    
    await ctx.reply('To\'liq ismingizni kiriting:');
    
    // Continue with registration flow...
    // This is a simplified version, in a real application you would
    // need to handle each step of the registration process
  });
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
  const baseButtons = [
    ['👤 Profil', '📚 Darslar'],
    ['📝 Testlar', '📊 Statistika'],
    ['🔙 Chiqish']
  ];
  
  // Add role-specific buttons
  if (role === 'teacher') {
    baseButtons.unshift(['➕ Dars qo\'shish', '➕ Test qo\'shish']);
  } else if (role === 'student') {
    baseButtons.unshift(['📊 Natijalarim', '📅 Jadval']);
  }
  
  return baseButtons;
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

export { bot };