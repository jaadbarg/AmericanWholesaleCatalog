# American Wholesalers Catalog

A Next.js application for managing wholesale product catalogs and customer orders.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Supabase Setup Requirements

This application requires several database functions to be set up in Supabase to handle admin operations and authentication flows. These functions allow administrators to bypass Row Level Security (RLS) policies when managing customers and products, and ensure proper user authentication.

### Required SQL Functions

1. **Admin Functions**: For managing customers and products

   To set up the necessary admin functions:

   1. Go to your Supabase project dashboard
   2. Navigate to the SQL Editor
   3. Create a new query
   4. Copy the contents of the `supabase/functions/admin_functions.sql` file
   5. Run the SQL query to create the functions

   These functions include:
   - `admin_create_customer`: Creates a new customer record
   - `admin_assign_products`: Assigns products to a customer
   - `admin_remove_products`: Removes products from a customer
   - `admin_update_customer`: Updates customer information
   - `admin_delete_customer`: Deletes a customer and related data

2. **Authentication Fix Functions**: For proper user authentication and profile management

   To set up the authentication functions:

   1. Go to your Supabase project dashboard
   2. Navigate to the SQL Editor
   3. Create a new query
   4. Copy the contents of the `supabase/auth_fix_functions.sql` file
   5. Run the SQL query to create all the authentication-related functions and triggers

   These functions ensure:
   - User profiles are created automatically
   - Profiles are linked to customer records
   - Email verification works properly
   - Admin tools for managing user accounts

   For more details, see the [Auth Fix Guide](/supabase/AUTH_FIX_GUIDE.md).

### RLS Policies

The application includes row-level security policies that restrict access to data. Administrators access data through special RPC functions that bypass these restrictions. The authentication triggers work with these policies to ensure proper access control.

## Building for Production

```bash
npm run build
npm run start
```

## Technologies Used

- Next.js
- Supabase (PostgreSQL + Auth)
- TypeScript
- Tailwind CSS
- Lucide Icons
- Framer Motion
