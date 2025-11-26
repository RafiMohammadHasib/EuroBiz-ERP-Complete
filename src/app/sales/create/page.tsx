
'use client';

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, addDoc, serverTimestamp, writeBatch, doc } from "firebase/firestore";
import type { Invoice, FinishedGood, Distributor, Commission, SalesCommission } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { CreateInvoiceDialog } from "@/components/invoices/create-invoice-dialog";
import { useRouter } from "next/navigation";


export default function CreateSalePage() {
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  
  const productsCollection = useMemoFirebase(() => collection(firestore, 'finishedGoods'), [firestore]);
  const distributorsCollection = useMemoFirebase(() => collection(firestore, 'distributors'), [firestore]);
  const commissionsCollection = useMemoFirebase(() => collection(firestore, 'commissions'), [firestore]);
  
  const { data: products, isLoading: productsLoading } = useCollection<FinishedGood>(productsCollection);
  const { data: distributors, isLoading: distributorsLoading } = useCollection<Distributor>(distributorsCollection);
  const { data: commissionRules, isLoading: commissionsLoading } = useCollection<Commission>(commissionsCollection);

  const [isSaving, setIsSaving] = useState(false);

  const addInvoice = async (newInvoice: Omit<Invoice, 'id'>) => {
    setIsSaving(true);
    if (!firestore || !user) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Database connection or user not found.",
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
    
    // 3. Calculate and add commissions
    const distributor = distributors?.find(d => d.name === newInvoice.customer);

    newInvoice.items.forEach(item => {
        const product = products?.find(p => p.productName === item.description);
        if (!product || !distributor) return;

        commissionRules?.forEach(rule => {
            const ruleAppliesToProduct = rule.appliesTo.includes(product.productName);
            const ruleAppliesToDistributor = rule.appliesTo.includes(distributor.name);
            const ruleAppliesToTier = rule.appliesTo.includes(distributor.tier);

            if (ruleAppliesToProduct || ruleAppliesToDistributor || ruleAppliesToTier) {
                const saleAmount = item.quantity * item.unitPrice;
                const commissionAmount = rule.type === 'Percentage'
                    ? saleAmount * (rule.rate / 100)
                    : rule.rate;
                
                const commissionDoc: Omit<SalesCommission, 'id'> = {
                    salespersonId: user.uid, // Assuming the logged-in user is the salesperson
                    productId: product.id,
                    distributionChannelId: distributor.id,
                    commissionRate: rule.rate,
                    saleDate: newInvoice.date,
                    saleAmount: saleAmount,
                    commissionAmount: commissionAmount,
                    invoiceId: invoiceRef.id,
                    ruleId: rule.id,
                    ruleName: rule.ruleName,
                    commissionType: rule.type,
                };
                
                const commissionRef = doc(collection(firestore, 'sales_commissions'));
                batch.set(commissionRef, commissionDoc);
            }
        });
    });


    try {
      await batch.commit();
      toast({
        title: "Invoice & Commissions Created",
        description: `A new invoice for ${newInvoice.customer} has been saved and commissions have been calculated.`,
      });
      router.push('/invoices'); // Redirect to invoices list on success
    } catch(error) {
      console.error("Error creating invoice and commissions: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not create the invoice or calculate commissions.",
      });
    } finally {
        setIsSaving(false);
    }
  }

  const isLoading = productsLoading || distributorsLoading || commissionsLoading;

  return (
    <>
    <div className="space-y-6">
       <Card>
          <CardHeader>
            <CardTitle>Create Sale</CardTitle>
            <CardDescription>
              Select a distributor and add products to generate a new invoice. Commissions will be calculated automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
              <CreateInvoiceDialog 
                distributors={distributors || []}
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
