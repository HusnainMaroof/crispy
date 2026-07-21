import { v2 as cloudinary } from "cloudinary";
import { envConfig } from "./env.js";

cloudinary.config({
  cloud_name: envConfig.CLOUDINARY.CLOUD_NAME,
  api_key: envConfig.CLOUDINARY.API_KEY,
  api_secret: envConfig.CLOUDINARY.API_SECRET,
  secure: true,
});

export default cloudinary;
