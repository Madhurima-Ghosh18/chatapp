import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "./firebase";

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

  const storageRef = ref(storage, `${folder}${date.getTime()}_${file.name}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
      },
      (error) => {
        reject("Something went wrong! " + error.code);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          resolve(downloadURL);
        });
      }
    );
  });
};

export default upload;
