import { bot } from './bot';
import { log } from '../vite';

/**
 * Start the Telegram bot
 */
export async function startTelegramBot() {
  try {
    if (!bot) {
      log('Telegram bot token not provided - skipping bot startup', 'telegram');
      return null;
    }
    
    // Launch the bot
    await bot.launch();
    log('Telegram bot started successfully', 'telegram');
    
    // Enable graceful stop
    process.once('SIGINT', () => bot?.stop('SIGINT'));
    process.once('SIGTERM', () => bot?.stop('SIGTERM'));
    
    return bot;
  } catch (error) {
    log(`Failed to start Telegram bot: ${error}`, 'telegram');
    throw error;
  }
}