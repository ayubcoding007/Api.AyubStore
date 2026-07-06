import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
// Supabase Configuration

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
const bucketName = process.env.SUPABASE_BUCKET_NAME;

// Initialize Supabase Client with Anon Key (for public operations)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize Admin Client with Secret Key (for admin operations)
const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey);
console.log('Supabase configured successfully');

// Upload File to Supabase
export const uploadToSupabase = async (file, folder, resourceType = "image") => {
  try {
    // Determine file extension
    const fileExtension = file.originalname?.split('.').pop() || 'file';
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;
    
    // Determine content type
    let contentType = file.mimetype || 'application/octet-stream';
    if (resourceType === 'raw') {
      contentType = 'application/vnd.android.package-archive';
    }

    console.log('Uploading to Supabase:', fileName);
    console.log('File size:', (file.buffer.length / 1024 / 1024).toFixed(2), 'MB');

    // Upload to Supabase Storage using admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, file.buffer, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase Upload Error:', error);
      throw error;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    console.log('Upload successful:', fileName);
    console.log('Public URL:', publicUrlData.publicUrl);

    return {
      secure_url: publicUrlData.publicUrl,
      public_id: fileName,
    };
  } catch (error) {
    console.error('Supabase Upload Error:', error);
    throw error;
  }
};

// Delete File from Supabase
export const deleteFromSupabase = async (publicId) => {
  try {
    if (!publicId) {
      console.warn('No publicId provided for deletion');
      return { success: true };
    }

    console.log('Deleting from Supabase:', publicId);

    // Delete using admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .remove([publicId]);

    if (error) {
      console.error('Supabase Delete Error:', error);
      throw error;
    }

    console.log('Deletion successful:', publicId);
    return { success: true };
  } catch (error) {
    console.error('Supabase Delete Error:', error);
    throw error;
  }
};

// Check if file exists
export const fileExists = async (publicId) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list('', {
        limit: 1,
        offset: 0,
        search: publicId,
      });

    if (error) throw error;
    return data && data.length > 0;
  } catch (error) {
    console.error('Supabase File Check Error:', error);
    return false;
  }
};

export default {
  supabase,
  supabaseAdmin,
  uploadToSupabase,
  deleteFromSupabase,
  fileExists,
};