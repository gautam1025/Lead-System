"use client";

import { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../../App";
import { mockApi } from "../../services/mockApi";
import { BarChartIcon, PhoneCallIcon, FileTextIcon, ShoppingCartIcon, UsersIcon } from "../../components/Icons";
import { MapPin } from "lucide-react";

// FOS Team Members List
const FOS_RECEIVERS = [
    "PRANAV VINAYAKRAO BHOGAWAR",
    "RANJAN KUMAR PRUSTY",
    "SAMIRAN RAJBONGSHI",
    "ROSHAN DEWANGAN",
    "TUSHAR ATRAM",
    "SUBHRAJIT BEHERA",
    "MANOSH ROY CHOUDHURY",
    "AMAN JHA"
];

function Report() {
    const { isAdmin } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState("calling"); // "calling" or "fos"

    // calling report state
    const [metrics, setMetrics] = useState({
        totalLeads: 0,
        calls: 0,
        enquiries: 0,
        quotations: 0,
        orders: 0,
        quotationValue: 0,
        orderQuotationValue: 0,
    });
    const [filters, setFilters] = useState({
        scName: "all",
        startDate: "",
        endDate: "",
    });
    const [scNames, setScNames] = useState([]);

    // FOS report state
    const [fosMetrics, setFosMetrics] = useState({
        enquiryCount: 0,
        totalValue: 0,
        orderConvert: 0,
    });

    // Total Visit (Tankhwa Patra)
    const [totalVisitCount, setTotalVisitCount] = useState(0);

    // Pipeline state (for non-converted enquiries)
    const [pipelineMetrics, setPipelineMetrics] = useState({
        enquiryCount: 0,
        totalValue: 0,
    });

    // SC Pipeline state
    const [scPipelineMetrics, setScPipelineMetrics] = useState({
        leadsCount: 0,
        leadsValue: 0,
        enquiryCount: 0,
        enquiryValue: 0,
    });
    const [scPipelineFilters, setScPipelineFilters] = useState({
        scName: "all",
        startDate: "",
        endDate: "",
    });

    // Conversion Metrics Table (per enquiry receiver)
    const [conversionMetrics, setConversionMetrics] = useState([]);

    const [fosFilters, setFosFilters] = useState({
        receiverName: "all",
        startDate: "",
        endDate: "",
    });

    const [isLoading, setIsLoading] = useState(true);

    // Fetch unique SC names for the filter dropdown
    const fetchSCNames = useCallback(async () => {
        try {
            const uniqueNames = await mockApi.fetchReportSCNames();
            setScNames(uniqueNames);
        } catch (error) {
            console.error("Error fetching SC names:", error);
        }
    }, []);

    const fetchMetrics = useCallback(async () => {
        if (!isAdmin()) return;
        setIsLoading(true);
        try {
            const data = await mockApi.fetchCallingReportMetrics(filters);
            setMetrics(data);
        } catch (error) {
            console.error("Error fetching report metrics:", error);
        } finally {
            setIsLoading(false);
        }
    }, [filters, isAdmin]);

    // Fetch FOS Data
    const fetchFosMetrics = useCallback(async () => {
        if (!isAdmin() || activeTab !== "fos") return;
        setIsLoading(true);
        try {
            const data = await mockApi.fetchFosReportMetrics(fosFilters);
            setFosMetrics({
                enquiryCount: data.enquiryCount,
                totalValue: data.totalValue,
                convertedValue: data.convertedValue,
                orderConvert: data.orderConvert
            });
            setPipelineMetrics(data.pipelineMetrics);
            setConversionMetrics(data.conversionMetrics);
        } catch (err) {
            console.error("FOS fetch error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [fosFilters, activeTab, isAdmin]);

    // Fetch SC Pipeline Metrics
    const fetchScPipelineMetrics = useCallback(async () => {
        if (!isAdmin() || activeTab !== "sc_pipeline") return;
        setIsLoading(true);
        try {
            const data = await mockApi.fetchScPipelineReportMetrics(scPipelineFilters);
            setScPipelineMetrics(data);
        } catch (error) {
            console.error("Error fetching SC Pipeline metrics:", error);
        } finally {
            setIsLoading(false);
        }
    }, [scPipelineFilters, activeTab, isAdmin]);


    useEffect(() => {
        fetchSCNames();
    }, [fetchSCNames]);


    const fetchFilteredVisitCount = useCallback(async () => {
        if (!isAdmin() || activeTab !== "fos") return;
        try {
            const count = await mockApi.fetchFilteredVisitCount(fosFilters);
            setTotalVisitCount(count);
        } catch (err) {
            console.error("Visit count error:", err);
        }
    }, [fosFilters, activeTab, isAdmin]);

    useEffect(() => {
        if (activeTab === "calling") {
            fetchMetrics();
        } else if (activeTab === "fos") {
            fetchFosMetrics();
            fetchFilteredVisitCount();
        } else if (activeTab === "sc_pipeline") {
            fetchScPipelineMetrics();
        }
    }, [fetchMetrics, fetchFosMetrics, fetchFilteredVisitCount, fetchScPipelineMetrics, activeTab]);

    if (!isAdmin()) {
        return <div className="p-8 text-center text-red-600">Access Denied</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Tabs */}
                <div className="mb-6 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab("calling")}
                            className={`${activeTab === "calling"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Calling Data
                        </button>
                        <button
                            onClick={() => setActiveTab("fos")}
                            className={`${activeTab === "fos"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            FOS Report
                        </button>
                        <button
                            onClick={() => setActiveTab("sc_pipeline")}
                            className={`${activeTab === "sc_pipeline"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            SC Pipeline
                        </button>
                    </nav>
                </div>

                {/* CALLING DATA TAB CONTENT */}
                {activeTab === "calling" && (
                    <>
                        {/* Filters */}
                        <div className="bg-white p-4 rounded-lg shadow mb-8 flex flex-col md:flex-row gap-4 items-end md:items-center">
                            <div className="w-full md:w-1/4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">SC Name</label>
                                <select
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                    value={filters.scName}
                                    onChange={(e) => setFilters(prev => ({ ...prev, scName: e.target.value }))}
                                >
                                    <option value="all">All Sales Coordinators</option>
                                    {scNames.map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-full md:w-1/4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                />
                            </div>
                            <div className="w-full md:w-1/4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                <input
                                    type="date"
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                />
                            </div>
                            <div className="w-full md:w-1/4">
                                <button
                                    onClick={() => setFilters({ scName: "all", startDate: "", endDate: "" })}
                                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {/* Card 0: Total Leads */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow p-6 flex items-center">
                                <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 mr-4">
                                    <UsersIcon className="h-7 w-7" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Leads</p>
                                    <p className="text-2xl font-bold text-slate-900">{isLoading ? "..." : metrics.totalLeads}</p>
                                </div>
                            </div>

                            {/* Card 1: Calls */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow p-6 flex items-center">
                                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 mr-4">
                                    <PhoneCallIcon className="h-7 w-7" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">No. of Calls</p>
                                    <p className="text-2xl font-bold text-slate-900">{isLoading ? "..." : metrics.calls}</p>
                                </div>
                            </div>

                            {/* Card 2: Enquiries */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow p-6 flex items-center">
                                <div className="p-3 rounded-xl bg-purple-50 text-purple-600 mr-4">
                                    <BarChartIcon className="h-7 w-7" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Enquiries</p>
                                    <p className="text-2xl font-bold text-slate-900">{isLoading ? "..." : metrics.enquiries}</p>
                                </div>
                            </div>

                            {/* Card 3: Quotations */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow p-6 flex items-center">
                                <div className="p-3 rounded-xl bg-amber-50 text-amber-600 mr-4">
                                    <FileTextIcon className="h-7 w-7" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Quotations</p>
                                    <p className="text-2xl font-bold text-slate-900">{isLoading ? "..." : metrics.quotations}</p>
                                </div>
                            </div>

                            {/* Card 4: Orders */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow p-6 flex items-center">
                                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 mr-4">
                                    <ShoppingCartIcon className="h-7 w-7" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Orders</p>
                                    <p className="text-2xl font-bold text-slate-900">{isLoading ? "..." : metrics.orders}</p>
                                </div>
                            </div>

                            {/* Card 5: Total Quotation Value */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow p-6 flex items-center">
                                <div className="p-3 rounded-xl bg-teal-50 text-teal-600 mr-4">
                                    <span className="text-2xl font-bold">₹</span>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Quotation Value</p>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {isLoading ? "..." : (metrics.quotationValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </p>
                                </div>
                            </div>

                            {/* Card 6: Total Order Quotation Value */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow p-6 flex items-center">
                                <div className="p-3 rounded-xl bg-orange-50 text-orange-600 mr-4">
                                    <span className="text-2xl font-bold">₹</span>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Order Value</p>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {isLoading ? "..." : (metrics.orderQuotationValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* FOS REPORT TAB CONTENT */}
                {activeTab === "fos" && (
                    <>
                        {/* FOS Filters */}
                        <div className="bg-white p-4 rounded-lg shadow mb-8 flex flex-col md:flex-row gap-4 items-end md:items-center">
                            <div className="w-full md:w-1/3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Enquiry Receiver Name</label>
                                <select
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                    value={fosFilters.receiverName}
                                    onChange={(e) => setFosFilters(prev => ({ ...prev, receiverName: e.target.value }))}
                                >
                                    <option value="all">All Receivers</option>
                                    {FOS_RECEIVERS.map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-full md:w-1/4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                    value={fosFilters.startDate}
                                    onChange={(e) => setFosFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                />
                            </div>
                            <div className="w-full md:w-1/4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                <input
                                    type="date"
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                    value={fosFilters.endDate}
                                    onChange={(e) => setFosFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                />
                            </div>
                            <div className="w-full md:w-1/6">
                                <button
                                    onClick={() => setFosFilters({ receiverName: "all", startDate: "", endDate: "" })}
                                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>

                        {/* FOS Team and Pipeline Sections */}
                        <div className="space-y-12">
                            {/* Section 1: FOS Team */}
                            <div>
                                <h2 className="text-xl font-semibold text-slate-800 mb-4">FOS Team Performance</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                                    {/* Total Visit */}
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow p-6 flex items-center justify-between border-l-4 border-l-blue-500">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                                Total Visit
                                            </p>
                                            <p className="text-3xl font-bold text-slate-900 mt-2">
                                                {isLoading ? "..." : totalVisitCount}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-blue-50 text-blue-600">
                                            <MapPin className="h-8 w-8" />
                                        </div>
                                    </div>

                                    {/* No. of Enquiry */}
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow p-6 flex items-center justify-between border-l-4 border-l-indigo-500">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">No. of Enquiries</p>
                                            <p className="text-3xl font-bold text-slate-900 mt-2">{isLoading ? "..." : fosMetrics.enquiryCount}</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-indigo-50 text-indigo-600">
                                            <UsersIcon className="h-8 w-8" />
                                        </div>
                                    </div>

                                    {/* Total Enquiry Value */}
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow p-6 flex items-center justify-between border-l-4 border-l-emerald-500">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Enquiry Value </p>
                                            <p className="text-3xl font-bold text-slate-900 mt-2">
                                                {isLoading ? "..." : (fosMetrics.totalValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-600">
                                            <span className="text-2xl font-bold">₹</span>
                                        </div>
                                    </div>

                                    {/* Order Convert */}
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow p-6 flex items-center justify-between border-l-4 border-l-purple-500">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Orders Converted</p>
                                            <p className="text-3xl font-bold text-slate-900 mt-2">{isLoading ? "..." : fosMetrics.orderConvert}</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-purple-50 text-purple-600">
                                            <ShoppingCartIcon className="h-8 w-8" />
                                        </div>
                                    </div>

                                    {/*Order Converted Total Value */}
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow p-6 flex items-center justify-between border-l-4 border-l-teal-500">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Order Converted Value </p>
                                            <p className="text-3xl font-bold text-slate-900 mt-2">
                                                {isLoading ? "..." : (fosMetrics.convertedValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-teal-50 text-teal-600">
                                            <span className="text-2xl font-bold">₹</span>
                                        </div>
                                    </div>

                                    {/* Avg Ticket Size */}
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow p-6 flex items-center justify-between border-l-4 border-l-amber-500">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Avg Ticket Size</p>
                                            <p className="text-3xl font-bold text-slate-900 mt-2">
                                                {isLoading ? "..." : fosMetrics.orderConvert > 0
                                                    ? (fosMetrics.convertedValue / fosMetrics.orderConvert).toLocaleString('en-IN', { maximumFractionDigits: 0 })
                                                    : '0'}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-amber-50 text-amber-600">
                                            <span className="text-2xl font-bold">₹</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Pipeline (Non-converted Enquiries Only) */}
                            <div>
                                <h2 className="text-xl font-semibold text-slate-800 mb-4">Pipeline</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* No. of Enquiry (Non-converted only) */}
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow p-6 flex items-center justify-between border-l-4 border-l-indigo-500">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">No. of Enquiries</p>
                                            <p className="text-3xl font-bold text-slate-900 mt-2">{isLoading ? "..." : pipelineMetrics.enquiryCount}</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-indigo-50 text-indigo-600">
                                            <UsersIcon className="h-8 w-8" />
                                        </div>
                                    </div>

                                    {/* Value (Non-converted only) */}
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow p-6 flex items-center justify-between border-l-4 border-l-emerald-500">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Value</p>
                                            <p className="text-3xl font-bold text-slate-900 mt-2">
                                                {isLoading ? "..." : (pipelineMetrics.totalValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-600">
                                            <span className="text-2xl font-bold">₹</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Conversion Metrics Table */}
                            <div>
                                <h2 className="text-xl font-semibold text-slate-800 mb-4">Enquiry to Order Conversion Metrics</h2>
                                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-200">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">FOS Name</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Enquiries</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order Conversions</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Conversion %</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Ticket Size</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-slate-100">
                                                {conversionMetrics.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.totalEnquiries}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.orderConversions}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${item.conversionPercentage >= 50 ? 'bg-emerald-100 text-emerald-800' : item.conversionPercentage >= 20 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                                                                {item.conversionPercentage.toFixed(1)}%
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                                                            {(item.avgTicketSize || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {conversionMetrics.length === 0 && (
                                                    <tr>
                                                        <td colSpan="5" className="px-6 py-8 text-center text-sm text-slate-500">No conversion data available</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* SC PIPELINE TAB CONTENT */}
                {activeTab === "sc_pipeline" && (
                    <>
                        {/* SC Pipeline Filters */}
                        <div className="bg-white p-4 rounded-lg shadow mb-8 flex flex-col md:flex-row gap-4 items-end md:items-center">
                            <div className="w-full md:w-1/4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">SC Name</label>
                                <select
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                    value={scPipelineFilters.scName}
                                    onChange={(e) => setScPipelineFilters(prev => ({ ...prev, scName: e.target.value }))}
                                >
                                    <option value="all">All Sales Coordinators</option>
                                    {scNames.map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-full md:w-1/4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                    value={scPipelineFilters.startDate}
                                    onChange={(e) => setScPipelineFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                />
                            </div>
                            <div className="w-full md:w-1/4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                <input
                                    type="date"
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                    value={scPipelineFilters.endDate}
                                    onChange={(e) => setScPipelineFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                />
                            </div>
                            <div className="w-full md:w-1/4">
                                <button
                                    onClick={() => setScPipelineFilters({ scName: "all", startDate: "", endDate: "" })}
                                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        </div>

                        {/* SC Pipeline Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Card 1: Total Leads */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow p-6 flex items-center justify-between border-l-4 border-l-indigo-500">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Leads</p>
                                    <p className="text-3xl font-bold text-slate-900 mt-2">{isLoading ? "..." : scPipelineMetrics.leadsCount}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-indigo-50 text-indigo-600">
                                    <UsersIcon className="h-8 w-8" />
                                </div>
                            </div>

                            {/* Card 2: Total Leads Value */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow p-6 flex items-center justify-between border-l-4 border-l-green-500">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Leads Value</p>
                                    <p className="text-2xl font-bold text-slate-900 mt-2">
                                        {isLoading ? "..." : (scPipelineMetrics.leadsValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-green-50 text-green-600">
                                    <span className="text-2xl font-bold">₹</span>
                                </div>
                            </div>

                            {/* Card 3: Total Enquiries */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow p-6 flex items-center justify-between border-l-4 border-l-purple-500">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Enquiries</p>
                                    <p className="text-3xl font-bold text-slate-900 mt-2">{isLoading ? "..." : scPipelineMetrics.enquiryCount}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-purple-50 text-purple-600">
                                    <BarChartIcon className="h-8 w-8" />
                                </div>
                            </div>

                            {/* Card 4: Total Enquiries Value */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow p-6 flex items-center justify-between border-l-4 border-l-amber-500">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Enquiries Value</p>
                                    <p className="text-2xl font-bold text-slate-900 mt-2">
                                        {isLoading ? "..." : (scPipelineMetrics.enquiryValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-amber-50 text-amber-600">
                                    <span className="text-2xl font-bold">₹</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Report;
