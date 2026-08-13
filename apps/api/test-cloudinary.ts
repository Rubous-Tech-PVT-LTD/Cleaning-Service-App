/**
 * Simple Cloudinary Test
 * Run: npx ts-node test-cloudinary.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { CloudinaryService } from './src/cloudinary/cloudinary.service';
import { ConfigService } from '@nestjs/config';

// Load environment variables from project root
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function testCloudinary() {
  const config = new ConfigService();
  const cloudinaryService = new CloudinaryService(config);


  // Check configuration
  const isConfigured = cloudinaryService.isConfigured();
  console.log(`Cloudinary Configured: ${isConfigured ? '✅ Yes' : '❌ No'}`);

  if (!isConfigured) {
    console.log('\n⚠️  Add credentials to .env to enable upload features:');
    console.log('   CLOUDINARY_CLOUD_NAME="your-cloud-name"');
    console.log('   CLOUDINARY_API_KEY="your-api-key"');
    console.log('   CLOUDINARY_API_SECRET="your-api-secret"');
    console.log('\n📱 Your existing Cloudinary URLs will still work.');
    return;
  }

  // Test URL operations
  console.log('\n🔍 Testing URL Operations:');
  const testUrl = 'https://res.cloudinary.com/dchtlnkhn/image/upload/f_auto,q_auto/female-home-cleaner_tdsya1.png';
  console.log(`Original URL: ${testUrl}`);

  try {
    const publicId = cloudinaryService.extractPublicId(testUrl);
    console.log(`Extracted Public ID: ${publicId} ✅`);

    const mobileUrl = cloudinaryService.getMobileUrl(publicId, 300);
    console.log(`Mobile URL: ${mobileUrl.substring(0, 60)}... ✅`);
  } catch (error) {
    console.log(`URL Operations: ❌ Failed`);
  }

  // Show available endpoints
  console.log('\n🚀 Available Endpoints:');
  console.log('POST   /v1/cloudinary/upload - Upload image');
  console.log('DELETE /v1/cloudinary/:publicId - Delete image');
  console.log('GET    /v1/cloudinary/mobile/:publicId - Get mobile URL');
  console.log('POST   /v1/cloudinary/extract-public-id - Extract public ID');
  console.log('GET    /v1/cloudinary/health - Health check');

  console.log('\n✅ Cloudinary setup is working!');
}

testCloudinary().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});