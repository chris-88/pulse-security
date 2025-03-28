import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "react-toastify"
import { Html5Qrcode } from "html5-qrcode"

type Entry = {
    code: string
    name: string
    email: string
    bib: string
    event: string
    startTime: string
    finishTime?: string
}

export default function ScannerPage() {
    const scannerId = "qr-reader"
    const [isScanning, setIsScanning] = useState(false)
    const [eventName, setEventName] = useState("")
    const [entries, setEntries] = useState<Entry[]>([])
    const [scanner, setScanner] = useState<Html5Qrcode | null>(null)

    const [adminUnlocked, setAdminUnlocked] = useState(false)

    const [showBibModal, setShowBibModal] = useState(false)
    const [bibInput, setBibInput] = useState("")
    const [currentScan, setCurrentScan] = useState<{ name: string; email: string; code: string } | null>(null)

    const quickBibs = getQuickBibSuggestions()

    useEffect(() => {
        const saved = localStorage.getItem("scannedEntries")
        if (saved) setEntries(JSON.parse(saved))
    }, [])

    useEffect(() => {
        localStorage.setItem("scannedEntries", JSON.stringify(entries))
    }, [entries])

    function getQuickBibSuggestions(): number[] {
        const lastBib = Math.max(0, ...entries.map((e) => parseInt(e.bib) || 0))
        return Array.from({ length: 5 }, (_, i) => lastBib + i + 1)
    }

    const startScanner = async () => {
        if (!eventName.trim()) {
            toast.error("Please enter an event name first");
            return;
        }

        console.log("Initializing scanner...");

        try {
            const scanner = new Html5Qrcode(scannerId);
            await scanner.start(
                { facingMode: "environment" }, // Ensures front camera on most devices
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                onScanSuccess,
                (errorMessage) => {
                    console.error("Scan error:", errorMessage);  // Log scanning errors here
                    toast.error("Scanning failed: " + errorMessage);
                }
            );
            setScanner(scanner);
            setIsScanning(true);
            console.log("Scanner started.");
        } catch (err) {
            toast.error("Camera permission or initialization failed");
            console.error("Error starting scanner:", err);
        }
    };

    const stopScanner = async () => {
        if (scanner?.isScanning) {
            await scanner.stop();
            await scanner.clear();
            setIsScanning(false);
            setScanner(null);
            console.log("Scanner stopped.");
        }
    };

    const onScanSuccess = (decodedText: string) => {
        console.log("Decoded QR Code:", decodedText); // Add log for debugging

        try {
            const [name, email] = atob(decodedText).split("|").map((s) => s.trim())
            const code = decodedText

            const existing = entries.find((e) => e.email === email && e.event === eventName)

            if (existing) {
                if (existing.name !== name) {
                    return toast.error(`License conflict: already used by ${existing.name}`)
                }

                const now = Date.now()
                const start = new Date(existing.startTime).getTime()
                const diff = now - start

                if (!existing.finishTime && diff >= 30000) {
                    existing.finishTime = new Date().toISOString()
                    setEntries([...entries])
                    return toast.info(`Signed out: ${existing.name}`)
                }

                return // silent ignore
            }

            setCurrentScan({ name, email, code })
            setShowBibModal(true)
        } catch {
            toast.error("Invalid QR format")
        }
    };

    const confirmBib = () => {
        if (!currentScan) return
        if (!bibInput.trim()) return toast.error("Please enter a bib number")

        const entry: Entry = {
            ...currentScan,
            bib: bibInput.trim(),
            event: eventName,
            startTime: new Date().toISOString(),
        }

        setEntries([...entries, entry])
        setBibInput("")
        setCurrentScan(null)
        setShowBibModal(false)
        toast.success(`Signed in: ${entry.name}`)
    }

    const removeEntry = (code: string) => {
        if (!confirm("Remove this entry?")) return
        setEntries(entries.filter((e) => e.code !== code))
    }

    const resetAll = () => {
        if (!confirm("Reset all data?")) return
        setEntries([])
    }

    const downloadCSV = () => {
        if (!entries.length) return toast.info("No entries to download")

        const rows = [
            ["Name", "License", "Bib", "Event", "Start Time", "Finish Time"],
            ...entries.map((e) => [
                e.name,
                e.email,
                e.bib,
                e.event,
                e.startTime,
                e.finishTime || "",
            ]),
        ]

        const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n")
        const blob = new Blob([csv], { type: "text/csv" })
        const url = URL.createObjectURL(blob)

        const link = document.createElement("a")
        link.href = url
        link.download = "pulse-scanner.csv"
        link.click()
        URL.revokeObjectURL(url)
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

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <Card
                className={`max-w-6xl mx-auto border-2 transition-all duration-300 ${isScanning ? "border-green-500" : "border-red-500"}`}
            >
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="text-xl">Pulse Scanner</CardTitle>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Input
                            placeholder="Event name"
                            value={eventName}
                            onChange={(e) => setEventName(e.target.value)}
                        />
                        <Button
                            onClick={isScanning ? stopScanner : startScanner}
                            variant="outline"
                            className={`rounded-full border-2 ${isScanning ? "border-green-500 text-green-600" : "border-red-500 text-red-600"}`}
                            title={isScanning ? "Stop Scanner" : "Start Scanner"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
                            </svg>
                        </Button>
                    </div>
                </CardHeader>

                <CardContent>
                    <div id={scannerId} className="hidden" />

                    {entries.length > 0 && (
                        <div className="mt-6 overflow-x-auto">
                            <table className="w-full text-sm bg-white rounded border">
                                <thead className="bg-gray-200">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Name</th>
                                        <th className="px-4 py-2">License</th>
                                        <th className="px-4 py-2">Bib</th>
                                        <th className="px-4 py-2">Start</th>
                                        <th className="px-4 py-2">Finish</th>
                                        <th className="px-4 py-2 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map((e) => (
                                        <tr key={e.code} className="border-t">
                                            <td className="px-4 py-2">{e.name}</td>
                                            <td className="px-4 py-2">{e.email}</td>
                                            <td className="px-4 py-2">{e.bib}</td>
                                            <td className="px-4 py-2">
                                                {new Date(e.startTime).toLocaleTimeString("en-GB")}
                                            </td>
                                            <td className="px-4 py-2">
                                                {e.finishTime
                                                    ? new Date(e.finishTime).toLocaleTimeString("en-GB")
                                                    : ""}
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                <Button
                                                    variant="link"
                                                    className="text-red-600 px-0"
                                                    onClick={() => removeEntry(e.code)}
                                                >
                                                    Remove
                                                </Button>
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

            <Dialog open={showBibModal} onOpenChange={() => setShowBibModal(false)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Assign Bib Number</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground mb-2">
                        {currentScan?.name} ({currentScan?.email})
                    </p>
                    <div className="flex gap-2 mb-3">
                        {quickBibs.map((b) => (
                            <Button key={b} variant="outline" onClick={() => setBibInput(String(b))}>
                                {b}
                            </Button>
                        ))}
                    </div>
                    <Input
                        placeholder="Manual bib entry"
                        value={bibInput}
                        onChange={(e) => setBibInput(e.target.value)}
                    />
                    <Button className="mt-4 w-full" onClick={confirmBib}>
                        Confirm
                    </Button>
                </DialogContent>
            </Dialog>

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
