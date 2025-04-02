import { useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "react-toastify"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

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

type ConfirmDialogState = {
  open: boolean
  title: string
  description: string
  confirmText: string
  cancelText?: string
  onConfirm: () => void
}

// -----------DEFINITIONS-----------
export default function ScannerPage() {
  const videoId = "html5qr-reader"
  
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lastScannedCodeRef = useRef<string | null>(null)
  const lastScanTimeRef = useRef<number>(0)

  const [pendingEntry, setPendingEntry] = useState<Entry | null>(null)
  const [bibModalOpen, setBibModalOpen] = useState(false)
  const [customBib, setCustomBib] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [eventName, setEventName] = useState("")
  const [entries, setEntries] = useState<Entry[]>([])
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [pinDialogOpen, setPinDialogOpen] = useState(false)
  const [adminPin, setAdminPin] = useState("")
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    title: "",
    description: "",
    confirmText: "",
    cancelText: "Cancel",
    onConfirm: () => { },
  })

  // -----------HANDLERS-----------
  const handleScanSuccess = (decodedText: string) => {
    const now = Date.now()

    // Prevent immediate duplicate scans of same QR
    if (
      decodedText === lastScannedCodeRef.current &&
      now - lastScanTimeRef.current < 10000
    ) {
      return
    }

    lastScannedCodeRef.current = decodedText
    lastScanTimeRef.current = now

    try {
      const decodedPayload = JSON.parse(atob(decodedText))
      const name = decodedPayload.name?.trim()
      const license = decodedPayload.license?.trim()
      const company = decodedPayload.company?.trim()

      if (!name || !license) {
        toast.error("QR code is missing name or license")
        return
      }

      setEntries((prevEntries) => {
        const existingIndex = prevEntries.findIndex(
          (entry) => entry.license === license
        )

        // CASE: Already scanned before
        if (existingIndex !== -1) {
          const existing = prevEntries[existingIndex]

          // Already signed out
          if (existing.finishTime) {
            toast.warning(`User ${existing.name} has already signed out.`)
            return prevEntries
          }

          const start = new Date(existing.startTime).getTime()
          const elapsed = now - start

          if (elapsed >= 10000) {
            // Eligible for sign-out
            const updatedEntries = [...prevEntries]
            updatedEntries[existingIndex] = {
              ...existing,
              finishTime: new Date().toISOString(),
            }
            toast.info(`Signed out: ${existing.name}`)
            return updatedEntries
          } else {
            // Too soon to sign out
            toast.warning(`Please wait at least 10 seconds before signing out.`)
            return prevEntries
          }
        }

        // New entry: sign in
        const newEntry: Entry = {
          name,
          license,
          company,
          event: eventName,
          bib: "", // to be assigned
          startTime: new Date().toISOString(),
        }

        setPendingEntry(newEntry)
        setBibModalOpen(true)
        return prevEntries // Don't add yet        
      })
    } catch (err) {
      console.error("QR parsing failed", err)
      toast.error("Invalid QR Code format")
    }
  }

  const handleScanError = (errorMessage: string) => {
    console.warn("QR scan error:", errorMessage);
    // toast.error("QR code scanning error");
  }

  const startScanner = async () => {
    if (!eventName.trim()) {
      toast.error("Please enter an event name");
      return;
    }

    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        toast.error("No camera device found.");
        return;
      }

      const selectedDeviceId = devices[0].id;
      const html5QrCode = new Html5Qrcode(videoId);

      await html5QrCode.start(
        { deviceId: { exact: selectedDeviceId } },
        {
          fps: 10,
          qrbox: { width: 300, height: 300 },
        },
        handleScanSuccess,
        handleScanError
      );

      scannerRef.current = html5QrCode;
      setIsScanning(true);
    } catch (err) {
      console.error("Failed to start scanner:", err);
      toast.error("Failed to start scanner");
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

  const handleDownloadConfirm = () => {
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

  const handleResetConfirm = () => {
    setEntries([])
    toast.success("All data reset")
  }

  const confirmRemoval = (index: number) => {
    const updated = [...entries]
    updated.splice(index, 1)
    setEntries(updated)
    toast.info("Entry removed")
  }

  const showConfirmDialog = ({
    title,
    description,
    confirmText,
    cancelText = "Cancel",
    onConfirm,
  }: Omit<ConfirmDialogState, "open">) => {
    setConfirmDialog({
      open: true,
      title,
      description,
      confirmText,
      cancelText,
      onConfirm,
    })
  }

  const handleBibConfirm = (bib: string) => {
    if (!pendingEntry) return

    const finalEntry = { ...pendingEntry, bib }

    setEntries((prev) => [...prev, finalEntry])
    toast.success(`Signed in: ${finalEntry.name} with Bib ${bib}`)

    setPendingEntry(null)
    setCustomBib("")
    setBibModalOpen(false)
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
              placeholder="Please provide an event name..."
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
          <div
            id={videoId}
            className={`transition-all duration-300 ease-in-out overflow-hidden rounded border 
              ${isScanning ? "scale-100 opacity-100 border-gray-300 mb-4" : "scale-0 opacity-0 h-0 border-transparent"}
            `}
          />

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
            <div className="flex gap-2 flex-wrap">
              <div className="bg-muted text-muted-foreground px-3 py-1 rounded text-sm">
                Total: {entries.length}
              </div>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm">
                Active: {entries.filter(e => !e.finishTime).length}
              </div>
              <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm">
                Signed Out: {entries.filter(e => e.finishTime).length}
              </div>
            </div>

            <Input
              type="search"
              placeholder="Search by name, company, or license..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

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
                  {entries
                    .filter((entry) => {
                      const query = searchQuery.toLowerCase()
                      return (
                        entry.name.toLowerCase().includes(query) ||
                        entry.company.toLowerCase().includes(query) ||
                        entry.license.toLowerCase().includes(query)
                      )
                    })
                    .map((entry, index) => (
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
                              onClick={() =>
                                showConfirmDialog({
                                  title: "Remove Entry",
                                  description: "Are you sure you want to remove this entry? This action cannot be undone.",
                                  confirmText: "Remove",
                                  cancelText: "Cancel",
                                  onConfirm: () => confirmRemoval(index),
                                })
                              }
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
              <Button
                className="flex-1"
                onClick={() =>
                  showConfirmDialog({
                    title: "Download CSV",
                    description: "Do you want to download all entries as a CSV file?",
                    confirmText: "Download",
                    onConfirm: handleDownloadConfirm,
                  })
                }
              >
                Download CSV
              </Button>
              <Button
                className="flex-1"
                variant="destructive"
                onClick={() =>
                  showConfirmDialog({
                    title: "Reset All Entries",
                    description: "Are you sure you want to remove all scanned entries? This cannot be undone.",
                    confirmText: "Reset",
                    onConfirm: handleResetConfirm,
                  })
                }
              >
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

      {/* -------CONFIRMATION DIALOG------- */}
      <ConfirmDialog
        open={confirmDialog.open}
        setOpen={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        onConfirm={confirmDialog.onConfirm}
      />

      {/* -------BIB DIALOG------- */}
      <Dialog open={bibModalOpen} onOpenChange={setBibModalOpen}>
        <DialogContent className="sm:max-w-sm w-[90%] text-center space-y-4 p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Assign Bib Number</DialogTitle>
          </DialogHeader>

          {pendingEntry && (
            <>
              <p className="text-muted-foreground text-sm">Assign bib for <strong>{pendingEntry.name}</strong></p>

              <div className="grid grid-cols-5 gap-2 justify-center">
                {Array.from({ length: 5 }, (_, i) => {
                  const highestBib = entries.reduce((max, e) => {
                    const num = parseInt(e.bib, 10)
                    return isNaN(num) ? max : Math.max(max, num)
                  }, 0)
                  const suggestedBib = highestBib + i + 1

                  return (
                    <Button
                      key={suggestedBib}
                      variant="outline"
                      onClick={() => handleBibConfirm(suggestedBib.toString())}
                    >
                      {suggestedBib}
                    </Button>
                  )
                })}
              </div>

              <div className="pt-2">
                <Input
                  type="number"
                  placeholder="Enter custom bib"
                  value={customBib}
                  onChange={(e) => setCustomBib(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customBib.trim()) {
                      handleBibConfirm(customBib.trim())
                    }
                  }}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
