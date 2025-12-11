/**
 * Sitemap Generator
 * API'dan 1000 ta document olib sitemap.xml yaratadi
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API base URL
const API_BASE = 'https://api.tqdm.ismailov.uz';

// Top mavzular (har xil kategoriyalar)
const TOP_TOPICS = [
    'fizika', 'matematika', 'kimyo', 'biologiya', 'informatika',
    'tarix', 'geografiya', 'adabiyot', 'ingliz tili', 'ona tili',
    'suniy intellekt', 'dasturlash', 'internet', 'kompyuter', 'texnologiya',
    'ekologiya', 'iqtisod', 'huquq', 'psixologiya', 'pedagogika',
    'sport', 'salomatlik', 'tibbiyot', 'musiqa', 'san\'at',
    'arxitektura', 'dizayn', 'biznes', 'marketing', 'moliya',
    'siyosat', 'jamiyat', 'madaniyat', 'din', 'falsafa',
    'astronomiya', 'geologiya', 'botanika', 'zoologiya', 'genetika',
    'atom', 'energiya', 'ekologiya', 'iqlim', 'tabiat'
];

// API'dan document'lar olish
async function fetchDocuments(query, limit = 25) {
    try {
        const url = `${API_BASE}/search?text=${encodeURIComponent(query)}&page=1&page_size=${limit}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error(`❌ Xato: ${query} - ${response.status}`);
            return [];
        }
        
        const data = await response.json();
        console.log(`✅ ${query}: ${data.length} ta hujjat topildi`);
        return data;
    } catch (error) {
        console.error(`❌ Xato: ${query} - ${error.message}`);
        return [];
    }
}

// Sitemap XML yaratish
function generateSitemapXML(documents) {
    const today = new Date().toISOString().split('T')[0];
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

  <!-- Homepage -->
  <url>
    <loc>https://taqdimot.ismailov.uz/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>https://taqdimot.ismailov.uz/images/logo.png</image:loc>
      <image:title>Taqdimot App Logo</image:title>
    </image:image>
  </url>

  <!-- Login Page -->
  <url>
    <loc>https://taqdimot.ismailov.uz/login</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Showcase Page - 100,000+ Documents -->
  <url>
    <loc>https://taqdimot.ismailov.uz/showcase</loc>
    <lastmod>${today}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Document Detail Pages (${documents.length} ta) -->
`;

    // Document URL'larni qo'shish
    documents.forEach(doc => {
        xml += `  <url>
    <loc>https://taqdimot.ismailov.uz/d/${doc.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    });

    xml += `
  <!-- Main Features/Pages -->
  <url>
    <loc>https://taqdimot.ismailov.uz/#features</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>https://taqdimot.ismailov.uz/#pricing</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <url>
    <loc>https://taqdimot.ismailov.uz/#about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

  <!-- FAQ/Support Pages -->
  <url>
    <loc>https://taqdimot.ismailov.uz/#faq</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>

</urlset>`;

    return xml;
}

// Main function
async function main() {
    console.log('🚀 Sitemap Generator ishga tushdi...\n');
    
    const allDocuments = [];
    const documentsPerTopic = Math.ceil(1000 / TOP_TOPICS.length); // ~25 ta
    
    console.log(`📊 ${TOP_TOPICS.length} ta mavzu bo'yicha qidiruv...\n`);
    
    // Har bir mavzu bo'yicha document'lar olish
    for (const topic of TOP_TOPICS) {
        const docs = await fetchDocuments(topic, documentsPerTopic);
        allDocuments.push(...docs);
        
        // Duplicate'larni olib tashlash
        const uniqueDocs = Array.from(
            new Map(allDocuments.map(doc => [doc.id, doc])).values()
        );
        allDocuments.length = 0;
        allDocuments.push(...uniqueDocs);
        
        // 1000 ta yetdi?
        if (allDocuments.length >= 1000) {
            console.log(`\n✅ 1000 ta document to'plandi!\n`);
            break;
        }
    }
    
    // 1000 ta'ga limit qilish
    const limitedDocs = allDocuments.slice(0, 1000);
    
    console.log(`\n📝 ${limitedDocs.length} ta unique document topildi\n`);
    
    // Sitemap yaratish
    const sitemapXML = generateSitemapXML(limitedDocs);
    
    // Faylga yozish
    const distPath = path.join(__dirname, '../dist/sitemap.xml');
    fs.writeFileSync(distPath, sitemapXML, 'utf8');
    
    console.log(`✅ Sitemap yaratildi: ${distPath}`);
    console.log(`📊 Jami URL'lar: ${limitedDocs.length + 6}`);
    console.log(`\n🎯 Google Search Console'ga submit qilishingiz mumkin!`);
}

// Run
main().catch(console.error);
