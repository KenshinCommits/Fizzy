import { Request, Response } from 'express';
import { Product } from '../models/Product.js';
import { logger } from '../config/logger.js';

export class ProductController {
  async getProducts(req: Request, res: Response) {
    try {
      const { category, status, search, limit = 50, skip = 0 } = req.query;

      const filter: any = {};
      if (category) filter.category = category;
      if (status) filter.status = status;
      if (search) {
        filter.$text = { $search: search as string };
      }

      const products = await Product.find(filter)
        .sort({ name: 1 })
        .limit(parseInt(limit as string))
        .skip(parseInt(skip as string));

      const total = await Product.countDocuments(filter);

      res.json({ products, total });
    } catch (error) {
      logger.error('Get products error:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  }

  async getProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json({ product });
    } catch (error) {
      logger.error('Get product error:', error);
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  }

  async createProduct(req: Request, res: Response) {
    try {
      const product = await Product.create(req.body);
      logger.info(`Product created: ${product.name}`);
      res.status(201).json({ product });
    } catch (error) {
      logger.error('Create product error:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  }

  async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await Product.findByIdAndUpdate(id, req.body, { new: true });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      logger.info(`Product updated: ${product.name}`);
      res.json({ product });
    } catch (error) {
      logger.error('Update product error:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  }

  async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await Product.findByIdAndDelete(id);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      logger.info(`Product deleted: ${product.name}`);
      res.json({ message: 'Product deleted' });
    } catch (error) {
      logger.error('Delete product error:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  }
}

export const productController = new ProductController();
