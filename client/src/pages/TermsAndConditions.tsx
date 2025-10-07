import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function TermsAndConditions() {
  return (
    <div className="container mx-auto max-w-4xl" data-testid="page-terms">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Terms and Conditions</CardTitle>
          <CardDescription>
            Last updated: {new Date().toLocaleDateString('en-IN', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing and using this Gaming Center Admin Panel, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use this service.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-3">2. Use of Service</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  This admin panel is designed for authorized personnel only. You agree to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Use the service only for legitimate business purposes</li>
                  <li>Maintain the confidentiality of your login credentials</li>
                  <li>Not share your access with unauthorized individuals</li>
                  <li>Report any security breaches or unauthorized access immediately</li>
                </ul>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-3">3. Booking Management</h2>
                <p className="text-muted-foreground leading-relaxed">
                  When managing bookings through this system, you are responsible for ensuring accurate information, proper time tracking, and correct pricing. Any discrepancies should be reported and corrected promptly.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-3">4. Payment and Pricing</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  All pricing and payment information entered into the system must be accurate. Users agree to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Verify all pricing before confirming bookings</li>
                  <li>Process payments according to company policies</li>
                  <li>Maintain proper records of all transactions</li>
                  <li>Handle customer payment information securely</li>
                </ul>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-3">5. Data Privacy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Customer information collected through this system is confidential. You must not disclose, share, or use customer data for any purpose other than providing the gaming center services. All data handling must comply with applicable privacy laws and regulations.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-3">6. System Availability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  While we strive to ensure continuous availability of the admin panel, we do not guarantee uninterrupted service. The system may be temporarily unavailable due to maintenance, updates, or unforeseen technical issues.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-3">7. Modifications to Service</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to modify, suspend, or discontinue any aspect of the service at any time without prior notice. We may also update these terms and conditions periodically, and continued use of the service constitutes acceptance of such changes.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-3">8. Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  The service is provided "as is" without warranties of any kind. We shall not be liable for any damages arising from the use or inability to use the service, including but not limited to data loss, revenue loss, or business interruption.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-3">9. User Responsibilities</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  As an authorized user, you are responsible for:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Maintaining accurate booking records</li>
                  <li>Properly managing customer sessions and timers</li>
                  <li>Ensuring food orders are recorded correctly</li>
                  <li>Managing device configurations appropriately</li>
                  <li>Following company policies and procedures</li>
                </ul>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-3">10. Termination</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to terminate or suspend access to the admin panel at any time, without notice, for conduct that we believe violates these terms or is harmful to other users, us, or third parties, or for any other reason.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-3">11. Contact Information</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about these Terms and Conditions, please contact your system administrator or management team.
                </p>
              </section>

              <div className="mt-8 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  By using this Gaming Center Admin Panel, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
                </p>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
