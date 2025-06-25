import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export class ImageOptimizer {
  private static instance: ImageOptimizer;
  
  public static getInstance(): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer();
    }
    return ImageOptimizer.instance;
  }

  /**
   * Rasmni optimize qilish va WebP formatiga aylantirish
   */
  async optimizeImage(
    inputPath: string,
    outputPath: string,
    options: ImageOptimizationOptions = {}
  ): Promise<{ success: boolean; outputPath: string; originalSize: number; optimizedSize: number }> {
    try {
      const {
        maxWidth = 1200,
        maxHeight = 800,
        quality = 80,
        format = 'webp'
      } = options;

      // Original fayl hajmini olish
      const originalStats = await fs.stat(inputPath);
      const originalSize = originalStats.size;

      // Sharp orqali rasmni optimize qilish
      let sharpInstance = sharp(inputPath);

      // Resize qilish (agar kerak bo'lsa)
      const metadata = await sharpInstance.metadata();
      if (metadata.width && metadata.height) {
        if (metadata.width > maxWidth || metadata.height > maxHeight) {
          sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
            fit: 'inside',
            withoutEnlargement: true
          });
        }
      }

      // Format va quality sozlash
      switch (format) {
        case 'webp':
          sharpInstance = sharpInstance.webp({ quality });
          break;
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({ quality });
          break;
        case 'png':
          sharpInstance = sharpInstance.png({ compressionLevel: 9 });
          break;
      }

      // Faylni saqlash
      await sharpInstance.toFile(outputPath);

      // Optimized fayl hajmini olish
      const optimizedStats = await fs.stat(outputPath);
      const optimizedSize = optimizedStats.size;

      return {
        success: true,
        outputPath,
        originalSize,
        optimizedSize
      };

    } catch (error) {
      console.error('Image optimization error:', error);
      return {
        success: false,
        outputPath: '',
        originalSize: 0,
        optimizedSize: 0
      };
    }
  }

  /**
   * Thumbnail yaratish
   */
  async createThumbnail(
    inputPath: string,
    outputPath: string,
    size: number = 150
  ): Promise<boolean> {
    try {
      await sharp(inputPath)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 70 })
        .toFile(outputPath);

      return true;
    } catch (error) {
      console.error('Thumbnail creation error:', error);
      return false;
    }
  }

  /**
   * Rasm formatini tekshirish
   */
  isValidImageFormat(filename: string): boolean {
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(filename).toLowerCase();
    return validExtensions.includes(ext);
  }

  /**
   * Rasm hajmini tekshirish (5MB max)
   */
  async isValidImageSize(filePath: string, maxSizeInMB: number = 5): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      return fileSizeInMB <= maxSizeInMB;
    } catch {
      return false;
    }
  }

  /**
   * Batch image optimization
   */
  async optimizeImageBatch(
    inputPaths: string[],
    outputDir: string,
    options: ImageOptimizationOptions = {}
  ): Promise<Array<{ inputPath: string; success: boolean; outputPath: string }>> {
    const results = [];
    
    for (const inputPath of inputPaths) {
      const filename = path.basename(inputPath, path.extname(inputPath));
      const outputPath = path.join(outputDir, `${filename}.webp`);
      
      const result = await this.optimizeImage(inputPath, outputPath, options);
      results.push({
        inputPath,
        success: result.success,
        outputPath: result.outputPath
      });
    }

    return results;
  }
}

export default ImageOptimizer.getInstance();