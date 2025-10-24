import { LoginForm } from "@/components/login-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">RentFlow Login</CardTitle>
          <CardDescription>Enter your credentials to access the payment reconciliation dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Demo Accounts:</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>Admin: admin@rentflow.com</p>
              <p>Manager: manager@rentflow.com</p>
              <p>Accountant: accountant@rentflow.com</p>
              <p>Viewer: viewer@rentflow.com</p>
              <p className="mt-2 font-medium">Password: demo123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
