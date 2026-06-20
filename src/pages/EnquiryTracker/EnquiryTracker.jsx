"use client"

import { useState, useEffect, useContext } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { PlusIcon, SearchIcon, ArrowRightIcon, BuildingIcon } from "../../components/Icons"
import { AuthContext } from "../../App" // Import AuthContext just like in the FollowUp component
import { mockApi } from "../../services/mockApi"
import EnquiryTrackerForm from "./Enquiry-Tracker-Form" // Add this import
import SearchableDropdown from "../../components/SearchableDropdown"
import DataTable from "../../components/DataTable"
import EnquiryTrackerFilter from "../../components/enquiry-tracker/EnquiryTrackerFilter"

// Animation classes
const slideIn = "animate-in slide-in-from-right duration-300"
const fadeIn = "animate-in fade-in duration-300"

function EnquiryTracker() {
  const { currentUser, isAdmin } = useContext(AuthContext) // Get user info and admin function
  const [searchParams] = useSearchParams()
  const initialAction = searchParams.get("action")
  
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("pending")
  const [pendingCallTrackers, setPendingCallTrackers] = useState([])
  const [historyCallTrackers, setHistoryCallTrackers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewEnquiryTrackerForm, setShowNewEnquiryTrackerForm] = useState(initialAction === "new-enquiry")
  const [showPopup, setShowPopup] = useState(false)
  const [selectedTracker, setSelectedTracker] = useState(null)
  const [callingDaysFilter, setCallingDaysFilter] = useState([])
  const [enquiryNoFilter, setEnquiryNoFilter] = useState([])
  const [currentStageFilter, setCurrentStageFilter] = useState([])
  const [availableEnquiryNos, setAvailableEnquiryNos] = useState([])

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Reset pagination on filter or tab changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchTerm, callingDaysFilter, enquiryNoFilter, currentStageFilter])

  const [visibleColumns, setVisibleColumns] = useState({
    timestamp: true,
    enquiryNo: true,
    companyName: true,
    shippingAddress: true,
    enquiryStatus: true,
    customerFeedback: true,
    currentStage: true,
    sendQuotationNo: true,
    quotationSharedBy: true,
    quotationNumber: true,
    valueWithoutTax: true,
    valueWithTax: true,
    quotationUpload: true,
    quotationRemarks: true,
    validatorName: true,
    sendStatus: true,
    validationRemark: true,
    faqVideo: true,
    productVideo: true,
    offerVideo: true,
    productCatalog: true,
    productImage: true,
    nextCallDate: true,
    nextCallTime: true,
    orderStatus: true,
    acceptanceVia: true,
    paymentMode: true,
    paymentTerms: true,
    transportMode: true,
    registrationFrom: true,
    orderVideo: true,
    acceptanceFile: true,
    orderRemark: true,
    apologyVideo: true,
    reasonStatus: true,
    reasonRemark: true,
    holdReason: true,
    holdingDate: true,
    holdRemark: true,
  })
  const [visiblePendingColumns, setVisiblePendingColumns] = useState({
    timestamp: true,
    leadId: true,
    enquiryType: true,
    receiverName: true,
    leadSource: true,
    personName: true,
    phoneNumber: true,
    companyName: true,
    shippingAddress: true,
    lastFollowUpDate: false,
    lastFollowUpStatus: false,
    customerSay: false,
    nextAction: false,
    callingDate: true,
    noOfFollowUps: false,
    currentStage: true,
    salespersonName: true,
    itemQty: true,
    groupName: true,
  })
  const [showColumnDropdown, setShowColumnDropdown] = useState(false)



  // Helper function to check if a date is today
  const isToday = (dateStr) => {
    if (!dateStr) return false
    try {
      const date = new Date(dateStr.split("/").reverse().join("-")) // Convert DD/MM/YYYY to YYYY-MM-DD
      const today = new Date()
      return date.toDateString() === today.toDateString()
    } catch {
      return false
    }
  }



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


  // Replace the matchesCallingDaysFilter function with this updated version
  const matchesCallingDaysFilter = (dateStr, activeTab) => {
    if (callingDaysFilter.length === 0) return true;

    // Convert to lowercase for case-insensitive comparison
    const dateText = dateStr ? dateStr.toLowerCase() : '';

    return callingDaysFilter.some((filter) => {
      if (activeTab === "history") {
        // Special handling for history tab
        switch (filter) {
          case "today":
            return isToday(dateStr); // Use the isToday helper function
          case "older":
            return !isToday(dateStr); // Older days call
          default:
            return false;
        }
      } else {
        // Original handling for other tabs
        switch (filter) {
          case "today":
            return dateText.includes("today");
          case "overdue":
            return dateText.includes("overdue");
          case "upcoming":
            return dateText.includes("upcoming");
          default:
            return false;
        }
      }
    });
  };

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
    setVisiblePendingColumns((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }))
  }

  const handleSelectAllPending = () => {
    const allSelected = Object.values(visiblePendingColumns).every(Boolean)
    const newState = Object.fromEntries(Object.keys(visiblePendingColumns).map((key) => [key, !allSelected]))
    setVisiblePendingColumns(newState)
  }

  const columnOptions = [
    { key: "timestamp", label: "Timestamp" },
    { key: "enquiryNo", label: "Enquiry No." },
    { key: "companyName", label: "Company Name" },
    { key: "shippingAddress", label: "Shipping Address" },
    { key: "enquiryStatus", label: "Enquiry Status" },
    { key: "customerFeedback", label: "What Did Customer Say" },
    { key: "currentStage", label: "Current Stage" },
    { key: "sendQuotationNo", label: "Send Quotation No." },
    { key: "quotationSharedBy", label: "Quotation Shared By" },
    { key: "quotationNumber", label: "Quotation Number" },
    { key: "valueWithoutTax", label: "Value Without Tax" },
    { key: "valueWithTax", label: "Value With Tax" },
    { key: "quotationUpload", label: "Quotation Upload" },
    { key: "quotationRemarks", label: "Quotation Remarks" },
    { key: "validatorName", label: "Validator Name" },
    { key: "sendStatus", label: "Send Status" },
    { key: "validationRemark", label: "Validation Remark" },
    { key: "faqVideo", label: "FAQ Video" },
    { key: "productVideo", label: "Product Video" },
    { key: "offerVideo", label: "Offer Video" },
    { key: "productCatalog", label: "Product Catalog" },
    { key: "productImage", label: "Product Image" },
    { key: "nextCallDate", label: "Next Call Date" },
    { key: "nextCallTime", label: "Next Call Time" },
    { key: "orderStatus", label: "Order Status" },
    { key: "acceptanceVia", label: "Acceptance Via" },
    { key: "paymentMode", label: "Payment Mode" },
    { key: "paymentTerms", label: "Payment Terms" },
    { key: "transportMode", label: "Transport Mode" },
    { key: "registrationFrom", label: "Registration From" },
    { key: "orderVideo", label: "Order Video" },
    { key: "acceptanceFile", label: "Acceptance File" },
    { key: "orderRemark", label: "Remark" },
    { key: "apologyVideo", label: "Apology Video" },
    { key: "reasonStatus", label: "Reason Status" },
    { key: "reasonRemark", label: "Reason Remark" },
    { key: "holdReason", label: "Hold Reason" },
    { key: "holdingDate", label: "Holding Date" },
    { key: "holdRemark", label: "Hold Remark" },
  ]

  const pendingColumnOptions = [
    { key: "timestamp", label: "Timestamp" },
    { key: "leadId", label: "Lead No." },
    { key: "enquiryType", label: "Enquiry Type" },
    { key: "receiverName", label: "Lead Receiver Name" },
    { key: "leadSource", label: "Lead Source" },
    { key: "personName", label: "Person Name" },
    { key: "phoneNumber", label: "Phone No." },
    { key: "companyName", label: "Company Name" },
    { key: "shippingAddress", label: "Shipping Address" },
    { key: "lastFollowUpDate", label: "Last Follow Up Date" },
    { key: "lastFollowUpStatus", label: "Last Follow Up Status" },
    { key: "customerSay", label: "What Did Customer Say" },
    { key: "nextAction", label: "Next Action" },
    { key: "callingDate", label: "Calling Date" },
    { key: "noOfFollowUps", label: "No of Follow Ups" },
    { key: "currentStage", label: "Current Stage" },
    { key: "salespersonName", label: "Assigned To" },
    { key: "groupName", label: "Group Name" },
    { key: "itemQty", label: "Item/Qty" },
  ]

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setShowColumnDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Function to fetch data from FMS and Enquiry Tracker sheets
  useEffect(() => {
    const fetchCallTrackerData = async () => {
      try {
        setIsLoading(true)

        const data = await mockApi.fetchCallTrackers(currentUser, isAdmin)

        const combinedPending = [
          ...data.pending.map(item => ({ ...item, enquiryType: 'Lead' })),
          ...data.directEnquiry.map(item => ({ ...item, enquiryType: 'Direct Enquiry' }))
        ]

        setPendingCallTrackers(combinedPending)
        setHistoryCallTrackers(data.history)

        // Extract unique enquiry numbers for filter dropdown based on mock data
        const allEnquiryNos = new Set()

        combinedPending.forEach(item => { if (item.leadId) allEnquiryNos.add(item.leadId); });
        data.history.forEach(item => { if (item.enquiryNo) allEnquiryNos.add(item.enquiryNo); });

        setAvailableEnquiryNos(Array.from(allEnquiryNos).sort())

      } catch (error) {
        console.error("Error fetching call tracker data:", error)
        // Fallback or empty state
        setPendingCallTrackers([])
        setHistoryCallTrackers([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCallTrackerData()
  }, [currentUser, isAdmin]) // Add isAdmin to dependencies like in FollowUp

  // Enhanced filter function for search and dropdown filters
  const filterTrackers = (tracker, searchTerm, activeTab) => {
    // Search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const matchesSearch = Object.values(tracker).some(
        (value) => value && value.toString().toLowerCase().includes(term),
      )
      if (!matchesSearch) return false
    }

    // Enquiry number filter
    if (enquiryNoFilter.length > 0) {
      const enquiryNo = activeTab === "history" ? tracker.enquiryNo : tracker.leadId
      if (!enquiryNoFilter.includes(enquiryNo)) return false
    }

    // Current stage filter
    if (currentStageFilter.length > 0) {
      const currentStage = tracker.currentStage || ""
      if (!currentStageFilter.includes(currentStage)) return false
    }

    // Calling days filter
    if (callingDaysFilter.length > 0) {
      const callingDate = tracker.callingDate || ""
      if (!matchesCallingDaysFilter(callingDate, activeTab)) return false
    }

    return true
  }

  const filteredPendingCallTrackers = pendingCallTrackers.filter((tracker) =>
    filterTrackers(tracker, searchTerm, "pending"),
  )

  const filteredHistoryCallTrackers = historyCallTrackers.filter((tracker) =>
    filterTrackers(tracker, searchTerm, "history"),
  )


  // Add this function inside your CallTracker component
  const calculateFilterCounts = () => {
    const counts = {
      today: 0,
      overdue: 0,
      upcoming: 0,
      older: 0
    };

    // Calculate counts based on active tab
    if (activeTab === "pending") {
      const trackers = pendingCallTrackers;

      trackers.forEach(tracker => {
        const dateStr = tracker.callingDate ? tracker.callingDate.toLowerCase() : "";
        if (dateStr.includes("today")) counts.today++;
        else if (dateStr.includes("overdue")) counts.overdue++;
        else if (dateStr.includes("upcoming")) counts.upcoming++;
      });
    } else if (activeTab === "history") {
      historyCallTrackers.forEach(tracker => {
        const dateStr = tracker.callingDate;
        if (isToday(dateStr)) counts.today++;
        else counts.older++;
      });
    }

    return counts;
  };

  const filterCounts = calculateFilterCounts();

  const activeData = activeTab === "pending" 
    ? filteredPendingCallTrackers 
    : filteredHistoryCallTrackers;

  const totalResults = activeData.length;
  const totalPages = Math.ceil(totalResults / itemsPerPage) || 1;
  const paginatedData = activeData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page) => setCurrentPage(page);
  const handleItemsPerPageChange = (items) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  // Define Headers
  const pendingHeaders = [
    { label: "Actions", className: "sticky left-0 bg-gray-50 z-30 shadow-[1px_0_0_0_#e5e7eb]" }, "Timestamp", "Lead No.", "Enquiry Type", "Lead Receiver Name", "Lead Source",
    "Person Name", "Phone No.", "Company Name", "Current Stage", "Calling Date", "Group Name"
  ];
  if (isAdmin()) pendingHeaders.push("Assigned To");
  pendingHeaders.push("Item/Qty");

  const historyHeaders = [
    "Actions",
    ...columnOptions.filter(opt => visibleColumns[opt.key]).map(opt => opt.label)
  ];

  // Render Functions
  const renderPendingCard = (tracker, index) => (
    <div key={tracker.id || index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <span className="text-xs font-semibold text-gray-500">{tracker.timestamp}</span>
          <h3 className="font-bold text-gray-900 mt-1">{tracker.companyName}</h3>
          <p className="text-xs text-blue-600 font-medium">{tracker.leadId}</p>
        </div>
        <div className="text-right">
          <span className="block text-xs text-gray-400">Person Name</span>
          <span className="text-sm font-medium">{tracker.salespersonName}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
        <div>
          <span className="block text-xs text-gray-400">Phone</span>
          <p className="font-medium">{tracker.phoneNumber}</p>
        </div>
        <div>
          <span className="block text-xs text-gray-400">Current Stage</span>
          <p className="text-sky-600 font-medium">{tracker.currentStage || "Pending"}</p>
        </div>
        <div>
          <span className="block text-xs text-gray-400">Calling Date</span>
          <p>{tracker.callingDate || "-"}</p>
        </div>
      </div>
      <div className="pt-2 border-t border-gray-100 flex justify-end">
        <Link to={`/enquiry-tracker/new?leadId=${tracker.leadId}`} className="w-full">
          <button className="flex items-center justify-center w-full px-3 py-2 text-sm border border-sky-200 text-sky-600 hover:bg-sky-50 rounded-md font-medium">
            Process <ArrowRightIcon className="ml-1 h-3 w-3" />
          </button>
        </Link>
      </div>
    </div>
  );

  const renderPendingRow = (tracker, index) => (
    <tr key={tracker.id || index} className="hover:bg-slate-50 transition-colors group">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[1px_0_0_0_#e5e7eb]">
        <div className="flex space-x-2">
          <Link to={`/enquiry-tracker/new?leadId=${tracker.leadId}`}>
            <button className="px-3 py-1 text-xs border border-sky-200 text-sky-600 hover:bg-sky-50 rounded-md">
              Process <ArrowRightIcon className="ml-1 h-3 w-3 inline" />
            </button>
          </Link>
        </div>
      </td>
      {visiblePendingColumns.timestamp && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.timestamp}</td>}
      {visiblePendingColumns.leadId && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tracker.leadId}</td>}
      {visiblePendingColumns.enquiryType && (
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tracker.enquiryType === 'Lead' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'}`}>
            {tracker.enquiryType}
          </span>
        </td>
      )}
      {visiblePendingColumns.receiverName && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.receiverName}</td>}
      {visiblePendingColumns.leadSource && (
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tracker.priority === "High" ? "bg-red-100 text-red-800" : tracker.priority === "Medium" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-800"}`}>
            {tracker.leadSource}
          </span>
        </td>
      )}
      {visiblePendingColumns.personName && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.assignedTo}</td>}
      {visiblePendingColumns.phoneNumber && <td className="px-4 py-4 text-sm text-gray-500">{tracker.phoneNumber}</td>}
      {visiblePendingColumns.companyName && (
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <div className="flex items-center">
            <BuildingIcon className="h-4 w-4 mr-2 text-slate-400" />
            {tracker.companyName}
          </div>
        </td>
      )}
      {visiblePendingColumns.shippingAddress && (
        <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate" title={tracker.shippingAddress}>
          {tracker.shippingAddress || "—"}
        </td>
      )}
      {visiblePendingColumns.lastFollowUpDate && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.lastFollowUpDate || "—"}</td>}
      {visiblePendingColumns.lastFollowUpStatus && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.lastFollowUpStatus || "—"}</td>}
      {visiblePendingColumns.customerSay && <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate" title={tracker.customerSay}>{tracker.customerSay || "—"}</td>}
      {visiblePendingColumns.nextAction && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.nextAction || "—"}</td>}
      {visiblePendingColumns.callingDate && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.callingDate}</td>}
      {visiblePendingColumns.noOfFollowUps && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.noOfFollowUps || "0"}</td>}
      {visiblePendingColumns.currentStage && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.currentStage}</td>}
      {visiblePendingColumns.salespersonName && isAdmin() && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.salespersonName}</td>}
      {visiblePendingColumns.groupName && (
        <td className="px-6 py-4 whitespace-nowrap">
          {tracker.groupName ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              {tracker.groupName}
            </span>
          ) : (
            <span className="text-gray-300 text-xs">—</span>
          )}
        </td>
      )}
      {visiblePendingColumns.itemQty && (
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <div className="min-w-[300px] break-words whitespace-normal" title={formatItemQty(tracker.itemQty)}>
            {formatItemQty(tracker.itemQty)}
          </div>
        </td>
      )}
    </tr>
  );

  const renderDirectEnquiryCard = (tracker, index) => (
    <div key={tracker.id || index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <span className="text-xs font-semibold text-gray-500">{tracker.timestamp}</span>
          <h3 className="font-bold text-gray-900 mt-1">{tracker.companyName}</h3>
          <p className="text-xs text-blue-600 font-medium">{tracker.leadId}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-700">{tracker.phoneNumber}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
        <div>
          <span className="block text-xs text-gray-400">Source</span>
          <span>{tracker.leadSource}</span>
        </div>
        <div>
          <span className="block text-xs text-gray-400">Stage</span>
          <span className="text-sky-600">{tracker.currentStage}</span>
        </div>
        <div className="col-span-2">
          <span className="block text-xs text-gray-400">Location</span>
          <span>{tracker.location}</span>
        </div>
      </div>
      <div className="pt-2 border-t border-gray-100 flex justify-end">
        <Link to={`/enquiry-tracker/new?leadId=${tracker.leadId}`} className="w-full">
          <button className="flex items-center justify-center w-full px-3 py-2 text-sm border border-sky-200 text-sky-600 hover:bg-sky-50 rounded-md font-medium">
            Process <ArrowRightIcon className="ml-1 h-3 w-3" />
          </button>
        </Link>
      </div>
    </div>
  );

  const renderDirectEnquiryRow = (tracker, index) => (
    <tr key={tracker.id || index} className="hover:bg-slate-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex space-x-2">
          <Link to={`/enquiry-tracker/new?leadId=${tracker.leadId}`}>
            <button className="px-3 py-1 text-xs border border-sky-200 text-sky-600 hover:bg-sky-50 rounded-md">
              Process <ArrowRightIcon className="ml-1 h-3 w-3 inline" />
            </button>
          </Link>
          <button onClick={() => { setSelectedTracker(tracker); setShowPopup(true); }} className="px-3 py-1 text-xs border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md">
            View
          </button>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.timestamp}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tracker.leadId}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tracker.priority === "High" ? "bg-red-100 text-red-800" : tracker.priority === "Medium" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-800"}`}>
          {tracker.leadSource}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.companyName}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.currentStage}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.callingDate1}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.phoneNumber}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.location}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="min-w-[300px] break-words whitespace-normal" title={formatItemQty(tracker.itemQty)}>
          {formatItemQty(tracker.itemQty)}
        </div>
      </td>
    </tr>
  );

  const renderHistoryCard = (tracker, index) => (
    <div key={tracker.id || index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-semibold text-gray-500">{tracker.timestamp}</span>
          <h3 className="font-bold text-gray-900 mt-1">{tracker.enquiryNo}</h3>
          <p className="text-sm font-medium text-gray-700">{tracker.companyName}</p>
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800`}>
          {tracker.enquiryStatus}
        </span>
      </div>
      <div>
        <span className="block text-xs text-gray-400">Customer Feedback</span>
        <p className="text-sm text-gray-600 line-clamp-2">{tracker.customerFeedback}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
        <div>
          <span className="block text-xs text-gray-400">Current Stage</span>
          <p>{tracker.currentStage}</p>
        </div>
        <div>
          <span className="block text-xs text-gray-400">Next Call</span>
          <p>{tracker.nextCallDate || "-"}</p>
        </div>
      </div>
    </div>
  );

  const renderHistoryRow = (tracker, index) => (
    <tr key={tracker.id || index} className="hover:bg-slate-50 border-b border-gray-200">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button onClick={() => { setSelectedTracker(tracker); setShowPopup(true); }} className="px-3 py-1 text-xs border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md">
          View
        </button>
      </td>
      {visibleColumns.timestamp && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.timestamp}</td>}
      {visibleColumns.enquiryNo && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tracker.enquiryNo}</td>}
      {visibleColumns.companyName && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.companyName}</td>}
      {visibleColumns.shippingAddress && (
        <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate" title={tracker.shippingAddress}>
          {tracker.shippingAddress || "—"}
        </td>
      )}
      {visibleColumns.enquiryStatus && (
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tracker.priority === "High" ? "bg-red-100 text-red-800" : tracker.priority === "Medium" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-800"}`}>
            {tracker.enquiryStatus}
          </span>
        </td>
      )}
      {visibleColumns.customerFeedback && <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate" title={tracker.customerFeedback}>{tracker.customerFeedback}</td>}
      {visibleColumns.currentStage && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.currentStage}</td>}
      {visibleColumns.sendQuotationNo && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.sendQuotationNo}</td>}
      {visibleColumns.quotationSharedBy && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.quotationSharedBy}</td>}
      {visibleColumns.quotationNumber && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.quotationNumber}</td>}
      {visibleColumns.valueWithoutTax && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.valueWithoutTax}</td>}
      {visibleColumns.valueWithTax && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.valueWithTax}</td>}
      {visibleColumns.quotationUpload && (
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {tracker.quotationUpload && <a href={tracker.quotationUpload} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View File</a>}
        </td>
      )}
      {visibleColumns.quotationRemarks && <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate" title={tracker.quotationRemarks}>{tracker.quotationRemarks}</td>}
      {visibleColumns.validatorName && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.validatorName}</td>}
      {visibleColumns.sendStatus && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.sendStatus}</td>}
      {visibleColumns.validationRemark && <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate" title={tracker.validationRemark}>{tracker.validationRemark}</td>}
      {visibleColumns.faqVideo && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.faqVideo}</td>}
      {visibleColumns.productVideo && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.productVideo}</td>}
      {visibleColumns.offerVideo && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.offerVideo}</td>}
      {visibleColumns.productCatalog && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.productCatalog}</td>}
      {visibleColumns.productImage && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.productImage}</td>}
      {visibleColumns.nextCallDate && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.nextCallDate}</td>}
      {visibleColumns.nextCallTime && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.nextCallTime}</td>}
      {visibleColumns.orderStatus && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.orderStatus}</td>}
      {visibleColumns.acceptanceVia && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.acceptanceVia}</td>}
      {visibleColumns.paymentMode && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.paymentMode}</td>}
      {visibleColumns.paymentTerms && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.paymentTerms}</td>}
      {visibleColumns.transportMode && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.transportMode}</td>}
      {visibleColumns.registrationFrom && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.registrationFrom}</td>}
      {visibleColumns.orderVideo && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.orderVideo}</td>}
      {visibleColumns.acceptanceFile && (
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {tracker.acceptanceFile && <a href={tracker.acceptanceFile} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View File</a>}
        </td>
      )}
      {visibleColumns.orderRemark && <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate" title={tracker.orderRemark}>{tracker.orderRemark}</td>}
      {visibleColumns.apologyVideo && (
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {tracker.apologyVideo && <a href={tracker.apologyVideo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Video</a>}
        </td>
      )}
      {visibleColumns.reasonStatus && <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate" title={tracker.reasonStatus}>{tracker.reasonStatus}</td>}
      {visibleColumns.reasonRemark && <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate" title={tracker.reasonRemark}>{tracker.reasonRemark}</td>}
      {visibleColumns.holdReason && <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate" title={tracker.holdReason}>{tracker.holdReason}</td>}
      {visibleColumns.holdingDate && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.holdingDate}</td>}
      {visibleColumns.holdRemark && <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate" title={tracker.holdRemark}>{tracker.holdRemark}</td>}
    </tr>
  );

  const getHeaders = () => {
    if (activeTab === "pending") {
      const baseHeaders = [
        { label: "Actions", className: "sticky left-0 bg-gray-50 z-30 shadow-[1px_0_0_0_#e5e7eb]" }
      ];
      pendingColumnOptions.forEach(opt => {
        if (visiblePendingColumns[opt.key]) {
          if (opt.key === "salespersonName") {
            if (isAdmin()) baseHeaders.push(opt.label);
          } else {
            baseHeaders.push(opt.label);
          }
        }
      });
      return baseHeaders;
    }
    if (activeTab === "directEnquiry") return directEnquiryHeaders;
    return historyHeaders;
  };

  const getRenderRow = () => {
    if (activeTab === "pending") return renderPendingRow;
    return renderHistoryRow;
  };

  const getRenderCard = () => {
    if (activeTab === "pending") return renderPendingCard;
    return renderHistoryCard;
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 w-full p-1 md:p-1.5">
      <EnquiryTrackerFilter
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        callingDaysFilter={callingDaysFilter}
        setCallingDaysFilter={setCallingDaysFilter}
        enquiryNoFilter={enquiryNoFilter}
        setEnquiryNoFilter={setEnquiryNoFilter}
        currentStageFilter={currentStageFilter}
        setCurrentStageFilter={setCurrentStageFilter}
        filterCounts={filterCounts}
        availableEnquiryNos={availableEnquiryNos}
        showColumnDropdown={showColumnDropdown}
        setShowColumnDropdown={setShowColumnDropdown}
        visibleColumns={visibleColumns}
        handleSelectAll={handleSelectAll}
        handleColumnToggle={handleColumnToggle}
        columnOptions={columnOptions}
        visiblePendingColumns={visiblePendingColumns}
        handleSelectAllPending={handleSelectAllPending}
        handleColumnTogglePending={handleColumnTogglePending}
        pendingColumnOptions={pendingColumnOptions}
        setShowNewCallTrackerForm={setShowNewEnquiryTrackerForm}
        pendingCallTrackers={pendingCallTrackers}
        historyCallTrackers={historyCallTrackers}
      />

      <div className="flex-1 flex flex-col min-h-0 mt-2">
        {isLoading ? (
          <div className="p-8 text-center flex-1 flex items-center justify-center bg-white rounded-lg">
            <p className="text-slate-500">Loading Enquiry tracker data...</p>
          </div>
        ) : (
          <DataTable
            headers={getHeaders()}
            data={paginatedData}
            renderRow={getRenderRow()}
            renderCard={getRenderCard()}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            totalResults={totalResults}
            minWidth="min-w-[1200px]"
          />
        )}
      </div>

      {/* New Call Tracker Form Modal */}
      {showNewEnquiryTrackerForm && (
        <EnquiryTrackerForm 
          onClose={() => {
            setShowNewEnquiryTrackerForm(false);
            if (initialAction === "new-enquiry") {
              window.history.replaceState({}, '', '/enquiry-tracker');
            }
          }} 
          initialCompanyName={searchParams.get("companyName")}
          initialPhoneNumber={searchParams.get("phoneNumber")}
          initialPersonName={searchParams.get("personName")}
          initialLocation={searchParams.get("location")}
          initialEmail={searchParams.get("email")}
        />
      )}

      {/* View Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className={`absolute inset-0 bg-black/50 backdrop-blur-sm ${fadeIn}`}
            onClick={() => setShowPopup(false)}
          ></div>
          <div
            className={`relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto ${slideIn}`}
          >
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                {activeTab === "pending"
                  ? `Call Tracker Details: ${selectedTracker?.leadId}`
                  : `Call Tracker History: ${selectedTracker?.enquiryNo}`}
              </h3>
              <button
                onClick={() => setShowPopup(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {activeTab === "pending" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Column B - Lead ID */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Lead Number</p>
                    <p className="text-base font-semibold">{selectedTracker?.leadId}</p>
                  </div>

                  {/* Column C - Receiver Name */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Lead Receiver Name</p>
                    <p className="text-base">{selectedTracker?.receiverName}</p>
                  </div>

                  {/* Column D - Lead Source */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Lead Source</p>
                    <p className="text-base">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedTracker?.priority === "High"
                          ? "bg-red-100 text-red-800"
                          : selectedTracker?.priority === "Medium"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-800"
                          }`}
                      >
                        {selectedTracker?.leadSource}
                      </span>
                    </p>
                  </div>

                  {/* Column E - Assign Name */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Assign Name</p>
                    <p className="text-base">{selectedTracker?.salespersonName}</p>
                  </div>

                  {/* Column G - Company Name */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Company Name</p>
                    <p className="text-base">{selectedTracker?.companyName}</p>
                  </div>

                  {/* Shipping Address */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Shipping Address</p>
                    <p className="text-base">{selectedTracker?.shippingAddress || "—"}</p>
                  </div>

                  {/* Created Date */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Created Date</p>
                    <p className="text-base">{selectedTracker?.createdAt}</p>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="text-base">{selectedTracker?.status}</p>
                  </div>

                  {/* Priority */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Priority</p>
                    <p className="text-base">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedTracker?.priority === "High"
                          ? "bg-red-100 text-red-800"
                          : selectedTracker?.priority === "Medium"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-800"
                          }`}
                      >
                        {selectedTracker?.priority}
                      </span>
                    </p>
                  </div>

                  {/* Stage */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Stage</p>
                    <p className="text-base">{selectedTracker?.stage}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Enquiry No */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Enquiry No.</p>
                    <p className="text-base font-semibold">{selectedTracker?.enquiryNo}</p>
                  </div>

                  {/* Company Name */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Company Name</p>
                    <p className="text-base">{selectedTracker?.companyName}</p>
                  </div>

                  {/* Shipping Address */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Shipping Address</p>
                    <p className="text-base">{selectedTracker?.shippingAddress || "—"}</p>
                  </div>

                  {/* Timestamp */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Timestamp</p>
                    <p className="text-base">{selectedTracker?.timestamp}</p>
                  </div>

                  {/* Enquiry Status */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Enquiry Status</p>
                    <p className="text-base">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedTracker?.priority === "High"
                          ? "bg-red-100 text-red-800"
                          : selectedTracker?.priority === "Medium"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-800"
                          }`}
                      >
                        {selectedTracker?.enquiryStatus}
                      </span>
                    </p>
                  </div>

                  {/* Current Stage */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Current Stage</p>
                    <p className="text-base">{selectedTracker?.currentStage}</p>
                  </div>

                  {/* Next Call Date */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Next Call Date</p>
                    <p className="text-base">{selectedTracker?.nextCallDate}</p>
                  </div>

                  {/* Next Call Time */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Next Call Time</p>
                    <p className="text-base">{selectedTracker?.nextCallTime}</p>
                  </div>

                  {/* Holding Date */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Holding Date</p>
                    <p className="text-base">{selectedTracker?.holdingDate}</p>
                  </div>

                  {/* Order Status */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Order Status</p>
                    <p className="text-base">{selectedTracker?.orderStatus}</p>
                  </div>

                  {/* Payment Mode */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Payment Mode</p>
                    <p className="text-base">{selectedTracker?.paymentMode}</p>
                  </div>

                  {/* Payment Terms */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Payment Terms</p>
                    <p className="text-base">{selectedTracker?.paymentTerms}</p>
                  </div>
                </div>
              )}

              {/* Customer Feedback - Full width */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">What Did Customer Say</p>
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="text-base">
                    {activeTab === "pending" || activeTab === "directEnquiry"
                      ? "No feedback yet"
                      : selectedTracker?.customerFeedback}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t p-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowPopup(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
              >
                Close
              </button>
              {(activeTab === "pending" || activeTab === "directEnquiry") && (
                <Link to={`/enquiry-tracker/new?leadId=${selectedTracker?.leadId}`}>
                  <button className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500">
                    Process <ArrowRightIcon className="ml-1 h-4 w-4 inline" />
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnquiryTracker
