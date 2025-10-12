import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, DollarSign, Calendar as CalendarIcon, Download, FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { queryClient } from "@/lib/queryClient";
import type { Expense } from "@shared/schema";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { getAdjustedTime } from "@/hooks/useServerTime";

const EXPENSE_CATEGORIES = [
  "Equipment Maintenance",
  "Equipment Purchase",
  "Food/Beverage Purchase",
  "Utilities (Electricity)",
  "Utilities (Internet)",
  "Utilities (Water)",
  "Staff Salary",
  "Game Licenses",
  "Marketing",
  "Rent",
  "Repairs",
  "Supplies",
  "Other",
];

export default function Expenses() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState<{ open: boolean; item: Expense | null }>({
    open: false,
    item: null,
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; description: string }>({
    open: false,
    id: "",
    description: "",
  });
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    amount: "",
    date: getAdjustedTime(),
  });

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { category: string; description: string; amount: string; date: Date }) => {
      const response = await fetch("/api/expenses", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to create expense");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Expense Added", description: "Expense has been recorded successfully" });
      setAddDialog(false);
      setFormData({ category: "", description: "", amount: "", date: getAdjustedTime() });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { category: string; description: string; amount: string; date: Date } }) => {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to update expense");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Expense Updated", description: "Expense has been updated successfully" });
      setEditDialog({ open: false, item: null });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete expense");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Expense Deleted", description: "Expense has been removed", variant: "destructive" });
      setDeleteDialog({ open: false, id: "", description: "" });
    },
  });

  const handleAdd = () => {
    if (!formData.category || !formData.description || !formData.amount || !formData.date) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Error", description: "Please enter a valid positive amount", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = () => {
    if (!editDialog.item) return;
    if (!formData.category || !formData.description || !formData.amount || !formData.date) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Error", description: "Please enter a valid positive amount", variant: "destructive" });
      return;
    }
    updateMutation.mutate({ id: editDialog.item.id, data: formData });
  };

  const openEditDialog = (item: Expense) => {
    setFormData({
      category: item.category,
      description: item.description,
      amount: item.amount,
      date: new Date(item.date),
    });
    setEditDialog({ open: true, item });
  };

  const openDeleteDialog = (id: string, description: string) => {
    setDeleteDialog({ open: true, id, description });
  };

  const handleExportExcel = () => {
    if (!expenses || expenses.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no expenses to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      const headers = ["Date", "Category", "Description", "Amount (₹)"];
      const csvContent = [
        headers.join(","),
        ...sortedExpenses.map(expense => [
          format(new Date(expense.date), "MMM dd, yyyy"),
          expense.category,
          `"${expense.description.replace(/"/g, '""')}"`, // Escape quotes in description
          parseFloat(expense.amount).toFixed(2)
        ].join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `expenses_${getAdjustedTime().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export successful",
        description: "Excel file has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export Excel file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = () => {
    if (!expenses || expenses.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no expenses to export.",
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

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Expense Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; margin-bottom: 10px; }
            .summary { margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 8px; }
            .summary h3 { margin: 0 0 10px 0; font-size: 14px; color: #666; }
            .summary .value { font-size: 24px; font-weight: bold; color: #dc2626; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .text-right { text-align: right; }
            .category-badge { 
              display: inline-block; 
              padding: 4px 8px; 
              background-color: #e0e7ff; 
              border-radius: 9999px; 
              font-size: 12px;
            }
            @media print {
              body { padding: 10px; }
            }
          </style>
        </head>
        <body>
          <h1>Expense Report</h1>
          <p>Generated on ${getAdjustedTime().toLocaleDateString()}</p>
          <div class="summary">
            <h3>Total Expenses</h3>
            <div class="value">₹${totalExpenses.toFixed(2)}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${sortedExpenses.map(expense => `
                <tr>
                  <td>${format(new Date(expense.date), "MMM dd, yyyy")}</td>
                  <td><span class="category-badge">${expense.category}</span></td>
                  <td>${expense.description}</td>
                  <td class="text-right">₹${parseFloat(expense.amount).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      printWindow.onload = () => {
        printWindow.print();
        setTimeout(() => {
          printWindow.close();
        }, 100);
      };

      toast({
        title: "PDF export ready",
        description: "Print dialog opened. Save as PDF to download.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => {
    const amount = parseFloat(expense.amount);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Expense Tracker</h1>
        <p className="text-muted-foreground">Loading expenses...</p>
      </div>
    );
  }

  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Expense Tracker</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Track and manage operational expenses</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleExportExcel} 
              data-testid="button-export-excel"
              size="sm"
              className="flex-1 sm:flex-none"
            >
              <FileSpreadsheet className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Export </span>Excel
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportPDF} 
              data-testid="button-export-pdf"
              size="sm"
              className="flex-1 sm:flex-none"
            >
              <FileText className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Export </span>PDF
            </Button>
          </div>
          <Button onClick={() => setAddDialog(true)} data-testid="button-add-expense" className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

      <div className="glass-card rounded-lg p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold text-foreground" data-testid="text-total-expenses">
              ₹{totalExpenses.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr className="text-left">
                <th className="p-4 font-semibold text-muted-foreground">Date</th>
                <th className="p-4 font-semibold text-muted-foreground">Category</th>
                <th className="p-4 font-semibold text-muted-foreground">Description</th>
                <th className="p-4 font-semibold text-muted-foreground">Amount</th>
                <th className="p-4 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No expenses recorded yet. Click "Add Expense" to get started.
                  </td>
                </tr>
              ) : (
                sortedExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                    data-testid={`row-expense-${expense.id}`}
                  >
                    <td className="p-4" data-testid={`text-expense-date-${expense.id}`}>
                      {format(new Date(expense.date), "MMM dd, yyyy")}
                    </td>
                    <td className="p-4">
                      <span
                        className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                        data-testid={`text-expense-category-${expense.id}`}
                      >
                        {expense.category}
                      </span>
                    </td>
                    <td className="p-4 text-foreground" data-testid={`text-expense-description-${expense.id}`}>
                      {expense.description}
                    </td>
                    <td className="p-4 font-bold text-destructive" data-testid={`text-expense-amount-${expense.id}`}>
                      ₹{parseFloat(expense.amount).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(expense)}
                          data-testid={`button-edit-expense-${expense.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(expense.id, expense.description)}
                          data-testid={`button-delete-expense-${expense.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent data-testid="dialog-add-expense">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>Record a new business expense</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="add-category" data-testid="select-add-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-description">Description</Label>
              <Textarea
                id="add-description"
                data-testid="input-add-description"
                placeholder="What was this expense for?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-amount">Amount (₹)</Label>
              <Input
                id="add-amount"
                data-testid="input-add-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    data-testid="button-add-date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => date && setFormData({ ...formData, date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)} data-testid="button-cancel-add">
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={createMutation.isPending} data-testid="button-confirm-add">
              {createMutation.isPending ? "Adding..." : "Add Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, item: null })}>
        <DialogContent data-testid="dialog-edit-expense">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Update expense details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="edit-category" data-testid="select-edit-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                data-testid="input-edit-description"
                placeholder="What was this expense for?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount (₹)</Label>
              <Input
                id="edit-amount"
                data-testid="input-edit-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    data-testid="button-edit-date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => date && setFormData({ ...formData, date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, item: null })} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending} data-testid="button-confirm-edit">
              {updateMutation.isPending ? "Updating..." : "Update Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, id: "", description: "" })}>
        <DialogContent data-testid="dialog-delete-expense">
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.description}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, id: "", description: "" })} data-testid="button-cancel-delete">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate(deleteDialog.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
