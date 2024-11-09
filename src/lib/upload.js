// import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
// import { storage } from "./firebase";

// const upload = async (file) => {
//   const date = new Date();
//   const fileExtension = file.name.split('.').pop().toLowerCase();
//   let folder = 'others/';

//   // Organizing files based on their type
//   if (['jpg', 'jpeg', 'png', 'svg', 'gif', 'webp'].includes(fileExtension)) {
//     folder = 'images/';
//   } else if (['pdf', 'doc', 'docx', 'ppt', 'txt', 'xls', 'xlsx'].includes(fileExtension)) {
//     folder = 'documents/';
//   }

//   const storageRef = ref(storage, `${folder}${date.getTime()}_${file.name}`);
//   const uploadTask = uploadBytesResumable(storageRef, file);

//   return new Promise((resolve, reject) => {
//     uploadTask.on(
//       "state_changed",
//       (snapshot) => {
//         const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
//         console.log('Upload is ' + progress + '% done');
//       },
//       (error) => {
//         reject("Something went wrong! " + error.code);
//       },
//       () => {
//         getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
//           resolve(downloadURL);
//         });
//       }
//     );
//   });
// };

// export default upload;
// Importing Cloudinary is no longer necessary since we're using a direct API call

const upload = async (file) => {
  const date = new Date();
  const fileExtension = file.name.split('.').pop().toLowerCase();
  let folder = 'others/';

  // Organizing files based on their type
  if (['jpg', 'jpeg', 'png', 'svg', 'gif', 'webp'].includes(fileExtension)) {
    folder = 'images/';
  } else if (['pdf', 'doc', 'docx', 'ppt', 'txt', 'xls', 'xlsx'].includes(fileExtension)) {
    folder = 'documents/';
  }

  const formData = new FormData();
  formData.append('file', file);  // File from the file input
  formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET); // Cloudinary upload preset
  formData.append('folder', folder);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url;  // URL of the uploaded file on Cloudinary
    } else {
      throw new Error('Failed to upload to Cloudinary');
    }
  } catch (error) {
    console.error("Something went wrong:", error.message);
    throw error;
  }
};

export default upload;
