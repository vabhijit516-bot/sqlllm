import sqlite3
import random
import os
from datetime import datetime, timedelta
from pathlib import Path
from db import DB_PATH

def seed_database():
    """Seeds the SQLite e-commerce database with rich mock data."""
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON;")

    # 1. Categories Table
    cursor.execute("""
    CREATE TABLE categories (
        category_id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_name TEXT NOT NULL UNIQUE,
        description TEXT
    );
    """)

    # 2. Products Table
    cursor.execute("""
    CREATE TABLE products (
        product_id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_name TEXT NOT NULL,
        category_id INTEGER,
        price REAL NOT NULL,
        stock_quantity INTEGER NOT NULL,
        rating REAL DEFAULT 4.5,
        FOREIGN KEY (category_id) REFERENCES categories(category_id)
    );
    """)

    # 3. Customers Table
    cursor.execute("""
    CREATE TABLE customers (
        customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        country TEXT NOT NULL,
        created_at DATE NOT NULL
    );
    """)

    # 4. Orders Table
    cursor.execute("""
    CREATE TABLE orders (
        order_id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        order_date DATE NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('Completed', 'Pending', 'Shipped', 'Cancelled')),
        payment_method TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
    );
    """)

    # 5. Order Items Table
    cursor.execute("""
    CREATE TABLE order_items (
        item_id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        product_id INTEGER,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(order_id),
        FOREIGN KEY (product_id) REFERENCES products(product_id)
    );
    """)

    # 6. Inventory Table
    cursor.execute("""
    CREATE TABLE inventory (
        inventory_id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER UNIQUE,
        warehouse_location TEXT NOT NULL,
        stock_level INTEGER NOT NULL,
        last_restocked DATE NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(product_id)
    );
    """)

    # 7. Reviews Table
    cursor.execute("""
    CREATE TABLE reviews (
        review_id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        customer_id INTEGER,
        rating INTEGER CHECK(rating BETWEEN 1 AND 5),
        comment TEXT,
        review_date DATE NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(product_id),
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
    );
    """)

    # Insert Categories
    categories_data = [
        ("Electronics", "Gadgets, laptops, audio gear, and smart devices"),
        ("Apparel", "Clothing, shoes, and fashion accessories"),
        ("Home & Kitchen", "Furniture, cookware, and home appliances"),
        ("Books", "Fiction, non-fiction, and technical literature"),
        ("Fitness & Sports", "Workout equipment, outdoor gear, and apparel")
    ]
    cursor.executemany("INSERT INTO categories (category_name, description) VALUES (?, ?);", categories_data)

    # Insert Products
    products_data = [
        ("Quantum X Laptop", 1, 1299.99, 45, 4.8),
        ("NoiseCancel Wireless Headphones", 1, 199.99, 120, 4.6),
        ("SmartWatch Ultra", 1, 299.50, 80, 4.5),
        ("Ergonomic Mesh Chair", 3, 249.00, 30, 4.7),
        ("Organic Cotton Hoodie", 2, 59.99, 200, 4.3),
        ("RunFast Sneakers", 2, 89.95, 150, 4.4),
        ("Pro Espresso Machine", 3, 449.00, 25, 4.9),
        ("Non-Stick Cookware Set", 3, 129.99, 60, 4.2),
        ("AI & Machine Learning Handbook", 4, 49.99, 300, 4.9),
        ("Python SQL Data Science", 4, 39.99, 250, 4.8),
        ("Adjustable Dumbbell Set", 5, 179.99, 40, 4.6),
        ("Yoga Mat Extra Thick", 5, 29.99, 180, 4.5),
        ("4K Ultra Monitor 32-inch", 1, 499.99, 50, 4.7),
        ("Mechanical RGB Keyboard", 1, 109.99, 90, 4.6),
        ("Hydration Stainless Bottle", 5, 24.99, 350, 4.4)
    ]
    cursor.executemany("INSERT INTO products (product_name, category_id, price, stock_quantity, rating) VALUES (?, ?, ?, ?, ?);", products_data)

    # Insert Customers
    first_names = ["Alice", "Bob", "Charlie", "Diana", "Ethan", "Fiona", "George", "Hannah", "Ian", "Julia", "Kevin", "Laura", "Marcus", "Nina", "Oscar"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson"]
    countries = ["United States", "United Kingdom", "Canada", "Germany", "India", "Japan", "Australia", "France"]
    
    customers_data = []
    base_date = datetime.now() - timedelta(days=365)
    for i in range(25):
        fn = first_names[i % len(first_names)]
        ln = last_names[(i * 3) % len(last_names)]
        email = f"{fn.lower()}.{ln.lower()}{i+1}@example.com"
        country = countries[i % len(countries)]
        created_at = (base_date + timedelta(days=random.randint(1, 100))).strftime("%Y-%m-%d")
        customers_data.append((fn, ln, email, country, created_at))
    
    cursor.executemany("INSERT INTO customers (first_name, last_name, email, country, created_at) VALUES (?, ?, ?, ?, ?);", customers_data)

    # Insert Orders & Order Items
    statuses = ["Completed", "Completed", "Completed", "Shipped", "Pending", "Cancelled"]
    payment_methods = ["Credit Card", "PayPal", "UPI", "Wire Transfer"]
    
    order_id_counter = 1
    for day in range(1, 300, 5): # Generate orders over last 10 months
        order_date = (base_date + timedelta(days=day)).strftime("%Y-%m-%d")
        num_orders_today = random.randint(1, 3)
        
        for _ in range(num_orders_today):
            customer_id = random.randint(1, 25)
            status = random.choice(statuses)
            payment = random.choice(payment_methods)
            
            # Select 1-3 items
            num_items = random.randint(1, 3)
            selected_products = random.sample(range(1, 16), num_items)
            
            total_amount = 0.0
            items_to_insert = []
            
            for prod_id in selected_products:
                qty = random.randint(1, 3)
                price = products_data[prod_id - 1][2]
                total_amount += qty * price
                items_to_insert.append((order_id_counter, prod_id, qty, price))
                
            cursor.execute("INSERT INTO orders (customer_id, order_date, total_amount, status, payment_method) VALUES (?, ?, ?, ?, ?);",
                           (customer_id, order_date, round(total_amount, 2), status, payment))
            
            cursor.executemany("INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?);", items_to_insert)
            order_id_counter += 1

    # Insert Inventory
    warehouses = ["US-East-W1", "US-West-W2", "EU-Central-W3", "APAC-W4"]
    inventory_data = []
    for pid in range(1, 16):
        loc = random.choice(warehouses)
        stock = products_data[pid - 1][3]
        restocked = (datetime.now() - timedelta(days=random.randint(5, 60))).strftime("%Y-%m-%d")
        inventory_data.append((pid, loc, stock, restocked))
        
    cursor.executemany("INSERT INTO inventory (product_id, warehouse_location, stock_level, last_restocked) VALUES (?, ?, ?, ?);", inventory_data)

    # Insert Reviews
    comments = [
        "Outstanding performance and build quality! Highly recommended.",
        "Very good value for money. Arrived on time.",
        "Average quality, but does the job well.",
        "Exceeded my expectations! Will buy again.",
        "Decent product, quick delivery.",
        "Top-notch customer support and easy setup."
    ]
    reviews_data = []
    for _ in range(30):
        pid = random.randint(1, 15)
        cid = random.randint(1, 25)
        rating = random.randint(3, 5)
        comment = random.choice(comments)
        rdate = (datetime.now() - timedelta(days=random.randint(1, 120))).strftime("%Y-%m-%d")
        reviews_data.append((pid, cid, rating, comment, rdate))
        
    cursor.executemany("INSERT INTO reviews (product_id, customer_id, rating, comment, review_date) VALUES (?, ?, ?, ?, ?);", reviews_data)

    conn.commit()
    conn.close()
    print(f"Database seeded successfully with 7 tables at {DB_PATH}")

if __name__ == "__main__":
    seed_database()
