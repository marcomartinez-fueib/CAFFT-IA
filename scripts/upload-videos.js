// Upload videos to Cloudinary
// Usage: node scripts/upload-videos.js <cloud_name> <api_key> <api_secret>

const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

const [,, cloudName, apiKey, apiSecret] = process.argv;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('Usage: node scripts/upload-videos.js <cloud_name> <api_key> <api_secret>');
  process.exit(1);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

const VIDEO_DIR = path.join(__dirname, '..', 'public', 'videos_cafft');

const VIDEOS = [
  'ev001_ca', 'ev001_es', 'ev001_en',
  'ev002_ca', 'ev002_es', 'ev002_en',
  'ev003_ca', 'ev003_es', 'ev003_en',
  'ev004_ca', 'ev004_es', 'ev004_en',
  'ev005_ca', 'ev005_es', 'ev005_en',
  'ev006_ca', 'ev006_es', 'ev006_en',
  'exposure_explanation_ca',
  'exposure_explanation_es',
  'exposure_explanation_en',
];

async function uploadVideo(videoId) {
  const filePath = path.join(VIDEO_DIR, `${videoId}.mp4`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${videoId}.mp4 not found, skipping`);
    return null;
  }
  
  const stats = fs.statSync(filePath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`⬆️  ${videoId} (${sizeMB} MB)...`);
  
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'video',
      public_id: `cafft/${videoId}`,
      overwrite: true,
    });
    
    console.log(`✅ ${videoId}: ${result.secure_url}`);
    return { id: videoId, url: result.secure_url };
  } catch (err) {
    console.error(`❌ ${videoId}: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log(`📹 Uploading ${VIDEOS.length} videos to Cloudinary (${cloudName})\n`);
  
  const results = [];
  for (const videoId of VIDEOS) {
    const result = await uploadVideo(videoId);
    if (result) results.push(result);
  }
  
  console.log('\n✅ Upload complete!\n');
  console.log('Add to .env:');
  console.log(`  VITE_CLOUDINARY_CLOUD_NAME=${cloudName}`);
  console.log('  VITE_CLOUDINARY_VIDEO_FOLDER=cafft\n');
  
  console.log('Video URLs:');
  for (const r of results) {
    console.log(`  ${r.id} -> ${r.url}`);
  }
}

main().catch(console.error);
