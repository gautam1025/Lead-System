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

const columnsConfig = [
  { key: "timestamp", label: "Timestamp" },
  { key: "leadId", label: "Lead No." },
  { key: "leadSource", label: "Lead Source" },
  { key: "companyName", label: "Company Name" },
  { key: "phoneNumber", label: "Phone Number" },
  { key: "salespersonName", label: "Salesperson Name" },
  { key: "currentStage", label: "Current Stage" },
  { key: "callingDate", label: "Calling Date" },
  { key: "itemQty", label: "Item/Qty" },
  { key: "totalQty", label: "Total Qty" },
  { key: "shippingAddress", label: "Shipping Address" },
  { key: "enquiryReceiverName", label: "Enquiry Receiver Name" },
  { key: "enquiryAssignToProject", label: "Enquiry Assign to Project" },
  { key: "gstNumber", label: "GST Number" },
  { key: "enquiryDate", label: "Enquiry Date" },
  { key: "enquiryState", label: "Enquiry for State" },
  { key: "projectName", label: "Project Name" },
  { key: "salesType", label: "Sales Type" },
  { key: "enquiryApproach", label: "Enquiry Approach" },
  { key: "itemName1", label: "Item Name 1" },
  { key: "itemQty1", label: "Quantity 1" },
  { key: "itemName2", label: "Item Name 2" },
  { key: "itemQty2", label: "Quantity 2" },
  { key: "itemName3", label: "Item Name 3" },
  { key: "itemQty3", label: "Quantity 3" },
  { key: "itemName4", label: "Item Name 4" },
  { key: "itemQty4", label: "Quantity 4" },
  { key: "itemName5", label: "Item Name 5" },
  { key: "itemQty5", label: "Quantity 5" },
  { key: "enquiryStatus", label: "Enquiry Status" },
  { key: "customerFeedback", label: "Customer Feedback" },
  { key: "sendQuotationNo", label: "Send Quotation No." },
  { key: "quotationSharedBy", label: "Quotation Shared By" },
  { key: "quotationNumber", label: "Quotation Number" },
  { key: "valueWithoutTax", label: "Quotation Value Without Tax" },
  { key: "valueWithTax", label: "Quotation Value With Tax" },
  { key: "quotationUpload", label: "Quotation Upload" },
  { key: "quotationRemarks", label: "Quotation Remarks" },
  { key: "validatorName", label: "Quotation Validator Name" },
  { key: "sendStatus", label: "Quotation Send Status" },
  { key: "validationRemark", label: "Quotation Validation Remark" },
  { key: "faqVideo", label: "Send FAQ Video" },
  { key: "productVideo", label: "Send Product Video" },
  { key: "offerVideo", label: "Send Offer Video" },
  { key: "productCatalog", label: "Send Product Catalog" },
  { key: "productImage", label: "Send Product Image" },
  { key: "nextCallTime", label: "Next Call Time" },
  { key: "orderStatus", label: "Order Received Status" },
  { key: "reasonStatus", label: "If No Reason Status" },
  { key: "reasonRemark", label: "If No Reason Remark" },
  { key: "holdReason", label: "Customer Order Hold Reason Category" },
  { key: "holdingDate", label: "Holding Date" },
  { key: "holdRemark", label: "Hold Remark" },
  { key: "transportMode", label: "Transport Mode" },
  { key: "conveyedForRegistration", label: "Conveyed For Registration Form" },
  { key: "orderNo", label: "Order No" },
  { key: "destination", label: "Destination" },
  { key: "poNumber", label: "PO Number" },
]

const defaultVisibility = {
  timestamp: true,
  leadId: true,
  leadSource: true,
  companyName: true,
  phoneNumber: true,
  salespersonName: true,
  currentStage: false,
  callingDate: false,
  itemQty: false,
  totalQty: false,
  shippingAddress: false,
  enquiryReceiverName: false,
  enquiryAssignToProject: false,
  gstNumber: false,
  enquiryDate: false,
  enquiryState: false,
  projectName: false,
  salesType: false,
  enquiryApproach: false,
  itemName1: false,
  itemQty1: false,
  itemName2: false,
  itemQty2: false,
  itemName3: false,
  itemQty3: false,
  itemName4: false,
  itemQty4: false,
  itemName5: false,
  itemQty5: false,
  enquiryStatus: false,
  customerFeedback: false,
  sendQuotationNo: false,
  quotationSharedBy: false,
  quotationNumber: false,
  valueWithoutTax: false,
  valueWithTax: false,
  quotationUpload: false,
  quotationRemarks: false,
  validatorName: false,
  sendStatus: false,
  validationRemark: false,
  faqVideo: false,
  productVideo: false,
  offerVideo: false,
  productCatalog: false,
  productImage: false,
  nextCallTime: false,
  orderStatus: false,
  reasonStatus: false,
  reasonRemark: false,
  holdReason: false,
  holdingDate: false,
  holdRemark: false,
  transportMode: false,
  conveyedForRegistration: false,
  orderNo: false,
  destination: false,
  poNumber: false,
}

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

  const [visibleColumns, setVisibleColumns] = useState(defaultVisibility)
  const [visiblePendingColumns, setVisiblePendingColumns] = useState(defaultVisibility)
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

  const renderRowCells = (tracker, visibleState) => {
    return columnsConfig.map(opt => {
      if (!visibleState[opt.key]) return null;
      if (opt.key === "salespersonName" && !isAdmin()) return null;

      const val = tracker[opt.key];

      // Special case for lead ID cell formatting
      if (opt.key === "leadId") {
        return (
          <td key={opt.key} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            {val || "—"}
          </td>
        );
      }

      // Custom rendering logic based on key
      let cellContent = val !== undefined && val !== null ? String(val) : "—";

      if (opt.key === "companyName") {
        cellContent = (
          <div className="flex items-center">
            <BuildingIcon className="h-4 w-4 mr-2 text-slate-400 shrink-0" />
            <span className="truncate">{val || "—"}</span>
          </div>
        );
      } else if (opt.key === "leadSource" || opt.key === "enquiryStatus") {
        cellContent = val ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
            {val}
          </span>
        ) : "—";
      } else if (opt.key === "shippingAddress") {
        cellContent = (
          <div className="max-w-[200px] truncate" title={val}>
            {val || "—"}
          </div>
        );
      } else if (opt.key === "itemQty") {
        cellContent = (
          <div className="min-w-[300px] break-words whitespace-normal" title={formatItemQty(val)}>
            {formatItemQty(val) || "—"}
          </div>
        );
      } else if (opt.key === "quotationUpload" || opt.key === "acceptanceFile" || opt.key === "apologyVideo") {
        cellContent = val ? (
          <a href={val} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {opt.key === "apologyVideo" ? "View Video" : "View File"}
          </a>
        ) : "—";
      } else if (opt.key === "customerFeedback" || opt.key === "quotationRemarks" || opt.key === "validationRemark" || opt.key === "reasonRemark" || opt.key === "holdRemark") {
        cellContent = (
          <div className="max-w-[200px] truncate" title={val}>
            {val || "—"}
          </div>
        );
      }

      return (
        <td key={opt.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {cellContent}
        </td>
      );
    });
  };

  const columnOptions = columnsConfig
  const pendingColumnOptions = columnsConfig

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

  const renderHistoryCard = (tracker, index) => (
    <div key={tracker.id || index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <span className="text-xs font-semibold text-gray-500">{tracker.timestamp}</span>
          <h3 className="font-bold text-gray-900 mt-1">{tracker.companyName}</h3>
          <p className="text-xs text-blue-600 font-medium">{tracker.enquiryNo || tracker.leadId}</p>
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
          <p className="text-sky-600 font-medium">{tracker.currentStage || "Completed"}</p>
        </div>
        <div>
          <span className="block text-xs text-gray-400">Calling Date</span>
          <p>{tracker.callingDate || "-"}</p>
        </div>
      </div>
      <div className="pt-2 border-t border-gray-100 flex justify-end">
        <button onClick={() => { setSelectedTracker(tracker); setShowPopup(true); }} className="w-full flex items-center justify-center px-3 py-2 text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md font-medium">
          View
        </button>
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
      {renderRowCells(tracker, visiblePendingColumns)}
    </tr>
  );

  const renderHistoryRow = (tracker, index) => (
    <tr key={tracker.id || index} className="hover:bg-slate-50 border-b border-gray-200">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button onClick={() => { setSelectedTracker(tracker); setShowPopup(true); }} className="px-3 py-1 text-xs border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md">
          View
        </button>
      </td>
      {renderRowCells(tracker, visibleColumns)}
    </tr>
  );

  const getHeaders = () => {
    if (activeTab === "pending") {
      const baseHeaders = [
        { label: "Actions", className: "sticky left-0 bg-gray-50 z-30 shadow-[1px_0_0_0_#e5e7eb]" }
      ];
      columnsConfig.forEach(opt => {
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

    const historyHeaders = [
      "Actions",
      ...columnsConfig
        .filter(opt => visibleColumns[opt.key])
        .filter(opt => opt.key !== "salespersonName" || isAdmin())
        .map(opt => opt.label)
    ];
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
