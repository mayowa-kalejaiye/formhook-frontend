## 3.0 Sequence Diagrams

This section outlines the key interaction flows between actors and system components within the Online Bookstore WebApp. Each diagram illustrates the message exchange required to execute major use cases.

### 3.1 User Registration / Login
Shows how the Customer submits credentials, the Web Server validates them, and the system returns authentication status.

### 3.2 Browsing & Searching Books
Describes how Customers or Guests initiate catalog or search requests, and how the WebApp retrieves and returns matching results.

### 3.3 Viewing Book Details
Covers the interaction where the WebApp requests detailed information for a selected book and displays it to the user.

### 3.4 Adding Items to Cart
Illustrates how a Customer adds a book to their cart, including validation and cart state updates by the Cart/Order component.

### 3.5 Checkout & Payment
Shows the complete checkout flow: order creation, handoff to Payment Gateway, payment confirmation, order finalization, and confirmation output to the Customer.

### 3.6 Viewing Order History
Outlines how an authenticated Customer requests past orders, with the Web Server retrieving and returning order records.

### 3.7 Admin – Manage Catalog
Represents how an Administrator submits catalog updates, and how the system validates and applies these modifications.

### 3.8 Admin – Process Orders
Describes the steps involved when an Administrator retrieves, updates, or finalizes customer orders.
