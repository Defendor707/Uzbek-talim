import { Context } from 'telegraf';

export class BotErrorHandler {
  static async handleDatabaseError(error: any, ctx: Context, operation: string) {
    console.error(`Database error in ${operation}:`, error);
    
    // Check if it's a connection timeout or connection error
    if (error.code === '57P01' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      await ctx.reply(
        '⚠️ Ma\'lumotlar bazasiga ulanishda vaqtinchalik muammo bor.\n' +
        'Iltimos, bir necha daqiqadan so\'ng qaytadan urinib ko\'ring.'
      );
      return true;
    }
    
    // Handle other database errors
    if (error.code && error.code.startsWith('23')) {
      await ctx.reply(
        '❌ Ma\'lumot saqlashda xatolik yuz berdi.\n' +
        'Iltimos, ma\'lumotlarni tekshirib qaytadan urinib ko\'ring.'
      );
      return true;
    }
    
    // Generic database error
    await ctx.reply(
      '❌ Tizimda vaqtinchalik muammo bor.\n' +
      'Iltimos, keyinroq qaytadan urinib ko\'ring.'
    );
    return true;
  }
  
  static async handleGenericError(error: any, ctx: Context, operation: string) {
    console.error(`Error in ${operation}:`, error);
    await ctx.reply(
      '❌ Kutilmagan xatolik yuz berdi.\n' +
      'Iltimos, keyinroq qaytadan urinib ko\'ring.'
    );
  }
  
  static async retryDatabaseOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        console.error(`Database operation attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    
    return null;
  }
}