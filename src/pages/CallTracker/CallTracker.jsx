"use client"

import { useState, useEffect, useContext } from "react"
import { Link } from "react-router-dom"
import { SearchIcon, ArrowRightIcon } from "../../components/Icons"
import { AuthContext } from "../../App"
import DataTable from "../../components/DataTable"
import CallTrackerFilter from "../../components/call-tracker/CallTrackerFilter" // Import AuthContext
import { mockApi } from "../../services/mockApi"

const slideIn = "animate-in slide-in-from-right duration-300"
const slideOut = "animate-out slide-out-to-right duration-300"
const fadeIn = "animate-in fade-in duration-300"
const fadeOut = "animate-out fade-out duration-300"

function CallTracker() {
  const { currentUser, userType, isAdmin } = useContext(AuthContext) // Get user info and admin function
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("pending")
  const [pendingFollowUps, setPendingFollowUps] = useState([])
  const [historyFollowUps, setHistoryFollowUps] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState([])
  const [dateFilter, setDateFilter] = useState([]) // New state for date filter
  const [showPopup, setShowPopup] = useState(false)
  const [selectedFollowUp, setSelectedFollowUp] = useState(null)
  const [companyFilter, setCompanyFilter] = useState([])
  const [personFilter, setPersonFilter] = useState([])
  const [phoneFilter, setPhoneFilter] = useState([])
  const [visibleColumns, setVisibleColumns] = useState({
    leadNo: true,
    companyName: true,
    personName: true,
    phoneNumber: true,
    nextCallDate: true,
    nextAction: true,
    customerSay: true,
    timestamp: false,
    callingCount: false,
    enquiryCallingCount: false,
    noOfFollowUps: false,
    lastFollowUpStatus: false,
    enquiryStatus: false,
    receivedDate: false,
    state: false,
    projectName: false,
    salesType: false,
    productDate: false,
    projectValue: false,
    item1: false,
    qty1: false,
    item2: false,
    qty2: false,
    item3: false,
    qty3: false,
    item4: false,
    qty4: false,
    item5: false,
    qty5: false,
    callDate: false,
    callTime: false,
    itemQty: false,
  })
  const [visibleColumnsPending, setVisibleColumnsPending] = useState({
    action: true,
    leadId: true,
    companyName: true,
    personName: true,
    phoneNumber: true,
    nextCallDate: true,
    nextAction: true,
    customerSay: true,
    leadSource: false,
    location: false,
    enquiryStatus: false,
    assignedTo: false,
    email: false,
    lastFollowUpDate: false,
    noOfFollowUps: false,
    lastFollowUpStatus: false,
    state: false,
    address: false,
    personName1: false,
    designation1: false,
    phoneNumber1: false,
    personName2: false,
    designation2: false,
    phoneNumber2: false,
    personName3: false,
    designation3: false,
    phoneNumber3: false,
    natureOfBusiness: false,
    gst: false,
    customerRegistrationForm: false,
    creditAccess: false,
    creditDays: false,
    creditLimit: false,
    additionalNotes: false,
    groupName: false,
  })
  const [showColumnDropdown, setShowColumnDropdown] = useState(false)

  // Helper function to determine priority based on lead source
  const determinePriority = (source) => {
    if (!source) return "Low"

    const sourceLower = source.toLowerCase()
    if (sourceLower.includes("indiamart")) return "High"
    if (sourceLower.includes("website")) return "Medium"
    return "Low"
  }

  // Helper function to format next call time
  const formatNextCallTime = (timeValue) => {
    if (!timeValue) return ""

    try {
      // Check if it's a Date(YYYY,MM,DD,HH,MM,SS) format
      if (typeof timeValue === "string" && timeValue.startsWith("Date(")) {
        // Extract hours and minutes from the Date string
        const timeString = timeValue.substring(5, timeValue.length - 1)
        const [year, month, day, hours, minutes, seconds] = timeString
          .split(",")
          .map((part) => Number.parseInt(part.trim()))

        // Convert to 12-hour format
        const formattedHours = hours % 12 || 12 // Convert to 12-hour format
        const period = hours >= 12 ? "PM" : "AM"

        // Pad minutes with leading zero if needed
        const formattedMinutes = minutes.toString().padStart(2, "0")

        return `${formattedHours}:${formattedMinutes} ${period}`
      }

      // If it's already in HH:MM:SS format
      if (typeof timeValue === "string" && /^\d{2}:\d{2}:\d{2}$/.test(timeValue)) {
        const [hours, minutes] = timeValue.split(":").map(Number)

        // Convert to 12-hour format
        const formattedHours = hours % 12 || 12
        const period = hours >= 12 ? "PM" : "AM"

        // Pad minutes with leading zero if needed
        const formattedMinutes = minutes.toString().padStart(2, "0")

        return `${formattedHours}:${formattedMinutes} ${period}`
      }

      // Fallback to original value if parsing fails
      return timeValue
    } catch (error) {
      console.error("Error formatting time:", error)
      return timeValue
    }
  }

  // Helper function to calculate next call date (3 days after created date)
  const calculateNextCallDate = (createdDate) => {
    if (!createdDate) return ""

    try {
      // Parse the date - assuming format is DD/MM/YYYY
      const parts = createdDate.split("/")
      if (parts.length !== 3) return ""

      const date = new Date(parts[2], parts[1] - 1, parts[0])
      date.setDate(date.getDate() + 3) // Add 3 days for next call

      // Format as YYYY-MM-DD for display
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    } catch (error) {
      console.error("Error calculating next call date:", error)
      return ""
    }
  }

  // Helper function to format date to DD/MM/YYYY
  const formatDateToDDMMYYYY = (dateValue) => {
    if (!dateValue) return ""

    try {
      // Check if it's a Date object-like string (e.g. "Date(2025,3,22)")
      if (typeof dateValue === "string" && dateValue.startsWith("Date(")) {
        // Extract the parts from Date(YYYY,MM,DD) format
        const dateString = dateValue.substring(5, dateValue.length - 1)
        const [year, month, day] = dateString.split(",").map((part) => Number.parseInt(part.trim()))

        // JavaScript months are 0-indexed, but we need to display them as 1-indexed
        // Also ensure day and month are padded with leading zeros if needed
        return `${day.toString().padStart(2, "0")}/${(month + 1).toString().padStart(2, "0")}/${year}`
      }

      // Handle other date formats if needed
      const date = new Date(dateValue)
      if (!isNaN(date.getTime())) {
        return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`
      }

      // If it's already in the correct format, return as is
      return dateValue
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateValue // Return the original value if formatting fails
    }
  }

  // Helper function to parse date from column CL and compare with today
  const getDateFromColumnCL = (dateValue) => {
    if (!dateValue) return null

    try {
      // Check if it's a Date object-like string (e.g. "Date(2025,4,27)")
      if (typeof dateValue === "string" && dateValue.startsWith("Date(")) {
        const dateString = dateValue.substring(5, dateValue.length - 1)
        const [year, month, day] = dateString.split(",").map((part) => Number.parseInt(part.trim()))
        // JavaScript months are 0-indexed
        return new Date(year, month, day)
      }

      // Try to parse as regular date
      const parsedDate = new Date(dateValue)
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate
      }

      return null
    } catch (error) {
      console.error("Error parsing date from column CL:", error)
      return null
    }
  }

  const displayDate = (dateVal, fallbackVal = "") => {
    if (!dateVal) return fallbackVal
    const lowerVal = String(dateVal).toLowerCase().trim()
    const today = new Date()

    if (lowerVal === "today") {
      return `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`
    }
    if (lowerVal === "yesterday" || lowerVal === "overdue") {
      const yesterday = new Date()
      yesterday.setDate(today.getDate() - 1)
      return `${String(yesterday.getDate()).padStart(2, "0")}/${String(yesterday.getMonth() + 1).padStart(2, "0")}/${yesterday.getFullYear()}`
    }
    if (lowerVal === "upcoming" || lowerVal === "tomorrow") {
      const tomorrow = new Date()
      tomorrow.setDate(today.getDate() + 1)
      return `${String(tomorrow.getDate()).padStart(2, "0")}/${String(tomorrow.getMonth() + 1).padStart(2, "0")}/${tomorrow.getFullYear()}`
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
      const parts = dateVal.split("-")
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }

    return dateVal
  }

  // Add this helper function after the other helper functions (around line 100)
  const formatItemQty = (itemQtyString) => {
    if (!itemQtyString) return ""

    try {
      const items = JSON.parse(itemQtyString)
      return items
        .filter(item => item.name && item.quantity && item.quantity !== "0")
        .map(item => `${item.name} : ${item.quantity}`)
        .join(", ")
    } catch (error) {
      console.error("Error parsing item quantity:", error)
      return itemQtyString // Return original string if parsing fails
    }
  }

  // Helper function to check date filter condition
  const checkDateFilter = (followUp, filterType) => {
    if (filterType === "all" || !filterType || filterType.length === 0) return true

    if (activeTab === "pending") {
      // Get the text value from column CL (nextCallDate field)
      const columnCLValue = followUp.nextCallDate
      if (!columnCLValue) return false

      // Convert the column CL value to lowercase for comparison
      const columnCLText = String(columnCLValue).toLowerCase()

      // Match the filter type with the text in column CL
      switch (filterType) {
        case "today":
          return columnCLText.includes("today")
        case "overdue":
          return columnCLText.includes("overdue")
        case "upcoming":
          return columnCLText.includes("upcoming")
        default:
          return true
      }
    } else {
      // History tab filtering
      const nextCallDate = followUp.nextCallDate
      if (!nextCallDate) return false

      try {
        // Parse the date from DD/MM/YYYY format
        const [day, month, year] = nextCallDate.split("/")
        const followUpDate = new Date(year, month - 1, day)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        switch (filterType) {
          case "today":
            return (
              followUpDate.getDate() === today.getDate() &&
              followUpDate.getMonth() === today.getMonth() &&
              followUpDate.getFullYear() === today.getFullYear()
            )
          case "older":
            return followUpDate < today
          default:
            return true
        }
      } catch (error) {
        console.error("Error parsing date:", error)
        return false
      }
    }
  }

  // Function to fetch data from FMS and Leads Tracker sheets
  useEffect(() => {
    const fetchFollowUpData = async () => {
      try {
        setIsLoading(true)

        const data = await mockApi.fetchFollowUps(currentUser, isAdmin)

        setPendingFollowUps(data.pending)
        setHistoryFollowUps(data.history)

      } catch (error) {
        console.error("Error fetching follow-up data:", error)
        // Fallback or empty state
        setPendingFollowUps([])
        setHistoryFollowUps([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchFollowUpData()
  }, [currentUser, isAdmin]) // Add isAdmin to dependencies

  // Add this function or modify the existing formatDateToDDMMYYYY function
  const formatPopupDate = (dateValue) => {
    if (!dateValue) return ""

    try {
      // Check if it's a Date object-like string (e.g. "Date(2025,4,3)")
      if (typeof dateValue === "string" && dateValue.startsWith("Date(")) {
        // Extract the parts from Date(YYYY,MM,DD) format
        const dateString = dateValue.substring(5, dateValue.length - 1)
        const [year, month, day] = dateString.split(",").map((part) => Number.parseInt(part.trim()))

        // JavaScript months are 0-indexed, but we need to display them as 1-indexed
        // Also ensure day and month are padded with leading zeros if needed
        return `${day.toString().padStart(2, "0")}/${(month + 1).toString().padStart(2, "0")}/${year}`
      }

      // If it's already in the correct format, return as is
      return dateValue
    } catch (error) {
      console.error("Error formatting popup date:", error)
      return dateValue // Return the original value if formatting fails
    }
  }

  // Filter function for search in both sections
  const filteredPendingFollowUps = pendingFollowUps.filter((followUp) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      searchTerm === "" ||
      (followUp.companyName && followUp.companyName.toLowerCase().includes(searchLower)) ||
      (followUp.leadId && followUp.leadId.toLowerCase().includes(searchLower)) ||
      (followUp.personName && followUp.personName.toLowerCase().includes(searchLower)) ||
      (followUp.phoneNumber && followUp.phoneNumber.toString().toLowerCase().includes(searchLower)) ||
      (followUp.leadSource && followUp.leadSource.toLowerCase().includes(searchLower)) ||
      (followUp.location && followUp.location.toLowerCase().includes(searchLower)) ||
      (followUp.customerSay && followUp.customerSay.toLowerCase().includes(searchLower)) ||
      (followUp.enquiryStatus && followUp.enquiryStatus.toLowerCase().includes(searchLower)) ||
      (followUp.assignedTo && followUp.assignedTo.toLowerCase().includes(searchLower))

    // Apply filter type for Column R
    const matchesFilterType = (() => {
      if (filterType === "first") {
        return followUp.enquiryStatus === "" || followUp.enquiryStatus === null
      } else if (filterType === "multi") {
        return followUp.enquiryStatus === "expected"
      } else {
        return true
      }
    })()

    // Apply date filter based on column CL
    const matchesDateFilter = checkDateFilter(followUp, dateFilter)

    // Apply company filter
    const matchesCompanyFilter = !companyFilter || companyFilter.length === 0 || companyFilter.includes("all") || companyFilter.includes(followUp.companyName)

    // Apply person filter
    const matchesPersonFilter = !personFilter || personFilter.length === 0 || personFilter.includes("all") || personFilter.includes(followUp.personName)

    // Apply phone filter
    const phoneToCompare = followUp.phoneNumber ? followUp.phoneNumber.toString().trim() : ""
    const matchesPhoneFilter = !phoneFilter || phoneFilter.length === 0 || phoneFilter.includes("all") || phoneFilter.includes(phoneToCompare)

    return (
      matchesSearch &&
      matchesFilterType &&
      matchesDateFilter &&
      matchesCompanyFilter &&
      matchesPersonFilter &&
      matchesPhoneFilter
    )
  })

  useEffect(() => {
    // Reset specific filters when switching tabs
    if (activeTab !== "pending") {
      setCompanyFilter([])
      setPersonFilter([])
      setPhoneFilter([])
    }
  }, [activeTab])

  const filteredHistoryFollowUps = historyFollowUps.filter((followUp) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      searchTerm === "" ||
      (followUp.leadNo && followUp.leadNo.toString().toLowerCase().includes(searchLower)) ||
      (followUp.customerSay && followUp.customerSay.toLowerCase().includes(searchLower)) ||
      (followUp.status && followUp.status.toLowerCase().includes(searchLower)) ||
      (followUp.enquiryReceivedStatus && followUp.enquiryReceivedStatus.toLowerCase().includes(searchLower)) ||
      (followUp.enquiryReceivedDate && followUp.enquiryReceivedDate.toLowerCase().includes(searchLower)) ||
      (followUp.enquiryState && followUp.enquiryState.toLowerCase().includes(searchLower)) ||
      (followUp.projectName && followUp.projectName.toLowerCase().includes(searchLower)) ||
      (followUp.salesType && followUp.salesType.toLowerCase().includes(searchLower)) ||
      (followUp.requiredProductDate && followUp.requiredProductDate.toLowerCase().includes(searchLower)) ||
      (followUp.projectApproxValue && followUp.projectApproxValue.toString().toLowerCase().includes(searchLower)) ||
      (followUp.itemName1 && followUp.itemName1.toLowerCase().includes(searchLower)) ||
      (followUp.itemName2 && followUp.itemName2.toLowerCase().includes(searchLower)) ||
      (followUp.itemName3 && followUp.itemName3.toLowerCase().includes(searchLower)) ||
      (followUp.itemName4 && followUp.itemName4.toLowerCase().includes(searchLower)) ||
      (followUp.itemName5 && followUp.itemName5.toLowerCase().includes(searchLower)) ||
      (followUp.nextAction && followUp.nextAction.toLowerCase().includes(searchLower)) ||
      (followUp.nextCallDate && followUp.nextCallDate.toLowerCase().includes(searchLower)) ||
      (followUp.nextCallTime && followUp.nextCallTime.toLowerCase().includes(searchLower))

    // Apply filter type for history - check column E (enquiryReceivedStatus)
    const matchesFilterType = (() => {
      if (filterType === "first") {
        return (
          followUp.enquiryReceivedStatus === "" ||
          followUp.enquiryReceivedStatus === null ||
          followUp.enquiryReceivedStatus === "New"
        )
      } else if (filterType === "multi") {
        return followUp.enquiryReceivedStatus === "Expected" || followUp.enquiryReceivedStatus === "expected"
      } else {
        return true
      }
    })()

    // Apply date filter based on column Z
    const matchesDateFilter = (() => {
      if (dateFilter === "all" || !dateFilter || dateFilter.length === 0) return true

      // Get the text value from column Z (historyDateFilter field)
      const columnZValue = followUp.historyDateFilter
      if (!columnZValue) return false

      // Convert the column Z value to lowercase for comparison
      const columnZText = String(columnZValue).toLowerCase()

      // Match the filter type with the text in column Z
      switch (dateFilter) {
        case "today":
          return columnZText.includes("today")
        case "overdue":
          return columnZText.includes("overdue")
        case "upcoming":
          return columnZText.includes("upcoming")
        default:
          return true
      }
    })()

    return matchesSearch && matchesFilterType && matchesDateFilter
  })

  // Add this function inside your FollowUp component
  const calculateDateFilterCounts = () => {
    const counts = {
      today: 0,
      overdue: 0,
      upcoming: 0,
      older: 0,
    }

    // Calculate counts for pending follow-ups
    pendingFollowUps.forEach((followUp) => {
      const columnCLValue = followUp.nextCallDate
      if (!columnCLValue) return

      const columnCLText = String(columnCLValue).toLowerCase()

      if (columnCLText.includes("today")) counts.today++
      if (columnCLText.includes("overdue")) counts.overdue++
      if (columnCLText.includes("upcoming")) counts.upcoming++
    })

    // Calculate counts for history follow-ups
    historyFollowUps.forEach((followUp) => {
      const nextCallDate = followUp.nextCallDate
      if (!nextCallDate) return

      try {
        const [day, month, year] = nextCallDate.split("/")
        const followUpDate = new Date(year, month - 1, day)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (
          followUpDate.getDate() === today.getDate() &&
          followUpDate.getMonth() === today.getMonth() &&
          followUpDate.getFullYear() === today.getFullYear()
        ) {
          counts.today++
        } else if (followUpDate < today) {
          counts.older++
        }
      } catch (error) {
        console.error("Error parsing date:", error)
      }
    })

    return counts
  }

  const handleColumnToggle = (columnKey) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }))
  }

  const handleSelectAll = () => {
    const allSelected = Object.values(visibleColumns).every(Boolean)
    const newState = Object.fromEntries(Object.keys(visibleColumns).map((key) => [key, !allSelected]))
    setVisibleColumns(newState)
  }

  const handleColumnTogglePending = (columnKey) => {
    setVisibleColumnsPending((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }))
  }

  const handleSelectAllPending = () => {
    const allSelected = Object.values(visibleColumnsPending).every(Boolean)
    const newState = Object.fromEntries(Object.keys(visibleColumnsPending).map((key) => [key, !allSelected]))
    setVisibleColumnsPending(newState)
  }

  const columnOptions = [
    { key: "leadNo", label: "Lead No." },
    { key: "companyName", label: "Company Name" },
    { key: "personName", label: "Person Name" },
    { key: "phoneNumber", label: "Phone Number" },
    { key: "nextCallDate", label: "Next Follow Up Date" },
    { key: "nextAction", label: "Next Action" },
    { key: "customerSay", label: "Last Follow Up Remarks" },
    { key: "timestamp", label: "Timestamp" },
    { key: "callingCount", label: "Calling Count" },
    { key: "enquiryCallingCount", label: "Enquiry Calling Count" },
    { key: "noOfFollowUps", label: "No. of FollowUps" },
    { key: "lastFollowUpStatus", label: "Last FollowUp Status" },
    { key: "enquiryStatus", label: "Enquiry Status" },
    { key: "receivedDate", label: "Received Date" },
    { key: "state", label: "State" },
    { key: "projectName", label: "Project Name" },
    { key: "salesType", label: "Sales Type" },
    { key: "productDate", label: "Product Date" },
    { key: "projectValue", label: "Project Value" },
    { key: "item1", label: "Item 1" },
    { key: "qty1", label: "Qty 1" },
    { key: "item2", label: "Item 2" },
    { key: "qty2", label: "Qty 2" },
    { key: "item3", label: "Item 3" },
    { key: "qty3", label: "Qty 3" },
    { key: "item4", label: "Item 4" },
    { key: "qty4", label: "Qty 4" },
    { key: "item5", label: "Item 5" },
    { key: "qty5", label: "Qty 5" },
    { key: "callDate", label: "Call Date" },
    { key: "callTime", label: "Call Time" },
    { key: "itemQty", label: "Item/Qty" }
  ];

  const dateFilterCounts = calculateDateFilterCounts()

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showColumnDropdown && !event.target.closest(".relative")) {
        setShowColumnDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showColumnDropdown])


  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Calculate pagination
  const currentData = activeTab === "pending" ? filteredPendingFollowUps : filteredHistoryFollowUps;
  const totalPages = Math.max(1, Math.ceil(currentData.length / itemsPerPage));
  const paginatedData = currentData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  // Reset page when tab or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, companyFilter, personFilter, phoneFilter, dateFilter, filterType]);

  const columnOptionsPending = [
    { key: "action", label: "Action" },
    { key: "leadId", label: "Lead No." },
    { key: "companyName", label: "Company Name" },
    { key: "personName", label: "Person Name" },
    { key: "phoneNumber", label: "Phone Number" },
    { key: "nextCallDate", label: "Next Follow Up Date" },
    { key: "nextAction", label: "Next Action" },
    { key: "customerSay", label: "Last Follow Up Remarks" },
    { key: "leadSource", label: "Lead Source" },
    { key: "location", label: "Location" },
    { key: "enquiryStatus", label: "Enquiry Status" },
    { key: "assignedTo", label: "Assigned To" },
    { key: "email", label: "Email Address" },
    { key: "lastFollowUpDate", label: "Last Follow Up Date" },
    { key: "noOfFollowUps", label: "No OF Follow Ups" },
    { key: "lastFollowUpStatus", label: "Last Follow Up Status" },
    { key: "state", label: "State" },
    { key: "address", label: "Address" },
    { key: "personName1", label: "Person Name 1" },
    { key: "designation1", label: "Designation 1" },
    { key: "phoneNumber1", label: "Phone Number 1" },
    { key: "personName2", label: "Person Name 2" },
    { key: "designation2", label: "Designation 2" },
    { key: "phoneNumber2", label: "Phone Number 2" },
    { key: "personName3", label: "Person Name 3" },
    { key: "designation3", label: "Designation 3" },
    { key: "phoneNumber3", label: "Phone Number 3" },
    { key: "natureOfBusiness", label: "Nature of Business" },
    { key: "gst", label: "GST Number" },
    { key: "customerRegistrationForm", label: "Customer Registration Form" },
    { key: "creditAccess", label: "Credit Access" },
    { key: "creditDays", label: "Credit Days" },
    { key: "creditLimit", label: "Credit Limit" },
    { key: "additionalNotes", label: "Additional Notes" },
    { key: "groupName", label: "Group Name" }
  ];

  const getHeaders = () => {
    if (activeTab === "pending") {
      return columnOptionsPending
        .filter(opt => visibleColumnsPending[opt.key])
        .map(opt => opt.key === "action" ? { label: "Actions", className: "sticky left-0 bg-gray-50 z-30 shadow-[1px_0_0_0_#e5e7eb] border-r border-gray-200" } : opt.label);
    } else {
      return columnOptions
        .filter(opt => visibleColumns[opt.key])
        .map(opt => opt.label);
    }
  };

  const renderPendingRow = (followUp, index) => (
    <tr key={`${followUp.leadId}-${index}`} className="hover:bg-slate-50 transition-colors group">
      {visibleColumnsPending.action && (
        <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-sm font-medium sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[1px_0_0_0_#e5e7eb] border-r border-gray-200">
          <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
            <Link to={`/call-tracker/new?leadId=${followUp.leadId}&leadNo=${followUp.leadId}`}>
              <button className="w-full sm:w-auto px-2 sm:px-3 py-1 text-xs border border-sky-200 text-sky-600 hover:bg-sky-50 rounded-md transition-colors whitespace-nowrap">
                Call Now <ArrowRightIcon className="ml-1 h-3 w-3 inline" />
              </button>
            </Link>
          </div>
        </td>
      )}
      {visibleColumnsPending.leadId && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{followUp.leadId}</td>}
      {visibleColumnsPending.companyName && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500"><div className="max-w-[150px] truncate" title={followUp.companyName}>{followUp.companyName}</div></td>}
      {visibleColumnsPending.personName && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.personName}</td>}
      {visibleColumnsPending.phoneNumber && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.phoneNumber}</td>}
      {visibleColumnsPending.nextCallDate && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{displayDate(followUp.nextCallDate, followUp.timestamp)}</td>}
      {visibleColumnsPending.nextAction && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.nextAction}</td>}
      {visibleColumnsPending.customerSay && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500"><div className="max-w-[200px] truncate" title={followUp.customerSay}>{followUp.customerSay}</div></td>}
      
      {visibleColumnsPending.leadSource && (
        <td className="px-3 sm:px-4 py-3 sm:py-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${followUp.priority === "High" ? "bg-red-100 text-red-800" : followUp.priority === "Medium" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-800"}`}>
            {followUp.leadSource}
          </span>
        </td>
      )}
      {visibleColumnsPending.location && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500"><div className="max-w-[120px] truncate" title={followUp.location}>{followUp.location}</div></td>}
      {visibleColumnsPending.enquiryStatus && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500"><div className="max-w-[120px] truncate" title={followUp.enquiryStatus}>{followUp.enquiryStatus}</div></td>}
      {visibleColumnsPending.assignedTo && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500"><div className="max-w-[120px] truncate" title={followUp.assignedTo}>{followUp.assignedTo}</div></td>}
      {visibleColumnsPending.email && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.email}</td>}
      {visibleColumnsPending.lastFollowUpDate && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.lastFollowUpDate}</td>}
      {visibleColumnsPending.noOfFollowUps && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.noOfFollowUps}</td>}
      {visibleColumnsPending.lastFollowUpStatus && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.lastFollowUpStatus}</td>}
      {visibleColumnsPending.state && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.state}</td>}
      {visibleColumnsPending.address && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.address}</td>}
      {visibleColumnsPending.personName1 && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.personName1}</td>}
      {visibleColumnsPending.designation1 && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.designation1}</td>}
      {visibleColumnsPending.phoneNumber1 && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.phoneNumber1}</td>}
      {visibleColumnsPending.personName2 && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.personName2}</td>}
      {visibleColumnsPending.designation2 && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.designation2}</td>}
      {visibleColumnsPending.phoneNumber2 && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.phoneNumber2}</td>}
      {visibleColumnsPending.personName3 && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.personName3}</td>}
      {visibleColumnsPending.designation3 && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.designation3}</td>}
      {visibleColumnsPending.phoneNumber3 && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.phoneNumber3}</td>}
      {visibleColumnsPending.natureOfBusiness && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.natureOfBusiness}</td>}
      {visibleColumnsPending.gst && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.gst}</td>}
      {visibleColumnsPending.customerRegistrationForm && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.customerRegistrationForm}</td>}
      {visibleColumnsPending.creditAccess && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.creditAccess}</td>}
      {visibleColumnsPending.creditDays && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.creditDays}</td>}
      {visibleColumnsPending.creditLimit && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.creditLimit}</td>}
      {visibleColumnsPending.additionalNotes && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.additionalNotes}</td>}
      {visibleColumnsPending.groupName && (
        <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
          {followUp.groupName ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              {followUp.groupName}
            </span>
          ) : (
            <span className="text-gray-300 text-xs">—</span>
          )}
        </td>
      )}
    </tr>
  );

  const renderHistoryRow = (followUp, index) => (
    <tr key={`${followUp.leadNo}-${index}`} className="hover:bg-slate-50 transition-colors">
      {visibleColumns.leadNo && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.leadNo}</td>}
      {visibleColumns.companyName && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500"><div className="max-w-[150px] truncate">{followUp.companyName}</div></td>}
      {visibleColumns.personName && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.personName}</td>}
      {visibleColumns.phoneNumber && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.phoneNumber}</td>}
      {visibleColumns.nextCallDate && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.nextCallDate}</td>}
      {visibleColumns.nextAction && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.nextAction}</td>}
      {visibleColumns.customerSay && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500"><div className="max-w-[200px] truncate" title={followUp.customerSay}>{followUp.customerSay}</div></td>}
      
      {visibleColumns.timestamp && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.timestamp}</td>}
      {visibleColumns.callingCount && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.callingCount}</td>}
      {visibleColumns.enquiryCallingCount && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.enquiryCallingCount}</td>}
      {visibleColumns.noOfFollowUps && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.noOfFollowUps}</td>}
      {visibleColumns.lastFollowUpStatus && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.lastFollowUpStatus}</td>}
      {visibleColumns.enquiryStatus && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.enquiryReceivedStatus}</td>}
      {visibleColumns.receivedDate && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.enquiryReceivedDate}</td>}
      {visibleColumns.state && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.state}</td>}
      {visibleColumns.projectName && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500"><div className="max-w-[150px] truncate">{followUp.projectName}</div></td>}
      {visibleColumns.salesType && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.salesType}</td>}
      {visibleColumns.productDate && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.requiredProductDate}</td>}
      {visibleColumns.projectValue && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.projectApproxValue}</td>}
      {visibleColumns.item1 && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.itemName1}</td>}
      {visibleColumns.qty1 && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.itemQty1}</td>}
      {visibleColumns.item2 && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.itemName2}</td>}
      {visibleColumns.qty2 && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.itemQty2}</td>}
      {visibleColumns.item3 && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.itemName3}</td>}
      {visibleColumns.qty3 && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.itemQty3}</td>}
      {visibleColumns.item4 && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.itemName4}</td>}
      {visibleColumns.qty4 && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.itemQty4}</td>}
      {visibleColumns.item5 && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.itemName5}</td>}
      {visibleColumns.qty5 && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.itemQty5}</td>}
      {visibleColumns.callDate && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.nextCallDate}</td>}
      {visibleColumns.callTime && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">{followUp.nextCallTime}</td>}
      {visibleColumns.itemQty && <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500"><div className="min-w-[200px] break-words whitespace-normal" title={formatItemQty(followUp.itemQty)}>{formatItemQty(followUp.itemQty)}</div></td>}
    </tr>
  );

  const renderPendingCard = (followUp, index) => (
    <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{followUp.leadId}</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${determinePriority(followUp.leadSource) === "High" ? "bg-red-100 text-red-800" : determinePriority(followUp.leadSource) === "Medium" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
              {determinePriority(followUp.leadSource)} Priority
            </span>
          </div>
          <h3 className="font-bold text-gray-900 text-lg">{followUp.companyName}</h3>
          <p className="text-sm text-gray-600">{followUp.personName}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-500">Phone</p>
          <p className="font-medium">{followUp.phoneNumber}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Next Call</p>
          <p className="font-medium text-orange-600">{displayDate(followUp.nextCallDate, "Not Set")}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-gray-500">Customer Say</p>
          <p className="text-gray-700 bg-gray-50 p-2 rounded text-xs line-clamp-2">{followUp.customerSay || "No feedback recorded"}</p>
        </div>
      </div>
      <div className="pt-2 border-t border-gray-100 flex justify-end">
        <Link to={`/call-tracker/new?leadId=${followUp.leadId}&leadNo=${followUp.leadId}`} className="w-full">
          <button className="flex items-center justify-center px-4 py-2 border border-sky-600 rounded-md text-sm font-medium text-sky-600 bg-white hover:bg-sky-50 w-full">
            Call Now <ArrowRightIcon className="ml-1 h-4 w-4 inline" />
          </button>
        </Link>
      </div>
    </div>
  );

  const renderHistoryCard = (followUp, index) => (
    <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-semibold text-gray-500">{followUp.timestamp}</span>
          <h3 className="font-bold text-gray-900">{followUp.companyName}</h3>
          <p className="text-xs text-blue-600 font-medium">{followUp.leadNo}</p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${followUp.status === "Completed" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
          {followUp.status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
        <div><span className="block text-xs text-gray-400">Project</span><p className="truncate">{followUp.projectName}</p></div>
        <div><span className="block text-xs text-gray-400">Status</span><p>{followUp.enquiryReceivedStatus}</p></div>
        <div><span className="block text-xs text-gray-400">Sales Type</span><p>{followUp.salesType}</p></div>
        <div><span className="block text-xs text-gray-400">Value</span><p>{followUp.projectApproxValue}</p></div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 w-full p-1 md:p-1.5">
      <CallTrackerFilter
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        companyFilter={companyFilter}
        setCompanyFilter={setCompanyFilter}
        personFilter={personFilter}
        setPersonFilter={setPersonFilter}
        phoneFilter={phoneFilter}
        setPhoneFilter={setPhoneFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        dateFilterCounts={dateFilterCounts}
        filterType={filterType}
        setFilterType={setFilterType}
        showColumnDropdown={showColumnDropdown}
        setShowColumnDropdown={setShowColumnDropdown}
        visibleColumns={visibleColumns}
        handleSelectAll={handleSelectAll}
        handleColumnToggle={handleColumnToggle}
        columnOptions={columnOptions}
        visibleColumnsPending={visibleColumnsPending}
        handleSelectAllPending={handleSelectAllPending}
        handleColumnTogglePending={handleColumnTogglePending}
        columnOptionsPending={columnOptionsPending}
        pendingFollowUps={pendingFollowUps}
      />

      <div className="flex-1 flex flex-col min-h-0 mt-1">
        {isLoading ? (
          <div className="p-8 text-center flex-1 flex flex-col justify-center items-center bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mb-4"></div>
            <p className="text-slate-500">Loading follow-up data...</p>
          </div>
        ) : (
          <DataTable
            headers={getHeaders()}
            data={paginatedData}
            renderRow={activeTab === "pending" ? renderPendingRow : renderHistoryRow}
            renderCard={activeTab === "pending" ? renderPendingCard : renderHistoryCard}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            totalResults={currentData.length}
          />
        )}
      </div>
    </div>
  );
};

export default CallTracker;
