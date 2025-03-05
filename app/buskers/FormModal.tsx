import React, { useState, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { BuskerType } from '@/types/supabase';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';

// Props for the modal form
interface BuskerModalFormProps {
  initialData?: BuskerType | null;
  isEditMode: boolean;
  onClose: () => void;
  userId?: string;
  email?: string;
  userName?: string;
}

// Updated form schema with more comprehensive validation
const formSchema = z.object({
  genre: z
    .string()
    .min(2, { message: 'Genre must be at least 2 characters.' })
    .max(50, { message: 'Genre must be less than 50 characters.' }),
  description: z
    .string()
    .min(10, { message: 'Description must be at least 10 characters.' })
    .max(500, { message: 'Description must be less than 500 characters.' }),
  youtubeUrl: z.string().optional(),
  instagramUrl: z.string().optional(),
  websiteUrl: z.string().optional(),
  tipUrl: z.string().optional(),
  location: z
    .string()
    .min(3, { message: 'Location must be at least 3 characters.' })
    .max(100, { message: 'Location must be less than 100 characters.' }),
  mainPhoto: z
    .string()
    .url({ message: 'Please upload a valid photo.' })
    .optional(),
});

type FormSchemaType = z.infer<typeof formSchema>;

// Type definitions for form
declare global {
  interface Window {
    initAutocomplete?: () => void;
  }
}

const BuskerModalForm: React.FC<BuskerModalFormProps> = ({
  initialData,
  isEditMode,
  onClose,
  userId,
  email,
  userName,
}) => {
  // Initialize the form with default or existing values
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      genre: initialData?.genre || '',
      description: initialData?.description || '',
      mainPhoto: initialData?.main_photo || '',
      youtubeUrl: initialData?.youtube_url || '',
      instagramUrl: initialData?.instagram_url || '',
      websiteUrl: initialData?.website_url || '',
      tipUrl: initialData?.tip_url || '',
      location: initialData?.location || '',
    },
  });

  const [mainPhotoUrl, setMainPhotoUrl] = useState<string>(
    initialData?.main_photo || ''
  );
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const locationValue = watch('location');

  // Handle location change
  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setValue('location', e.target.value);
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    try {
      setIsUploading(true);

      // Create a unique file name to prevent conflicts
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;

      // Simplified file path structure
      const filePath = `${userId}/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('buskers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL for the uploaded file
      const { data } = supabase.storage.from('buskers').getPublicUrl(filePath);

      if (data) {
        const photoUrl = data.publicUrl;
        setMainPhotoUrl(photoUrl);
        setValue('mainPhoto', photoUrl);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const onSubmit = async (formData: FormSchemaType) => {
    if (!userId || !userName) {
      toast.error('User information is missing');
      return;
    }

    // Map form data to Supabase table structure
    const buskerData = {
      user_id: userId,
      user_name: userName,
      email: email || '',
      genre: formData.genre,
      description: formData.description,
      location: formData.location,
      main_photo: formData.mainPhoto || '',
      youtube_url: formData.youtubeUrl || '',
      instagram_url: formData.instagramUrl || '',
      website_url: formData.websiteUrl || '',
      tip_url: formData.tipUrl || '',
    };

    try {
      if (isEditMode && initialData?.id) {
        // Update existing record
        const { error } = await supabase
          .from('buskers')
          .update(buskerData)
          .eq('id', initialData.id)
          .eq('user_id', userId); // Ensure user owns this profile

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase.from('buskers').insert(buskerData);

        if (error) throw error;
      }

      onClose();
      toast.success(
        `Busker profile ${isEditMode ? 'updated' : 'created'} successfully!`
      );
    } catch (error) {
      console.error(`${isEditMode ? 'Edit' : 'Create'} Busker Error:`, error);
      toast.error(
        `Failed to ${
          isEditMode ? 'update' : 'create'
        } busker profile. Please try again.`
      );
    }
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      className="relative"
    >
      <form
        ref={formRef}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Genre:
          </label>
          <select
            {...register('genre')}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="Musician">Musician</option>
            <option value="Dancer">Dancer</option>
            <option value="Magician">Magician</option>
            <option value="Artist">Artist</option>
            <option value="Circus">Circus</option>
            <option value="Statue">Statue</option>
            <option value="Performer">Performer</option>
            <option value="Other">Other</option>
          </select>
          {errors.genre && (
            <p className="text-red-500 text-xs italic">
              {errors.genre.message}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Location:
          </label>
          <select
            {...register('location')}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            onChange={handleLocationChange}
            value={locationValue}
          >
            <option value="">Select a state or territory</option>
            <option value="NSW">New South Wales (NSW)</option>
            <option value="NT">Northern Territory (NT)</option>
            <option value="QLD">Queensland (QLD)</option>
            <option value="SA">South Australia (SA)</option>
            <option value="TAS">Tasmania (TAS)</option>
            <option value="VIC">Victoria (VIC)</option>
            <option value="WA">Western Australia (WA)</option>
            <option value="ACT">Australian Capital Territory (ACT)</option>
          </select>
          {errors.location && (
            <p className="text-red-500 text-xs italic">
              {errors.location.message}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Description:
          </label>
          <textarea
            {...register('description')}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Description"
            rows={4}
          />
          {errors.description && (
            <p className="text-red-500 text-xs italic">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Youtube (Optional):
          </label>
          <input
            {...register('youtubeUrl')}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter your YouTube URL"
          />
          {errors.youtubeUrl && (
            <p className="text-red-500 text-xs italic">
              {errors.youtubeUrl.message}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Instagram (Optional):
          </label>
          <input
            {...register('instagramUrl')}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter your Instagram URL"
          />
          {errors.instagramUrl && (
            <p className="text-red-500 text-xs italic">
              {errors.instagramUrl.message}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Website (Optional):
          </label>
          <input
            {...register('websiteUrl')}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter your website URL"
          />
          {errors.websiteUrl && (
            <p className="text-red-500 text-xs italic">
              {errors.websiteUrl.message}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Tip Url (Optional):
          </label>
          <input
            {...register('tipUrl')}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter your tip URL"
          />
          {errors.tipUrl && (
            <p className="text-red-500 text-xs italic">
              {errors.tipUrl.message}
            </p>
          )}
        </div>

        <div className="mb-4 items-center flex flex-col gap-4">
          {mainPhotoUrl && (
            <div className="mt-4">
              <Image
                src={mainPhotoUrl}
                alt="Uploaded"
                width={200}
                height={200}
                className="rounded-lg object-cover"
              />
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          <Button
            type="button"
            onClick={handleUploadClick}
            disabled={isUploading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {isUploading ? 'Uploading...' : 'Upload Image'}
          </Button>

          <input type="hidden" {...register('mainPhoto')} />
        </div>

        <div className="flex justify-end">
          <Button type="submit">
            {isEditMode ? 'Update Profile' : 'Create Profile'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BuskerModalForm;
