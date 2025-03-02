'use client';

import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';

interface GalleryItem {
  url: string;
  type: 'image' | 'video';
}

interface GalleryUploadFormProps {
  initialGallery: GalleryItem[];
  onClose: () => void;
  userName: string;
  userId: string;
}

export const GalleryUploadForm: React.FC<GalleryUploadFormProps> = ({
  initialGallery,
  onClose,
  userName,
  userId,
}) => {
  const [galleryItems, setGalleryItems] =
    useState<GalleryItem[]>(initialGallery);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_GALLERY_ITEMS = 9;

  // Update gallery items in the database
  const updateGalleryInDB = async (items: GalleryItem[]) => {
    try {
      const { error } = await supabase
        .from('buskers')
        .update({ gallery_contents: items })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Gallery updated successfully');
    } catch (error) {
      console.error('Error updating gallery:', error);
      toast.error('Failed to update gallery');
    }
  };

  // Handle file selection
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (galleryItems.length >= MAX_GALLERY_ITEMS) {
      toast.error(
        `You can only have up to ${MAX_GALLERY_ITEMS} items in your gallery.`
      );
      return;
    }

    try {
      setIsUploading(true);

      // Determine file type
      const fileType = file.type.startsWith('image/') ? 'image' : 'video';
      if (!fileType.startsWith('image') && !fileType.startsWith('video')) {
        toast.error('Only image and video files are supported');
        return;
      }

      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;

      // Simplified file path structure
      const filePath = `${userId}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('buskers')
        .upload(filePath, file, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage.from('buskers').getPublicUrl(filePath);

      if (data) {
        const fileUrl = data.publicUrl;
        const newGalleryItems = [
          ...galleryItems,
          { url: fileUrl, type: fileType as 'image' | 'video' },
        ];

        setGalleryItems(newGalleryItems);
        await updateGalleryInDB(newGalleryItems);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle item removal
  const handleRemoveItem = async (indexToRemove: number) => {
    try {
      // Extract filename from URL to delete from storage
      const urlToRemove = galleryItems[indexToRemove].url;
      const urlParts = urlToRemove.split('/');
      const fileNameWithParams = urlParts[urlParts.length - 1];
      const fileName = fileNameWithParams.split('?')[0]; // Remove query params if any

      // First update the gallery list in state
      const updatedGallery = galleryItems.filter(
        (_, index) => index !== indexToRemove
      );
      setGalleryItems(updatedGallery);

      // Update in database
      await updateGalleryInDB(updatedGallery);

      // Try to remove the file from storage (this might fail if path is incorrect)
      try {
        const path = `${userName}/${fileName}`;
        await supabase.storage.from('buskers').remove([path]);
      } catch (storageError) {
        console.error('Could not remove file from storage:', storageError);
        // We continue anyway as the gallery was updated
      }

      toast.success('Item removed from gallery');
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  };

  // Save changes and close modal
  const handleSave = () => {
    onClose();
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          Gallery Items ({galleryItems.length}/{MAX_GALLERY_ITEMS})
        </h3>

        <Button
          onClick={handleUploadClick}
          disabled={isUploading || galleryItems.length >= MAX_GALLERY_ITEMS}
          className="flex items-center gap-2"
        >
          {isUploading ? 'Uploading...' : 'Add Item'}
          {!isUploading && <Plus size={16} />}
        </Button>

        <input
          type="file"
          accept="image/*,video/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {galleryItems.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          Your gallery is empty. Add some images or videos!
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {galleryItems.map((item, index) => (
            <div
              key={index}
              className="relative group rounded-lg overflow-hidden"
            >
              {item.type === 'video' ? (
                <video
                  src={item.url}
                  controls={false}
                  className="w-full h-32 object-cover"
                />
              ) : (
                <div className="relative h-32">
                  <Image
                    src={item.url}
                    alt={`Gallery item ${index}`}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => handleRemoveItem(index)}
                  className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1">
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Done</Button>
      </div>
    </div>
  );
};
