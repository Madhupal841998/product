import { getRepository } from 'typeorm';
import { Products } from '../entities/Product';
import { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import * as multer from 'multer';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const multerInstance = multer.default;
const upload = multerInstance({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 
  }
});

export class ProductController {
  public static async uploadProductImage(req:any, res: any): Promise<void> {
    try {
      const uploadSingle = upload.single('image');
      
      uploadSingle(req, res, async (err: any) => {
        if (err) {
          return res.status(400).json({ message: err.message });
        }

        if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded' });
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        res.status(200).json({ imageUrl });
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  public static async createProduct(req:any, res: any): Promise<void> {
    try {
      const uploadMultiple = upload.fields([
        { name: 'image0', maxCount: 1 },
        { name: 'image1', maxCount: 1 },
        { name: 'image2', maxCount: 1 },
        { name: 'image3', maxCount: 1 },
        { name: 'image4', maxCount: 1 }
      ]);

      uploadMultiple(req, res, async (err: any) => {
        if (err) {
          return res.status(400).json({ message: err.message });
        }
  
        const { sku, name, price, description, isactive } = req.body;
        
        if (!sku || !name || price === undefined) {
          return res.status(400).json({ message: 'SKU, name, and price are required fields' });
        }
        
        const productRepository = getRepository(Products);
        const existingProduct = await productRepository.findOne({ where: { sku } });
        
        if (existingProduct) {
          return res.status(409).json({ message: 'A product with this SKU already exists' });
        }
        
        const product = new Products();
        product.sku = sku;
        product.name = name;
        product.price = parseFloat(price);
        product.description = description || '';
        
        const images: string[] = [];
        if (req.files) {
          const files = req.files as { [fieldname: string]: Express.Multer.File[] };
          Object.keys(files).forEach(key => {
            if (files[key][0]) {
              images.push(`/uploads/${files[key][0].filename}`);
            }
          });
        }
        
        product.images = images;
        
        product.isactive = isactive !== undefined ? JSON.parse(isactive) : true;
        
        const savedProduct = await productRepository.save(product);
        res.status(201).json(savedProduct);
      });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  public static async updateProduct(req:any, res: any) {
    try {
      const { id } = req.params;
      const { sku, name, price, description, isactive, deletedImages } = req.body;
      
      const productRepository = getRepository(Products);
      const product = await productRepository.findOne(id);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      product.sku = sku || product.sku;
      product.name = name || product.name;
      product.price = price !== undefined ? parseFloat(price) : product.price;
      product.description = description || product.description;
      product.isactive = isactive !== undefined ? JSON.parse(isactive) : product.isactive;
      product.updatedat = new Date();
      if (deletedImages && deletedImages.length > 0) {
        product.images = product.images?.filter(image => !deletedImages.includes(image));
        
        deletedImages.forEach((image: any) => {
          const imagePath = path.join(__dirname, '../../public', image);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        });
      }
    
      const updatedProduct = await productRepository.save(product);
      res.status(200).json(updatedProduct);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  public static async updateProductImages(req:any, res: any) {
    try {
      const { id } = req.params;
      const productRepository = getRepository(Products);
      const product = await productRepository.findOne(id);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      const uploadMultiple = upload.fields([
        { name: 'image0', maxCount: 1 },
        { name: 'image1', maxCount: 1 },
        { name: 'image2', maxCount: 1 },
        { name: 'image3', maxCount: 1 },
        { name: 'image4', maxCount: 1 }
      ]);
      
      uploadMultiple(req, res, async (err: any) => {
        if (err) {
          return res.status(400).json({ message: err.message });
        }
        
        if (req.files && Object.keys(req.files).length > 0) {
          if (product.images && product.images.length > 0) {
            product.images.forEach(image => {
              const imagePath = path.join(__dirname, '../../public', image);
              if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
              }
            });
          }
          
          const files = req.files as { [fieldname: string]: Express.Multer.File[] };
          product.images = Object.keys(files).map(key => `/uploads/${files[key][0].filename}`);
        }
        
        const updatedProduct = await productRepository.save(product);
        res.status(200).json(updatedProduct);
      });
    } catch (error) {
      console.error('Error updating product images:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  public static async getProductById(req:any, res: any): Promise<void> {
    try {
      const { id } = req.params;
      const productRepository = getRepository(Products);
      const product = await productRepository.findOne(id);
      
      if (!product) {
        res.status(404).json({ message: 'Product not found' });
        return;
      }
      
      res.status(200).json(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }


  public static async getAllProducts(req:any, res: any): Promise<void> {
    try {
      const productRepository = getRepository(Products);
      const products = await productRepository.find();
      res.status(200).json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  public static async deleteProduct(req:any, res: any): Promise<void> {
    try {
      const { id } = req.params;
      const productRepository = getRepository(Products);
      const product = await productRepository.findOne(id);
      
      if (!product) {
        res.status(404).json({ message: 'Product not found' });
        return;
      }
      
      await productRepository.remove(product);
      res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}