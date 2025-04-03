import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { APP_VERSION } from "@/version"
import { ThemeProvider } from "@/components/theme-provider"

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6 relative">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Pulse Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">Choose an action to begin:</p>
            <div className="flex flex-col gap-4">
              <Button asChild>
                <Link to="/register">Register Operative</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/scan">Scanner Mode</Link>
              </Button>
            </div>
            <div className="flex justify-end gap-3">
              <ThemeToggle/>
              <Badge variant="secondary" className="text-xs">v{APP_VERSION}</Badge>
            </div>
          </CardContent>
        </Card>
      </main>
    </ThemeProvider>
  )
}
