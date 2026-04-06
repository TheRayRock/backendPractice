import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // console.log("File uploaded successfully to Cloudinary", response.url);
    fs.unlinkSync(localFilePath); // remove the local file after successful upload
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the local file after upload attempt
    console.error("Error uploading file to Cloudinary", error);
    return null;
  }
};

cloudinary.uploader.upload(
  "https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg",
  {
    public_id: "shoes",
  },

  function (error, result) {
    console.log(result, error);
  },
);

export default uploadOnCloudinary;
