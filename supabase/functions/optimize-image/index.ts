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

    // 4. Redimensionner l'image avec ImageScript
    console.log('🔄 Redimensionnement de l\'image...');
    
    let finalBlob: Blob;
    
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
      const newWidth = Math.floor(img.width * ratio);
      const newHeight = Math.floor(img.height * ratio);
      
      console.log(`📐 Nouvelles dimensions: ${newWidth}x${newHeight}`);
      
      // Redimensionner l'image
      const resizedImage = img.resize(newWidth, newHeight);
      console.log(`✅ Image redimensionnée: ${resizedImage.width}x${resizedImage.height}`);
      
      // Encoder selon le format original
      let optimizedBuffer: Uint8Array;
      let contentType: string;
      
      if (fileExtension === 'png') {
        console.log('🔄 Encodage en PNG...');
        optimizedBuffer = await resizedImage.encodePNG();
        contentType = 'image/png';
      } else {
        console.log('🔄 Encodage en JPEG...');
        optimizedBuffer = await resizedImage.encodeJPEG(85);
        contentType = 'image/jpeg';
      }
      
      finalBlob = new Blob([optimizedBuffer], { type: contentType });
      console.log(`✅ Image optimisée: ${finalBlob.size} bytes`);
      
    } catch (error) {
      console.error('⚠️ Erreur redimensionnement:', error);
      finalBlob = imageData;
    }
    
    // 5. Remplacer directement l'image originale
    console.log('⬆️ Remplacement de l\'image originale...');
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(originalFileName, finalBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: fileExtension === 'png' ? 'image/png' : 'image/jpeg'
      });


    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log('✅ Image remplacée avec succès');

    console.log('🎉 Redimensionnement terminé !');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Image redimensionnée avec succès pour ${product.name}`,
        original: {
          fileName: originalFileName,
          url: product.image_url,
          size: originalSize
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