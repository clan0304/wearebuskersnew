'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';
import { GalleryUploadForm } from './GalleryUploadForm';
import { useAuth } from '@/hooks/useAuth';

interface GalleryUploaderProps {
  userName: string;
  initialGallery: Array<{ url: string; type: 'image' | 'video' }>;
  userId: string;
}

export const GalleryUploader = ({
  userName,
  initialGallery,
  userId,
}: GalleryUploaderProps) => {
  const { user } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="flex justify-end pr-10">
      {user?.id === userId && (
        <button
          className="bg-primary hover:opacity-70 rounded-full px-7 py-2 font-semibold text-white"
          onClick={() => setIsModalOpen(true)}
        >
          Manage Gallery
        </button>
      )}

      <Modal title="Manage Gallery" isOpen={isModalOpen} onClose={closeModal}>
        <GalleryUploadForm
          initialGallery={initialGallery}
          onClose={closeModal}
          userName={userName}
          userId={userId}
        />
      </Modal>
    </div>
  );
};
