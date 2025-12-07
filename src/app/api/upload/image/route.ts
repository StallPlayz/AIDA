// src/app/api/upload/image/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { checkCsrf, checkRateLimit } from "@/utils/security";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function POST(request: Request) {
  try {
    console.log("Upload route called");

    const csrf = checkCsrf(request);
    if (csrf) return csrf;

    const rateLimited = checkRateLimit(request, { windowMs: 60_000, limit: 15, identifier: "upload_image" });
    if (rateLimited) return rateLimited;
    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase is not configured. Please check environment variables." },
        { status: 500 }
      );
    }

    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log("Unauthorized - no session");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("User authenticated:", session.user.email);

    // Get the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.log("No file provided");
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    console.log("File received:", file.name, file.type, file.size);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log("Invalid file type:", file.type);
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.log("File too large:", file.size);
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Create unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.includes('.') ? file.name.split('.').pop() : "";
    const baseName = `product-${timestamp}-${randomString}`;

    console.log("Generated base filename:", baseName);

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("Buffer created, size:", buffer.length);

    // Optional server-side fallback conversion to WebP
    const shouldConvertToWebP =
      file.type !== "image/webp" &&
      !file.name.toLowerCase().endsWith(".webp");

    let uploadBuffer = buffer;
    let uploadContentType = file.type;
    let uploadFileName = `${baseName}.${fileExt || "bin"}`;

    if (shouldConvertToWebP) {
      try {
        uploadBuffer = await sharp(buffer).webp({ quality: 90 }).toBuffer();
        uploadContentType = "image/webp";
        uploadFileName = `${baseName}.webp`;
        console.log(
          "Converted to WebP, new size:",
          uploadBuffer.length,
          "bytes"
        );
      } catch (conversionError) {
        console.error("WebP conversion failed, using original file:", conversionError);
      }
    }

    // Enforce size after potential conversion
    if (uploadBuffer.length > 5 * 1024 * 1024) {
      console.log("Converted/original file still too large:", uploadBuffer.length);
      return NextResponse.json(
        { error: "File size must be less than 5MB after conversion" },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage
    console.log("Uploading to Supabase...");
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(uploadFileName, uploadBuffer, {
        contentType: uploadContentType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      
      // Provide more specific error messages
      if (error.message.includes('Bucket not found')) {
        return NextResponse.json(
          { 
            error: "Storage bucket not found", 
            details: "Please create a 'product-images' bucket in Supabase Storage",
            supabaseError: error.message 
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to upload image", details: error.message },
        { status: 500 }
      );
    }

    console.log("Upload successful:", data);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(uploadFileName);

    console.log("Public URL:", publicUrl);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: uploadFileName
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: "Failed to upload image", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
