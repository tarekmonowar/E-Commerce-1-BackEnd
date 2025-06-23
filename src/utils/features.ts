import { Product } from "../models/product.model.js";
import { OrderItemType } from "../types/types.js";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

export const reduceStock = async (orderItems: OrderItemType[]) => {
  for (let i = 0; i < orderItems.length; i++) {
    const order = orderItems[i];
    const product = await Product.findById(order.productId);
    if (!product) throw new Error("Product Not Found");
    product.stock -= order.quantity;
    await product.save();
  }
};

//
//
//
export const calculatePercentage = (thisMonth: number, lastMonth: number) => {
  if (lastMonth === 0) return thisMonth * 100;
  const percent = (thisMonth / lastMonth) * 100;
  //const percent = ((thisMonth - lastMonth) / lastMonth) * 100;
  return Number(percent.toFixed(0));
};

//
//
//

export const getInventories = async ({
  categories,
  productsCount,
}: {
  categories: string[];
  productsCount: number;
}) => {
  const categoriesCountPromise = categories.map((category) =>
    Product.countDocuments({ category }),
  );

  const categoriesCount = await Promise.all(categoriesCountPromise);

  const categoryCount: Record<string, number>[] = [];

  categories.forEach((category, i) => {
    categoryCount.push({
      [category]: Math.round((categoriesCount[i] / productsCount) * 100),
    });
  });

  return categoryCount;
};

//
//
//
//
interface MyDocument extends Document {
  createdAt: Date;
  discount?: number;
  total?: number;
}
type FuncProps = {
  length: number;
  docArr: MyDocument[];
  today: Date;
  property?: "discount" | "total";
};

export const getChartData = ({
  length,
  docArr,
  today,
  property,
}: FuncProps) => {
  const data: number[] = new Array(length).fill(0);

  docArr.forEach((i) => {
    const creationDate = i.createdAt;
    const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

    if (monthDiff < length) {
      if (property) {
        data[length - monthDiff - 1] += i[property]!;
      } else {
        data[length - monthDiff - 1] += 1;
      }
    }
  });

  return data;
};

export const uploadToCloudinary = async (files: Express.Multer.File[]) => {
  const uploadSingle = (
    file: Express.Multer.File,
  ): Promise<UploadApiResponse> => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream((error, result) => {
        if (error) return reject(error);
        resolve(result!); // <-- result is UploadApiResponse here
      });
      stream.end(file.buffer);
    });
  };

  const uploadPromises = files.map(uploadSingle);

  const results = await Promise.all(uploadPromises);

  return results.map((res) => ({
    public_id: res.public_id,
    url: res.secure_url,
  }));
};

//!its 8 npack code tae more time to save
// const getBase64 = (file: Express.Multer.File) => {
//   return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
// };

// export const uploadToCloudinary = async (files: Express.Multer.File[]) => {
//   const promise = files.map((file) => {
//     return new Promise<UploadApiResponse>((resolve, reject) => {
//       cloudinary.uploader.upload(getBase64(file), (error, result) => {
//         if (error) {
//           return reject(error);
//         }
//         resolve(result!);
//       });
//     });
//   });

//   const result = await Promise.all(promise);
//   return result.map((res) => ({
//     public_id: res.public_id,
//     url: res.secure_url,
//   }));
// };

export const deleteFromCloudinary = async (public_id: string[]) => {
  const promises = public_id.map((id) => {
    return new Promise<void>((resolve, reject) => {
      cloudinary.uploader.destroy(id, (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve();
      });
    });
  });
  await Promise.all(promises);
};
