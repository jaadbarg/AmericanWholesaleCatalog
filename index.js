const supabase = require('./supabase');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to handle Supabase read operations
async function performSupabaseOperation(operation, params = {}) {
  try {
    let result;
    
    switch (operation) {
      case 'listTables':
        console.log('Detecting tables in your Supabase database...');
        
        // Use the tables that actually exist in your Supabase database (confirmed via REST API)
        const commonTables = [
          // Tables found in your database
          'orders',
          'customers',
          'profiles',
          'products',
          'order_items',
          'customer_products'
        ];
        
        let foundTables = [];
        
        // Test each table with a small delay between requests
        for (const tableName of commonTables) {
          try {
            // Add a small delay between requests
            if (foundTables.length > 0) {
              await new Promise(r => setTimeout(r, 300));
            }
            
            const result = await supabase
              .from(tableName)
              .select('*', { count: 'exact', head: true });
            
            if (!result.error) {
              foundTables.push({
                name: tableName,
                count: result.count
              });
            }
          } catch (error) {
            // Skip tables that cause errors (they likely don't exist)
          }
        }
        
        // Display results
        if (foundTables.length > 0) {
          // Sort by table name
          foundTables.sort((a, b) => a.name.localeCompare(b.name));
          
          console.log('\nAvailable tables in your database:');
          foundTables.forEach(table => {
            const recordCount = table.count !== null ? table.count : 'unknown';
            console.log(`- ${table.name} (${recordCount} records)`);
          });
        } else {
          console.log('\nNo tables were detected or you may not have access to view them.');
          console.log('Check your Supabase dashboard to see your available tables.');
          console.log('Tip: Check your Supabase dashboard -> Table Editor to see your tables.');
        }
        
        break;
        
      case 'queryTable':
        const { tableName, columns = '*', limit = 10, filter } = params;
        
        try {
          // First verify the table exists
          console.log(`Attempting to query table: ${tableName}`);
          
          // Construct the query
          let query = supabase.from(tableName).select(columns);
          
          if (filter && filter.column && filter.value) {
            query = query.eq(filter.column, filter.value);
          }
          
          // Execute the query with the limit
          result = await query.limit(limit);
          
          if (result.error) {
            console.log(`Error querying ${tableName}: ${result.error.message}`);
            console.log('Please check if the table exists and you have permission to access it.');
          } else {
            if (result.data && result.data.length > 0) {
              console.log(`Query results for ${tableName} (${result.data.length} records):`);
              console.log(JSON.stringify(result.data, null, 2));
            } else {
              console.log(`No data found in table ${tableName}. The table exists but appears to be empty.`);
            }
          }
        } catch (error) {
          console.error(`Error during query: ${error.message}`);
        }
        break;
        
      case 'countRecords':
        const { countTable } = params;
        // Using select with count option
        result = await supabase
          .from(countTable)
          .select('*', { count: 'exact', head: true });
        
        if (result.error) throw result.error;
        console.log(`Total records in ${countTable}: ${result.count}`);
        break;
        
      case 'describeTable':
        console.log(`Note: The Supabase JS client doesn't provide direct schema information.`);
        console.log(`You'll need to query a sample row to infer the schema structure.`);
        
        const { describeTableName, describeSampleSize = 1 } = params;
        const sampleResult = await supabase
          .from(describeTableName)
          .select('*')
          .limit(describeSampleSize);
          
        if (sampleResult.error) throw sampleResult.error;
        
        if (sampleResult.data && sampleResult.data.length > 0) {
          const sample = sampleResult.data[0];
          console.log(`\nColumns in ${describeTableName} (based on sample data):`);
          for (const [key, value] of Object.entries(sample)) {
            const type = typeof value;
            console.log(`- ${key}: ${type} ${value === null ? '(nullable)' : ''}`);
          }
        } else {
          console.log(`No sample data available for ${describeTableName}`);
        }
        break;
        
      default:
        console.log('Unknown operation');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Main CLI interface
function startCLI() {
  console.log('\n===== Supabase Read-Only Helper =====');
  console.log('What would you like to do with Supabase?');
  console.log('1. List tables (for reference)');
  console.log('2. Query a table');
  console.log('3. Count records in a table');
  console.log('4. Describe table structure');
  console.log('5. Exit');
  
  rl.question('\nEnter your choice (1-5): ', (choice) => {
    switch (choice) {
      case '1':
        performSupabaseOperation('listTables')
          .then(() => setTimeout(startCLI, 1000));
        break;
        
      case '2':
        rl.question('Enter table name: ', (tableName) => {
          rl.question('Enter columns to select (default: *): ', (columns) => {
            columns = columns || '*';
            rl.question('Enter limit (default: 10): ', (limit) => {
              limit = parseInt(limit) || 10;
              rl.question('Do you want to filter results? (y/n): ', (filterChoice) => {
                if (filterChoice.toLowerCase() === 'y') {
                  rl.question('Enter filter column: ', (column) => {
                    rl.question('Enter filter value: ', (value) => {
                      performSupabaseOperation('queryTable', { 
                        tableName, 
                        columns, 
                        limit, 
                        filter: { column, value } 
                      }).then(() => setTimeout(startCLI, 1000));
                    });
                  });
                } else {
                  performSupabaseOperation('queryTable', { tableName, columns, limit })
                    .then(() => setTimeout(startCLI, 1000));
                }
              });
            });
          });
        });
        break;
        
      case '3':
        rl.question('Enter table name: ', (countTable) => {
          performSupabaseOperation('countRecords', { countTable })
            .then(() => setTimeout(startCLI, 1000));
        });
        break;
        
      case '4':
        rl.question('Enter table name: ', (describeTableName) => {
          rl.question('Enter sample size (default: 1): ', (describeSampleSize) => {
            describeSampleSize = parseInt(describeSampleSize) || 1;
            performSupabaseOperation('describeTable', { 
              describeTableName, 
              describeSampleSize 
            }).then(() => setTimeout(startCLI, 1000));
          });
        });
        break;
        
      case '5':
        console.log('Goodbye!');
        rl.close();
        break;
        
      default:
        console.log('Invalid choice');
        setTimeout(startCLI, 500);
    }
  });
}

console.log('\nWelcome to the Supabase Read-Only Helper');
console.log('Make sure you have updated your .env file with your Supabase credentials');

// Check for command line arguments for non-interactive usage
const args = process.argv.slice(2);
if (args.length > 0 && args[0] === '--list-tables') {
  // Non-interactive mode to just list tables
  console.log('Running in non-interactive mode to list tables...');
  performSupabaseOperation('listTables')
    .then(() => {
      console.log('\nDone. Exiting.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Error:', err);
      process.exit(1);
    });
} else {
  // Regular interactive mode
  startCLI();
}