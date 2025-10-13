import * as React from "react"

export type DeviceType = "desktop" | "tablet" | "mobile"

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = React.useState<DeviceType>(() => {
    if (typeof window === "undefined") return "desktop"
    
    const width = window.innerWidth
    if (width < MOBILE_BREAKPOINT) return "mobile"
    if (width < TABLET_BREAKPOINT) return "tablet"
    return "desktop"
  })

  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < MOBILE_BREAKPOINT) {
        setDeviceType("mobile")
      } else if (width < TABLET_BREAKPOINT) {
        setDeviceType("tablet")
      } else {
        setDeviceType("desktop")
      }
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return deviceType
}

export function useIsDesktop(): boolean {
  const deviceType = useDeviceType()
  return deviceType === "desktop"
}

export function useIsMobileOrTablet(): boolean {
  const deviceType = useDeviceType()
  return deviceType === "mobile" || deviceType === "tablet"
}
