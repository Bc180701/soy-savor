import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";

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

    // 4. Optimiser l'image avec ImageScript (compatible Deno)
    console.log('🔄 Début de l\'optimisation avec ImageScript...');
    
    let finalBlob: Blob;
    let compressionRatio = 0;
    let newWidth = 0;
    let newHeight = 0;
    
    try {
      // Convertir le blob en Uint8Array
      const imageBuffer = new Uint8Array(await imageData.arrayBuffer());
      console.log(`📊 Buffer size: ${imageBuffer.length} bytes`);
      
      // Décoder l'image avec ImageScript
      const img = await Image.decode(imageBuffer);
      console.log(`📐 Dimensions originales: ${img.width}x${img.height}`);
      
      // Calculer les nouvelles dimensions (max 600x400)
      const maxWidth = 600;
      const maxHeight = 400;
      const ratio = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
      newWidth = Math.floor(img.width * ratio);
      newHeight = Math.floor(img.height * ratio);
      
      console.log(`📐 Nouvelles dimensions: ${newWidth}x${newHeight} (ratio: ${ratio.toFixed(3)})`);
      
      // Redimensionner l'image
      const resizedImage = img.resize(newWidth, newHeight);
      console.log(`✅ Image redimensionnée: ${resizedImage.width}x${resizedImage.height}`);
      
      // Encoder selon le format original pour conserver la transparence
      let optimizedBuffer: Uint8Array;
      let contentType: string;
      
      if (fileExtension === 'png') {
        console.log('🔄 Encodage en PNG pour conserver la transparence...');
        optimizedBuffer = await resizedImage.encodePNG();
        contentType = 'image/png';
      } else {
        console.log('🔄 Encodage en JPEG avec compression...');
        optimizedBuffer = await resizedImage.encodeJPEG(70); // 70% de qualité
        contentType = 'image/jpeg';
      }
      
      console.log(`📦 Buffer optimisé: ${optimizedBuffer.length} bytes`);
      
      // Créer le blob optimisé
      finalBlob = new Blob([optimizedBuffer], { type: contentType });
      
      // Calculer le ratio de compression
      compressionRatio = ((originalSize - finalBlob.size) / originalSize * 100);
      console.log(`✅ Image optimisée: ${newWidth}x${newHeight}, taille: ${finalBlob.size} bytes (${compressionRatio.toFixed(1)}% de compression)`);
      
    } catch (error) {
      console.error('⚠️ Erreur pendant l\'optimisation avec ImageScript:', error);
      console.log('🔄 Fallback: utilisation de l\'image originale');
      finalBlob = imageData;
    }
    
    // 5. Créer le nom du fichier optimisé (conserver le format original)
    const optimizedFileName = originalFileName.replace(/\.(png|jpg|jpeg)$/i, `-optimized.${fileExtension}`);
    console.log(`📝 Optimized filename: ${optimizedFileName}`);

    // 6. Upload l'image optimisée
    console.log('⬆️ Uploading optimized image...');
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(optimizedFileName, finalBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: fileExtension === 'png' ? 'image/png' : 'image/jpeg'
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