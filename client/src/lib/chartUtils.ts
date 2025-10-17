import html2canvas from "html2canvas";

export async function saveChartAsImage(
  elementId: string,
  fileName: string = "chart"
): Promise<void> {
  const element = document.getElementById(elementId);
  
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: getComputedStyle(document.documentElement)
        .getPropertyValue('--background')
        .trim() || '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true,
      scrollY: -window.scrollY,
      onclone: (clonedDoc) => {
        clonedDoc.querySelectorAll('svg').forEach((svg) => {
          const rect = svg.getBoundingClientRect();
          svg.setAttribute('width', rect.width.toString());
          svg.setAttribute('height', rect.height.toString());
          svg.style.width = '';
          svg.style.height = '';
        });
      }
    });

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `${fileName}-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    });
  } catch (error) {
    console.error("Error saving chart as image:", error);
  }
}
