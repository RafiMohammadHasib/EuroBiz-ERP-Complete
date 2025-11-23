
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Package } from 'lucide-react';

const initialInventory = 150; // Starting mock inventory

export default function FinishedGoodsPage() {
  const [inventory, setInventory] = useState(initialInventory);

  useEffect(() => {
    const handleDataUpdate = (event: Event) => {
        const customEvent = event as CustomEvent;
        setInventory(customEvent.detail.finishedGoodsInventory);
    };

    window.addEventListener('data-updated', handleDataUpdate);

    return () => {
        window.removeEventListener('data-updated', handleDataUpdate);
    };
  }, []);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Finished Goods Inventory</CardTitle>
        <CardDescription>
          Manage your inventory of finished products. This will update if a sales return is processed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center text-center border-2 border-dashed rounded-lg p-12">
          <Package className="w-12 h-12 text-muted-foreground" />
          <h3 className="text-4xl font-bold mt-4">{inventory} Units</h3>
          <p className="text-muted-foreground mt-2">in stock</p>
        </div>
      </CardContent>
    </Card>
  );
}
