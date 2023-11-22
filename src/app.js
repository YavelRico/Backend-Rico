const express = require('express');
const ProductManager = require('./ProductManager');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const productManager = new ProductManager('./productos.json');

const app = express();
const port = 4000;

app.get('/products', async (req, res) => {
    try {
        const limit = req.query.limit;
        const products = await productManager.getProducts(limit);
        const resolvedProducts = await products;
        res.json(resolvedProducts);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.get('/products/:pid', async (req, res) => {
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

function addProduct() {
    rl.question('Introduce el nombre del producto: ', (title) => {
        rl.question('Introduce la descripción del producto: ', (description) => {
            rl.question('Introduce el precio del producto: ', (price) => {
                rl.question('Introduce la ruta de la imagen: ', (thumbnail) => {
                    rl.question('Introduce el código del producto: ', (code) => {
                        rl.question('Introduce el stock del producto: ', (stock) => {
                            productManager.addProduct({
                                title,
                                description,
                                price: parseFloat(price),
                                thumbnail,
                                code,
                                stock: parseInt(stock)
                            });
                            displayMenu();
                        });
                    });
                });
            });
        });
    });
}

function getProductById() {
    rl.question('Introduce el ID del producto: ', async (productId) => {
        const product = await productManager.getProductById(parseInt(productId));
        if (product) {
            console.log('Producto encontrado:', product);
        } else {
            console.log('Producto no encontrado');
        }
        displayMenu();
    });
}

function displayMenu() {
    console.log('\nOpciones:');
    console.log('1. Agregar Producto');
    console.log('2. Buscar Producto por ID');
    console.log('3. Mostrar Todos los Productos');
    console.log('4. Salir');
    rl.question('Elige una opción: ', (option) => {
        switch (option) {
            case '1':
                addProduct();
                break;
            case '2':
                getProductById();
                break;
            case '3':
                productManager.getProducts().then((allProducts) => {
                    console.log("\nTodos los productos:", allProducts);
                    displayMenu();
                });
                break;
            case '4':
                rl.close();
                break;
            default:
                console.log('Opción no válida. Por favor, elige una opción válida.');
                displayMenu();
                break;
        }
    });
}

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
    displayMenu();
});
