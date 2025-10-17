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
    });

    const link = document.createElement("a");
    link.download = `${fileName}-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (error) {
    console.error("Error saving chart as image:", error);
  }
}
