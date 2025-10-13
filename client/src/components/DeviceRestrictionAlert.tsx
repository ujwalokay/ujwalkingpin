import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Monitor, AlertTriangle } from "lucide-react";

interface DeviceRestrictionAlertProps {
  show: boolean;
  userRole?: string;
}

export function DeviceRestrictionAlert({ show, userRole = "admin/staff" }: DeviceRestrictionAlertProps) {
  if (!show) return null;

  return (
    <Alert className="mb-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20" data-testid="alert-device-restriction">
      <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      <AlertTitle className="text-orange-800 dark:text-orange-200">
        Desktop Access Required
      </AlertTitle>
      <AlertDescription className="text-orange-700 dark:text-orange-300">
        You are viewing this page from a mobile or tablet device. As a {userRole} user, you can only make changes from a desktop/PC. 
        All editing features are disabled on this device for security and usability reasons.
      </AlertDescription>
    </Alert>
  );
}
