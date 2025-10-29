import { storage } from "./storage";
import type { InsertNotification } from "@shared/schema";

export async function notifyBookingCreated(bookingId: string, seatName: string, customerName: string) {
  try {
    await storage.createNotification({
      type: "booking",
      title: "New Booking Created",
      message: `${customerName} has booked ${seatName}`,
      entityType: "booking",
      entityId: bookingId,
      isRead: 0,
    });
  } catch (error) {
    console.error("Failed to create booking notification:", error);
  }
}

export async function notifyActivityLog(activityLogId: string, username: string, action: string, entityType?: string) {
  try {
    const actionMessages: Record<string, string> = {
      create: "created",
      update: "updated",
      delete: "deleted",
      login: "logged in",
    };

    const actionMessage = actionMessages[action] || action;
    const message = entityType 
      ? `${username} ${actionMessage} a ${entityType}` 
      : `${username} ${actionMessage}`;

    await storage.createNotification({
      type: "activity",
      title: "Activity Logged",
      message,
      entityType: "activity_log",
      entityId: activityLogId,
      activityLogId,
      isRead: 0,
    });
  } catch (error) {
    console.error("Failed to create activity log notification:", error);
  }
}

export async function notifyLowInventory(foodItemId: string, foodName: string, currentStock: number, minStockLevel: number) {
  try {
    await storage.createNotification({
      type: "inventory",
      title: "Low Inventory Alert",
      message: `${foodName} is running low (${currentStock}/${minStockLevel} units remaining)`,
      entityType: "food_item",
      entityId: foodItemId,
      isRead: 0,
    });
  } catch (error) {
    console.error("Failed to create inventory notification:", error);
  }
}

export async function notifyExpenseAdded(expenseId: string, category: string, amount: string) {
  try {
    await storage.createNotification({
      type: "expense",
      title: "New Expense Added",
      message: `${category} expense of ₹${amount} has been recorded`,
      entityType: "expense",
      entityId: expenseId,
      isRead: 0,
    });
  } catch (error) {
    console.error("Failed to create expense notification:", error);
  }
}

export async function notifyPaymentReceived(bookingId: string, seatName: string, amount: string, paymentMethod: string) {
  try {
    await storage.createNotification({
      type: "payment",
      title: "Payment Received",
      message: `Payment of ₹${amount} received for ${seatName} via ${paymentMethod}`,
      entityType: "booking",
      entityId: bookingId,
      isRead: 0,
    });
  } catch (error) {
    console.error("Failed to create payment notification:", error);
  }
}

export async function notifySessionEnding(bookingId: string, seatName: string, customerName: string, minutesRemaining: number) {
  try {
    await storage.createNotification({
      type: "alert",
      title: "Session Ending Soon",
      message: `${customerName}'s session on ${seatName} ends in ${minutesRemaining} minutes`,
      entityType: "booking",
      entityId: bookingId,
      isRead: 0,
    });
  } catch (error) {
    console.error("Failed to create session ending notification:", error);
  }
}

export async function notifySessionExpired(bookingId: string, seatName: string, customerName: string) {
  try {
    await storage.createNotification({
      type: "alert",
      title: "⏰ Session Timer Expired",
      message: `${customerName}'s session on ${seatName} has ended - timer expired`,
      entityType: "booking",
      entityId: bookingId,
      isRead: 0,
    });
  } catch (error) {
    console.error("Failed to create session expired notification:", error);
  }
}

export async function notifySessionCompleted(bookingId: string, seatName: string, customerName: string) {
  try {
    await storage.createNotification({
      type: "alert",
      title: "✅ Session Completed",
      message: `${customerName}'s session on ${seatName} has been completed`,
      entityType: "booking",
      entityId: bookingId,
      isRead: 0,
    });
  } catch (error) {
    console.error("Failed to create session completed notification:", error);
  }
}

export async function notifyCustomNotification(notification: Omit<InsertNotification, "isRead">) {
  try {
    await storage.createNotification({
      ...notification,
      isRead: 0,
    });
  } catch (error) {
    console.error("Failed to create custom notification:", error);
  }
}
