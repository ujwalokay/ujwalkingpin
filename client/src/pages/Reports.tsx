import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { RevenueCard } from "@/components/RevenueCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Download, IndianRupee, Users, Clock, Search, Eye, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAdjustedTime } from "@/hooks/useServerTime";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColumnVisibilityToggle } from "@/components/ColumnVisibilityToggle";
import RetentionCharts from "@/components/RetentionCharts";
import { useAuth } from "@/contexts/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BookingStats {
  totalRevenue: number;
  totalFoodRevenue: number;
  totalSessions: number;
  avgSessionMinutes: number;
  cashRevenue: number;
  upiRevenue: number;
}

interface BookingHistoryItem {
  id: string;
  date: string;
  seatName: string;
  customerName: string;
  duration: string;
  price: string;
  foodAmount: number;
  totalAmount: number;
  paymentMethod: string | null;
  paymentStatus: string;
  cashAmount: string | null;
  upiAmount: string | null;
  discount?: string | null;
  bonus?: string | null;
  discountApplied?: string | null;
  bonusHoursApplied?: string | null;
}

interface SeatDetail {
  seat: string;
  duration: string;
  bookingId: string;
}

interface GroupedBookingSession {
  id: string;
  date: string;
  customerName: string;
  seats: string[];
  seatDetails: SeatDetail[];
  duration: string;
  sessionPrice: number;
  foodAmount: number;
  cashAmount: number;
  upiAmount: number;
  totalAmount: number;
  bookingIds: string[];
  discount?: string;
  bonus?: string;
  discountApplied?: string;
  bonusHoursApplied?: string;
  paymentStatus: string;
}

interface UnifiedTransaction {
  id: string;
  date: string;
  customerName: string;
  seats?: string[];
  seatDetails?: SeatDetail[];
  duration?: string;
  sessionPrice?: number;
  foodAmount: number;
  cashAmount: number;
  upiAmount: number;
  totalAmount: number;
  paymentMethod: string | null;
  paymentStatus?: string;
  discount?: string;
  bonus?: string;
  discountApplied?: string;
  bonusHoursApplied?: string;
  bookingIds?: string[];
}

export default function Reports() {
  const { user } = useAuth();
  const [mainTab, setMainTab] = useState<string>("reports");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("daily");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewSeatsDialog, setViewSeatsDialog] = useState<{ open: boolean; seatDetails: SeatDetail[] }>({ open: false, seatDetails: [] });
  const [viewBonusDialog, setViewBonusDialog] = useState<{ open: boolean; bonusHours: string }>({ open: false, bonusHours: '' });
  const { toast } = useToast();

  const reportColumns = useMemo(() => [
    { id: "date", label: "Date", defaultVisible: true },
    { id: "customer", label: "Customer", defaultVisible: true },
    { id: "seats", label: "Seat/Duration", defaultVisible: true },
    { id: "duration", label: "Duration", defaultVisible: false },
    { id: "sessionPrice", label: "Session Price", defaultVisible: true },
    { id: "foodAmount", label: "Food Amount", defaultVisible: true },
    { id: "discount", label: "Discount", defaultVisible: false },
    { id: "bonus", label: "Bonus", defaultVisible: false },
    { id: "paymentMethod", label: "Payment Method", defaultVisible: true },
    { id: "cash", label: "Cash", defaultVisible: true },
    { id: "upi", label: "UPI", defaultVisible: true },
    { id: "total", label: "Total", defaultVisible: true },
    { id: "status", label: "Status", defaultVisible: true },
  ], []);

  const defaultVisibleColumns = useMemo(() => 
    reportColumns.filter(col => col.defaultVisible).map(col => col.id),
    [reportColumns]
  );

  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultVisibleColumns);

  const handleVisibilityChange = useCallback((columns: string[]) => {
    setVisibleColumns(columns);
  }, []);

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.append("period", selectedPeriod);
    
    if (selectedPeriod === "weekly" && startDate && endDate) {
      params.append("startDate", startDate);
      params.append("endDate", endDate);
    } else if (selectedPeriod === "monthly" && selectedMonth) {
      const date = new Date(selectedMonth);
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      params.append("startDate", firstDay.toISOString().split('T')[0]);
      params.append("endDate", lastDay.toISOString().split('T')[0]);
    }
    
    return params.toString();
  };

  const { data: stats, isLoading: statsLoading } = useQuery<BookingStats>({
    queryKey: ["/api/reports/stats", selectedPeriod, startDate, endDate, selectedMonth],
    queryFn: async () => {
      const response = await fetch(`/api/reports/stats?${buildQueryParams()}`);
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  const { data: history, isLoading: historyLoading } = useQuery<BookingHistoryItem[]>({
    queryKey: ["/api/reports/history", selectedPeriod, startDate, endDate, selectedMonth],
    queryFn: async () => {
      const response = await fetch(`/api/reports/history?${buildQueryParams()}`);
      if (!response.ok) throw new Error("Failed to fetch history");
      return response.json();
    },
  });

  const groupedSessions = useMemo(() => {
    if (!history) return [];
    
    const sessionMap = new Map<string, GroupedBookingSession>();
    
    history.forEach((record, index) => {
      const recordDateTime = new Date(record.date);
      let foundSession = false;
      
      for (const [key, session] of Array.from(sessionMap.entries())) {
        const sessionDateTime = new Date(session.date);
        const timeDifferenceMs = Math.abs(recordDateTime.getTime() - sessionDateTime.getTime());
        const timeDifferenceMinutes = timeDifferenceMs / (1000 * 60);
        
        if (
          session.customerName === record.customerName &&
          timeDifferenceMinutes < 5
        ) {
          session.seats.push(record.seatName);
          session.seatDetails.push({
            seat: record.seatName,
            duration: record.duration,
            bookingId: record.id
          });
          if (session.duration !== record.duration) {
            session.duration = "Mixed";
          }
          session.bookingIds.push(record.id);
          session.sessionPrice += parseFloat(record.price);
          session.foodAmount += record.foodAmount || 0;
          session.totalAmount += record.totalAmount || parseFloat(record.price);
          
          if (record.cashAmount) {
            session.cashAmount += parseFloat(record.cashAmount);
          } else if (record.paymentMethod === 'cash') {
            session.cashAmount += record.totalAmount || parseFloat(record.price);
          }
          
          if (record.upiAmount) {
            session.upiAmount += parseFloat(record.upiAmount);
          } else if (record.paymentMethod === 'upi_online') {
            session.upiAmount += record.totalAmount || parseFloat(record.price);
          }
          
          if (record.discountApplied) {
            session.discountApplied = session.discountApplied 
              ? `${session.discountApplied}, ${record.discountApplied}`
              : record.discountApplied;
          }
          if (record.bonusHoursApplied) {
            session.bonusHoursApplied = session.bonusHoursApplied 
              ? `${session.bonusHoursApplied}, ${record.bonusHoursApplied}`
              : record.bonusHoursApplied;
          }
          
          const currentStatus = session.paymentStatus || 'unpaid';
          const recordStatus = record.paymentStatus || 'unpaid';
          if (currentStatus !== recordStatus) {
            session.paymentStatus = "Mixed";
          }
          
          foundSession = true;
          break;
        }
      }
      
      if (!foundSession) {
        const sessionKey = `${record.customerName}-${record.date}-${record.duration}-${index}`;
        sessionMap.set(sessionKey, {
          id: record.id,
          date: record.date,
          customerName: record.customerName,
          seats: [record.seatName],
          seatDetails: [{
            seat: record.seatName,
            duration: record.duration,
            bookingId: record.id
          }],
          duration: record.duration,
          sessionPrice: parseFloat(record.price),
          foodAmount: record.foodAmount || 0,
          cashAmount: record.cashAmount 
            ? parseFloat(record.cashAmount)
            : record.paymentMethod === 'cash' 
              ? (record.totalAmount || parseFloat(record.price))
              : 0,
          upiAmount: record.upiAmount 
            ? parseFloat(record.upiAmount)
            : record.paymentMethod === 'upi_online' 
              ? (record.totalAmount || parseFloat(record.price))
              : 0,
          totalAmount: record.totalAmount || parseFloat(record.price),
          bookingIds: [record.id],
          discount: record.discount || undefined,
          bonus: record.bonus || undefined,
          discountApplied: record.discountApplied || undefined,
          bonusHoursApplied: record.bonusHoursApplied || undefined,
          paymentStatus: record.paymentStatus || 'unpaid',
        });
      }
    });
    
    return Array.from(sessionMap.values());
  }, [history]);

  const unifiedTransactions = useMemo(() => {
    if (!history) return [];
    
    const bookingTransactions: UnifiedTransaction[] = groupedSessions.map((session) => {
      let paymentMethod: string | null = null;
      if (session.cashAmount > 0 && session.upiAmount > 0) {
        paymentMethod = "Split";
      } else if (session.cashAmount > 0) {
        paymentMethod = "Cash";
      } else if (session.upiAmount > 0) {
        paymentMethod = "UPI";
      }
      
      return {
        id: session.id,
        date: session.date,
        customerName: session.customerName,
        seats: session.seats,
        seatDetails: session.seatDetails,
        duration: session.duration,
        sessionPrice: session.sessionPrice,
        foodAmount: session.foodAmount,
        cashAmount: session.cashAmount,
        upiAmount: session.upiAmount,
        totalAmount: session.totalAmount,
        paymentMethod,
        paymentStatus: session.paymentStatus,
        discount: session.discount,
        bonus: session.bonus,
        discountApplied: session.discountApplied,
        bonusHoursApplied: session.bonusHoursApplied,
        bookingIds: session.bookingIds,
      };
    });
    
    bookingTransactions.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
    
    return bookingTransactions;
  }, [groupedSessions, history]);

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return unifiedTransactions;

    const query = searchQuery.toLowerCase();
    return unifiedTransactions.filter(transaction => {
      const matchesCustomer = transaction.customerName.toLowerCase().includes(query);
      const matchesDate = transaction.date.toLowerCase().includes(query);
      const matchesSeats = transaction.seats?.some(seat => seat.toLowerCase().includes(query));
      const matchesDuration = transaction.duration?.toLowerCase().includes(query);
      const matchesPaymentMethod = transaction.paymentMethod?.toLowerCase().includes(query);
      
      return matchesCustomer || matchesDate || matchesSeats || matchesDuration || matchesPaymentMethod;
    });
  }, [unifiedTransactions, searchQuery]);

  const handleExportExcel = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no transactions for the selected period.",
        variant: "destructive",
      });
      return;
    }

    try {
      const headers = ["Date", "Customer", "Seat/Duration", "Session Price (₹)", "Food (₹)", "Discount", "Bonus", "Payment Method", "Cash (₹)", "UPI (₹)", "Total (₹)", "Status"];
      const csvContent = [
        headers.join(","),
        ...filteredTransactions.map(transaction => {
          const seatDurationPairs = transaction.seatDetails
            ? transaction.seatDetails.map(detail => `${detail.seat} (${detail.duration})`).join(' + ')
            : transaction.seats?.join(' + ') || '-';
          
          return [
            transaction.date,
            `"${transaction.customerName}"`,
            `"${seatDurationPairs}"`,
            transaction.sessionPrice?.toFixed(0) || '-',
            transaction.foodAmount.toFixed(0),
            transaction.discountApplied || '-',
            transaction.bonusHoursApplied || '-',
            transaction.paymentMethod || '-',
            transaction.cashAmount.toFixed(0),
            transaction.upiAmount.toFixed(0),
            transaction.totalAmount.toFixed(0),
            transaction.paymentStatus || '-'
          ].join(",");
        })
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `transactions_report_${selectedPeriod}_${getAdjustedTime().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export successful",
        description: "CSV file has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export CSV file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case "daily": return "Today's";
      case "weekly": return "This Week's";
      case "monthly": return "This Month's";
      default: return "Today's";
    }
  };

  const handleExportPDF = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no transactions for the selected period.",
        variant: "destructive",
      });
      return;
    }

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: "Popup blocked",
          description: "Please allow popups for this site to export PDF.",
          variant: "destructive",
        });
        return;
      }

      const currentDate = new Date().toLocaleString('en-IN', { 
        dateStyle: 'full', 
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata'
      });
      
      const totalCash = filteredTransactions.reduce((sum, t) => sum + t.cashAmount, 0);
      const totalUPI = filteredTransactions.reduce((sum, t) => sum + t.upiAmount, 0);
      const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.totalAmount, 0);

      const adminName = user?.username || "Admin";

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${adminName} - Transaction Report</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: #f8f9fa;
              padding: 20px;
              color: #333;
            }
            .container {
              background: white;
              max-width: 1200px;
              margin: 0 auto;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
              padding: 24px 32px;
              color: white;
              border-bottom: 3px solid #6d28d9;
            }
            .header-top {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 16px;
            }
            .company-info h1 {
              font-size: 24px;
              font-weight: 600;
              margin-bottom: 4px;
            }
            .company-info p {
              font-size: 13px;
              opacity: 0.95;
            }
            .admin-info {
              text-align: right;
              font-size: 12px;
              opacity: 0.95;
            }
            .admin-info .label {
              font-weight: 500;
              margin-bottom: 3px;
              opacity: 0.85;
            }
            .admin-info .name {
              font-size: 14px;
              font-weight: 600;
            }
            .report-title {
              font-size: 18px;
              font-weight: 500;
              text-align: center;
              padding: 12px;
              background: rgba(255,255,255,0.15);
              border-radius: 6px;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 16px;
              padding: 24px 32px;
              background: #faf5ff;
            }
            .stat-card {
              background: white;
              padding: 16px;
              border-radius: 6px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.05);
              border-left: 3px solid #7c3aed;
            }
            .stat-card h3 {
              font-size: 12px;
              color: #6b7280;
              font-weight: 500;
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            .stat-card .value {
              font-size: 22px;
              font-weight: 600;
              color: #7c3aed;
            }
            .content {
              padding: 24px 32px;
            }
            .table-wrapper {
              overflow-x: auto;
              border-radius: 6px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.05);
              border: 1px solid #e5e7eb;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
              background: white;
            }
            thead {
              background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
              color: white;
            }
            th {
              padding: 12px 10px;
              text-align: left;
              font-weight: 500;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            td {
              padding: 10px;
              border-bottom: 1px solid #f3f4f6;
            }
            tbody tr {
              transition: background-color 0.15s;
            }
            tbody tr:nth-child(even) {
              background-color: #faf5ff;
            }
            tbody tr:hover {
              background-color: #f3e8ff;
            }
            .text-right {
              text-align: right;
            }
            .badge {
              display: inline-block;
              padding: 3px 8px;
              background: #f3e8ff;
              border-radius: 4px;
              margin: 2px;
              font-size: 10px;
              font-weight: 500;
              color: #6d28d9;
              border: 1px solid #e9d5ff;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: 600;
              text-transform: uppercase;
            }
            .status-paid {
              background: #d1fae5;
              color: #065f46;
            }
            .status-pending {
              background: #fef3c7;
              color: #92400e;
            }
            .status-partial {
              background: #dbeafe;
              color: #1e40af;
            }
            .summary {
              margin-top: 24px;
              padding: 20px;
              background: #faf5ff;
              border-radius: 6px;
              border: 2px solid #7c3aed;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 16px;
            }
            .summary-item {
              text-align: center;
            }
            .summary-item .label {
              font-size: 12px;
              color: #6b7280;
              font-weight: 500;
              margin-bottom: 6px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            .summary-item .amount {
              font-size: 20px;
              font-weight: 700;
              color: #7c3aed;
            }
            .footer {
              margin-top: 24px;
              padding-top: 16px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 11px;
            }
            .footer .powered {
              margin-top: 8px;
              font-size: 10px;
              color: #9ca3af;
            }
            @media print {
              body { 
                padding: 0;
                background: white;
              }
              .container {
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="header-top">
                <div class="company-info">
                  <h1>${adminName}</h1>
                  <p>Staff Panel - Transaction Reports</p>
                </div>
                <div class="admin-info">
                  <div class="label">Generated By</div>
                  <div class="name">${adminName}</div>
                  <div style="margin-top: 6px; font-size: 11px; opacity: 0.85;">${currentDate}</div>
                </div>
              </div>
              <div class="report-title">
                ${getPeriodLabel()} Transaction Report
              </div>
            </div>

            <div class="stats-grid">
              <div class="stat-card">
                <h3>💰 Total Revenue</h3>
                <div class="value">₹${stats?.totalRevenue.toLocaleString() || 0}</div>
              </div>
              <div class="stat-card">
                <h3>🎮 Total Sessions</h3>
                <div class="value">${stats?.totalSessions || 0}</div>
              </div>
              <div class="stat-card">
                <h3>⏱️ Avg Session</h3>
                <div class="value">${stats?.avgSessionMinutes || 0} min</div>
              </div>
            </div>

            <div class="content">
              <div class="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Seat/Duration</th>
                      <th class="text-right">Session</th>
                      <th class="text-right">Food</th>
                      <th class="text-right">Discount</th>
                      <th class="text-right">Bonus</th>
                      <th class="text-right">Payment</th>
                      <th class="text-right">Cash</th>
                      <th class="text-right">UPI</th>
                      <th class="text-right">Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredTransactions.map(transaction => {
                      const detailsDisplay = transaction.seatDetails 
                        ? transaction.seatDetails.map(d => `<span class="badge">${d.seat} (${d.duration})</span>`).join(' ')
                        : transaction.seats?.map(s => `<span class="badge">${s}</span>`).join(' ') || '-';
                      
                      const statusClass = transaction.paymentStatus === 'Paid' ? 'status-paid' 
                        : transaction.paymentStatus === 'Pending' ? 'status-pending' 
                        : 'status-partial';
                      
                      return `
                        <tr>
                          <td>${transaction.date}</td>
                          <td><strong>${transaction.customerName}</strong></td>
                          <td>${detailsDisplay}</td>
                          <td class="text-right">${transaction.sessionPrice ? '₹' + transaction.sessionPrice.toFixed(0) : '-'}</td>
                          <td class="text-right">${transaction.foodAmount > 0 ? '₹' + transaction.foodAmount.toFixed(0) : '-'}</td>
                          <td class="text-right">${transaction.discountApplied || '-'}</td>
                          <td class="text-right">${transaction.bonusHoursApplied || '-'}</td>
                          <td class="text-right">${transaction.paymentMethod || '-'}</td>
                          <td class="text-right">${transaction.cashAmount > 0 ? '₹' + transaction.cashAmount.toFixed(0) : '-'}</td>
                          <td class="text-right">${transaction.upiAmount > 0 ? '₹' + transaction.upiAmount.toFixed(0) : '-'}</td>
                          <td class="text-right"><strong style="color: #7c3aed;">₹${transaction.totalAmount.toFixed(0)}</strong></td>
                          <td><span class="status-badge ${statusClass}">${transaction.paymentStatus || 'N/A'}</span></td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>

              <div class="summary">
                <div class="summary-grid">
                  <div class="summary-item">
                    <div class="label">💵 Total Cash</div>
                    <div class="amount">₹${totalCash.toLocaleString()}</div>
                  </div>
                  <div class="summary-item">
                    <div class="label">📱 Total UPI</div>
                    <div class="amount">₹${totalUPI.toLocaleString()}</div>
                  </div>
                  <div class="summary-item">
                    <div class="label">💰 Grand Total</div>
                    <div class="amount">₹${totalRevenue.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div class="footer">
                <strong>Confidential Report</strong><br>
                This report contains ${filteredTransactions.length} transaction(s) for ${getPeriodLabel().toLowerCase()} period
                <div class="powered">Provided by Airavoto Gaming</div>
              </div>
            </div>
          </div>

          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 500);
            };
            window.onafterprint = () => {
              window.close();
            };
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      printWindow.onload = () => {
        printWindow.print();
      };
      
      toast({
        title: "Print dialog opened",
        description: "Use the print dialog to save as PDF.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to open print dialog. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Track revenue, bookings and customer retention</p>
        </div>
      </div>

      <Tabs defaultValue="reports" value={mainTab} onValueChange={setMainTab}>
        <TabsList data-testid="tabs-main" className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
          <TabsTrigger value="reports" data-testid="tab-reports">
            <Calendar className="h-4 w-4 mr-2" />
            Revenue Reports
          </TabsTrigger>
          <TabsTrigger value="retention" data-testid="tab-retention">
            <TrendingUp className="h-4 w-4 mr-2" />
            Customer Retention
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4 mt-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportExcel} data-testid="button-export-excel" size="sm" className="flex-1 sm:flex-none">
              <Download className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Export </span>Excel
            </Button>
            <Button variant="outline" onClick={handleExportPDF} data-testid="button-export-pdf" size="sm" className="flex-1 sm:flex-none">
              <Download className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Export </span>PDF
            </Button>
          </div>

          <Tabs defaultValue="daily" value={selectedPeriod} onValueChange={(value) => {
        setSelectedPeriod(value);
        setStartDate("");
        setEndDate("");
        setSelectedMonth("");
      }}>
        <TabsList data-testid="tabs-period" className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
          <TabsTrigger value="daily" data-testid="tab-daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly" data-testid="tab-weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly" data-testid="tab-monthly">Monthly</TabsTrigger>
        </TabsList>

        {selectedPeriod === "weekly" && (
          <div className="glass-card p-4 rounded-lg mt-4">
            <Label className="text-sm font-semibold mb-3 block">Select Date Range</Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label htmlFor="start-date" className="text-xs text-muted-foreground">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                  data-testid="input-start-date"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="end-date" className="text-xs text-muted-foreground">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                  data-testid="input-end-date"
                />
              </div>
              {startDate && endDate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="self-end"
                  data-testid="button-clear-date-range"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}

        {selectedPeriod === "monthly" && (
          <div className="glass-card p-4 rounded-lg mt-4">
            <Label htmlFor="month-select" className="text-sm font-semibold mb-2 block">
              <Calendar className="inline-block mr-2 h-4 w-4" />
              Select Month & Year
            </Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  id="month-select"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full"
                  placeholder="Choose a month"
                  data-testid="input-select-month"
                />
              </div>
              {selectedMonth && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMonth("")}
                  className="self-start sm:self-center"
                  data-testid="button-clear-month"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}

        <TabsContent value={selectedPeriod} className="space-y-4">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {statsLoading ? (
              <>
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </>
            ) : (
              <>
                <RevenueCard
                  title={`${getPeriodLabel()} Session Revenue`}
                  amount={stats?.totalRevenue || 0}
                  trend={0}
                  icon={<IndianRupee className="h-4 w-4 text-muted-foreground" />}
                />
                <RevenueCard
                  title={`${getPeriodLabel()} Food Revenue`}
                  amount={stats?.totalFoodRevenue || 0}
                  trend={0}
                  icon={<IndianRupee className="h-4 w-4 text-muted-foreground" />}
                />
                <RevenueCard
                  title="Total Sessions"
                  amount={stats?.totalSessions || 0}
                  trend={0}
                  icon={<Users className="h-4 w-4 text-muted-foreground" />}
                  showCurrency={false}
                />
                <RevenueCard
                  title="Avg Session Time"
                  amount={stats?.avgSessionMinutes || 0}
                  trend={0}
                  icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                  showCurrency={false}
                  suffix=" mins"
                />
              </>
            )}
          </div>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            {statsLoading ? (
              <>
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </>
            ) : (
              <>
                <RevenueCard
                  title="Cash Revenue"
                  amount={stats?.cashRevenue || 0}
                  trend={0}
                  icon={<IndianRupee className="h-4 w-4 text-green-600 dark:text-green-400" />}
                />
                <RevenueCard
                  title="UPI/Online Revenue"
                  amount={stats?.upiRevenue || 0}
                  trend={0}
                  icon={<IndianRupee className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                />
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-semibold">Transactions History</h2>
          <div className="flex gap-2 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by customer, seat, payment method..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-transactions"
              />
            </div>
            <ColumnVisibilityToggle
              columns={reportColumns}
              storageKey="reports-visible-columns"
              onVisibilityChange={handleVisibilityChange}
            />
          </div>
        </div>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.includes("date") && <TableHead>Date</TableHead>}
                {visibleColumns.includes("customer") && <TableHead>Customer</TableHead>}
                {visibleColumns.includes("seats") && <TableHead>Seat/Duration</TableHead>}
                {visibleColumns.includes("duration") && <TableHead>Duration</TableHead>}
                {visibleColumns.includes("sessionPrice") && <TableHead className="text-right">Session Price</TableHead>}
                {visibleColumns.includes("foodAmount") && <TableHead className="text-right">Food</TableHead>}
                {visibleColumns.includes("discount") && <TableHead className="text-right">Discount</TableHead>}
                {visibleColumns.includes("bonus") && <TableHead className="text-right">Bonus</TableHead>}
                {visibleColumns.includes("paymentMethod") && <TableHead>Payment Method</TableHead>}
                {visibleColumns.includes("cash") && <TableHead className="text-right">Cash</TableHead>}
                {visibleColumns.includes("upi") && <TableHead className="text-right">UPI</TableHead>}
                {visibleColumns.includes("total") && <TableHead className="text-right">Total</TableHead>}
                {visibleColumns.includes("status") && <TableHead>Status</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyLoading ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ) : filteredTransactions && filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                    {visibleColumns.includes("date") && (
                      <TableCell data-testid={`text-date-${transaction.id}`}>{transaction.date}</TableCell>
                    )}
                    {visibleColumns.includes("customer") && (
                      <TableCell className="font-medium" data-testid={`text-customer-${transaction.id}`}>
                        {transaction.customerName}
                      </TableCell>
                    )}
                    {visibleColumns.includes("seats") && (
                      <TableCell data-testid={`text-seats-${transaction.id}`}>
                        {transaction.seatDetails && transaction.seatDetails.length > 0 ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewSeatsDialog({ open: true, seatDetails: transaction.seatDetails! })}
                            data-testid={`button-view-seats-${transaction.id}`}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View ({transaction.seatDetails.length})
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.includes("duration") && (
                      <TableCell data-testid={`text-duration-${transaction.id}`}>
                        {transaction.duration || <span className="text-muted-foreground text-xs">-</span>}
                      </TableCell>
                    )}
                    {visibleColumns.includes("sessionPrice") && (
                      <TableCell className="text-right" data-testid={`text-session-price-${transaction.id}`}>
                        {transaction.sessionPrice ? `₹${transaction.sessionPrice.toFixed(0)}` : <span className="text-muted-foreground text-xs">-</span>}
                      </TableCell>
                    )}
                    {visibleColumns.includes("foodAmount") && (
                      <TableCell className="text-right" data-testid={`text-food-amount-${transaction.id}`}>
                        {transaction.foodAmount > 0 ? `₹${transaction.foodAmount.toFixed(0)}` : <span className="text-muted-foreground text-xs">-</span>}
                      </TableCell>
                    )}
                    {visibleColumns.includes("discount") && (
                      <TableCell className="text-right" data-testid={`text-discount-${transaction.id}`}>
                        {transaction.discountApplied || <span className="text-muted-foreground text-xs">-</span>}
                      </TableCell>
                    )}
                    {visibleColumns.includes("bonus") && (
                      <TableCell className="text-right" data-testid={`text-bonus-${transaction.id}`}>
                        {transaction.bonusHoursApplied ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewBonusDialog({ open: true, bonusHours: transaction.bonusHoursApplied! })}
                            data-testid={`button-view-bonus-${transaction.id}`}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.includes("paymentMethod") && (
                      <TableCell data-testid={`text-payment-method-${transaction.id}`}>
                        {transaction.paymentMethod ? (
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                            transaction.paymentMethod === 'Cash' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                              : transaction.paymentMethod === 'UPI'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                              : transaction.paymentMethod === 'Split'
                              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                          }`}>
                            {transaction.paymentMethod}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.includes("cash") && (
                      <TableCell className="text-right" data-testid={`text-cash-${transaction.id}`}>
                        {transaction.cashAmount > 0 ? (
                          <span className="text-green-600 dark:text-green-400">₹{transaction.cashAmount.toFixed(0)}</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.includes("upi") && (
                      <TableCell className="text-right" data-testid={`text-upi-${transaction.id}`}>
                        {transaction.upiAmount > 0 ? (
                          <span className="text-blue-600 dark:text-blue-400">₹{transaction.upiAmount.toFixed(0)}</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.includes("total") && (
                      <TableCell className="text-right font-bold" data-testid={`text-total-${transaction.id}`}>
                        ₹{transaction.totalAmount.toFixed(0)}
                      </TableCell>
                    )}
                    {visibleColumns.includes("status") && (
                      <TableCell data-testid={`text-status-${transaction.id}`}>
                        {transaction.paymentStatus ? (
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                            transaction.paymentStatus === 'paid' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                              : transaction.paymentStatus === 'unpaid'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              : transaction.paymentStatus === 'partial'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                          }`}>
                            {transaction.paymentStatus.charAt(0).toUpperCase() + transaction.paymentStatus.slice(1)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length} className="text-center text-muted-foreground">
                    {searchQuery.trim() ? 'No transactions found matching your search' : 'No transactions for this period'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={viewSeatsDialog.open} onOpenChange={(open) => setViewSeatsDialog({ open, seatDetails: [] })}>
        <DialogContent data-testid="dialog-view-seats">
          <DialogHeader>
            <DialogTitle>Seat Duration Details</DialogTitle>
            <DialogDescription>
              View the PC/seat duration breakdown for this booking session
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              {viewSeatsDialog.seatDetails.map((detail, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between px-4 py-3 bg-card border rounded-md"
                  data-testid={`seat-detail-${idx}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-primary/10 text-primary rounded-md font-semibold text-sm">
                      {detail.seat}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">{detail.duration}</span>
                  </div>
                </div>
              ))}
            </div>
            {viewSeatsDialog.seatDetails.length > 1 && (
              <p className="text-sm text-muted-foreground border-t pt-3">
                Total Seats: {viewSeatsDialog.seatDetails.length}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={viewBonusDialog.open} onOpenChange={(open) => setViewBonusDialog({ open, bonusHours: '' })}>
        <DialogContent data-testid="dialog-view-bonus">
          <DialogHeader>
            <DialogTitle>Bonus Free Hours</DialogTitle>
            <DialogDescription>
              Free hours given for this booking session
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="px-6 py-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md font-semibold text-lg">
                {viewBonusDialog.bonusHours}
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              This session received free bonus hours
            </p>
          </div>
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="retention" className="mt-4">
          <RetentionCharts />
        </TabsContent>
      </Tabs>
    </div>
  );
}
