import { NextResponse } from "next/server";
import { getValidatedSession } from "@/lib/validate-session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const session = await getValidatedSession();

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split(".").pop() || "jpg";
    const fileName = `${session.user.id}-${timestamp}-${randomString}.${fileExtension}`;
    const filePath = fileName;

    // Get user's current avatar to delete old file
    const currentUser = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
    const oldAvatarUrl = currentUser[0]?.avatar_url || currentUser[0]?.image;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Supabase Storage
    let uploadError;
    try {
      const { error: error } = await supabaseAdmin.storage
        .from('avatars')
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
        });
      uploadError = error;
    } catch (err: any) {
      console.error("Supabase client error:", err);
      // Check if it's a configuration error
      if (err.message?.includes('Missing') || err.message?.includes('environment variable')) {
        return NextResponse.json(
          { 
            error: "Supabase is not configured. Please check your environment variables.",
            details: err.message 
          },
          { status: 500 }
        );
      }
      throw err;
    }

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      
      // Provide more specific error messages
      let errorMessage = "Failed to upload file to storage.";
      if (uploadError.message?.includes('Bucket not found')) {
        errorMessage = "Storage bucket 'avatars' not found. Please create it in your Supabase dashboard.";
      } else if (uploadError.message?.includes('new row violates row-level security')) {
        errorMessage = "Storage policy error. Please check your Supabase storage policies.";
      } else if (uploadError.message) {
        errorMessage = `Upload failed: ${uploadError.message}`;
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: uploadError.message || "Unknown error"
        },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      console.error("Failed to get public URL for uploaded file");
      return NextResponse.json(
        { error: "File uploaded but failed to get public URL. Please try again." },
        { status: 500 }
      );
    }

    const avatarUrl = urlData.publicUrl;

    // Update user's avatar_url in the database immediately after upload
    try {
      await db.update(users)
        .set({
          avatar_url: avatarUrl,
          image: avatarUrl, // Also update image field for NextAuth compatibility
        })
        .where(eq(users.id, session.user.id));
    } catch (dbError) {
      console.error("Failed to update avatar_url in database:", dbError);
      // Continue even if database update fails - the file is already uploaded
      // The client can retry updating the profile
    }

    // Delete old avatar file from Supabase Storage if it exists
    if (oldAvatarUrl && oldAvatarUrl.includes('/storage/v1/object/public/avatars/')) {
      try {
        // Extract file path from URL (format: .../avatars/filename)
        const urlParts = oldAvatarUrl.split('/avatars/');
        if (urlParts.length > 1) {
          const oldFileName = urlParts[urlParts.length - 1].split('?')[0]; // Remove query params if any
          const { error: deleteError } = await supabaseAdmin.storage
            .from('avatars')
            .remove([oldFileName]);
          
          if (deleteError) {
            console.error("Failed to delete old avatar:", deleteError);
          }
        }
      } catch (deleteError) {
        // Log but don't fail the upload if deletion fails
        console.error("Failed to delete old avatar:", deleteError);
      }
    }

    return NextResponse.json({
      success: true,
      avatarUrl,
      message: "File uploaded successfully",
    });
  } catch (error: any) {
    console.error("Avatar upload error:", error);
    
    // Check for Supabase configuration errors
    if (error.message?.includes('Missing') || error.message?.includes('environment variable')) {
      return NextResponse.json(
        { 
          error: "Supabase is not configured. Please check your environment variables.",
          details: error.message,
          help: "See SUPABASE_STORAGE_SETUP.md for setup instructions."
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error.message || "Failed to upload file. Please try again.",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
