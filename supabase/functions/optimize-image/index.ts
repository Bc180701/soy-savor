import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting image optimization function...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { productName } = await req.json();
    console.log(`📦 Processing product: ${productName}`);

    // 1. Get product information (handle duplicates by taking the first one)
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, image_url')
      .eq('name', productName)
      .limit(1)
      .single();

    if (productError) {
      console.error('❌ Product query error:', productError);
      throw new Error(`Product not found: ${productName}`);
    }

    if (!product) {
      throw new Error(`No product found with name: ${productName}`);
    }

    console.log(`✅ Product found: ${product.name}`);
    console.log(`🖼️ Current image URL: ${product.image_url}`);

    if (!product.image_url || !product.image_url.includes('supabase')) {
      throw new Error('Image URL is not compatible for optimization');
    }

    // 2. Extract filename from URL
    const urlParts = product.image_url.split('/');
    const originalFileName = decodeURIComponent(urlParts[urlParts.length - 1]);
    const fileExtension = originalFileName.split('.').pop()?.toLowerCase();
    
    console.log(`📄 Original filename: ${originalFileName}`);
    console.log(`🔧 File extension: ${fileExtension}`);

    // 3. Download the original image
    console.log('⬇️ Downloading original image...');
    const { data: imageData, error: downloadError } = await supabase.storage
      .from('products')
      .download(originalFileName);

    if (downloadError) {
      console.error('❌ Download error:', downloadError);
      throw new Error(`Download failed: ${downloadError.message}`);
    }

    const originalSize = imageData.size;
    console.log(`✅ Image downloaded successfully, size: ${originalSize} bytes`);

    // 4. Optimiser l'image en utilisant l'API Web standard
    console.log('🔄 Début de l\'optimisation avec redimensionnement...');
    
    try {
      // Créer un canvas virtuel pour le redimensionnement
      const img = new Image();
      
      // Convertir le blob en URL d'objet
      const imageUrl = URL.createObjectURL(imageData);
      
      // Charger l'image
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });
      
      console.log(`📐 Dimensions originales: ${img.width}x${img.height}`);
      
      // Calculer les nouvelles dimensions (max 600x400)
      const maxWidth = 600;
      const maxHeight = 400;
      const ratio = Math.min(maxWidth / img.width, maxHeight / img.height, 1); // Ne pas agrandir
      const newWidth = Math.floor(img.width * ratio);
      const newHeight = Math.floor(img.height * ratio);
      
      console.log(`📐 Nouvelles dimensions: ${newWidth}x${newHeight} (ratio: ${ratio.toFixed(3)})`);
      
      // Créer un canvas pour le redimensionnement
      const canvas = new OffscreenCanvas(newWidth, newHeight);
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Impossible de créer le contexte Canvas');
      }
      
      // Configurer la qualité de rendu
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Dessiner l'image redimensionnée
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Nettoyer l'URL d'objet
      URL.revokeObjectURL(imageUrl);
      
      // Convertir en JPEG avec compression
      const optimizedBlob = await canvas.convertToBlob({
        type: 'image/jpeg',
        quality: 0.7 // 70% de qualité pour un bon compromis
      });
      
      const compressionRatio = ((originalSize - optimizedBlob.size) / originalSize * 100).toFixed(1);
      console.log(`✅ Image optimisée: ${newWidth}x${newHeight}, taille: ${optimizedBlob.size} bytes (${compressionRatio}% de compression)`);
      
      // Assigner le blob optimisé
      var finalBlob = optimizedBlob;
      
    } catch (error) {
      console.error('⚠️ Erreur pendant l\'optimisation, utilisation de l\'image originale:', error);
      var finalBlob = imageData;
    }
    
    // 5. Créer le nom du fichier optimisé (toujours en .jpg)
    const optimizedFileName = originalFileName.replace(/\.(png|jpg|jpeg)$/i, '-optimized.jpg');
    console.log(`📝 Optimized filename: ${optimizedFileName}`);

    // 6. Upload l'image optimisée
    console.log('⬆️ Uploading optimized image...');
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(optimizedFileName, finalBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/jpeg'
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log('✅ Image uploaded successfully');

    // 7. Build new URL
    const optimizedImageUrl = `https://tdykegnmomyyucbhslok.supabase.co/storage/v1/object/public/products/${encodeURIComponent(optimizedFileName)}`;
    console.log(`🔗 New URL: ${optimizedImageUrl}`);

    // 8. Update product to point to optimized image
    console.log('🔄 Updating product...');
    const { error: updateError } = await supabase
      .from('products')
      .update({ 
        image_url: optimizedImageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', product.id);

    if (updateError) {
      console.error('❌ Update error:', updateError);
      throw new Error(`Product update failed: ${updateError.message}`);
    }

    console.log('🎉 Optimization completed successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Image optimized successfully for ${product.name}`,
        original: {
          fileName: originalFileName,
          url: product.image_url,
          size: originalSize
        },
        optimized: {
          fileName: optimizedFileName,
          url: optimizedImageUrl
        },
        productId: product.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});