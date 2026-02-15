import { db } from "./db";

/**
 * Export all sales data to CSV format
 */
export async function exportSalesToCSV(): Promise<void> {
  try {
    const sales = await db.sales.toArray();
    const saleItems = await db.sale_items.toArray();

    // Create CSV header
    let csv =
      "Sale ID,Date,Time,Total Amount,Items Count,Customer Cash,Change,Product Name,Quantity,Price,Subtotal\n";

    // Add data rows
    for (const sale of sales) {
      const items = saleItems.filter((item) => item.sale_id === sale.id);

      if (items.length === 0) {
        // Sale with no items
        csv += `${sale.id},"${formatDate(sale.sale_date)}","${formatTime(sale.sale_date)}",${sale.total_amount},${sale.items_count},${sale.customer_cash || 0},${sale.change || 0},"","","",""\n`;
      } else {
        // Sale with items
        items.forEach((item, index) => {
          if (index === 0) {
            // First item includes sale info
            csv += `${sale.id},"${formatDate(sale.sale_date)}","${formatTime(sale.sale_date)}",${sale.total_amount},${sale.items_count},${sale.customer_cash || 0},${sale.change || 0},"${item.product_name}",${item.quantity},${item.price},${item.subtotal}\n`;
          } else {
            // Other items just have product info
            csv += `${sale.id},"","","","","","","${item.product_name}",${item.quantity},${item.price},${item.subtotal}\n`;
          }
        });
      }
    }

    // Download CSV file
    downloadFile(csv, "sales-export.csv", "text/csv");
  } catch (error) {
    console.error("Failed to export sales:", error);
    throw error;
  }
}

/**
 * Export all products to CSV
 */
export async function exportProductsToCSV(): Promise<void> {
  try {
    const products = await db.products.toArray();

    let csv = "ID,Name,Price,Active\n";

    products.forEach((product) => {
      csv += `${product.id},"${product.name}",${product.price},${product.is_active ? "Yes" : "No"}\n`;
    });

    downloadFile(csv, "products-export.csv", "text/csv");
  } catch (error) {
    console.error("Failed to export products:", error);
    throw error;
  }
}

/**
 * Create a complete backup of all data as JSON
 */
export async function createBackup(): Promise<void> {
  try {
    const products = await db.products.toArray();
    const sales = await db.sales.toArray();
    const saleItems = await db.sale_items.toArray();

    const backup = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      data: {
        products,
        sales,
        saleItems,
      },
      stats: {
        totalProducts: products.length,
        totalSales: sales.length,
        totalSaleItems: saleItems.length,
        totalRevenue: sales.reduce((sum, sale) => sum + sale.total_amount, 0),
      },
    };

    const json = JSON.stringify(backup, null, 2);
    const date = new Date().toISOString().split("T")[0];
    downloadFile(json, `pandehabibi-backup-${date}.json`, "application/json");
  } catch (error) {
    console.error("Failed to create backup:", error);
    throw error;
  }
}

/**
 * Restore data from a backup JSON file
 */
export async function restoreBackup(
  file: File,
): Promise<{ success: boolean; message: string }> {
  try {
    const text = await file.text();
    const backup = JSON.parse(text);

    // Validate backup structure
    if (
      !backup.data ||
      !backup.data.products ||
      !backup.data.sales ||
      !backup.data.saleItems
    ) {
      return {
        success: false,
        message: "Invalid backup file format",
      };
    }

    // Clear existing data
    await db.transaction(
      "rw",
      [db.products, db.sales, db.sale_items],
      async () => {
        await db.products.clear();
        await db.sales.clear();
        await db.sale_items.clear();

        // Restore data
        await db.products.bulkAdd(backup.data.products);
        await db.sales.bulkAdd(backup.data.sales);
        await db.sale_items.bulkAdd(backup.data.saleItems);
      },
    );

    return {
      success: true,
      message: `Backup restored! ${backup.stats.totalProducts} products, ${backup.stats.totalSales} sales`,
    };
  } catch (error) {
    console.error("Failed to restore backup:", error);
    return {
      success: false,
      message: "Failed to restore backup. Please check the file.",
    };
  }
}

/**
 * Helper: Download a file
 */
function downloadFile(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Helper: Format date
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Helper: Format time
 */
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get storage usage info
 */
export async function getStorageInfo(): Promise<{
  products: number;
  sales: number;
  saleItems: number;
  totalRevenue: number;
}> {
  const products = await db.products.count();
  const sales = await db.sales.toArray();
  const saleItems = await db.sale_items.count();
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);

  return {
    products,
    sales: sales.length,
    saleItems,
    totalRevenue,
  };
}
