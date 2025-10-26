import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Percent, Gift, Clock, TrendingDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PromotionUsageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  whatsappNumber: string;
  customerName: string;
}

interface PromotionSummary {
  discountCount: number;
  bonusCount: number;
  totalSavings: number;
  totalBonusHours: number;
}

interface PromotionHistoryItem {
  bookingId: string;
  seatName: string;
  date: string;
  promotionType: 'discount' | 'bonus';
  discountPercentage?: number;
  discountAmount?: string;
  bonusHours?: string;
  originalPrice?: string;
  finalPrice: string;
}

export function PromotionUsageDialog({ 
  open, 
  onOpenChange, 
  whatsappNumber, 
  customerName 
}: PromotionUsageDialogProps) {
  const { data: summary, isLoading: summaryLoading } = useQuery<PromotionSummary>({
    queryKey: ["/api/promotions/customer", whatsappNumber, "summary"],
    enabled: open && !!whatsappNumber,
  });

  const { data: history = [], isLoading: historyLoading } = useQuery<PromotionHistoryItem[]>({
    queryKey: ["/api/promotions/customer", whatsappNumber, "history"],
    enabled: open && !!whatsappNumber,
  });

  const discountHistory = history.filter((h: PromotionHistoryItem) => h.promotionType === 'discount');
  const bonusHistory = history.filter((h: PromotionHistoryItem) => h.promotionType === 'bonus');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" data-testid="dialog-promotion-usage">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Promotions for {customerName}
          </DialogTitle>
          <DialogDescription>
            View all discounts and bonus hours received by this customer
          </DialogDescription>
        </DialogHeader>

        {summaryLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : summary ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-4 rounded-lg" data-testid="card-discount-count">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-muted-foreground">Discounts</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{summary.discountCount}</p>
              </div>
              
              <div className="glass-card p-4 rounded-lg" data-testid="card-total-savings">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-muted-foreground">Total Saved</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{summary.totalSavings.toFixed(0)}
                </p>
              </div>
              
              <div className="glass-card p-4 rounded-lg" data-testid="card-bonus-count">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-4 w-4 text-violet-500" />
                  <span className="text-sm text-muted-foreground">Bonus Hours</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{summary.bonusCount}</p>
              </div>
              
              <div className="glass-card p-4 rounded-lg" data-testid="card-total-bonus-hours">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-violet-500" />
                  <span className="text-sm text-muted-foreground">Total Hours</span>
                </div>
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                  {summary.totalBonusHours.toFixed(1)}h
                </p>
              </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" data-testid="tab-all-promotions">
                  All ({history.length})
                </TabsTrigger>
                <TabsTrigger value="discounts" data-testid="tab-discounts">
                  Discounts ({discountHistory.length})
                </TabsTrigger>
                <TabsTrigger value="bonus" data-testid="tab-bonus">
                  Bonus ({bonusHistory.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No promotions used yet
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Seat</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Details</TableHead>
                          <TableHead className="text-right">Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.map((item: PromotionHistoryItem, index: number) => (
                          <TableRow key={`${item.bookingId}-${index}`} data-testid={`row-promotion-${item.bookingId}`}>
                            <TableCell className="text-sm">{item.date}</TableCell>
                            <TableCell className="font-medium">{item.seatName}</TableCell>
                            <TableCell>
                              {item.promotionType === 'discount' ? (
                                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                                  <Percent className="h-3 w-3 mr-1" />
                                  Discount
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800">
                                  <Gift className="h-3 w-3 mr-1" />
                                  Bonus
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {item.promotionType === 'discount' ? (
                                <span className="text-sm">
                                  {item.discountPercentage}% off
                                  {item.originalPrice && ` (₹${item.originalPrice} → ₹${item.finalPrice})`}
                                </span>
                              ) : (
                                <span className="text-sm">
                                  +{item.bonusHours} hours free
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {item.promotionType === 'discount' ? (
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  -₹{item.discountAmount}
                                </span>
                              ) : (
                                <span className="text-violet-600 dark:text-violet-400">
                                  +{item.bonusHours}h
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="discounts" className="mt-4">
                {discountHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No discount promotions used
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Seat</TableHead>
                          <TableHead>Discount</TableHead>
                          <TableHead>Original Price</TableHead>
                          <TableHead>Final Price</TableHead>
                          <TableHead className="text-right">Saved</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {discountHistory.map((item: PromotionHistoryItem, index: number) => (
                          <TableRow key={`${item.bookingId}-${index}`}>
                            <TableCell className="text-sm">{item.date}</TableCell>
                            <TableCell className="font-medium">{item.seatName}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
                                {item.discountPercentage}%
                              </Badge>
                            </TableCell>
                            <TableCell>₹{item.originalPrice}</TableCell>
                            <TableCell>₹{item.finalPrice}</TableCell>
                            <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                              -₹{item.discountAmount}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="bonus" className="mt-4">
                {bonusHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No bonus hour promotions used
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Seat</TableHead>
                          <TableHead>Paid Price</TableHead>
                          <TableHead className="text-right">Bonus Hours</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bonusHistory.map((item: PromotionHistoryItem, index: number) => (
                          <TableRow key={`${item.bookingId}-${index}`}>
                            <TableCell className="text-sm">{item.date}</TableCell>
                            <TableCell className="font-medium">{item.seatName}</TableCell>
                            <TableCell>₹{item.finalPrice}</TableCell>
                            <TableCell className="text-right font-semibold text-violet-600 dark:text-violet-400">
                              +{item.bonusHours}h
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
