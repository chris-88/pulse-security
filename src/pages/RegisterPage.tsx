import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "react-toastify"
import QRCode from "qrcode"

const companies = [
  "Manguard Plus",
  "Securitas",
  "Noonan",
  "Bidvest Noonan",
  "G4S",
  "Eventsec",
]

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [hasLicense, setHasLicense] = useState(false)
  const [licenseNumber, setLicenseNumber] = useState("")
  const [qrImageUrl, setQrImageUrl] = useState("")
  const [showQRModal, setShowQRModal] = useState(false)
  const [customCompany, setCustomCompany] = useState("")

  const handleSubmit = async () => {
    const resolvedCompany = company === "Other" ? customCompany.trim() : company.trim()

    if (!name.trim() || !resolvedCompany || (hasLicense && !licenseNumber.trim())) {
      toast.error("Please complete all required fields")
      return
    }

    const payload = {
      name: name.trim(),
      company: resolvedCompany,
      license: hasLicense ? licenseNumber.trim() : "N/A",
    }

    try {
      const encodedPayload = btoa(JSON.stringify(payload))
      const url = await QRCode.toDataURL(encodedPayload)
      setQrImageUrl(url)
      setShowQRModal(true)
    } catch (err) {
      console.error(err)
      toast.error("Failed to generate QR code")
    }
  }


  const downloadQR = () => {
    const link = document.createElement("a")
    link.href = qrImageUrl
    link.download = "pulse-qrcode.png"
    link.click()
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 p-6">
      <div className="max-w-md mx-auto bg-white rounded-lg p-6 shadow border space-y-6">
        <h1 className="text-2xl font-bold">Pulse Registration</h1>

        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" value={name} placeholder="Michael Collins" onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Select Company</Label>
          <Select value={company} onValueChange={setCompany}>
            <SelectTrigger className="w-full" id="company">
              <SelectValue placeholder="Please select..." />
            </SelectTrigger>
            <SelectContent>
              {companies.map((comp) => (
                <SelectItem key={comp} value={comp}>
                  {comp}
                </SelectItem>
              ))}
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>

          {company === "Other" && (
            <div className="space-y-2 pt-4">
              <Label htmlFor="custom-company">Company Name</Label>
              <Input
                id="custom-company"
                placeholder="Please provide..."
                value={customCompany}
                onChange={(e) => setCustomCompany(e.target.value)}
              />
            </div>
          )}
        </div>



        <div className="flex items-center justify-between">
          <Label htmlFor="psa">Do you have your PSA License with you?</Label>
          <Switch id="psa" checked={hasLicense} onCheckedChange={setHasLicense} />
        </div>

        {hasLicense && (
          <div className="space-y-2">
            <Label htmlFor="license">License Number</Label>
            <Input
              id="license"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
            />
          </div>
        )}

        <Button className="w-full mt-4" onClick={handleSubmit}>
          Generate QR Code
        </Button>
      </div>

      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="p-6 max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="mb-4">Your QR Code</DialogTitle>
          </DialogHeader>
          {qrImageUrl && <img src={qrImageUrl} alt="QR Code" className="mx-auto" />}
          <Button className="w-full mt-4" onClick={downloadQR}>
            Save to Photos
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
