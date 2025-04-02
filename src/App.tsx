import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import "react-toastify/dist/ReactToastify.css"

export default function App() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
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
        </CardContent>
      </Card>
    </main>
  )
}
