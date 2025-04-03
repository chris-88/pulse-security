import { useRef, useState, useEffect } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { toast } from "sonner"
import { Clock, UserCheck, UserX, Users, Lock, LockOpen, Unlock, ScanLine, PauseCircle, } from "lucide-react"

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
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null)
  const [eventNameCommitted, setEventNameCommitted] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    title: "",
    description: "",
    confirmText: "",
    cancelText: "Cancel",
    onConfirm: () => { },
  })

  // -----------TIME-----------
  const [currentTime, setCurrentTime] = useState(new Date())
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])
  const timeString = currentTime.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  // -----------FOCUS ON LOAD-----------
  const eventNameRef = useRef<HTMLInputElement | null>(null)
  useEffect(() => {
    eventNameRef.current?.focus()
  }, [])

  // -----------RELOCK-----------
  // Lock when admin gets turned off
  useEffect(() => {
    if (!adminUnlocked && eventName.trim() && !eventNameCommitted) {
      setEventNameCommitted(true)
    }
  }, [adminUnlocked])

  // Unlock when admin gets turned on
  useEffect(() => {
    if (adminUnlocked && eventNameCommitted) {
      setEventNameCommitted(false)
    }
  }, [adminUnlocked])

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
      toast.error("Please enter an event name")
      return
    }

    try {
      const devices = await Html5Qrcode.getCameras()
      if (!devices || devices.length === 0) {
        toast.error("No camera device found.")
        return
      }

      // Set cameras if not already set
      if (cameras.length === 0) {
        const camList = devices.map((d) => ({ id: d.id, label: d.label || `Camera ${d.id}` }))
        setCameras(camList)
        setSelectedCameraId(devices[0].id)
      }

      const html5QrCode = new Html5Qrcode(videoId)
      const selectedCamera = cameras.find((cam) => cam.id === selectedCameraId)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const cameraConfig = isIOS && selectedCamera?.label.toLowerCase().includes("back")
        ? { facingMode: "environment" as const }
        : { deviceId: { exact: selectedCameraId || devices[0].id } }

      await html5QrCode.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: function (viewfinderWidth: number, viewfinderHeight: number) {
            const size = Math.min(viewfinderWidth, viewfinderHeight, 500)
            return { width: size, height: size }
          }
        },
        handleScanSuccess,
        handleScanError
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <Card
        className={`w-full max-w-[1600px] mx-auto transition-all duration-300 border-2 ${isScanning ? "border-green-500" : "border-red-500"
          }`}
      >
        <CardHeader className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <CardTitle className="text-3xl">Pulse Scanner</CardTitle>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Input
                ref={eventNameRef}
                placeholder="Event name"
                value={eventName}
                onChange={(e) => {
                  setEventName(e.target.value)

                  // Reset committed state if admin is unlocked
                  if (adminUnlocked && eventNameCommitted) {
                    setEventNameCommitted(false)
                  }
                }}
                onBlur={() => {
                  if (eventName.trim() && !adminUnlocked) {
                    setEventNameCommitted(true)
                  }
                }}
                disabled={eventNameCommitted && !adminUnlocked}
                className="pr-10"
              />

              {eventNameCommitted && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  {adminUnlocked ? (
                    <Unlock className="w-4 h-4 text-green-600" />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              )}
            </div>

            <Button
              onClick={isScanning ? stopScanner : startScanner}
              variant="ghost"
              className={` ${isScanning ? "text-green-600" : "text-red-600"
                }`}
              title={isScanning ? "Stop Scanner" : "Start Scanner"}
            >
              {isScanning ? (
                <PauseCircle className="w-5 h-5" />
              ) : (
                <ScanLine className="w-5 h-5" />
              )}
            </Button>
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
                <LockOpen className="w-6 h-6 text-green-600" />
              ) : (
                <Lock className="w-6 h-6 text-red-600" />
              )}
            </Button>

          </div>
        </CardHeader>

        <CardContent>
          {cameras.length > 1 && (
            <div className="mb-4">
              <Label className="text-sm mb-1 block">Camera</Label>
              <Select
                value={selectedCameraId ?? ""}
                onValueChange={(value) => setSelectedCameraId(value)}
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Select camera" />
                </SelectTrigger>
                <SelectContent>
                  {cameras.map((cam) => (
                    <SelectItem key={cam.id} value={cam.id}>
                      {cam.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="w-full max-w-[1000px] mx-auto px-4">
            <AspectRatio ratio={4 / 3} className="w-full">
              <div
                id={videoId}
                className={`
                  w-full h-full rounded border transition-all duration-300 ease-in-out overflow-hidden
                  ${isScanning ? "opacity-100 border-gray-300" : "opacity-0 border-transparent pointer-events-none"}
                `}
                style={{
                  maxHeight: isScanning ? "600px" : "0px",
                }}
              />
            </AspectRatio>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="default" className="gap-2">
                <Clock className="w-4 h-4" />
                {timeString}
              </Badge>
              <Badge variant="outline" className="gap-2">
                <Users className="w-4 h-4" />
                {entries.length}
              </Badge>
              <Badge variant="outline" className="gap-2 text-green-600 border-green-500">
                <UserCheck className="w-4 h-4" />
                {entries.filter((e) => !e.finishTime).length}
              </Badge>
              <Badge variant="outline" className="gap-2 text-red-500 border-red-400">
                <UserX className="w-4 h-4" />
                {entries.filter((e) => e.finishTime).length}
              </Badge>
            </div>

            <Input
              type="search"
              placeholder="Search..."
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
