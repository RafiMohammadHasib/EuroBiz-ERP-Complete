
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
import { collection, addDoc, serverTimestamp, writeBatch, doc } from "firebase/firestore";
import type { Invoice, FinishedGood, Customer } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { CreateInvoiceDialog } from "@/components/invoices/create-invoice-dialog";
import { useRouter } from "next/navigation";


export default function CreateSalePage() {
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const productsCollection = useMemoFirebase(() => collection(firestore, 'finishedGoods'), [firestore]);
  const customersCollection = useMemoFirebase(() => collection(firestore, 'customers'), [firestore]);
  
  const { data: products, isLoading: productsLoading } = useCollection<FinishedGood>(productsCollection);
  const { data: customers, isLoading: customersLoading } = useCollection<Customer>(customersCollection);

  const [isSaving, setIsSaving] = useState(false);

  const addInvoice = async (newInvoice: Omit<Invoice, 'id'>) => {
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

    const batch = writeBatch(firestore);

    // 1. Add the new invoice
    const invoiceWithTimestamp = {
      ...newInvoice,
      createdAt: serverTimestamp(),
    };
    const invoiceRef = doc(collection(firestore, "invoices"));
    batch.set(invoiceRef, invoiceWithTimestamp);
    
    // 2. Decrement stock for each item in the invoice
    let stockError = false;
    for (const item of newInvoice.items) {
        const product = products?.find(p => p.productName === item.description);
        if (product) {
            const productRef = doc(firestore, 'finishedGoods', product.id);
            const newQuantity = product.quantity - item.quantity;
            if (newQuantity < 0) {
                stockError = true;
                toast({
                    variant: "destructive",
                    title: "Insufficient Stock",
                    description: `Not enough stock for ${product.productName}. Only ${product.quantity} available.`,
                });
                break; // Exit the loop if one item is out of stock
            }
            batch.update(productRef, { quantity: newQuantity });
        }
    }

    if (stockError) {
        setIsSaving(false);
        return; // Do not commit the batch if there's a stock error
    }

    try {
      await batch.commit();
      toast({
        title: "Invoice Created",
        description: `A new invoice for ${newInvoice.customer} has been saved successfully.`,
      });
      router.push('/invoices'); // Redirect to invoices list on success
    } catch(error) {
      console.error("Error creating invoice and updating stock: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not create the invoice or update stock.",
      });
    } finally {
        setIsSaving(false);
    }
  }

  const isLoading = productsLoading || customersLoading;

  return (
    <>
    <div className="space-y-6">
       <Card>
          <CardHeader>
            <CardTitle>Create Sale</CardTitle>
            <CardDescription>
              Select a customer and add products to generate a new invoice.
            </CardDescription>
          </CardHeader>
          <CardContent>
              <CreateInvoiceDialog 
                customers={customers || []}
                products={products || []}
                onCreateInvoice={addInvoice}
                isLoading={isLoading || isSaving}
              />
          </CardContent>
        </Card>
    </div>
    </>
  );
}
