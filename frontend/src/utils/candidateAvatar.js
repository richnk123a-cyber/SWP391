export function getCandidateAvatar(profile, user) {
  return profile?.avatarUrl || user?.avatarUrl || '';
}

export function readCandidateAvatar(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không đọc được ảnh.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Tệp ảnh không hợp lệ.'));
      image.onload = () => {
        try {
          const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Không xử lý được ảnh.');
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/webp', .86));
        } catch (error) { reject(error); }
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
