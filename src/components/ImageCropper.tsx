import React, { useState } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropperProps {
  imageUrl: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropper({ imageUrl, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(width, height);
    setCrop(crop);
    setImageRef(e.currentTarget);
  };

  const centerCrop = (width: number, height: number): Crop => {
    const size = Math.min(width, height);
    const x = (width - size) / 2;
    const y = (height - size) / 2;
    return {
      unit: 'px',
      width: size,
      height: size,
      x,
      y,
    };
  };

  const getCroppedImg = async (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleSave = async () => {
    if (imageRef && crop) {
      try {
        const croppedImage = await getCroppedImg(imageRef, crop as PixelCrop);
        onCropComplete(croppedImage);
      } catch (e) {
        console.error('Error cropping image:', e);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Crop Profile Picture</h3>
        <div className="mb-4 overflow-auto max-h-[60vh]">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            aspect={1}
            circularCrop
          >
            <img
              src={imageUrl}
              onLoad={onImageLoad}
              alt="Crop me"
              className="max-w-full"
            />
          </ReactCrop>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}