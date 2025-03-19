# American Wholesale Catalog

## Client Guide

Welcome to your American Wholesale Catalog application! This platform allows you to manage your product catalog, customer accounts, and orders through an intuitive web interface.

## Accessing the Application

The application is accessible at your designated URL. Contact your administrator for the exact address.

## Key Features

### For Administrators

- **Dashboard**: View key metrics including pending orders, total customers, and product counts
- **Customer Management**: 
  - Add, edit, and remove customer accounts
  - Bulk import customers via CSV files
  - Assign products to specific customers
- **Product Management**:
  - Add and edit products with descriptions and item numbers
  - Export product catalogs in CSV or PDF formats
  - Bulk import products from CSV files
- **Order Management**:
  - View and process customer orders
  - Filter orders by status (pending, confirmed, cancelled)
  - Track order history with detailed product information

### For Customers

- **Product Browsing**: View all products assigned to their account
- **Cart Management**: Build and modify orders before submission
- **Order Tracking**: View order history and status updates
- **Profile Management**: Update account information

## Admin Quick Start Guide

1. **Login**: Use your administrator credentials to sign in
2. **Navigate to Admin Dashboard**: Access all administration tools from the main dashboard
3. **Managing Customers**:
   - Import customers: Admin → Customers → Import
   - Create individual customers: Admin → Customers → New Customer
   - Edit a customer: Find the customer in the list and click Edit
4. **Managing Products**:
   - View all products: Admin → Products
   - Add new products: Admin → Products → Add New Product
   - Export products: Admin → Products → Export (CSV or PDF)
5. **Managing Orders**:
   - View pending orders: Admin → Orders
   - View all orders: Admin → Orders → All Orders
   - Process an order: Click on an order to view details and update its status

## Import/Export Formats

### Customer Import

CSV format with the following columns:
- `name` (required): Customer's full name
- `email` (required): Valid email address (must be unique)
- `products` (optional): Semi-colon separated list of product item numbers

Example:
```
name,email,products
John Smith,john@example.com,ABC123;DEF456
Jane Doe,jane@example.com,GHI789
```

### Product Export

Supports two formats:
- **CSV**: Contains all product data in a spreadsheet-compatible format
- **PDF**: Formatted report with product listings and details

## Support

For technical support or questions about the application, please contact:
- Technical Support: [Your support email/contact]
- Account Management: [Your account management contact]

## Security Information

- Each user has access only to their assigned products and orders
- Admin accounts have full system access - keep credentials secure
- Password reset functionality is available through the login screen
- The system uses encrypted connections for all data transmission

---

© American Wholesalers, Inc. All rights reserved.