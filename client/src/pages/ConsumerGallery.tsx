import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon } from "lucide-react";
import type { GalleryImage } from "@shared/schema";

export default function ConsumerGallery() {
  const { data: images, isLoading } = useQuery<GalleryImage[]>({
    queryKey: ["/api/consumer/gallery"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!images || images.length === 0) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold" data-testid="heading-gallery">Gallery</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">No images available yet</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl md:text-4xl font-bold" data-testid="heading-gallery">Gallery</h1>
      <p className="text-lg text-muted-foreground">Explore our gaming center</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <Card key={image.id} className="overflow-hidden group hover:shadow-lg transition-shadow" data-testid={`gallery-image-${image.id}`}>
            <CardContent className="p-0">
              <div className="relative aspect-video overflow-hidden bg-muted">
                <img
                  src={image.imageUrl}
                  alt={image.title}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  data-testid={`img-${image.id}`}
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1" data-testid={`text-title-${image.id}`}>{image.title}</h3>
                {image.description && (
                  <p className="text-sm text-muted-foreground" data-testid={`text-description-${image.id}`}>
                    {image.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
