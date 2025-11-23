
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { PlusCircle } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                Manage your account and application settings.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input id="company-name" defaultValue="BizFin Inc." />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue="admin@bizfin.com" />
                </div>
                <Button>Save Changes</Button>
            </CardContent>
        </Card>

        <Separator />

        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Production Formulas</CardTitle>
                        <CardDescription>
                        Define recipes for your manufactured products.
                        </CardDescription>
                    </div>
                    <Button size="sm" className="h-8 gap-1">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Add Formula
                        </span>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center text-center border-2 border-dashed rounded-lg p-12">
                    <h3 className="text-xl font-semibold">No formulas defined</h3>
                    <p className="text-muted-foreground mt-2">Add your first production formula to get started.</p>
                </div>
            </CardContent>
        </Card>

        <Separator />

        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Commission Rules</CardTitle>
                        <CardDescription>
                        Set up rules for sales commissions. These will apply to the commissions page.
                        </CardDescription>
                    </div>
                     <Button size="sm" className="h-8 gap-1">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Add Rule
                        </span>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                 <div className="flex flex-col items-center justify-center text-center border-2 border-dashed rounded-lg p-12">
                    <h3 className="text-xl font-semibold">No commission rules defined</h3>
                    <p className="text-muted-foreground mt-2">Add your first commission rule to get started.</p>
                </div>
            </CardContent>
        </Card>
    </div>
  )
}
