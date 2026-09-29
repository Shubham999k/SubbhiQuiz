import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../../services/api";
import { Activity, Download, Trash2, Calendar, FileText, CheckCircle, Clock, Trash, AlertCircle, Undo2, Eye, Info } from "lucide-react";
import toast from "react-hot-toast";
import Loader from "../../../components/common/Loader";
import Dropdown from "../../../components/ui/Dropdown";

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Action Modal state
  const [actionModalData, setActionModalData] = useState(null); // { type: 'single_delete' | 'restore' | 'old' | 'old_week' | 'all', id?: string }
  const [confirmText, setConfirmText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoClear, setAutoClear] = useState("Never");
  
  
  // View Modal state
  const [viewLogData, setViewLogData] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const data = await api.getActivityLogs();
      setLogs(data);
    } catch (error) {
      toast.error(error.message || "Failed to fetch activity logs");
    } finally {
      setLoading(false);
    }
  };

  // Close modals on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (actionModalData) {
          setActionModalData(null);
          setConfirmText("");
        }
        if (viewLogData) {
          setViewLogData(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actionModalData, viewLogData]);

  const handleExportCSV = () => {
    if (logs.length === 0) return toast.error("No data to export");
    
    // Create CSV content
    const headers = ["Date", "Action", "Type", "Details"];
    const rows = logs.map(log => [
      new Date(log.createdAt || log.date).toLocaleString(),
      `"${log.action.replace(/"/g, '""')}"`,
      log.type,
      `"${(log.details || "").replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ActivityLog_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported to Excel (CSV) successfully");
  };

  const handleConfirmAction = async () => {
    const requiredText = actionModalData.type === "restore" ? "restore" : "delete";
    if (confirmText.toLowerCase() !== requiredText) return;
    
    try {
      setIsProcessing(true);
      if (actionModalData.type === "single_delete") {
        await api.deleteActivityLog(actionModalData.id);
        setLogs(prev => prev.filter(log => log._id !== actionModalData.id));
        toast.success("Activity log deleted");
      } else if (actionModalData.type === "old") {
        await api.deleteOldActivityLogs();
        await fetchLogs();
        toast.success("Deleted data older than 30 days");
      } else if (actionModalData.type === "old_week") {
        await api.deleteWeekOldActivityLogs();
        await fetchLogs();
        toast.success("Deleted data older than 1 week");
      } else if (actionModalData.type === "all") {
        await api.clearAllActivityLogs();
        setLogs([]);
        toast.success("All activity logs cleared");
      } else if (actionModalData.type === "restore") {
        await api.restoreActivityLog(actionModalData.id);
        toast.success("Restored successfully");
        setLogs(prev => prev.map(log => log._id === actionModalData.id ? { ...log, isRestored: true, details: `${log.details} (Restored)` } : log));
      }
      setActionModalData(null);
      setConfirmText("");
    } catch (error) {
      toast.error(error.message || "Failed to process action");
    } finally {
      setIsProcessing(false);
    }
  };

  const getIconForType = (type) => {
    switch(type) {
      case "QUIZ_TAKEN": return <CheckCircle className="text-success w-5 h-5" />;
      case "QUIZ_ADDED": return <FileText className="text-primary w-5 h-5" />;
      case "QUIZ_DELETED": return <Trash className="text-error w-5 h-5" />;
      case "STUDENT_ADDED": return <Activity className="text-info w-5 h-5" />;
      case "STUDENT_DELETED": return <Trash2 className="text-error w-5 h-5" />;
      default: return <Clock className="text-base-content/50 w-5 h-5" />;
    }
  };

  if (loading) {
    return <Loader message="Loading Activity Logs..." />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-3 max-w-7xl mx-auto pb-4">
      
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-base-100 p-6 rounded-2xl shadow-sm border border-base-300">
        <div>
          <h1 className="text-2xl font-extrabold text-base-content flex items-center gap-3">
            <Activity className="text-primary h-7 w-7" />
            Activity Log
          </h1>
          <p className="text-sm text-base-content/70 mt-1">
            Track all your actions, quizzes conducted, and project modifications.
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <button
            onClick={handleExportCSV}
            className="flex-none px-3 py-1.5 bg-success/10 text-success font-bold rounded-lg hover:bg-success hover:text-white transition-colors flex items-center justify-center gap-1.5 text-sm"
          >
            <Download size={16} />
            Export
          </button>
          
          <button
            onClick={() => { setActionModalData({ type: "old_week" }); setConfirmText(""); }}
            className="flex-none px-3 py-1.5 bg-info/10 text-info font-bold rounded-lg hover:bg-info hover:text-white transition-colors flex items-center justify-center gap-1.5 text-sm whitespace-nowrap"
          >
            <Clock size={16} />
            &gt; 1 Week
          </button>
          
          <button
            onClick={() => { setActionModalData({ type: "old" }); setConfirmText(""); }}
            className="flex-none px-3 py-1.5 bg-warning/10 text-warning font-bold rounded-lg hover:bg-warning hover:text-white transition-colors flex items-center justify-center gap-1.5 text-sm whitespace-nowrap"
          >
            <Calendar size={16} />
            &gt; 30 Days
          </button>
          
          <button
            onClick={() => { setActionModalData({ type: "all" }); setConfirmText(""); }}
            className="flex-none px-3 py-1.5 bg-error/10 text-error font-bold rounded-lg hover:bg-error hover:text-white transition-colors flex items-center justify-center gap-1.5 text-sm whitespace-nowrap"
          >
            <Trash2 size={16} />
            Clear All
          </button>

          <div className="flex-none flex items-center gap-2 pl-2 border-l border-base-300 ml-1">
            <span className="text-sm font-medium text-base-content/70 whitespace-nowrap">Auto-Clear:</span>
            <Dropdown
              options={[
                { label: "Never", value: "Never" },
                { label: "Every Day", value: "Every Day" },
                { label: "Every Week", value: "Every Week" },
                { label: "Every Month", value: "Every Month" }
              ]}
              value={autoClear}
              onChange={setAutoClear}
              className="w-32"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      {logs.length === 0 ? (
        <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-base-200 mb-4">
            <Activity className="h-10 w-10 text-base-content/30" />
          </div>
          <h3 className="text-xl font-bold text-base-content">No Activity Found</h3>
          <p className="text-base-content/60 mt-2 max-w-md mx-auto">
            Your recent actions will appear here. Create quizzes, conduct sessions, or manage students to build your activity log.
          </p>
        </div>
      ) : (
        <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1"></div>
          
          <div className="overflow-x-auto h-[70vh] scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-base-100">
            <table className="w-full text-left">
              <thead className="bg-base-200/50 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="py-4 px-6 font-bold text-xs uppercase tracking-wider text-base-content/60 w-1/4">Date & Time</th>
                  <th className="py-4 px-6 font-bold text-xs uppercase tracking-wider text-base-content/60">Action</th>
                  <th className="py-4 px-6 font-bold text-xs uppercase tracking-wider text-base-content/60">Details</th>
                  <th className="py-4 px-6 font-bold text-xs uppercase tracking-wider text-base-content/60 text-right w-32">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-base-200/30 transition-colors group">
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-base-content">
                          {new Date(log.createdAt || log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-xs text-base-content/50">
                          {new Date(log.createdAt || log.date).toLocaleTimeString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-base-200 flex items-center justify-center shrink-0">
                          {getIconForType(log.type)}
                        </div>
                        <span className="font-medium text-base-content">{log.action}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-base-content/70 max-w-md truncate" title={log.details}>
                        {log.details || "-"}
                      </p>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity relative z-20">
                        <div className="tooltip tooltip-left lg:tooltip-top" data-tip="View Details">
                          <button 
                            onClick={() => setViewLogData(log)}
                            className="p-2 text-base-content/60 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            <Eye size={18} />
                          </button>
                        </div>

                        {log.isRestored ? (
                          <div className="tooltip tooltip-left lg:tooltip-top" data-tip="Already restored">
                            <span className="text-xs font-bold text-success px-2 py-1 bg-success/10 rounded-lg inline-flex items-center h-9">
                              Restored
                            </span>
                          </div>
                        ) : log.isRestorable && log.restoreData ? (
                          <div className="tooltip tooltip-left lg:tooltip-top" data-tip="Restore Data">
                            <button 
                              onClick={() => { setActionModalData({ type: "restore", id: log._id }); setConfirmText(""); }}
                              className="p-2 text-info hover:text-white hover:bg-info rounded-lg transition-colors"
                            >
                              <Undo2 size={18} />
                            </button>
                          </div>
                        ) : (
                          <div className="tooltip tooltip-left lg:tooltip-top" data-tip="Nothing to restore">
                            <button 
                              disabled
                              className="p-2 text-base-content/30 cursor-not-allowed rounded-lg"
                            >
                              <Undo2 size={18} />
                            </button>
                          </div>
                        )}

                        <div className="tooltip tooltip-left lg:tooltip-top" data-tip="Delete Permanently">
                          <button 
                            onClick={() => { setActionModalData({ type: "single_delete", id: log._id }); setConfirmText(""); }}
                            className="p-2 text-error/60 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      <AnimatePresence>
        {actionModalData && (
          <div className="fixed inset-0 bg-base-300/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-base-100 p-6 sm:p-8 rounded-3xl shadow-2xl max-w-md w-full border border-base-200"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto ${actionModalData.type === 'restore' ? 'bg-info/10' : 'bg-error/10'}`}>
                {actionModalData.type === 'restore' ? (
                  <Undo2 className="h-8 w-8 text-info" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-error" />
                )}
              </div>
              
              <h3 className="font-extrabold text-2xl text-base-content text-center mb-2">
                {actionModalData.type === "single_delete" ? "Delete Activity Log" 
                 : actionModalData.type === "old" ? "Delete Old Logs" 
                 : actionModalData.type === "old_week" ? "Delete Logs < 1 Week"
                 : actionModalData.type === "restore" ? "Restore Data"
                 : "Clear All History"}
              </h3>
              
              <p className="text-base-content/70 text-center mb-6 text-sm">
                {actionModalData.type === "single_delete" ? "Are you sure you want to delete this activity record?" 
                 : actionModalData.type === "old" ? "This will permanently delete all activity logs older than 30 days." 
                 : actionModalData.type === "old_week" ? "This will permanently delete all activity logs older than 1 week."
                 : actionModalData.type === "restore" ? "Are you sure you want to restore this data back to its original state?"
                 : "This will permanently delete ALL activity logs. This action cannot be undone."}
              </p>
              
              <div className={`${actionModalData.type === 'restore' ? 'bg-info/5 border-info/20' : 'bg-error/5 border-error/20'} border p-4 rounded-xl mb-6`}>
                <p className={`text-sm font-medium ${actionModalData.type === 'restore' ? 'text-info' : 'text-error'} mb-2 text-center`}>
                  Type <span className={`font-black ${actionModalData.type === 'restore' ? 'bg-info/20' : 'bg-error/20'} px-2 py-0.5 rounded capitalize`}>
                    {actionModalData.type === 'restore' ? 'Restore' : 'Delete'}
                  </span> to confirm
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  onKeyDown={(e) => {
                    const required = actionModalData.type === "restore" ? "restore" : "delete";
                    if (e.key === "Enter" && confirmText.toLowerCase() === required && !isProcessing) {
                      handleConfirmAction();
                    }
                  }}
                  placeholder={actionModalData.type === 'restore' ? 'Restore' : 'Delete'}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-base-100 text-center font-bold placeholder-opacity-40 
                    ${actionModalData.type === 'restore' ? 'border-info/30 focus:ring-info focus:border-info text-info placeholder-info' : 'border-error/30 focus:ring-error focus:border-error text-error placeholder-error'}`}
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setActionModalData(null)}
                  className="flex-1 px-4 py-3 bg-base-200 text-base-content rounded-xl font-bold hover:bg-base-300 transition-colors"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  disabled={confirmText.toLowerCase() !== (actionModalData.type === "restore" ? "restore" : "delete") || isProcessing}
                  className={`flex-1 px-4 py-3 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 
                    ${actionModalData.type === 'restore' ? 'bg-info hover:bg-blue-600' : 'bg-error hover:bg-red-600'}`}
                >
                  {isProcessing ? <Loader className="w-5 h-5 animate-spin" /> : (
                    actionModalData.type === 'restore' ? <Undo2 size={18} /> : <Trash2 size={18} />
                  )}
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Log Details Modal */}
      <AnimatePresence>
        {viewLogData && (
          <div className="fixed inset-0 bg-base-300/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-base-100 p-6 sm:p-8 rounded-3xl shadow-2xl max-w-2xl w-full border border-base-200 overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-base-200 flex items-center justify-center shrink-0">
                    {getIconForType(viewLogData.type)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-2xl text-base-content">{viewLogData.action}</h3>
                    <p className="text-sm text-base-content/60 font-medium mt-1">
                      {new Date(viewLogData.createdAt || viewLogData.date).toLocaleString()}
                    </p>
                  </div>
                </div>
                {viewLogData.isRestored && (
                  <span className="text-sm font-bold text-success px-3 py-1 bg-success/10 rounded-full border border-success/20">
                    Restored
                  </span>
                )}
              </div>

              <div className="space-y-6 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-base-300">
                <div>
                  <h4 className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Info size={14} /> Action Summary
                  </h4>
                  <p className="text-base-content bg-base-200/50 p-4 rounded-xl leading-relaxed">
                    {viewLogData.details || "No summary provided."}
                  </p>
                </div>

                {viewLogData.restoreData && (
                  <div>
                    <h4 className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <FileText size={14} /> Data Snapshot (Before Action)
                    </h4>
                    <div className="bg-[#1e1e2e] text-[#a6accd] p-4 rounded-xl overflow-x-auto text-sm font-mono whitespace-pre-wrap max-h-64 scrollbar-thin scrollbar-thumb-base-content/20 shadow-inner">
                      {JSON.stringify(viewLogData.restoreData.data, null, 2)}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-base-200 flex justify-end gap-3">
                {viewLogData.isRestorable && !viewLogData.isRestored && (
                  <button
                    onClick={() => {
                      const logToRestore = viewLogData;
                      setViewLogData(null);
                      setTimeout(() => {
                        setActionModalData({ type: "restore", id: logToRestore._id });
                        setConfirmText("");
                      }, 150);
                    }}
                    className="px-6 py-2.5 bg-info/10 text-info font-bold rounded-xl hover:bg-info hover:text-white transition-colors flex items-center gap-2"
                  >
                    <Undo2 size={18} /> Restore
                  </button>
                )}
                <button
                  onClick={() => setViewLogData(null)}
                  className="px-6 py-2.5 bg-base-200 text-base-content rounded-xl font-bold hover:bg-base-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default ActivityLog;
