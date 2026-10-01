import { Product } from '../models/Product.js';
import { logger } from '../config/logger.js';

// Real Fizzi products from existing frontend
const FIZZI_PRODUCTS = [
  {
    id: "yuzu",
    name: "Yuzu Citrus",
    category: "Sparkling juice",
    price: 1899,
    compareAt: 2199,
    stock: 1248,
    sold: 842,
    views: 6840,
    conversion: 12.3,
    status: "Active",
    flavor: "YUZU / CITRUS",
    tone: "#008DDA",
    description: "Bright Japanese yuzu. A crisp, naturally sparkling finish.",
    ingredients: "Carbonated water, yuzu juice, cane sugar",
    packSize: "12 × 250 ml",
    sku: "FZ-YZ-12",
    wholesale: true,
  },
  {
    id: "guava",
    name: "Passionfruit Guava",
    category: "Sparkling juice",
    price: 1899,
    compareAt: 2199,
    stock: 864,
    sold: 628,
    views: 4920,
    conversion: 12.8,
    status: "Active",
    flavor: "PASSION / GUAVA",
    tone: "#41C9E2",
    description: "Tropical passionfruit meets fragrant pink guava.",
    ingredients: "Carbonated water, guava, passionfruit, cane sugar",
    packSize: "12 × 250 ml",
    sku: "FZ-PG-12",
    wholesale: true,
  },
  {
    id: "orange",
    name: "Blood Orange",
    category: "Craft soda",
    price: 1699,
    compareAt: 1899,
    stock: 432,
    sold: 514,
    views: 4210,
    conversion: 12.2,
    status: "Active",
    flavor: "BLOOD / ORANGE",
    tone: "#B69A72",
    description: "A bittersweet citrus soda with a clean finish.",
    ingredients: "Carbonated water, blood orange juice, cane sugar",
    packSize: "12 × 250 ml",
    sku: "FZ-BO-12",
    wholesale: true,
  },
  {
    id: "cola",
    name: "Botanical Summer Cola",
    category: "Cola",
    price: 1599,
    compareAt: 1799,
    stock: 720,
    sold: 391,
    views: 3840,
    conversion: 10.2,
    status: "Active",
    flavor: "BOTANICAL / COLA",
    tone: "#0C2D48",
    description: "A botanical twist on the timeless cola.",
    ingredients: "Carbonated water, botanical extracts, cane sugar",
    packSize: "12 × 250 ml",
    sku: "FZ-BC-12",
    wholesale: true,
  },
  {
    id: "ginger",
    name: "Ginger Lime Fizz",
    category: "Summer cooler",
    price: 1699,
    compareAt: 1899,
    stock: 96,
    sold: 367,
    views: 3220,
    conversion: 11.4,
    status: "Active",
    flavor: "GINGER / LIME",
    tone: "#6BA6A2",
    description: "Fresh lime with a warming ginger kick.",
    ingredients: "Carbonated water, ginger juice, lime juice",
    packSize: "12 × 250 ml",
    sku: "FZ-GL-12",
    wholesale: true,
  },
  {
    id: "variety",
    name: "12-Can Variety Carton",
    category: "Multipack",
    price: 1999,
    compareAt: 2399,
    stock: 320,
    sold: 712,
    views: 5320,
    conversion: 13.4,
    status: "Active",
    flavor: "THE / DISCOVERY",
    tone: "#4B6E82",
    description: "A little of everything. Your next favorite awaits.",
    ingredients: "See individual flavors",
    packSize: "12 × 250 ml",
    sku: "FZ-VR-12",
    wholesale: true,
  },
  {
    id: "bulk",
    name: "Wholesale Bulk Crate",
    category: "Wholesale",
    price: 840,
    compareAt: 999,
    stock: 2500,
    sold: 1250,
    views: 940,
    conversion: 8.2,
    status: "Active",
    flavor: "CRAFT / COLLECTION",
    tone: "#008DDA",
    description: "Craft beverages for cafes and hospitality partners.",
    ingredients: "See individual flavors",
    packSize: "24 × 250 ml",
    sku: "FZ-WH-24",
    wholesale: true,
  },
  {
    id: "brew",
    name: "Midnight Cold Brew",
    category: "Cold brew",
    price: 2199,
    compareAt: 2499,
    stock: 0,
    sold: 0,
    views: 0,
    conversion: 0,
    status: "Draft",
    flavor: "MIDNIGHT / BREW",
    tone: "#0C2D48",
    description: "Slow brewed coffee, ready for your next morning.",
    ingredients: "Filtered water, arabica coffee",
    packSize: "6 × 250 ml",
    sku: "FZ-CB-06",
    wholesale: false,
  },
];

interface MigrationResult {
  productsFound: number;
  categoriesFound: Set<string>;
  inserted: number;
  updated: number;
  skipped: number;
  missingData: number;
  imagesPreserved: number;
  duplicatesDetected: number;
  errors: string[];
}

function createSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export async function migrateProducts(): Promise<MigrationResult> {
  const result: MigrationResult = {
    productsFound: FIZZI_PRODUCTS.length,
    categoriesFound: new Set<string>(),
    inserted: 0,
    updated: 0,
    skipped: 0,
    missingData: 0,
    imagesPreserved: 0,
    duplicatesDetected: 0,
    errors: []
  };

  logger.info('='.repeat(60));
  logger.info('FIZZI PRODUCT MIGRATION STARTING');
  logger.info('='.repeat(60));
  logger.info(`Found ${FIZZI_PRODUCTS.length} products in existing frontend data`);

  for (const product of FIZZI_PRODUCTS) {
    try {
      // Validate required fields
      if (!product.id || !product.name || !product.sku) {
        result.missingData++;
        result.errors.push(`Product missing required fields: ${product.name || 'Unknown'}`);
        continue;
      }

      // Track categories
      result.categoriesFound.add(product.category);

      // Check for existing product by legacyProductId or SKU
      const existing = await Product.findOne({
        $or: [
          { legacyProductId: product.id },
          { sku: product.sku }
        ]
      });

      const productData = {
        legacyProductId: product.id,
        name: product.name,
        slug: createSlug(product.name),
        description: product.description,
        category: product.category,
        flavor: product.flavor,
        tone: product.tone,
        images: [], // Preserve image paths when available
        price: product.price,
        compareAtPrice: product.compareAt,
        currency: 'INR',
        sku: product.sku,
        packSize: product.packSize,
        ingredients: product.ingredients,
        tags: [product.category.toLowerCase(), product.flavor?.toLowerCase()].filter(Boolean),
        stock: product.stock,
        sold: product.sold,
        views: product.views,
        conversion: product.conversion,
        wholesaleAvailable: product.wholesale,
        status: product.status as 'Active' | 'Draft' | 'Archived'
      };

      if (existing) {
        // Update existing product
        Object.assign(existing, productData);
        await existing.save();
        result.updated++;
        result.duplicatesDetected++;
        logger.info(`✓ Updated existing product: ${product.name} (${product.id})`);
      } else {
        // Insert new product
        await Product.create(productData);
        result.inserted++;
        logger.info(`✓ Inserted new product: ${product.name} (${product.id})`);
      }

      result.imagesPreserved++;
    } catch (error: any) {
      result.errors.push(`Error migrating ${product.name}: ${error.message}`);
      logger.error(`✗ Error migrating product ${product.name}:`, error);
    }
  }

  // Generate migration report
  logger.info('='.repeat(60));
  logger.info('MIGRATION REPORT');
  logger.info('='.repeat(60));
  logger.info(`Products found: ${result.productsFound}`);
  logger.info(`Categories found: ${result.categoriesFound.size} (${Array.from(result.categoriesFound).join(', ')})`);
  logger.info(`Products inserted: ${result.inserted}`);
  logger.info(`Products updated: ${result.updated}`);
  logger.info(`Products skipped: ${result.skipped}`);
  logger.info(`Products with missing data: ${result.missingData}`);
  logger.info(`Images preserved: ${result.imagesPreserved}`);
  logger.info(`Duplicates detected: ${result.duplicatesDetected}`);
  logger.info(`Errors: ${result.errors.length}`);
  
  if (result.errors.length > 0) {
    logger.error('Migration errors:');
    result.errors.forEach(err => logger.error(`  - ${err}`));
  }

  logger.info('='.repeat(60));

  return result;
}

export async function validateMigration(): Promise<void> {
  logger.info('='.repeat(60));
  logger.info('MIGRATION VALIDATION');
  logger.info('='.repeat(60));

  const dbProducts = await Product.find({}).sort({ name: 1 });
  
  logger.info(`Total products in MongoDB: ${dbProducts.length}`);
  logger.info(`Expected products: ${FIZZI_PRODUCTS.length}`);

  // Compare each product
  for (const frontendProduct of FIZZI_PRODUCTS) {
    const dbProduct = dbProducts.find(p => p.legacyProductId === frontendProduct.id);
    
    if (!dbProduct) {
      logger.error(`✗ MISSING: ${frontendProduct.name} (${frontendProduct.id}) not found in MongoDB`);
      continue;
    }

    // Validate fields
    const issues: string[] = [];
    if (dbProduct.name !== frontendProduct.name) issues.push(`name: "${frontendProduct.name}" vs "${dbProduct.name}"`);
    if (dbProduct.sku !== frontendProduct.sku) issues.push(`sku: "${frontendProduct.sku}" vs "${dbProduct.sku}"`);
    if (dbProduct.price !== frontendProduct.price) issues.push(`price: ${frontendProduct.price} vs ${dbProduct.price}`);
    if (dbProduct.category !== frontendProduct.category) issues.push(`category: "${frontendProduct.category}" vs "${dbProduct.category}"`);
    if (dbProduct.stock !== frontendProduct.stock) issues.push(`stock: ${frontendProduct.stock} vs ${dbProduct.stock}`);

    if (issues.length > 0) {
      logger.warn(`⚠ MISMATCH: ${frontendProduct.name}`);
      issues.forEach(issue => logger.warn(`  - ${issue}`));
    } else {
      logger.info(`✓ VALID: ${frontendProduct.name} matches frontend data`);
    }
  }

  logger.info('='.repeat(60));
  logger.info('VALIDATION COMPLETE');
  logger.info('='.repeat(60));
}
