"use client"

import { useState, useEffect, useContext, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import { AuthContext } from "../../App"
import { mockApi } from "../../services/mockApi"
import * as XLSX from "xlsx"

// ─── Excel Import Modal ───────────────────────────────────────────────────────
function ExcelImportModal({ onClose, onSaved }) {
  const [step, setStep] = useState("groupName") // "groupName" | "preview"
  const [groupName, setGroupName] = useState("")
  const [groupNameError, setGroupNameError] = useState("")
  const [importedRows, setImportedRows] = useState([])
  const [fileName, setFileName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const fileInputRef = useRef(null)
  const { showNotification } = useContext(AuthContext)

  // Column mapping: Excel header → internal key
  // Keys are stored normalized (lowercase, no asterisks, trimmed) for robust matching
  const COLUMN_MAP_RAW = {
    "Lead Receiver Name": "receiverName",
    "Lead Source*": "source",
    "Lead Source": "source",
    "SC Name": "scName",
    "Company Name": "companyName",
    "Person Name": "personName",
    "Person Number": "phoneNumber",
    "Location": "location",
    "Email Address": "email",
    "State": "state",
    "Address": "address",
    "Person 1 Name": "person1Name",
    "Person 1 Designation": "person1Designation",
    "Person 1 Phone": "person1Phone",
    "Person 2 Name": "person2Name",
    "Person 2 Designation": "person2Designation",
    "Person 2 Phone": "person2Phone",
    "Person 3 Name": "person3Name",
    "Person 3 Designation": "person3Designation",
    "Person 3 Phone": "person3Phone",
    "Nature of Business(NOB)": "nob",
    "Nature of Business (NOB)": "nob",
    "NOB": "nob",
    "Sales Type": "salesType",
    "GST Number": "gstNumber",
    "GST No": "gstNumber",
    "Additional Notes": "additionalNotes",
    "Additional Note": "additionalNotes",
  }

  // Normalize a column label: lowercase + strip asterisks + trim spaces
  const normalizeCol = (str) => String(str).toLowerCase().replace(/\*/g, "").replace(/\s+/g, " ").trim()

  // Build a normalized lookup map once (normalized key → internalKey)
  const COLUMN_MAP = Object.fromEntries(
    Object.entries(COLUMN_MAP_RAW).map(([k, v]) => [normalizeCol(k), v])
  )

  // Display columns for the preview table (in order)
  const DISPLAY_COLUMNS = [
    { key: "receiverName", label: "Lead Receiver Name" },
    { key: "source", label: "Lead Source*" },
    { key: "scName", label: "SC Name" },
    { key: "companyName", label: "Company Name" },
    { key: "personName", label: "Person Name" },
    { key: "phoneNumber", label: "Person Number" },
    { key: "location", label: "Location" },
    { key: "email", label: "Email Address" },
    { key: "state", label: "State" },
    { key: "address", label: "Address" },
    { key: "person1Name", label: "Person 1 Name" },
    { key: "person1Designation", label: "Person 1 Designation" },
    { key: "person1Phone", label: "Person 1 Phone" },
    { key: "person2Name", label: "Person 2 Name" },
    { key: "person2Designation", label: "Person 2 Designation" },
    { key: "person2Phone", label: "Person 2 Phone" },
    { key: "person3Name", label: "Person 3 Name" },
    { key: "person3Designation", label: "Person 3 Designation" },
    { key: "person3Phone", label: "Person 3 Phone" },
    { key: "nob", label: "Nature of Business(NOB)" },
    { key: "salesType", label: "Sales Type" },
    { key: "gstNumber", label: "GST Number" },
    { key: "additionalNotes", label: "Additional Notes" },
    { key: "groupName", label: "Group Name" },
  ]

  const handleGroupNameNext = () => {
    if (!groupName.trim()) {
      setGroupNameError("Group Name is required")
      return
    }
    setGroupNameError("")
    setStep("preview")
  }


  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result)
        const workbook = XLSX.read(data, { type: "array" })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" })

        const mapped = rawRows.map((row) => {
          const obj = { groupName: groupName.trim() }
          // Normalize each Excel row key and match against our normalized COLUMN_MAP
          Object.keys(row).forEach((rawHeader) => {
            const normHeader = normalizeCol(rawHeader)
            if (COLUMN_MAP[normHeader] !== undefined) {
              const internalKey = COLUMN_MAP[normHeader]
              // Only overwrite if not already set (first match wins)
              if (!obj[internalKey]) {
                obj[internalKey] = row[rawHeader] !== undefined && row[rawHeader] !== null
                  ? String(row[rawHeader]).trim()
                  : ""
              }
            }
          })
          return obj
        })

        setImportedRows(mapped)
      } catch (err) {
        console.error("Excel parse error:", err)
        setSaveError("Failed to parse Excel file. Please check the format.")
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleSave = async () => {
    if (importedRows.length === 0) {
      setSaveError("No data to save. Please upload an Excel file first.")
      return
    }
    setIsSaving(true)
    setSaveError("")
    try {
      const result = await mockApi.bulkSubmitLeads(importedRows)
      if (result.success) {
        showNotification(
          `${result.count} lead(s) imported successfully and added to Pending section.`,
          "success"
        )
        onSaved(groupName)
        onClose()
      } else {
        setSaveError("Failed to save leads. Please try again.")
      }
    } catch (err) {
      setSaveError("An error occurred: " + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full mx-4"
        style={{ maxWidth: step === "preview" ? "95vw" : "480px", maxHeight: "92vh", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Import Leads from Excel</h3>
                {step === "preview" && (
                  <p className="text-xs text-gray-500 mt-0.5">Group: <span className="font-semibold text-emerald-600">{groupName}</span></p>
                )}
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-0 px-6 py-3 bg-gray-50 border-b border-gray-100">
          <div className={`flex items-center gap-2 text-xs font-medium ${step === "groupName" ? "text-emerald-600" : "text-gray-400"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step === "groupName" ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-600"}`}>1</span>
            Group Name
          </div>
          <div className="w-8 h-px bg-gray-300 mx-2" />
          <div className={`flex items-center gap-2 text-xs font-medium ${step === "preview" ? "text-emerald-600" : "text-gray-400"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step === "preview" ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"}`}>2</span>
            Upload & Preview
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {step === "groupName" ? (
            /* ── STEP 1: Group Name ── */
            <div className="p-8">
              <div className="mb-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                  <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">Before uploading your Excel file, please provide a <strong>Group Name</strong> to categorize these leads.</p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => { setGroupName(e.target.value); setGroupNameError("") }}
                  onKeyDown={(e) => e.key === "Enter" && handleGroupNameNext()}
                  placeholder="e.g. June 2025 Campaign, Indiamart Batch 1..."
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-colors ${groupNameError ? "border-red-400 bg-red-50" : "border-gray-300 hover:border-gray-400"}`}
                  autoFocus
                />
                {groupNameError && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    {groupNameError}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* ── STEP 2: Upload & Preview ── */
            <div className="p-6 space-y-4">
              {/* File Upload Zone */}
              <div
                className="border-2 border-dashed border-emerald-300 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                {fileName ? (
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">{fileName}</p>
                    <p className="text-xs text-gray-500 mt-1">{importedRows.length} row(s) found — Click to change file</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Click to upload Excel file</p>
                    <p className="text-xs text-gray-500 mt-1">Supports .xlsx, .xls, .csv</p>
                  </div>
                )}
              </div>

              {/* Preview Table */}
              {importedRows.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">Preview ({importedRows.length} rows)</span>
                    <span className="text-xs text-emerald-600 font-medium">Group: {groupName}</span>
                  </div>
                  <div className="overflow-auto" style={{ maxHeight: "400px" }}>
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 sticky top-0 z-10">
                          <th className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap border-b border-gray-200 bg-gray-50">#</th>
                          {DISPLAY_COLUMNS.map((col) => (
                            <th key={col.key} className={`px-3 py-2 text-left font-semibold whitespace-nowrap border-b border-gray-200 bg-gray-50 ${col.key === "groupName" ? "text-emerald-700 bg-emerald-50" : "text-gray-600"}`}>
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importedRows.map((row, idx) => (
                          <tr key={idx} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"} hover:bg-emerald-50/30 transition-colors`}>
                            <td className="px-3 py-2 text-gray-400 font-medium">{idx + 1}</td>
                            {DISPLAY_COLUMNS.map((col) => (
                              <td key={col.key} className={`px-3 py-2 whitespace-nowrap max-w-[140px] truncate ${col.key === "groupName" ? "text-emerald-700 font-semibold bg-emerald-50/30" : "text-gray-700"}`}
                                title={row[col.key] || ""}>
                                {row[col.key] || <span className="text-gray-300">—</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {saveError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {saveError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-100 hover:border-gray-400 transition-colors"
          >
            Cancel
          </button>
          {step === "groupName" ? (
            <button
              onClick={handleGroupNameNext}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl transition-all shadow-md hover:shadow-lg"
            >
              Next →
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep("groupName")}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || importedRows.length === 0}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save {importedRows.length > 0 ? `(${importedRows.length})` : ""} Leads
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Leads Component ─────────────────────────────────────────────────────
function Leads() {
  const [searchParams] = useSearchParams();
  const initialCompanyName = searchParams.get("companyName") || "";
  const initialPhoneNumber = searchParams.get("phoneNumber") || "";
  const initialPersonName = searchParams.get("personName") || "";
  const initialLocation = searchParams.get("location") || "";
  const initialEmail = searchParams.get("email") || "";
  const initialState = searchParams.get("state") || "";
  const initialGroupName = searchParams.get("groupName") || "";

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [formData, setFormData] = useState({
    receiverName: "",
    source: "",
    companyName: initialCompanyName,
    phoneNumber: initialPhoneNumber,
    salespersonName: initialPersonName,
    location: initialLocation,
    email: initialEmail,
    contactPersons: [{ name: "", designation: "", number: "" }],
    state: initialState,
    address: "",
    nob: "",
    salesType: "",
    gst: "",
    notes: "",
    scName: "",
    groupName: initialGroupName
  })
  const [scMasterData, setScMasterData] = useState([])
  const [scNames, setScNames] = useState([])
  const [receiverNames, setReceiverNames] = useState([])
  const [salesTypeOptions] = useState(["NBD", "CRR", "NBD_CRR"])
  const [leadSources, setLeadSources] = useState([])
  const [companyOptions, setCompanyOptions] = useState([])
  const [companyDetailsMap, setCompanyDetailsMap] = useState({})
  const [nextLeadNumber, setNextLeadNumber] = useState("")
  const [creditDaysOptions, setCreditDaysOptions] = useState([])
  const [creditLimitOptions, setCreditLimitOptions] = useState([])
  const { showNotification } = useContext(AuthContext)
  const [designationOptions, setDesignationOptions] = useState([])
  const [nobOptions, setNobOptions] = useState([])
  const [stateOptions, setStateOptions] = useState([])

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await fetchDropdownData()
        await fetchCompanyData()
      } catch (error) {
        console.error("Error during initial data fetch:", error)
      }
    }
    fetchInitialData()
  }, [])

  const fetchDropdownData = async () => {
    try {
      const data = await mockApi.fetchDropdowns()
      const scData = await mockApi.fetchScMaster()

      if (data) {
        setReceiverNames(data.receivers || [])
        setStateOptions(data.states || [])
        setCreditDaysOptions(data.creditDays || [])
        setCreditLimitOptions(data.creditLimits || [])
        setDesignationOptions(data.designations || [])
        setNobOptions(data.nobs || [])
      }

      if (scData) {
        setScMasterData(scData)
        setScNames(Array.from(new Set(scData.map(s => s.personName).filter(Boolean))))
      }

      const defaultSources = data?.sources || [];
      const dynamicSources = scData ? scData.map(s => s.sourceName).filter(Boolean) : [];
      setLeadSources(Array.from(new Set([...defaultSources, ...dynamicSources])));
    } catch (error) {
      console.error("Error fetching dropdown values:", error)
      setReceiverNames(["John Smith", "Sarah Johnson", "Michael Brown"])
      setLeadSources(["Indiamart", "Justdial", "Social Media", "Website", "Referral", "Other"])
    }
  }

  const fetchCompanyData = async () => {
    try {
      const companies = await mockApi.fetchCompanies()
      if (companies && companies.length > 0) {
        const companyNames = []
        const detailsMap = {}
        companies.forEach(company => {
          companyNames.push(company.name)
          detailsMap[company.name] = {
            salesPerson: company.salesPerson || "",
            phoneNumber: company.phoneNumber || "",
            email: company.email || "",
            location: company.location || ""
          }
        })
        setCompanyOptions(companyNames)
        setCompanyDetailsMap(detailsMap)
        if (initialCompanyName && detailsMap[initialCompanyName]) {
          const companyDetails = detailsMap[initialCompanyName];
          setFormData(prev => ({
            ...prev,
            phoneNumber: companyDetails.phoneNumber || "",
            salespersonName: companyDetails.salesPerson || "",
            location: companyDetails.location || "",
            email: companyDetails.email || ""
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching company data:", error)
      setCompanyOptions([])
      setCompanyDetailsMap({})
    }
  }

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prevData => ({
      ...prevData,
      [id]: value
    }))

    if (id === 'source' && value) {
      const matchedSc = scMasterData.find(sc => sc.sourceName.toLowerCase() === value.toLowerCase());
      if (matchedSc && matchedSc.personName) {
        setFormData(prevData => ({
          ...prevData,
          source: value,
          scName: matchedSc.personName
        }));
      }
    }

    if (id === 'companyName' && value) {
      const companyDetails = companyDetailsMap[value] || {}
      setFormData(prevData => ({
        ...prevData,
        companyName: value,
        phoneNumber: companyDetails.phoneNumber || "",
        salespersonName: companyDetails.salesPerson || "",
        location: companyDetails.location || "",
        email: companyDetails.email || ""
      }))
    }
  }

  const handleContactPersonChange = (index, field, value) => {
    const updatedContactPersons = [...formData.contactPersons]
    updatedContactPersons[index] = {
      ...updatedContactPersons[index],
      [field]: value
    }
    setFormData({
      ...formData,
      contactPersons: updatedContactPersons
    })
  }

  const addContactPerson = () => {
    if (formData.contactPersons.length < 3) {
      setFormData({
        ...formData,
        contactPersons: [...formData.contactPersons, { name: "", designation: "", number: "" }]
      })
    }
  }

  const removeContactPerson = (index) => {
    const updatedContactPersons = [...formData.contactPersons]
    updatedContactPersons.splice(index, 1)
    setFormData({
      ...formData,
      contactPersons: updatedContactPersons
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formattedDate = formatDate(new Date())
      const submissionData = {
        ...formData,
        date: formattedDate
      }
      const result = await mockApi.submitLead(submissionData)
      if (result.success) {
        showNotification("Lead created successfully", "success")
        setFormData({
          receiverName: "",
          source: "",
          companyName: "",
          phoneNumber: "",
          salespersonName: "",
          location: "",
          email: "",
          contactPersons: [{ name: "", designation: "", number: "" }],
          state: "",
          address: "",
          nob: "",
          salesType: "",
          gst: "",
          notes: "",
          scName: "",
          groupName: ""
        })
      } else {
        showNotification("Error creating lead: " + (result.error || "Unknown error"), "error")
      }
    } catch (error) {
      showNotification("Error submitting form: " + error.message, "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-10 px-4">
      {/* Import Modal */}
      {showImportModal && (
        <ExcelImportModal
          onClose={() => setShowImportModal(false)}
          onSaved={(gName) => {
            if (gName) {
              setFormData(prev => ({ ...prev, groupName: gName }));
            }
          }}
        />
      )}

      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">New Lead</h2>
            <p className="text-sm text-slate-500">Fill in the lead information below</p>
            {nextLeadNumber && (
              <p className="text-sm font-medium text-blue-600 mt-1">
                Next Lead Number: {nextLeadNumber}
              </p>
            )}
          </div>
          {/* Header Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Download Template Button */}
            <button
              type="button"
              onClick={() => {
                const wb = XLSX.utils.book_new();
                const HEADERS = [
                  "Lead Receiver Name","Lead Source*","SC Name","Company Name",
                  "Person Name","Person Number","Location","Email Address","State","Address",
                  "Person 1 Name","Person 1 Designation","Person 1 Phone",
                  "Person 2 Name","Person 2 Designation","Person 2 Phone",
                  "Person 3 Name","Person 3 Designation","Person 3 Phone",
                  "Nature of Business(NOB)","Sales Type","GST Number",
                  "Additional Notes"
                ];
                const ws = XLSX.utils.aoa_to_sheet([HEADERS]);
                ws["!cols"] = HEADERS.map(() => ({ wch: 24 }));
                XLSX.utils.book_append_sheet(wb, ws, "Lead Import Template");
                XLSX.writeFile(wb, "Lead_Import_Template.xlsx");
              }}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-700 bg-white border-2 border-emerald-400 hover:bg-emerald-50 rounded-xl transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Template
            </button>
            {/* Import Excel Button */}
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Import Excel
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="space-y-2">
                <label htmlFor="receiverName" className="block text-sm font-medium text-gray-700">
                  Lead Receiver Name
                </label>
                <select
                  id="receiverName"
                  value={formData.receiverName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select receiver</option>
                  {receiverNames.map((name, index) => (
                    <option key={index} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                  Lead Source <span className="text-red-500">*</span>
                </label>
                <select
                  id="source"
                  value={formData.source}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select source</option>
                  {leadSources.map((source, index) => (
                    <option key={index} value={source}>{source}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="scName" className="block text-sm font-medium text-gray-700">
                  SC Name
                </label>
                <input
                  list="scNameOptions"
                  id="scName"
                  value={formData.scName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter or select SC Name"
                />
                <datalist id="scNameOptions">
                  {scNames.map((name, index) => (
                    <option key={index} value={name} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <input
                  list="companyOptions"
                  id="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <datalist id="companyOptions">
                  {companyOptions.map((company, index) => (
                    <option key={index} value={company} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                  Person Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Phone number will auto-fill"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="salespersonName" className="block text-sm font-medium text-gray-700">
                  Person Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="salespersonName"
                  value={formData.salespersonName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Person name will auto-fill"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  id="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Location will auto-fill"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address <span className="text-xs text-gray-500">(Optional)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email will auto-fill"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <select
                  id="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select state</option>
                  {stateOptions.map((state, index) => (
                    <option key={index} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              {formData.groupName && (
                <div className="space-y-2">
                  <label htmlFor="groupName" className="block text-sm font-medium text-gray-700">
                    Group Name
                  </label>
                  <input
                    id="groupName"
                    value={formData.groupName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter group name (optional)"
                  />
                </div>
              )}
            </div>

            {/* Address Field */}
            <div className="space-y-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                id="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter complete address"
                rows="2"
              />
            </div>

            {/* Contact Person Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-medium">Contact Person Details</h3>
                {formData.contactPersons.length < 3 && (
                  <button
                    type="button"
                    onClick={addContactPerson}
                    className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Add Person
                  </button>
                )}
              </div>

              {formData.contactPersons.map((person, index) => (
                <div key={index} className="border rounded-md p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium">Person {index + 1}</h4>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeContactPerson(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        value={person.name}
                        onChange={(e) => handleContactPersonChange(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contact name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Designation</label>
                      <select
                        value={person.designation}
                        onChange={(e) => handleContactPersonChange(index, 'designation', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select designation</option>
                        {designationOptions.map((designation, idx) => (
                          <option key={idx} value={designation}>{designation}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                      <input
                        value={person.number}
                        onChange={(e) => handleContactPersonChange(index, 'number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contact number"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="nob" className="block text-sm font-medium text-gray-700">
                  Nature of Business (NOB) <span className="text-red-500">*</span>
                </label>
                <select
                  id="nob"
                  value={formData.nob}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select nature of business</option>
                  {nobOptions.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="salesType" className="block text-sm font-medium text-gray-700">
                  Sales Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="salesType"
                  value={formData.salesType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select sales type</option>
                  {salesTypeOptions.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="gst" className="block text-sm font-medium text-gray-700">
                  GST Number
                </label>
                <input
                  id="gst"
                  value={formData.gst}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="GST number"
                />
              </div>






            </div>

            <div className="space-y-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Additional Notes
              </label>
              <input
                id="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter any additional information"
              />
            </div>
          </div>
          <div className="p-6 border-t flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
            >
              {isSubmitting ? "Saving..." : "Save Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Leads
