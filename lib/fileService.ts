import { supabase } from './supabase';
import { File, VoiceNote, FileInsert, FileUpdate, VoiceNoteInsert, VoiceNoteUpdate } from '@/types/database';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import { Platform } from 'react-native';

export interface FileUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileId?: string;
}

export interface VoiceNoteUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  voiceNoteId?: string;
}

// UUID validation function
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export class FileService {
  private static BUCKET_NAME = 'files';
  private static VOICE_NOTES_BUCKET = 'voice-notes';

  /**
   * Upload a file to Supabase Storage and save metadata to database
   */
  static async uploadFile(
    fileUri: string,
    fileName: string,
    cardId: string,
    userId: string,
    fileType?: string
  ): Promise<FileUploadResult> {
    try {
      // Validate UUID format
      if (!isValidUUID(cardId)) {
        throw new Error('Invalid card ID format');
      }

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      // Determine file type from extension if not provided
      const type = fileType || fileName.split('.').pop() || 'unknown';
      let mimeType = this.getMimeType(type);

      // Create unique file path
      const filePath = `${userId}/${cardId}/${Date.now()}_${fileName}`;

      console.log(`[FileService] Attempting to upload file. Path: ${filePath}`);
      
      // Read file as base64 and create blob more directly
      console.log('Reading file as base64...');
      const base64Data = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      console.log('File read as base64, length:', base64Data.length);
      
      if (base64Data.length === 0) {
        throw new Error('File is empty after reading');
      }

      // Try direct file upload first (this sometimes works better with React Native)
      console.log('Attempting direct file upload...');
      let uploadSuccess = false;
      
      try {
        // Try uploading the file directly without blob conversion
        const { data: directUploadData, error: directUploadError } = await supabase.storage
          .from(this.BUCKET_NAME)
          .upload(filePath, fileUri, {
            contentType: mimeType,
            upsert: false
          });

        if (!directUploadError) {
          console.log('Direct file upload successful:', directUploadData);
          uploadSuccess = true;
        } else {
          console.log('Direct upload failed, trying blob method:', directUploadError);
        }
      } catch (directError) {
        console.log('Direct upload error:', directError);
      }

      // If direct upload failed, try blob method
      if (!uploadSuccess) {
        console.log('Trying blob upload method...');
        
        // Create a data URL and use fetch to create a blob (React Native compatible)
        const dataUrl = `data:${mimeType};base64,${base64Data}`;
        console.log('Created data URL, length:', dataUrl.length);
        
        const response = await fetch(dataUrl);
        if (!response.ok) {
          throw new Error(`Failed to create blob from data URL: ${response.status}`);
        }
        const blob = await response.blob();
        console.log('Blob created from data URL:', { size: blob.size, type: blob.type });
        
        if (blob.size === 0) {
          throw new Error('Blob is empty - the file may be corrupted');
        }

        // Verify blob has content
        console.log('Blob verification - size:', blob.size, 'type:', blob.type);
        
        if (blob.size < 100) {
          console.warn('Blob size is very small, but continuing with upload');
        }

        // Upload to Supabase Storage with simpler options
        console.log('Uploading to Supabase storage...');
        
        const uploadOptions = {
          contentType: mimeType,
          upsert: false
        };
        
        console.log('Upload options:', uploadOptions);
        console.log('Blob details before upload:', { size: blob.size, type: blob.type });
        console.log('File path for upload:', filePath);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(this.BUCKET_NAME)
          .upload(filePath, blob, uploadOptions);

        console.log('[FileService] Storage upload response:', { uploadData, uploadError });
        if (uploadError) {
          console.error('Upload error details:', uploadError);
          throw new Error(`Upload failed: ${uploadError.message}`);
        }
      }

      // Verify the uploaded file by downloading it
      console.log('Verifying uploaded file...');
      const { data: verifyData, error: verifyError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .download(filePath);
      
      if (verifyError) {
        console.error('Error verifying uploaded file:', verifyError);
      } else {
        console.log('Uploaded file verification - size:', verifyData?.size, 'type:', verifyData?.type);
        if (verifyData && verifyData.size > 0) {
          console.log('✅ Uploaded file is valid and has content');
        } else {
          console.warn('⚠️ Uploaded file appears to be empty');
        }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      // Save metadata to database
      const fileData: FileInsert = {
        card_id: cardId,
        user_id: userId,
        name: fileName,
        type: type,
        url: urlData.publicUrl,
        size: fileInfo.size || null,
        mime_type: mimeType,
      };

      console.log('[FileService] Attempting to insert file metadata into db:', fileData);
      console.log('[FileService] Card ID being used:', cardId);
      console.log('[FileService] User ID being used:', userId);
      
      const { data: dbData, error: dbError } = await supabase
        .from('files')
        .insert(fileData)
        .select()
        .single();

      console.log('[FileService] Database insert response:', { dbData, dbError });
      if (dbError) {
        console.error('[FileService] Database error details:', dbError);
        // Clean up uploaded file if database insert fails
        await supabase.storage.from(this.BUCKET_NAME).remove([filePath]);
        throw new Error(`Database insert failed: ${dbError.message}`);
      }

      return {
        success: true,
        url: urlData.publicUrl,
        fileId: dbData.id,
      };
    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Upload a voice note to Supabase Storage and save metadata to database
   */
  static async uploadVoiceNote(
    fileUri: string,
    cardId: string,
    userId: string,
    duration: number,
    name?: string
  ): Promise<VoiceNoteUploadResult> {
    try {
      // Validate UUID format
      if (!isValidUUID(cardId)) {
        throw new Error('Invalid card ID format');
      }

      console.log('=== VOICE NOTE UPLOAD DEBUG START ===');
      console.log('Input fileUri:', fileUri);
      console.log('Card ID:', cardId);
      console.log('User ID:', userId);
      console.log('Duration:', duration);
      console.log('Name:', name);

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      console.log('File info from FileSystem:', fileInfo);
      
      if (!fileInfo.exists) {
        throw new Error('Voice note file does not exist');
      }

      if (!fileInfo.size || fileInfo.size === 0) {
        throw new Error('Voice note file is empty');
      }

      console.log('[FileService] Voice note file info:', {
        uri: fileUri,
        size: fileInfo.size,
        exists: fileInfo.exists
      });

      // Create unique file path - use files bucket with voice-notes subdirectory
      const fileName = name || `voice_note_${Date.now()}.m4a`;
      const filePath = `${userId}/voice-notes/${cardId}_${Date.now()}.m4a`;
      console.log('File path for upload:', filePath);

      // Determine the correct MIME type based on file extension
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'm4a';
      let mimeType = 'audio/m4a';
      switch (fileExtension) {
        case 'm4a': mimeType = 'audio/m4a'; break;
        case 'mp3': mimeType = 'audio/mpeg'; break;
        case 'wav': mimeType = 'audio/wav'; break;
        default: mimeType = 'audio/m4a';
      }
      console.log('[FileService] Using MIME type:', mimeType, 'for extension:', fileExtension);

      // Read file as base64 and create blob more directly
      console.log('Reading file as base64...');
      const base64Data = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      console.log('File read as base64, length:', base64Data.length);
      
      if (base64Data.length === 0) {
        throw new Error('File is empty after reading');
      }

      // Always use blob method for voice notes (direct upload doesn't work with React Native file URIs)
      console.log('Creating blob for voice note upload...');
      
      // Use base64 upload method for better reliability
      console.log('Using base64 upload method...');
      
      // Convert base64 to binary blob for proper audio file upload
      console.log('Converting base64 to binary blob...');
      const bytes = Buffer.from(base64Data, 'base64');
      
      console.log('Binary blob created, size:', bytes.length);
      
      // Upload binary data to Supabase
      console.log('Uploading binary data to Supabase storage...');
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, bytes, {
          contentType: mimeType,
          upsert: false
        });
      
      console.log('[FileService] Storage upload response:', { uploadData, uploadError });
      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      // Verify the uploaded file
      console.log('Verifying uploaded file...');
      const { data: verifyData, error: verifyError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .download(filePath);
      
      if (verifyError) {
        console.error('Error verifying uploaded file:', verifyError);
      } else {
        console.log('Uploaded file verification - size:', verifyData?.size, 'type:', verifyData?.type);
        if (verifyData && verifyData.size > 0) {
          console.log('✅ Uploaded file is valid and has content');
        } else {
          console.warn('⚠️ Uploaded file appears to be empty');
        }
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);
      
      console.log('Public URL generated:', urlData.publicUrl);
      
      // Save metadata to database
      const voiceNoteData: VoiceNoteInsert = {
        card_id: cardId,
        user_id: userId,
        name: name || null,
        url: urlData.publicUrl,
        duration: duration,
        size: fileInfo.size || null,
      };
      
      console.log('[FileService] Attempting to insert voice note metadata into db:', voiceNoteData);
      console.log('[FileService] Card ID being used for voice note:', cardId);
      console.log('[FileService] User ID being used for voice note:', userId);
      
      const { data: dbData, error: dbError } = await supabase
        .from('voice_notes')
        .insert(voiceNoteData)
        .select()
        .single();
      
      console.log('[FileService] Voice note database insert response:', { dbData, dbError });
      if (dbError) {
        console.error('[FileService] Voice note database error details:', dbError);
        // Clean up uploaded file if database insert fails
        await supabase.storage.from(this.BUCKET_NAME).remove([filePath]);
        throw new Error(`Database insert failed: ${dbError.message}`);
      }
      
      console.log('=== VOICE NOTE UPLOAD DEBUG END ===');
      return {
        success: true,
        url: urlData.publicUrl,
        voiceNoteId: dbData.id,
      };
    } catch (error) {
      console.error('=== VOICE NOTE UPLOAD ERROR ===');
      console.error('Voice note upload error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all files for a specific card
   */
  static async getFilesByCardId(cardId: string, userId: string) {
    try {
      // Validate UUID format
      if (!isValidUUID(cardId)) {
        console.error('Invalid card ID format:', cardId);
        return [];
      }

      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('card_id', cardId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching files:', error);
      return [];
    }
  }

  /**
   * Get all voice notes for a specific card
   */
  static async getVoiceNotesByCardId(cardId: string, userId: string) {
    try {
      // Validate UUID format
      if (!isValidUUID(cardId)) {
        console.error('Invalid card ID format:', cardId);
        return [];
      }

      const { data, error } = await supabase
        .from('voice_notes')
        .select('*')
        .eq('card_id', cardId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching voice notes:', error);
      return [];
    }
  }

  /**
   * Delete a file from storage and database
   */
  static async deleteFile(fileId: string, userId: string): Promise<boolean> {
    try {
      // Get file info from database
      const { data: file, error: fetchError } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !file) {
        throw new Error('File not found or access denied');
      }

      // Extract file path from URL
      const filePath = this.extractFilePathFromUrl(file.url, this.BUCKET_NAME);

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (storageError) {
        console.warn('Storage deletion failed:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId)
        .eq('user_id', userId);

      if (dbError) {
        throw new Error(`Database deletion failed: ${dbError.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Delete a voice note from storage and database
   */
  static async deleteVoiceNote(voiceNoteId: string, userId: string): Promise<boolean> {
    try {
      // Get voice note info from database
      const { data: voiceNote, error: fetchError } = await supabase
        .from('voice_notes')
        .select('*')
        .eq('id', voiceNoteId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !voiceNote) {
        throw new Error('Voice note not found or access denied');
      }

      // Extract file path from URL
      const filePath = this.extractFilePathFromUrl(voiceNote.url, this.BUCKET_NAME);

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (storageError) {
        console.warn('Storage deletion failed:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('voice_notes')
        .delete()
        .eq('id', voiceNoteId)
        .eq('user_id', userId);

      if (dbError) {
        throw new Error(`Database deletion failed: ${dbError.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting voice note:', error);
      return false;
    }
  }

  /**
   * Update file metadata
   */
  static async updateFile(fileId: string, userId: string, updates: FileUpdate): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('files')
        .update(updates)
        .eq('id', fileId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error updating file:', error);
      return false;
    }
  }

  /**
   * Update voice note metadata
   */
  static async updateVoiceNote(voiceNoteId: string, userId: string, updates: VoiceNoteUpdate): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('voice_notes')
        .update(updates)
        .eq('id', voiceNoteId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error updating voice note:', error);
      return false;
    }
  }

  /**
   * Get MIME type from file extension
   */
  private static getMimeType(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      mp4: 'video/mp4',
      mov: 'video/quicktime',
      m4a: 'audio/m4a',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Extract file path from Supabase storage URL
   */
  private static extractFilePathFromUrl(url: string, bucketName: string): string {
    const parts = url.split(`${bucketName}/`);
    return parts.length > 1 ? parts[1] : '';
  }

  /**
   * Get all files for a user (across all cards)
   */
  static async getAllFiles(userId: string): Promise<File[]> {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching all files:', error.message);
      return [];
    }
  }

  /**
   * Get all voice notes for a user (across all cards)
   */
  static async getAllVoiceNotes(
    userId: string
  ): Promise<VoiceNote[]> {
    try {
      const { data, error } = await supabase
        .from('voice_notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching all voice notes:', error.message);
      return [];
    }
  }

  /**
   * Get a signed URL for a voice note to enable proper downloading
   */
  static async getVoiceNoteSignedUrl(voiceNoteId: string, userId: string): Promise<string | null> {
    try {
      console.log('=== GET SIGNED URL DEBUG START ===');
      console.log('Voice note ID:', voiceNoteId);
      console.log('User ID:', userId);
      
      // Get voice note info from database
      const { data: voiceNote, error: fetchError } = await supabase
        .from('voice_notes')
        .select('*')
        .eq('id', voiceNoteId)
        .eq('user_id', userId)
        .single();

      console.log('Voice note fetch result:', { voiceNote, fetchError });

      if (fetchError || !voiceNote) {
        console.error('Voice note not found or access denied:', fetchError);
        return null;
      }

      console.log('Voice note URL:', voiceNote.url);
      console.log('Voice note size:', voiceNote.size);
      console.log('Voice note duration:', voiceNote.duration);

      // Extract file path from URL
      const filePath = this.extractFilePathFromUrl(voiceNote.url, this.BUCKET_NAME);
      console.log('Extracted file path:', filePath);

      // Check if the file exists in storage first
      console.log('Checking if file exists in storage...');
      const { data: fileExists, error: existsError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(filePath.split('/').slice(0, -1).join('/'));

      console.log('File existence check:', { fileExists, existsError });

      // Get signed URL (valid for 1 hour)
      console.log('Creating signed URL for bucket:', this.BUCKET_NAME);
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      console.log('Signed URL result:', { signedUrlData, signedUrlError });

      if (signedUrlError) {
        console.error('Error creating signed URL:', signedUrlError);
        return null;
      }

      console.log('=== GET SIGNED URL DEBUG END ===');
      return signedUrlData.signedUrl;
    } catch (error) {
      console.error('=== GET SIGNED URL ERROR ===');
      console.error('Error getting signed URL for voice note:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return null;
    }
  }

  /**
   * Get a signed URL for a file to enable proper downloading
   */
  static async getFileSignedUrl(fileId: string, userId: string): Promise<string | null> {
    try {
      // Get file info from database
      const { data: file, error: fetchError } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !file) {
        console.error('File not found or access denied:', fetchError);
        return null;
      }

      // Extract file path from URL
      const filePath = this.extractFilePathFromUrl(file.url, this.BUCKET_NAME);

      // Get signed URL (valid for 1 hour)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (signedUrlError) {
        console.error('Error creating signed URL:', signedUrlError);
        return null;
      }

      return signedUrlData.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL for file:', error);
      return null;
    }
  }
} 