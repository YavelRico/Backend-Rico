const express = require('express');
const ProductManager = require('./ProductManager');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const productManager = new ProductManager('./productos.json');

const app = express();
const port = 8080;

app.use(express.json());

const productsRouter = express.Router();
const cartsRouter = express.Router();

app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

productsRouter.get('/', async (req, res) => {
    try {
        const limit = req.query.limit;
        const products = await productManager.getProducts(limit);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

productsRouter.get('/:pid', async (req, res) => {
    try {
        const productId = parseInt(req.params.pid);
        const product = await productManager.getProductById(productId);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

cartsRouter.post('/:cid/product/:pid', async (req, res) => {
    try {
        const cartId = req.params.cid;
        const productId = req.params.pid;
        const quantity = req.body.quantity || 1;

        const cartExists = await readCart(cartId);
        if (!cartExists) {
            throw new Error('Carrito no encontrado');
        }

        const updatedCart = await addProductToCart(cartId, productId, quantity);
        res.json(updatedCart);
    } catch (error) {
        res.status(400).json({ error: 'Datos de producto no válidos' });
    }
});
productsRouter.put('/:pid', async (req, res) => {
    try {
        const productId = parseInt(req.params.pid);
        const updatedProduct = await productManager.updateProduct(productId, req.body);
        res.json(updatedProduct);
    } catch (error) {
        res.status(400).json({ error: 'Datos de producto no válidos' });
    }
});

productsRouter.delete('/:pid', async (req, res) => {
    try {
        const productId = parseInt(req.params.pid);
        await productManager.deleteProduct(productId);
        res.json({ message: 'Producto eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

cartsRouter.post('/', async (req, res) => {
    try {
        const cart = req.body;
        const createdCart = await createCart(cart);
        res.json(createdCart);
    } catch (error) {
        res.status(400).json({ error: 'Datos de carrito no válidos' });
    }
});

cartsRouter.get('/:cid', async (req, res) => {
    try {
        const cartId = req.params.cid;
        const cartProducts = await getCartProducts(cartId);
        res.json(cartProducts);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

cartsRouter.post('/:cid/product/:pid', async (req, res) => {
    try {
        const cartId = req.params.cid;
        const productId = req.params.pid;
        const quantity = req.body.quantity || 1;
        const updatedCart = await addProductToCart(cartId, productId, quantity);
        res.json(updatedCart);
    } catch (error) {
        res.status(400).json({ error: 'Datos de producto no válidos' });
    }
});

async function createCart(cart) {
    try {
        const cartId = Date.now().toString();
        const newCart = { id: cartId, products: [] }; 
        await saveCart(newCart);
        return newCart;
    } catch (error) {
        throw error;
    }
}


async function getCartProducts(cartId) {
    try {
        const cart = await readCart(cartId);
        if (!cart) {
            throw new Error('Carrito no encontrado');
        }
        return cart.products;
    } catch (error) {
        throw error;
    }
}

async function addProductToCart(cartId, productId, quantity) {
    try {
        const cart = await readCart(cartId);
        if (!cart) {
            throw new Error('Carrito no encontrado');
        }
        const existingProductIndex = cart.products.findIndex(product => product.productId === productId);
        if (existingProductIndex !== -1) {
            cart.products[existingProductIndex].quantity += quantity;
        } else {
            cart.products.push({
                productId,
                quantity
            });
        }
        await saveCart(cart);
        return cart;
    } catch (error) {
        throw error;
    }
}

async function saveCart(cart) {
    try {
        const filePath = `./carts/${cart.id}.json`;
        await fs.promises.writeFile(filePath, JSON.stringify(cart, null, 2), 'utf8');
    } catch (error) {
        throw error;
    }
}

async function readCart(cartId) {
    try {
        const filePath = `./carts/${cartId}.json`;
        const data = await fs.promises.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return null;
    }
}

function displayMenu() {
    console.log('\nOpciones:');
    console.log('1. Agregar Producto');
    console.log('2. Buscar Producto por ID');
    console.log('3. Mostrar Todos los Productos');
    console.log('4. Crear Nuevo Carrito');
    console.log('5. Agregar Producto a Carrito');
    console.log('6. Salir');
    rl.question('Elige una opción: ', async (option) => {
        switch (option) {
            case '1':
                await addProduct();
                break;
            case '2':
                await getProductById();
                break;
            case '3':
                await displayAllProducts();
                break;
            case '4':
                await createCart();
                break;
            case '5':
                await addProductToCart();
                break;
                case '6':
                    rl.close();
                    break;
                default:
                    console.log('Opción no válida. Por favor, elige una opción válida.');
            }
    
            if (option !== '6') {
                displayMenu();
            }
        });
    }
    
    async function addProductToCart(cartId, productId, quantity) {
        try {
            const cart = await readCart(cartId);
            if (!cart) {
                throw new Error('Carrito no encontrado');
            }
            const existingProductIndex = cart.products.findIndex(product => product.productId === productId);
            if (existingProductIndex !== -1) {
                cart.products[existingProductIndex].quantity += quantity;
            } else {
                cart.products.push({
                    productId,
                    quantity
                });
            }
            await saveCart(cart);
            return cart;
        } catch (error) {
            throw error;
        }
    }
    
    async function askForProductId() {
        return new Promise((resolve) => {
            rl.question('Ingrese el ID del producto a agregar: ', (productId) => {
                resolve(productId);
            });
        });
    }
    
    async function askForQuantity() {
        return new Promise((resolve) => {
            rl.question('Ingrese la cantidad del producto: ', (quantity) => {
                resolve(parseInt(quantity) || 1);
            });
        });
    }
    
    async function askForCartId() {
        return new Promise((resolve) => {
            rl.question('Ingrese el ID del carrito: ', (cartId) => {
                resolve(cartId);
            });
        });
    }

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
    displayMenu();
});
