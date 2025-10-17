import html2canvas from "html2canvas";

export async function saveChartAsImage(
  elementId: string,
  fileName: string = "chart"
): Promise<void> {
  const element = document.getElementById(elementId);
  
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    alert(`Chart element not found. Please try again.`);
    return;
  }

  try {
    // Wait a bit for any animations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Get background color from CSS variable
    const bgColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--background')
      .trim();
    
    const backgroundColor = bgColor ? `hsl(${bgColor})` : '#ffffff';

    const canvas = await html2canvas(element, {
      backgroundColor,
      scale: 2,
      logging: true,
      useCORS: true,
      allowTaint: true,
      scrollY: -window.scrollY,
      scrollX: -window.scrollX,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.getElementById(elementId);
        
        if (clonedElement) {
          // Fix SVG elements
          clonedElement.querySelectorAll('svg').forEach((svg) => {
            const bbox = svg.getBBox();
            const rect = svg.getBoundingClientRect();
            
            // Set explicit dimensions
            svg.setAttribute('width', String(rect.width || bbox.width));
            svg.setAttribute('height', String(rect.height || bbox.height));
            
            // Remove percentage-based sizing
            svg.style.removeProperty('width');
            svg.style.removeProperty('height');
            
            // Inline styles for better rendering
            svg.style.display = 'block';
            
            // Fix text elements
            svg.querySelectorAll('text').forEach((text) => {
              text.style.fontFamily = window.getComputedStyle(text).fontFamily;
            });
          });
          
          // Ensure ResponsiveContainer dimensions are fixed
          clonedElement.querySelectorAll('.recharts-responsive-container').forEach((container: any) => {
            const rect = container.getBoundingClientRect();
            container.style.width = `${rect.width}px`;
            container.style.height = `${rect.height}px`;
          });
        }
      }
    });

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `${fileName}-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log(`Chart saved as ${link.download}`);
      }
    }, 'image/png', 1.0);

  } catch (error) {
    console.error("Error saving chart as image:", error);
    alert("Failed to save chart. Please try again.");
  }
}
