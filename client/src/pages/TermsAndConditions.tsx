import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Instagram, Linkedin, Github, Twitter, Mail } from "lucide-react";

export default function TermsAndConditions() {
  return (
    <div className="container mx-auto max-w-4xl" data-testid="page-terms">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Terms and Conditions</CardTitle>
          <CardDescription>
            Effective Date: October 27, 2025
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-3">1. Introduction and Acceptance</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Welcome to Airavoto Gaming Center. By using our gaming facilities, booking services, or participating in any activities at our center, you agree to comply with and be bound by these Terms and Conditions. This document governs your use of our gaming center services, including PC gaming, PlayStation 5, VR experiences, car simulators, food and beverage services, loyalty programs, and tournament participation.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-3">2. Service Description</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Airavoto Gaming Center provides the following services:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>Gaming Stations:</strong> Access to various gaming devices including PCs, PlayStation 5 consoles, VR headsets, and car racing simulators</li>
                  <li><strong>Booking System:</strong> Walk-in and advance booking options with flexible session durations</li>
                  <li><strong>Food & Beverage:</strong> In-house food and drink ordering during gaming sessions</li>
                  <li><strong>Loyalty Program:</strong> Earn 1 point for every ₹1 spent and redeem rewards</li>
                  <li><strong>Tournament Participation:</strong> Organized gaming competitions with prize pools</li>
                  <li><strong>WhatsApp Notifications:</strong> Real-time availability updates and booking confirmations</li>
                  <li><strong>Happy Hours:</strong> Special pricing during designated time periods</li>
                </ul>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-3">3. Booking and Reservations</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>3.1 Walk-in Bookings:</strong> Available on a first-come, first-served basis subject to availability of gaming stations.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>3.2 Advance Bookings:</strong> Customers may book gaming sessions in advance. Advanced bookings are confirmed upon availability verification and require customer contact information (name and WhatsApp number).
                </p>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>3.3 Booking Modifications:</strong> Session times may be paused, resumed, or extended based on availability and pricing policies. Extensions are charged according to the current pricing tier.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>3.4 No-Shows:</strong> Customers who fail to arrive within 15 minutes of their scheduled booking time may forfeit their reservation without refund.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-3">4. Pricing and Payment</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>4.1 Pricing Structure:</strong> Gaming sessions are priced based on device type, duration, and number of persons (for applicable categories like PlayStation 5). Prices are displayed in Indian Rupees (₹).
                </p>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>4.2 Happy Hours:</strong> Special discounted rates apply during designated happy hour time slots. Happy hour pricing is subject to change and availability.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>4.3 Payment Methods:</strong> We accept Cash, UPI, Card, and Online payment methods. Full payment is required at the completion of the gaming session.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>4.4 Additional Charges:</strong> Food and beverage orders are charged separately and added to your final bill.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>4.5 Refund Policy:</strong> Refunds are not provided for partially used sessions. In case of technical issues with equipment that prevent gameplay, appropriate credits or refunds will be issued at management's discretion.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-3">5. Customer Loyalty Program</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>5.1 Points Earning:</strong> Customers automatically earn 1 loyalty point for every ₹1 spent on gaming sessions and food orders. Points are credited when bookings are marked as completed or expired.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>5.2 Points Redemption:</strong> Accumulated points can be redeemed for rewards from our rewards catalog. Minimum point requirements apply per reward.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>5.3 Points Validity:</strong> Loyalty points do not expire but are tied to your WhatsApp number. Customers are responsible for maintaining accurate contact information.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>5.4 Program Modifications:</strong> We reserve the right to modify or discontinue the loyalty program at any time. Existing points will be honored for a reasonable transition period.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-3">6. Food and Beverage Services</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>6.1 Ordering:</strong> Food and beverages can be ordered during gaming sessions through our staff. Items are subject to availability based on current inventory levels.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>6.2 Outside Food:</strong> Outside food and beverages are not permitted inside the gaming center.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>6.3 Allergies and Dietary Restrictions:</strong> Customers must inform staff of any food allergies or dietary restrictions when ordering. We cannot guarantee a completely allergen-free environment.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-3">7. Tournament Participation</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>7.1 Registration:</strong> Tournament registration is open to all customers on a first-come, first-served basis until maximum participant capacity is reached.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>7.2 Rules and Conduct:</strong> Participants must adhere to specific tournament rules, game settings, and codes of conduct as announced by tournament organizers. Violation may result in disqualification.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>7.3 Prize Distribution:</strong> Prizes are awarded based on final standings as determined by tournament organizers. Prize pool amounts are announced prior to tournament start.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>7.4 Cancellation:</strong> Management reserves the right to cancel or reschedule tournaments due to insufficient participation or unforeseen circumstances. Registered participants will be notified via WhatsApp.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-3">8. Equipment Usage and Conduct</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>8.1 Responsible Use:</strong> Customers must use all gaming equipment with care and follow staff instructions. Any damage caused by misuse, negligence, or intentional actions will be charged to the customer.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>8.2 Prohibited Activities:</strong> The following activities are strictly prohibited:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Installing unauthorized software or games</li>
                  <li>Accessing inappropriate or illegal content</li>
                  <li>Tampering with system settings or hardware</li>
                  <li>Sharing gaming stations without staff authorization</li>
                  <li>Engaging in disruptive behavior or harassment</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  <strong>8.3 Code of Conduct:</strong> Customers must maintain respectful behavior toward staff and other customers. We reserve the right to terminate sessions and ban individuals for misconduct without refund.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-3">9. Data Privacy and WhatsApp Communications</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>9.1 Data Collection:</strong> We collect customer information including name, WhatsApp number, booking history, spending records, and loyalty points for service delivery and business operations.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>9.2 WhatsApp Notifications:</strong> By providing your WhatsApp number, you consent to receive automated messages regarding booking confirmations, availability updates, tournament notifications, and promotional offers.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>9.3 Data Security:</strong> We implement reasonable security measures to protect customer data. However, we cannot guarantee absolute security against unauthorized access.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>9.4 Data Retention:</strong> Customer data is retained according to our data retention policies. Booking history is retained for 2 years, and expense records for 7 years, after which data is automatically purged from our systems.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-3">10. System Availability and Technical Issues</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>10.1 Service Availability:</strong> We strive to maintain operational gaming equipment at all times, but cannot guarantee 100% uptime. Scheduled maintenance may result in temporary unavailability of specific devices.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>10.2 Technical Support:</strong> Staff will provide reasonable technical assistance for gaming-related issues. However, we are not responsible for game-specific bugs or third-party service outages (e.g., Steam, PlayStation Network).
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>10.3 Equipment Failure:</strong> In case of equipment malfunction during a paid session, customers will be offered alternative equipment or session credits at our discretion.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-3">11. Age Restrictions and Parental Consent</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>11.1 Minimum Age:</strong> Customers under 13 years of age must be accompanied by a parent or legal guardian at all times.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>11.2 Age-Restricted Content:</strong> Access to games rated for mature audiences (18+) requires valid age verification. Parents are responsible for monitoring content accessed by minors.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>11.3 Parental Responsibility:</strong> Parents/guardians are liable for any damages or violations caused by minors under their supervision.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-3">12. Liability and Disclaimers</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>12.1 Service "As Is":</strong> Our services are provided on an "as is" basis. We make no warranties regarding uninterrupted service, specific game availability, or fitness for particular purposes.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>12.2 Personal Property:</strong> Airavoto Gaming Center is not responsible for loss, theft, or damage to personal belongings. Customers should secure their valuables.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>12.3 Health and Safety:</strong> Customers with medical conditions (epilepsy, motion sickness, etc.) should consult healthcare providers before using VR or gaming equipment. We are not liable for health issues arising from equipment use.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>12.4 Limitation of Liability:</strong> Our total liability for any claims arising from services shall not exceed the amount paid by the customer for the specific session in question.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-3">13. Intellectual Property</h2>
                <p className="text-muted-foreground leading-relaxed">
                  All games, software, and content available at our facility are licensed for use on our premises only. Customers may not copy, distribute, or reproduce any proprietary content. All trademarks and copyrights belong to their respective owners.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-3">14. Modifications to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to modify these Terms and Conditions at any time. Updated terms will be posted at our facility and on our systems. Continued use of our services after modifications constitutes acceptance of the revised terms.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-3">15. Governing Law and Dispute Resolution</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  <strong>15.1 Jurisdiction:</strong> These Terms and Conditions are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in [Your City], India.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>15.2 Dispute Resolution:</strong> In the event of any dispute, customers are encouraged to first contact management for amicable resolution before pursuing legal action.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-3">16. Contact Information</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  For questions, concerns, or support regarding these Terms and Conditions, please contact:
                </p>
                <div className="ml-4 text-muted-foreground space-y-1">
                  <p><strong>Airavoto Gaming Center</strong></p>
                  <p>Email: support@airavotogaming.com</p>
                  <p>Phone: Available through our staff panel</p>
                  <p>Address: As listed in gaming center information</p>
                </div>
              </section>

              <div className="mt-8 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  By using Airavoto Gaming Center services, booking gaming sessions, participating in tournaments, or enrolling in our loyalty program, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions effective October 27, 2025.
                </p>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      <footer className="mt-8 py-6 border-t">
        <div className="flex flex-col items-center gap-4">
          <p className="text-lg font-semibold text-foreground">
            Created by <span className="text-primary">Airavoto Gaming</span>
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              asChild
              data-testid="link-instagram"
            >
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              asChild
              data-testid="link-linkedin"
            >
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              asChild
              data-testid="link-github"
            >
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              asChild
              data-testid="link-twitter"
            >
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              asChild
              data-testid="link-email"
            >
              <a
                href="mailto:ujwal@example.com"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
