import { useEffect, useRef, useState } from "react"
import { Html5Qrcode, Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "react-toastify"

export default function BasicScanner() {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const videoId = "html5qr-reader"
  const [isScanning, setIsScanning] = useState(false)
  const [eventName, setEventName] = useState("")

  const startScanner = async () => {
    if (!eventName.trim()) {
      toast.error("Please enter an event name")
      return
    }

    try {
      const devices = await Html5Qrcode.getCameras()
      console.log("Available cameras:", devices)

      if (!devices || devices.length === 0) {
        toast.error("No camera device found.")
        return
      }

      const selectedDeviceId = devices[0].id // fallback to first camera
      const html5QrCode = new Html5Qrcode(videoId)

      await html5QrCode.start(
        { deviceId: { exact: selectedDeviceId } },
        {
          fps: 10,
          qrbox: { width: 300, height: 400 },
        //   formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        },
        (decodedText) => {
          toast.success(`Scanned: ${decodedText}`)
        },
        (errorMessage) => {
          // You can optionally log these errors
          // console.warn("QR scan error:", errorMessage)
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

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h2 className="text-xl font-semibold">Scanner</h2>

      <Input
        placeholder="Enter event name"
        value={eventName}
        onChange={(e) => setEventName(e.target.value)}
      />

      <Button onClick={isScanning ? stopScanner : startScanner}>
        {isScanning ? "Stop Scanner" : "Start Scanner"}
      </Button>

      <div id={videoId} className="mt-4 rounded border h-[300px]" />
    </div>
  )
}