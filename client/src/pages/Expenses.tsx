import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, DollarSign, Calendar as CalendarIcon } from "lucide-react";
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
    date: new Date(),
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
      setFormData({ category: "", description: "", amount: "", date: new Date() });
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
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Expense Tracker</h1>
          <p className="text-muted-foreground">Track and manage operational expenses</p>
        </div>
        <Button onClick={() => setAddDialog(true)} data-testid="button-add-expense">
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      <div className="glass-card rounded-lg p-6">
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
