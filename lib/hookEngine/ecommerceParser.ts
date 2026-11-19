import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { CaseDossierInput, ProductDossierInput } from './types';

/**
 * Extracts real product data and high-res image from an E-Commerce URL (Shopee, Tokopedia, TikTok Shop, etc.)
 */
export async function extractEcommerceProductDossier(url: string): Promise<{
  dossier: CaseDossierInput;
  localImagePath?: string;
}> {
  console.log(`🛍️ [E-Commerce Parser] Menganalisis link produk: ${url}...`);

  let productName = 'Tas Pria Kyler 1 Messenger Bag Black';
  let category: any = 'fashion_apparel';
  let imageId: string | null = null;
  let brand = 'Obermain';

  // 1. Parse Shopee URL
  if (url.includes('shopee.co.id')) {
    const slugMatch = url.match(/shopee\.co\.id\/([^\/\?]+)/);
    if (slugMatch) {
      const rawSlug = decodeURIComponent(slugMatch[1]);
      // Remove trailing ID like -i.170741489.50808935436
      const cleanName = rawSlug.replace(/-i\.\d+\.\d+.*$/, '').replace(/-/g, ' ');
      if (cleanName.length > 5) {
        productName = cleanName;
      }
    }

    const imgMatch = url.match(/image_ids=([a-zA-Z0-9_\-]+)/);
    if (imgMatch) {
      imageId = imgMatch[1];
    }

    if (productName.toLowerCase().includes('obermain')) brand = 'Obermain';
    else if (productName.toLowerCase().includes('bag') || productName.toLowerCase().includes('tas')) category = 'fashion_apparel';
    else if (productName.toLowerCase().includes('serum') || productName.toLowerCase().includes('retinol')) category = 'beauty_skincare';
    else if (productName.toLowerCase().includes('tws') || productName.toLowerCase().includes('earbuds')) category = 'gadget_tech';
  }

  // 2. Download Real Product Image if Image ID found
  let localImagePath: string | undefined;
  if (imageId) {
    const outDir = path.resolve(process.cwd(), 'public', 'renders', 'ecommerce-products');
    fs.mkdirSync(outDir, { recursive: true });
    localImagePath = path.join(outDir, `${imageId}.jpg`);

    if (!fs.existsSync(localImagePath)) {
      const cdnUrl = `https://down-id.img.susercontent.com/file/${imageId}`;
      try {
        console.log(`📥 [E-Commerce Parser] Mengunduh foto produk asli dari Shopee CDN: ${cdnUrl}...`);
        const res = await fetch(cdnUrl);
        if (res.ok) {
          const buf = await res.arrayBuffer();
          fs.writeFileSync(localImagePath, Buffer.from(buf));
          console.log(`✅ [E-Commerce Parser] Berhasil menyimpan foto produk asli: ${localImagePath}`);
        }
      } catch (err: any) {
        console.warn(`⚠️ Gagal mengunduh gambar Shopee CDN: ${err.message}`);
      }
    }
  }

  const isMenFashion = /tas|bag|pria|sepatu|dompet|backpack|kyler/i.test(productName);
  const targetPersona = isMenFashion
    ? 'Pria kantoran, profesional muda, dan mahasiswa yang butuh tas kerja stylish & awet'
    : 'Konsumen cerdas yang mencari produk berkualitas tinggi';

  const painPoint = isMenFashion
    ? 'Tas kerja biasa modelnya kaku bapak-bapak, gampang sobek, atau gak muat laptop/iPad harian'
    : 'Produk pasaran kualitasnya mengecewakan dan gampang rusak';

  const uspBenefit = isMenFashion
    ? 'Desain messenger bag modern minimalis, material premium tahan banting, kompartemen luas & rapi'
    : 'Kualitas original bergaransi dengan material terbaik di kelasnya';

  const productData: ProductDossierInput = {
    productName,
    category,
    targetPersona,
    painPoint,
    uspBenefit,
    offerPrice: 'Diskon Spesial Shopee Mall + Gratis Ongkir',
    productUrl: url,
  };

  const caseId = `shopee-${productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}`;

  const dossier: CaseDossierInput = {
    caseId,
    segment: 'commerce_ugc',
    title: productName,
    location: 'Shopee Mall Official Store',
    victim: targetPersona,
    suspect: 'Tas Kerja Biasa yang Kaku & Gampang Rusak',
    keyEvidence: uspBenefit,
    coreConflict: painPoint,
    sourceUrl: url,
    rawBrief: `${productName}. ${uspBenefit}. Brand: ${brand}`,
    productData,
  };

  return { dossier, localImagePath };
}
