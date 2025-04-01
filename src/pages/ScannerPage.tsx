import { useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "react-toastify"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

type Entry = {
  name: string
  company: string
  license: string
  bib: string
  event: string
  startTime: string
  finishTime?: string
}


export default function ScannerPage() {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const videoId = "html5qr-reader"

  const [isScanning, setIsScanning] = useState(false)
  const [eventName, setEventName] = useState("")
  const [entries, setEntries] = useState<Entry[]>([])
  const [adminUnlocked, setAdminUnlocked] = useState(false)

  const startScanner = async () => {
    if (!eventName.trim()) {
      toast.error("Please enter an event name")
      return
    }

    try {
      const devices = await Html5Qrcode.getCameras()
      if (!devices || devices.length === 0) {
        toast.error("No camera device found.")
        return
      }

      const selectedDeviceId = devices[0].id
      const html5QrCode = new Html5Qrcode(videoId)

      await html5QrCode.start(
        { deviceId: { exact: selectedDeviceId } },
        {
          fps: 10,
          qrbox: { width: 300, height: 400 },
        },
        (decodedText) => {
          try {
            const decodedPayload = JSON.parse(atob(decodedText))

            const entry: Entry = {
              ...decodedPayload,
              bib: "N/A", // assign bib later if needed
              event: eventName,
              startTime: new Date().toISOString(),
            }

            setEntries((prev) => [...prev, entry])
            toast.success(`Scanned: ${entry.name}`)
          } catch (err) {
            console.log(err)
            toast.error("Invalid QR Code format")
          }
        },
        (errorMessage) => {
          console.warn("QR scan error:", errorMessage)
        }
      )

      scannerRef.current = html5QrCode
      setIsScanning(true)
    } catch (err) {
      console.error("Failed to start scanner:", err)
      toast.error("Failed to start scanner")
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop()
      scannerRef.current.clear()
      scannerRef.current = null
      setIsScanning(false)
      toast.info("Scanner stopped")
    }
  }

  const handleAdminUnlock = () => {
    const code = prompt("Enter 4-digit admin code")
    if (code === "1234") {
      setAdminUnlocked(true)
      toast.success("Admin controls unlocked")
    } else {
      toast.error("Incorrect PIN")
    }
  }

  const downloadCSV = () => {
    if (!entries.length) {
      toast.info("No entries to download")
      return
    }

    const rows = [["Scanned Code"], ...entries.map((e) => [e])]
    const csv = rows.map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = "pulse-scanner.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  const resetAll = () => {
    if (!confirm("Reset all scanned data?")) return
    setEntries([])
    toast.success("All data reset")
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <Card
        className={`max-w-4xl mx-auto transition-all duration-300 border-2 ${isScanning ? "border-green-500" : "border-red-500"
          }`}
      >
        <CardHeader className="flex flex-col md:flex-row justify-between gap-4">
          <CardTitle className="text-xl">Pulse Scanner</CardTitle>
          <div className="flex gap-2 w-full md:w-auto items-center">
            <Input
              placeholder="Event name"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
            />
            <Button
              onClick={isScanning ? stopScanner : startScanner}
              variant="outline"
              className={`rounded-full border-2 ${isScanning ? "border-green-500 text-green-600" : "border-red-500 text-red-600"
                }`}
              title={isScanning ? "Stop Scanner" : "Start Scanner"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z"
                />
              </svg>
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div id={videoId} className="" />

          {entries.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-sm border bg-white rounded shadow">
                <thead className="bg-gray-200 text-left">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Company</th>
                    <th className="px-4 py-2">License</th>
                    <th className="px-4 py-2">Bib</th>
                    <th className="px-4 py-2">Event</th>
                    <th className="px-4 py-2">Start</th>
                    <th className="px-4 py-2">Finish</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2">{entry.name}</td>
                      <td className="px-4 py-2">{entry.company}</td>
                      <td className="px-4 py-2">{entry.license}</td>
                      <td className="px-4 py-2">{entry.bib}</td>
                      <td className="px-4 py-2">{entry.event}</td>
                      <td className="px-4 py-2">
                        {new Date(entry.startTime).toLocaleTimeString("en-GB")}
                      </td>
                      <td className="px-4 py-2">
                        {entry.finishTime
                          ? new Date(entry.finishTime).toLocaleTimeString("en-GB")
                          : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}


          {adminUnlocked && (
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Button className="flex-1" onClick={downloadCSV}>
                Download CSV
              </Button>
              <Button className="flex-1" variant="destructive" onClick={resetAll}>
                Reset All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {!adminUnlocked && (
        <div className="fixed bottom-4 right-4">
          <Button variant="outline" onClick={handleAdminUnlock}>
            🔒
          </Button>
        </div>
      )}
    </div>
  )
}