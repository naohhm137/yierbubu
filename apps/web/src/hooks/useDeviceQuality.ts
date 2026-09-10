import { useState, useEffect } from 'react';

export interface DeviceQuality {
  isMobile: boolean;
  isPortrait: boolean;
  dpr: number;
  shadows: boolean;
  postprocessing: boolean;
  particleCount: number;
  shadowMapSize: number;
}

export function useDeviceQuality(): DeviceQuality {
  const [quality, setQuality] = useState<DeviceQuality>({
    isMobile: false,
    isPortrait: false,
    dpr: 2,
    shadows: true,
    postprocessing: true,
    particleCount: 60,
    shadowMapSize: 2048,
  });

  useEffect(() => {
    const detect = () => {
      const ua = navigator.userAgent;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
        || window.innerWidth < 768;
      const isPortrait = window.innerHeight > window.innerWidth;
      const isLowEnd = isMobile || window.innerWidth < 1024;

      setQuality({
        isMobile,
        isPortrait,
        dpr: isMobile ? 1 : 2,
        shadows: !isMobile,
        postprocessing: !isMobile,
        particleCount: isMobile ? 20 : 60,
        shadowMapSize: isMobile ? 1024 : 2048,
      });
    };

    detect();
    window.addEventListener('resize', detect);
    window.addEventListener('orientationchange', detect);
    return () => {
      window.removeEventListener('resize', detect);
      window.removeEventListener('orientationchange', detect);
    };
  }, []);

  return quality;
}
