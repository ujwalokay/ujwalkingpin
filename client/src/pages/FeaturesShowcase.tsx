import { Monitor, Calendar, ShoppingCart, DollarSign, BarChart3, Award, Settings, Smartphone, MessageSquare, Lock, Users, Bell, Gamepad2, Clock, TrendingUp, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FeaturesShowcase() {
  const coreFeatures = [
    {
      icon: <Monitor className="w-12 h-12 text-cyan-500" />,
      title: "Real-time Session Management",
      description: "Track gaming sessions live across PC, PS5, VR, and car simulators with countdown timers and automatic status updates.",
      features: [
        "Live session tracking",
        "Visual countdown timers",
        "Audio/visual alerts",
        "Pause & resume sessions",
        "Multi-device support"
      ],
      color: "from-cyan-500 to-blue-600"
    },
    {
      icon: <Calendar className="w-12 h-12 text-purple-500" />,
      title: "Booking Management",
      description: "Handle walk-in and advance bookings with smart conflict detection and instant seat allocation.",
      features: [
        "Walk-in bookings",
        "Advance reservations",
        "Conflict prevention",
        "Bulk operations",
        "Customer tracking"
      ],
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: <ShoppingCart className="w-12 h-12 text-green-500" />,
      title: "Food & Inventory",
      description: "Manage food and beverage sales with dynamic pricing and real-time order tracking.",
      features: [
        "Item catalog management",
        "Add orders to bookings",
        "Quantity tracking",
        "Price configuration",
        "Revenue analytics"
      ],
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: <DollarSign className="w-12 h-12 text-yellow-500" />,
      title: "Financial Management",
      description: "Comprehensive expense tracking with category-wise reporting and export capabilities.",
      features: [
        "Expense categorization",
        "CSV/PDF exports",
        "Monthly summaries",
        "Revenue tracking",
        "Financial reports"
      ],
      color: "from-yellow-500 to-orange-600"
    }
  ];

  const advancedFeatures = [
    {
      icon: <BarChart3 className="w-12 h-12 text-blue-500" />,
      title: "Analytics & Reporting",
      description: "Powerful analytics dashboard with real-time insights and interactive visualizations.",
      features: [
        "Occupancy monitoring",
        "Revenue analysis",
        "Customer insights",
        "Hourly patterns",
        "Interactive charts"
      ],
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: <Award className="w-12 h-12 text-amber-500" />,
      title: "Loyalty Program",
      description: "Customer loyalty system with tier-based rewards and automatic point accumulation.",
      features: [
        "4 tier system (Bronze-Platinum)",
        "Points per spend",
        "Auto tier upgrades",
        "Redemption tracking",
        "Member analytics"
      ],
      color: "from-amber-500 to-yellow-600"
    },
    {
      icon: <Settings className="w-12 h-12 text-gray-500" />,
      title: "Device Configuration",
      description: "Flexible device and pricing management with custom seat naming and duration-based pricing.",
      features: [
        "Dynamic categories",
        "Custom seat names",
        "Flexible pricing rules",
        "Real-time updates",
        "Capacity management"
      ],
      color: "from-gray-500 to-slate-600"
    },
    {
      icon: <Gamepad2 className="w-12 h-12 text-red-500" />,
      title: "Game Updates",
      description: "Track and display latest game updates, patches, and events for your customers.",
      features: [
        "Update announcements",
        "Event tracking",
        "Image support",
        "Source linking",
        "Publication dates"
      ],
      color: "from-red-500 to-rose-600"
    }
  ];

  const customerFeatures = [
    {
      icon: <Smartphone className="w-12 h-12 text-teal-500" />,
      title: "Public Status Board",
      description: "Customer-facing display showing real-time device availability without authentication.",
      features: [
        "Real-time availability",
        "Auto-refresh (10s)",
        "No login required",
        "Large display format",
        "Visual indicators"
      ],
      color: "from-teal-500 to-cyan-600"
    },
    {
      icon: <MessageSquare className="w-12 h-12 text-lime-500" />,
      title: "WhatsApp Bot",
      description: "24/7 automated customer service via WhatsApp for availability queries.",
      features: [
        "Twilio integration",
        "Auto responses",
        "Real-time data",
        "24/7 availability",
        "Webhook processing"
      ],
      color: "from-lime-500 to-green-600"
    }
  ];

  const securityFeatures = [
    {
      icon: <Lock className="w-12 h-12 text-indigo-500" />,
      title: "Security & Access Control",
      description: "Multi-layer security with role-based access and device restrictions.",
      features: [
        "Bcrypt encryption",
        "Session management",
        "Rate limiting",
        "XSS protection",
        "SQL injection prevention"
      ],
      color: "from-indigo-500 to-purple-600"
    },
    {
      icon: <Users className="w-12 h-12 text-violet-500" />,
      title: "Device-Based Access",
      description: "Smart access control based on device type for enhanced security.",
      features: [
        "PC: Full access",
        "Mobile/Tablet: View-only",
        "Auto detection",
        "Visual alerts",
        "Optimized UX"
      ],
      color: "from-violet-500 to-fuchsia-600"
    },
    {
      icon: <Bell className="w-12 h-12 text-pink-500" />,
      title: "Activity Logging",
      description: "Complete audit trail of all user actions and system events.",
      features: [
        "Action tracking",
        "User attribution",
        "Timestamp logs",
        "Entity logging",
        "Accountability"
      ],
      color: "from-pink-500 to-rose-600"
    }
  ];

  const techHighlights = [
    { icon: <Zap className="w-6 h-6" />, label: "React + TypeScript", desc: "Modern frontend" },
    { icon: <TrendingUp className="w-6 h-6" />, label: "Real-time Updates", desc: "Live data sync" },
    { icon: <Clock className="w-6 h-6" />, label: "Session Timers", desc: "Countdown tracking" },
    { icon: <Lock className="w-6 h-6" />, label: "Secure Auth", desc: "Role-based access" }
  ];

  const FeatureCard = ({ feature }: { feature: any }) => (
    <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-cyan-500/50 overflow-hidden" data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className={`h-2 bg-gradient-to-r ${feature.color}`}></div>
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg bg-gradient-to-br ${feature.color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
            {feature.icon}
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
            <CardDescription className="text-base">{feature.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {feature.features.map((item: string, idx: number) => (
            <li key={idx} className="flex items-center gap-2 text-sm">
              <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${feature.color}`}></div>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-cyan-950/10">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 blur-3xl"></div>
        <div className="container mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4 bg-cyan-500/20 text-cyan-300 border-cyan-500/50" data-testid="badge-version">
              v1.0 - Full Feature Documentation
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Ankylo Gaming POS
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Complete Gaming Center Management System
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real-time session tracking, booking management, inventory control, financial tracking, 
              loyalty programs, and automated customer service - all in one powerful platform.
            </p>
          </div>

          {/* Tech Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
            {techHighlights.map((tech, idx) => (
              <div key={idx} className="text-center p-4 rounded-lg bg-card border border-border hover:border-cyan-500/50 transition-all" data-testid={`tech-${tech.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 mb-3">
                  {tech.icon}
                </div>
                <h3 className="font-semibold mb-1">{tech.label}</h3>
                <p className="text-sm text-muted-foreground">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Tabs */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <Tabs defaultValue="core" className="w-full">
            <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-4 mb-12" data-testid="tabs-features">
              <TabsTrigger value="core" data-testid="tab-core">Core Features</TabsTrigger>
              <TabsTrigger value="advanced" data-testid="tab-advanced">Advanced</TabsTrigger>
              <TabsTrigger value="customer" data-testid="tab-customer">Customer</TabsTrigger>
              <TabsTrigger value="security" data-testid="tab-security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="core" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-3">Core Features</h2>
                <p className="text-muted-foreground">Essential tools for daily gaming center operations</p>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {coreFeatures.map((feature, idx) => (
                  <FeatureCard key={idx} feature={feature} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-3">Advanced Features</h2>
                <p className="text-muted-foreground">Powerful tools for business growth and insights</p>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {advancedFeatures.map((feature, idx) => (
                  <FeatureCard key={idx} feature={feature} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="customer" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-3">Customer-Facing Features</h2>
                <p className="text-muted-foreground">Enhance customer experience and satisfaction</p>
              </div>
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {customerFeatures.map((feature, idx) => (
                  <FeatureCard key={idx} feature={feature} />
                ))}
              </div>

              {/* Consumer Website Preview */}
              <div className="mt-12 p-8 rounded-xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30">
                <h3 className="text-2xl font-bold mb-4">Consumer Website Included</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-card border">
                    <h4 className="font-semibold mb-2">🏠 Home Page</h4>
                    <p className="text-sm text-muted-foreground">Gaming center information and details</p>
                  </div>
                  <div className="p-4 rounded-lg bg-card border">
                    <h4 className="font-semibold mb-2">🖼️ Gallery</h4>
                    <p className="text-sm text-muted-foreground">Photo showcase of your facility</p>
                  </div>
                  <div className="p-4 rounded-lg bg-card border">
                    <h4 className="font-semibold mb-2">🎮 Games Catalog</h4>
                    <p className="text-sm text-muted-foreground">Display available games</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-3">Security & Access Control</h2>
                <p className="text-muted-foreground">Enterprise-grade security and audit capabilities</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {securityFeatures.map((feature, idx) => (
                  <FeatureCard key={idx} feature={feature} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-cyan-950/20 to-purple-950/20">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Built With Modern Technology</h2>
            <p className="text-muted-foreground">Cutting-edge stack for reliability and performance</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card data-testid="card-frontend-stack">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-500" />
                  Frontend Stack
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✓ React 18+ with TypeScript</li>
                  <li>✓ Vite for lightning-fast builds</li>
                  <li>✓ TanStack React Query</li>
                  <li>✓ Radix UI & shadcn/ui components</li>
                  <li>✓ Tailwind CSS with dark mode</li>
                  <li>✓ React Hook Form + Zod</li>
                </ul>
              </CardContent>
            </Card>

            <Card data-testid="card-backend-stack">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-500" />
                  Backend Stack
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✓ Express.js with TypeScript</li>
                  <li>✓ PostgreSQL via Neon</li>
                  <li>✓ Drizzle ORM (type-safe)</li>
                  <li>✓ Bcrypt password hashing</li>
                  <li>✓ RESTful API design</li>
                  <li>✓ Express-session auth</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Database Schema */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Comprehensive Database Schema</h2>
            <p className="text-muted-foreground">16 tables covering all aspects of gaming center operations</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { name: "Bookings", icon: "📅" },
              { name: "Booking History", icon: "📚" },
              { name: "Users", icon: "👤" },
              { name: "Device Configs", icon: "🖥️" },
              { name: "Pricing Configs", icon: "💰" },
              { name: "Food Items", icon: "🍔" },
              { name: "Expenses", icon: "💳" },
              { name: "Activity Logs", icon: "📝" },
              { name: "Loyalty Members", icon: "⭐" },
              { name: "Loyalty Events", icon: "🎁" },
              { name: "Loyalty Config", icon: "⚙️" },
              { name: "Game Updates", icon: "🎮" },
              { name: "Gaming Center Info", icon: "ℹ️" },
              { name: "Gallery Images", icon: "🖼️" },
              { name: "Facilities", icon: "🏢" },
              { name: "Games", icon: "🕹️" }
            ].map((table, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-card border hover:border-cyan-500/50 transition-all text-center" data-testid={`table-${table.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="text-3xl mb-2">{table.icon}</div>
                <div className="text-sm font-medium">{table.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-16 px-4 bg-gradient-to-br from-purple-950/20 to-pink-950/20">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Why Choose Ankylo Gaming POS?</h2>
            <p className="text-muted-foreground">Transform your gaming center with powerful features</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: "Streamlined Operations", desc: "Centralized management of all activities", icon: "⚡" },
              { title: "Real-time Monitoring", desc: "Live tracking of sessions and availability", icon: "📊" },
              { title: "Financial Control", desc: "Comprehensive expense and revenue tracking", icon: "💰" },
              { title: "Customer Satisfaction", desc: "Automated bot and public status board", icon: "😊" },
              { title: "Data-Driven Decisions", desc: "Analytics and reporting for insights", icon: "📈" },
              { title: "Scalability", desc: "Flexible device and pricing configuration", icon: "🚀" },
              { title: "Enterprise Security", desc: "Role-based access and restrictions", icon: "🔒" },
              { title: "Type Safety", desc: "Full-stack TypeScript reliability", icon: "✅" }
            ].map((benefit, idx) => (
              <div key={idx} className="flex gap-4 p-4 rounded-lg bg-card border hover:border-purple-500/50 transition-all" data-testid={`benefit-${benefit.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="text-3xl">{benefit.icon}</div>
                <div>
                  <h3 className="font-semibold mb-1">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="inline-block p-8 rounded-xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-cyan-500/30">
            <h3 className="text-2xl font-bold mb-2">Ready to Transform Your Gaming Center?</h3>
            <p className="text-muted-foreground mb-4">Complete POS solution built for modern gaming centers</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Badge variant="outline" className="px-4 py-2 text-base">React + TypeScript</Badge>
              <Badge variant="outline" className="px-4 py-2 text-base">PostgreSQL</Badge>
              <Badge variant="outline" className="px-4 py-2 text-base">Real-time Updates</Badge>
              <Badge variant="outline" className="px-4 py-2 text-base">Full Stack</Badge>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
