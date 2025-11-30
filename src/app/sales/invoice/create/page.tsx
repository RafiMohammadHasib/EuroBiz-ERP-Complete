
'use client';

import { useState } from "react";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, addDoc, serverTimestamp, writeBatch, doc } from "firebase/firestore";
import type { Invoice, FinishedGood, Distributor, Commission, SalesCommission } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { CreateInvoiceForm } from "@/components/invoices/create-invoice-form";
import { useRouter } from "next/navigation";


export default function GenerateInvoicePage() {
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

  const addInvoice = async (newInvoice: Omit<Invoice, 'id'>, totalDiscount: number) => {
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

        let totalRate = 0;
        const appliedRules: {ruleId: string, ruleName: string, rate: number}[] = [];

        commissionRules?.forEach(rule => {
            if (rule.type === 'Percentage') {
                const ruleAppliesToProduct = rule.appliesTo.includes(product.productName);
                const ruleAppliesToDistributor = rule.appliesTo.includes(distributor.name);
                const ruleAppliesToTier = rule.appliesTo.includes(distributor.tier);

                if (ruleAppliesToProduct || ruleAppliesToDistributor || ruleAppliesToTier) {
                    totalRate += rule.rate;
                    appliedRules.push({ruleId: rule.id, ruleName: rule.ruleName, rate: rule.rate});
                }
            }
        });
        
        const saleAmount = item.quantity * item.unitPrice;
        const discountAmount = totalDiscount; // Use the total discount passed
        const netSaleAmount = saleAmount - discountAmount;
        const commissionAmount = netSaleAmount * 0.01; // Example: 1% commission for salesperson on net amount

        const commissionDoc: Omit<SalesCommission, 'id'> = {
            salespersonId: user.uid,
            productId: product.id,
            distributionChannelId: distributor.id,
            commissionRate: totalRate, // This now represents total discount rate
            saleDate: newInvoice.date,
            saleAmount: saleAmount,
            discountAmount: discountAmount,
            netSaleAmount: netSaleAmount,
            commissionAmount: commissionAmount,
            invoiceId: invoiceRef.id,
            ruleId: appliedRules.map(r => r.ruleId).join(','),
            ruleName: appliedRules.map(r => r.ruleName).join(','),
            commissionType: 'Percentage',
        };
        
        const commissionRef = doc(collection(firestore, 'sales_commissions'));
        batch.set(commissionRef, commissionDoc);
    });


    try {
      await batch.commit();
      toast({
        title: "Invoice & Commissions Created",
        description: `A new invoice for ${newInvoice.customer} has been saved and commissions have been calculated.`,
      });
      router.push('/sales'); // Redirect to sales list on success
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
    <CreateInvoiceForm 
        distributors={distributors || []}
        products={products || []}
        commissionRules={commissionRules || []}
        onCreateInvoice={addInvoice}
        isLoading={isLoading || isSaving}
    />
  );
}
