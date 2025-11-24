
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { notifications } from "@/lib/data";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            View all your recent notifications here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm">Mark all as read</Button>
          </div>
          <div className="divide-y divide-border rounded-md border">
            {notifications.map((notification, index) => (
              <div key={index} className="p-4">
                <p className={`font-medium ${notification.type === 'warning' ? 'text-destructive' : ''}`}>{notification.title}</p>
                <p className="text-sm text-muted-foreground">{notification.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
