const fs = require('fs');

class ProductManager {
  constructor(path) {
    this.path = path;
  }

  async getProducts(limit) {
    const products = await this.readProducts();
    if (limit) {
      return products.slice(0, limit);
    }
    return products;
  }

  async getProductById(id) {
    const products = await this.readProducts();
    return products.find(product => product.id === id);
  }

  async addProduct(product) {
    const products = await this.readProducts();
    product.id = this.generateId(products);
    products.push(product);
    await this.saveProducts(products);
    return product;
  }

  async readProducts() {
    try {
      const data = await fs.promises.readFile(this.path, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  async saveProducts(products) {
    await fs.promises.writeFile(this.path, JSON.stringify(products, null, 2), 'utf8');
  }

  generateId(products) {
    return products.length > 0 ? Math.max(...products.map(product => product.id)) + 1 : 1;
  }
}

module.exports = ProductManager;
