
'use client';

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, addDoc } from "firebase/firestore";
import type { PurchaseOrder, Supplier, RawMaterial } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { CreatePurchaseOrderForm } from "@/components/purchase-orders/create-purchase-order-form";
import { useRouter } from "next/navigation";


export default function CreatePurchaseOrderPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const suppliersCollection = useMemoFirebase(() => collection(firestore, 'suppliers'), [firestore]);
  const rawMaterialsCollection = useMemoFirebase(() => collection(firestore, 'rawMaterials'), [firestore]);

  const { data: suppliers, isLoading: suppliersLoading } = useCollection<Supplier>(suppliersCollection);
  const { data: rawMaterials, isLoading: materialsLoading } = useCollection<RawMaterial>(rawMaterialsCollection);

  const [isSaving, setIsSaving] = useState(false);

  const addPurchaseOrder = async (newOrder: Omit<PurchaseOrder, 'id'>) => {
    setIsSaving(true);
    if (!firestore) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Database connection not found.",
        });
        setIsSaving(false);
        return;
    }

    try {
      await addDoc(collection(firestore, 'purchaseOrders'), newOrder);
      toast({
        title: "Purchase Order Created",
        description: `New PO for ${newOrder.supplier} has been added.`,
      });
      router.push('/purchase-orders');
    } catch(error) {
       console.error("Error adding purchase order: ", error);
       toast({
        variant: "destructive",
        title: "Error",
        description: "Could not create purchase order."
       });
    } finally {
        setIsSaving(false);
    }
  }

  const isLoading = suppliersLoading || materialsLoading;

  return (
    <>
    <div className="space-y-6">
       <Card>
          <CardHeader>
            <CardTitle>Create Purchase Order</CardTitle>
            <CardDescription>
              Select a supplier and add the raw materials you want to purchase.
            </CardDescription>
          </CardHeader>
          <CardContent>
              <CreatePurchaseOrderForm
                onCreate={addPurchaseOrder}
                suppliers={suppliers || []}
                rawMaterials={rawMaterials || []}
                isLoading={isLoading || isSaving}
              />
          </CardContent>
        </Card>
    </div>
    </>
  );
}
