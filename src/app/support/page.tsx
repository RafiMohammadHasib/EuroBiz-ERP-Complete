
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen } from "lucide-react"

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-4">
            <BookOpen className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-3xl">Support & Documentation</CardTitle>
              <CardDescription className="text-lg">
                Your guide to mastering the EuroBiz ERP system.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Welcome to the EuroBiz ERP documentation. This guide is designed to help you understand and utilize all the features of the system to manage your business operations effectively. Use the sections below to navigate to the specific module you need help with.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Module Guides</CardTitle>
          <CardDescription>
            Detailed work procedures for each module in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg font-semibold">Sales & Purchasing</AccordionTrigger>
              <AccordionContent className="pl-4">
                <Accordion type="single" collapsible>
                  <AccordionItem value="sub-1-1">
                    <AccordionTrigger>How to Create a New Sale</AccordionTrigger>
                    <AccordionContent>
                      <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                        <li>Navigate to the **Sales** page from the sidebar.</li>
                        <li>Click the **Create Sale** button.</li>
                        <li>Select a distributor from the dropdown menu. The system will automatically fetch their details.</li>
                        <li>Click the **Add Item** button to add a new product to the invoice.</li>
                        <li>For each item, select the product, and the selling price will be automatically populated. Adjust the quantity as needed.</li>
                        <li>The system automatically calculates applicable commissions/discounts based on predefined rules and shows the total.</li>
                        <li>Enter the **Amount Paid** by the customer (if any). The **Due Amount** will update automatically.</li>
                        <li>Click **Generate Invoice** to save the sale. Stock levels will be updated, and commission records will be generated.</li>
                      </ol>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="sub-1-2">
                    <AccordionTrigger>How to Manage Purchase Orders (POs)</AccordionTrigger>
                    <AccordionContent>
                      <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                        <li>Go to the **Purchase Orders** page.</li>
                        <li>Click **Create Purchase Order**.</li>
                        <li>Select a supplier and add the raw materials you wish to purchase, specifying quantity and unit cost.</li>
                        <li>Add any discounts or taxes. The grand total and due amount are calculated automatically.</li>
                        <li>Once the order is saved, you can track its status (Pending, Shipped, Received).</li>
                        <li>When you receive the items, find the PO and use the action menu to **Mark as Received**. This will automatically update your raw material inventory levels and their weighted average cost.</li>
                        <li>Use the **Make Payment** action to record payments against the PO.</li>
                      </ol>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-lg font-semibold">Inventory & Production</AccordionTrigger>
              <AccordionContent className="pl-4">
                 <Accordion type="single" collapsible>
                  <AccordionItem value="sub-2-1">
                    <AccordionTrigger>How to Manage Production Formulas</AccordionTrigger>
                    <AccordionContent>
                       <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                        <li>Navigate to **Settings** from the sidebar.</li>
                        <li>Under the **System** tab, find the **Production Formulas** card.</li>
                        <li>Click **Add Formula** to define a new finished good.</li>
                        <li>Give the product a name and an optional selling price.</li>
                        <li>Add each raw material component and its required quantity for one unit of the finished product.</li>
                        <li>The system will automatically calculate the **Unit Cost** based on the current cost of the raw materials.</li>
                        <li>Save the formula. This product will now be available for production.</li>
                      </ol>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="sub-2-2">
                    <AccordionTrigger>How to Create a Production Order</AccordionTrigger>
                    <AccordionContent>
                      <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                        <li>Go to the **Production** page.</li>
                        <li>Click **New Production**.</li>
                        <li>Select the finished good you want to produce and the quantity.</li>
                        <li>The system calculates the required **Material Cost** based on the product's formula.</li>
                        <li>Enter any additional costs, such as **Labour Cost**, **Wastage Value**, and **Other Costs**.</li>
                        <li>The **Total Production Cost** and final **Cost Per Unit** are calculated in real-time.</li>
                        <li>Once you save the order, it will appear in the production list with a "Pending" or "In Progress" status.</li>
                        <li>When production is complete, use the action menu to **Mark as Complete**. This deducts the used raw materials from inventory and adds the new finished goods to your stock.</li>
                      </ol>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-lg font-semibold">Financials</AccordionTrigger>
              <AccordionContent className="pl-4">
                 <Accordion type="single" collapsible>
                  <AccordionItem value="sub-3-1">
                    <AccordionTrigger>How to Manage Dues (Receivables & Payables)</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground mb-2">The **Outstanding Dues** page provides a centralized view of money you owe (Payables) and money owed to you (Receivables).</p>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        <li>**Accounts Receivable**: This tab lists all customer invoices with a balance due. You can click **Record Payment** to enter a full or partial payment received from a customer, which updates the invoice status automatically.</li>
                        <li>**Accounts Payable**: This tab lists all purchase orders with an outstanding balance. Click **Make Payment** to record payments made to your suppliers.</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="sub-3-2">
                    <AccordionTrigger>How to Manage Salary Payments</AccordionTrigger>
                    <AccordionContent>
                       <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                        <li>Navigate to the **Salaries** page from the sidebar.</li>
                        <li>Click the **Record Payment** button.</li>
                        <li>In the dialog, enter the employee's name, their position, the payment date, and the total amount paid.</li>
                        <li>Click **Save Record**. The payment will be added to the history table.</li>
                        <li>You can **Edit** or **Delete** any payment record from the action menu in the table. All changes are saved to the database instantly.</li>
                      </ol>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </AccordionContent>
            </AccordionItem>

             <AccordionItem value="item-4">
              <AccordionTrigger className="text-lg font-semibold">Settings</AccordionTrigger>
              <AccordionContent className="pl-4">
                 <p className="text-muted-foreground">
                    The **Settings** page allows administrators to configure system-wide parameters and business rules. Here you can manage your user profile, change passwords, set the system currency (which updates all financial displays), and define core business logic like **Production Formulas** and **Commission Rules**. Any rules defined here are used globally in their respective modules.
                 </p>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
