

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  invoices,
  salesData,
  commissions,
  purchaseOrders,
  salaries,
  salesReturns,
  rawMaterials,
  finishedGoods,
  distributors,
  suppliers,
  productionOrders,
  notifications,
} from '@/lib/data';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Copy, Check, Download } from 'lucide-react';
import { useState } from 'react';

type ForeignKey = {
  column: string;
  referencesTable: string;
  referencesColumn: string;
};

// Mock data for users and roles for SQL generation
const roles = [
    { id: 'role-01', name: 'admin', description: 'Full access to all system features.' },
    { id: 'role-02', name: 'sales_manager', description: 'Access to sales, invoices, and customer data.' },
    { id: 'role-03', name: 'production_staff', description: 'Access to production and inventory data.' },
];

const users = [
    { id: 'user-01', email: 'admin@bizfin.com', password_hash: 'placeholder_hash_admin', role_id: 'role-01' },
    { id: 'user-02', email: 'sales@bizfin.com', password_hash: 'placeholder_hash_sales', role_id: 'role-02' },
    { id: 'user-03', email: 'prod@bizfin.com', password_hash: 'placeholder_hash_prod', role_id: 'role-03' },
];


export default function SqlExporterPage() {
  const [copied, setCopied] = useState(false);

  const generateSqlForTable = (tableName: string, data: any[], foreignKeys: ForeignKey[] = []): string => {
    if (!data.length) return `-- No data for table: ${tableName}\n`;

    const firstItem = data[0];
    const columns = Object.keys(firstItem);
    
    let createTableStatement = `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;

    columns.forEach((column) => {
      const value = firstItem[column];
      let sqlType: string;

      const fk = foreignKeys.find(fk => fk.column === column);

      if (column.endsWith('_id') || column === 'id' || fk) {
        sqlType = 'VARCHAR(255)';
        if(column === 'id') {
            sqlType += ' PRIMARY KEY NOT NULL';
        }
      } else {
        switch (typeof value) {
            case 'number':
                sqlType = Number.isInteger(value) ? 'INTEGER' : 'DECIMAL(10, 2)';
                break;
            case 'string':
                if (column.toLowerCase().includes('date')) {
                    sqlType = 'DATE';
                } else if (value.length > 255 || column.toLowerCase().includes('description')) {
                    sqlType = 'TEXT';
                } else {
                    sqlType = 'VARCHAR(255)';
                }
                break;
            case 'boolean':
                sqlType = 'BOOLEAN';
                break;
            default:
                sqlType = 'TEXT'; // For arrays, objects, etc.
        }
        if(!column.endsWith('description')) { // Descriptions can be nullable
            sqlType += ' NOT NULL';
        }
      }
      
      createTableStatement += `  "${column}" ${sqlType},\n`;
    });

    foreignKeys.forEach(fk => {
        createTableStatement += `  FOREIGN KEY ("${fk.column}") REFERENCES "${fk.referencesTable}"("${fk.referencesColumn}"),\n`;
    });

    // Remove last comma
    if(createTableStatement.trim().endsWith(',')) {
        createTableStatement = createTableStatement.trim().slice(0, -1);
    }
    
    createTableStatement += '\n);\n\n';


    let insertStatements = `INSERT INTO "${tableName}" ("${columns.join('", "')}") VALUES\n`;
    data.forEach((item, itemIndex) => {
      const values = columns.map(column => {
        let value = item[column];
        if (value === null || value === undefined) {
            return 'NULL';
        }
         if (Array.isArray(value) || (value !== null && typeof value === 'object')) {
            // Sanitize JSON string for SQL
            value = JSON.stringify(value).replace(/'/g, "''");
             return `'${value}'`;
        }
        if (typeof value === 'string') {
          return `'${value.replace(/'/g, "''")}'`;
        }
        return value;
      });
      insertStatements += `  (${values.join(', ')})${itemIndex === data.length - 1 ? ';' : ','}\n`;
    });

    return createTableStatement + insertStatements;
  };
  
  const allSql = [
      generateSqlForTable('roles', roles),
      generateSqlForTable('users', users, [
          { column: 'role_id', referencesTable: 'roles', referencesColumn: 'id' }
      ]),
      generateSqlForTable('suppliers', suppliers),
      generateSqlForTable('distributors', distributors),
      generateSqlForTable('raw_materials', rawMaterials),
      generateSqlForTable('finished_goods', finishedGoods),
      generateSqlForTable('production_orders', productionOrders, [
          { column: 'productName', referencesTable: 'finished_goods', referencesColumn: 'productName' }
      ]),
      generateSqlForTable('invoices', invoices),
      generateSqlForTable('purchase_orders', purchaseOrders, [
          { column: 'supplier', referencesTable: 'suppliers', referencesColumn: 'name' }
      ]),
      generateSqlForTable('commissions', commissions),
      generateSqlForTable('sales_data', salesData),
      generateSqlForTable('salaries', salaries),
      generateSqlForTable('sales_returns', salesReturns, [
          { column: 'invoiceId', referencesTable: 'invoices', referencesColumn: 'id' }
      ]),
      generateSqlForTable('notifications', notifications),
  ].join('\n\n');


  const handleCopy = () => {
    navigator.clipboard.writeText(allSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleDownload = () => {
    const blob = new Blob([allSql], { type: 'application/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schema_with_security.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">SQL Exporter</h1>
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span className="ml-2">{copied ? 'Copied!' : 'Copy SQL'}</span>
                </Button>
                <Button onClick={handleDownload}>
                    <Download className="h-4 w-4" />
                    <span className="ml-2">Download .sql file</span>
                </Button>
            </div>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Generated SQL Schema</CardTitle>
                <CardDescription>
                This SQL schema is generated from your project's data entities, including user roles for security. It will refresh automatically if you change your data structure and revisit this tab.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Textarea
                    readOnly
                    value={allSql}
                    className="font-mono bg-muted h-[60vh]"
                />
            </CardContent>
        </Card>
    </div>
  );
}
