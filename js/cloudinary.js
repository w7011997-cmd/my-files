// cloudinary.js
// Talks to Cloudinary directly from the device using an UNSIGNED upload preset.
// No API secret lives in this app. Because of that, this app can only add
// files — deleting from Cloudinary itself requires a signed Admin API call,
// which needs the secret. "Remove" in this app only forgets the local record;
// see README for how to actually delete assets if you ever need to.

const Cloudinary = {
  upload(file, { cloudName, uploadPreset }, onProgress) {
    return new Promise((resolve, reject) => {
      if (!cloudName || !uploadPreset) {
        reject(new Error("Add your Cloudinary cloud name and upload preset in Settings first."));
        return;
      }

      const resourceType = file.type.startsWith("video/") ? "video" : "auto";
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", "my-files");

      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        try {
          const res = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({
              url: res.secure_url,
              publicId: res.public_id,
              resourceType: res.resource_type,
              format: res.format,
              bytes: res.bytes,
              originalName: file.name,
              mimeType: file.type,
            });
          } else {
            reject(new Error(res.error?.message || "Upload failed"));
          }
        } catch (e) {
          reject(new Error("Unexpected response from Cloudinary"));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(formData);
    });
  },
};
