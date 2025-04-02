import { useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "react-toastify"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"

// -----------TYPES-----------
type Entry = {
  name: string
  company: string
  license: string
  bib: string
  event: string
  startTime: string
  finishTime?: string
}

// -----------DEFINITIONS-----------
export default function ScannerPage() {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const videoId = "html5qr-reader"

  const [isScanning, setIsScanning] = useState(false)
  const [eventName, setEventName] = useState("")
  const [entries, setEntries] = useState<Entry[]>([])

  const lastScannedCodeRef = useRef<string | null>(null)
  const lastScanTimeRef = useRef<number>(0)

  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [pinDialogOpen, setPinDialogOpen] = useState(false)
  const [adminPin, setAdminPin] = useState("")

  const [pendingRemovalIndex, setPendingRemovalIndex] = useState<number | null>(null)

  // -----------HANDLERS-----------
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
          const now = Date.now()

          if (
            decodedText === lastScannedCodeRef.current &&
            now - lastScanTimeRef.current < 10000
          ) {
            return
          }

          try {
            const decodedPayload = JSON.parse(atob(decodedText))

            const entry: Entry = {
              ...decodedPayload,
              bib: "N/A",
              event: eventName,
              startTime: new Date().toISOString(),
            }

            setEntries((prev) => [...prev, entry])
            lastScannedCodeRef.current = decodedText
            lastScanTimeRef.current = now
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

  const downloadCSV = () => {
    if (!entries.length) {
      toast.info("No entries to download")
      return
    }

    const rows = [
      ["Name", "Company", "License", "Bib", "Event", "Start Time", "Finish Time"],
      ...entries.map((e) => [
        e.name,
        e.company,
        e.license,
        e.bib,
        e.event,
        e.startTime,
        e.finishTime || "",
      ]),
    ]
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

  const confirmRemoval = () => {
    if (pendingRemovalIndex !== null) {
      const updated = [...entries]
      updated.splice(pendingRemovalIndex, 1)
      setEntries(updated)
      toast.info("Entry removed")
      setPendingRemovalIndex(null)
    }
  }

  // -----------USER INTERFACE-----------
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
          <div id={videoId} className="aspect-video w-full rounded border border-gray-300 mb-4" />

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
                    <th className="px-4 py-2 text-right">Actions</th>

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
                      <td className="px-4 py-2 text-right">
                        {adminUnlocked ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-500 hover:bg-red-100"
                            onClick={() => setPendingRemovalIndex(index)}
                          >
                            Remove
                          </Button>
                        ) : (
                          <span className="text-gray-400 italic">Locked</span>
                        )}
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

      {/* -------LOCK BUTTON------- */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="ghost"
          className="p-2"
          onClick={() => {
            if (adminUnlocked) {
              setAdminUnlocked(false)
              toast.info("Admin locked")
            } else {
              setPinDialogOpen(true)
            }
          }}
        >
          {adminUnlocked ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-green-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-red-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          )}
        </Button>
      </div>

      {/* -------ADMIN DIALOG------- */}
      <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
        <DialogContent className="sm:max-w-sm w-[90%] text-center space-y-4 p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Admin Access</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Enter the 4-digit admin PIN to unlock additional controls.
          </p>

          <div className="flex justify-center">
            <InputOTP
              maxLength={4}
              value={adminPin}
              onChange={setAdminPin}
              onComplete={(val) => {
                if (val === "1234") {
                  setAdminUnlocked(true)
                  toast.success("Admin controls unlocked")
                } else {
                  toast.error("Incorrect PIN")
                }
                setPinDialogOpen(false)
                setAdminPin("")
              }}
              className="scale-125"
            >
              <InputOTPGroup>
                {[0, 1, 2, 3].map((_, i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
        </DialogContent>
      </Dialog>

      {/* -------REMOVAL DIALOG------- */}
      <AlertDialog open={pendingRemovalIndex !== null} onOpenChange={(open) => {
        if (!open) setPendingRemovalIndex(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoval}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
