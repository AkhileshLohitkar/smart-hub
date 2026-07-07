import { useEffect } from "react";
import { useLocation } from "wouter";

/** Legacy reset-link route — password reset now uses OTP on /forgot-password */
export default function ResetPassword() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/forgot-password");
  }, [setLocation]);

  return null;
}
