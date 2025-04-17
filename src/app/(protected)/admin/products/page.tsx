'use client';

// src/app/(protected)/admin/products/page.tsx
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { isAdmin } from '@/lib/utils/adminUtils';
import Link from 'next/link';
import { Plus, Upload, FilePlus, Download } from 'lucide-react';
import ProductsTable from '@/components/admin/ProductsTable';
import { Product } from '@/lib/supabase/client';

export default function AdminProductsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is admin
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email || !isAdmin(session.user.email)) {
        router.push('/products');
        return;
      }
      
      setUserEmail(session.user.email);
      
      // Fetch all products using pagination to handle large catalogs
      try {
        // First, get a count of total products
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });

        // Use pagination to fetch all products
        const allProducts: any = [];
        const pageSize = 1000; // Max rows per request
        const pages = Math.ceil((count || 2500) / pageSize);
        
        // Fetch all pages in parallel
        const pagePromises = [];
        for (let i = 0; i < pages; i++) {
          const from = i * pageSize;
          const to = from + pageSize - 1;
          
          pagePromises.push(
            supabase
              .from('products')
              .select('*')
              .order('item_number')
              .range(from, to)
          );
        }
        
        const results = await Promise.all(pagePromises);
        
        // Combine all results
        results.forEach(result => {
          if (result.error) {
            console.error('Error fetching products page:', result.error);
          } else if (result.data) {
            allProducts.push(...result.data);
          }
        });
        
        setProducts(allProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
    
    // Add click-outside handler for dropdown
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('exportDropdown');
      const exportButton = document.getElementById('exportButton');
      
      if (dropdown && !dropdown.contains(event.target as Node) && 
          exportButton && !exportButton.contains(event.target as Node)) {
        dropdown.classList.add('hidden');
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [supabase, router]);

  // Total products count
  const totalProducts = products?.length || 0;
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Product Management</h1>
        
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/import"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Import</span>
          </Link>
          
          <div className="relative inline-block">
            <button
              id="exportButton"
              onClick={() => {
                // Toggle dropdown visibility
                const dropdown = document.getElementById('exportDropdown');
                if (dropdown) {
                  dropdown.classList.toggle('hidden');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            
            <div id="exportDropdown" className="hidden absolute z-10 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200">
              <div className="py-1">
                <button
                  onClick={() => {
                    // Export as CSV
                    const headers = ["id", "item_number", "description", "category"];
                    const productRows = products?.map(product => 
                      headers.map(header => {
                        const value = product[header as keyof typeof product];
                        // Handle null values and escape commas
                        if (value === null || value === undefined) return "";
                        const strValue = String(value);
                        return strValue.includes(',') ? `"${strValue}"` : strValue;
                      }).join(",")
                    ) || [];
                    
                    const csvContent = [
                      headers.join(","),
                      ...productRows
                    ].join("\n");
                    
                    // Create blob and download link
                    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.setAttribute("href", url);
                    link.setAttribute("download", `products_export_${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    // Hide dropdown
                    document.getElementById('exportDropdown')?.classList.add('hidden');
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    CSV Format
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    // Generate PDF data
                    const { jsPDF } = require("jspdf");
                    const { autoTable } = require("jspdf-autotable");
                    
                    // Create PDF instance
                    const doc = new jsPDF();
                    
                    // Add title
                    doc.setFontSize(16);
                    doc.text("Product Catalog", 14, 15);
                    
                    // Add date
                    doc.setFontSize(10);
                    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);
                    
                    // Create table
                    autoTable(doc, {
                      head: [['Item Number', 'Description', 'Category']],
                      body: products.map(product => [
                        product.item_number,
                        product.description,
                        product.category || '—'
                      ]),
                      startY: 30,
                      theme: 'grid',
                      headStyles: { fillColor: [66, 85, 140] },
                      didDrawPage: (data) => {
                        // Footer
                        doc.setFontSize(8);
                        doc.text(
                          `American Wholesalers - Page ${data.pageNumber} of ${doc.getNumberOfPages()}`,
                          doc.internal.pageSize.width / 2,
                          doc.internal.pageSize.height - 10,
                          { align: 'center' }
                        );
                      }
                    });
                    
                    // Save the PDF
                    doc.save(`products_export_${new Date().toISOString().split('T')[0]}.pdf`);
                    
                    // Hide dropdown
                    document.getElementById('exportDropdown')?.classList.add('hidden');
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    PDF Format
                  </div>
                </button>
              </div>
            </div>
          </div>
          
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>
      
      {/* Simple Stats Overview */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-medium text-gray-700">Total Products</h2>
              <p className="text-3xl font-bold mt-2 text-blue-600">{totalProducts}</p>
            </div>
            <div className="p-2 rounded-full bg-blue-50 border border-blue-100">
              <FilePlus className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Products Table */}
      <ProductsTable initialProducts={products || []} />
    </div>
  );
}