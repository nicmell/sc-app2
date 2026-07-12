import { useLocation, useNavigate } from "react-router";
import { ConnectionErrorModal } from "@/components/ConnectionOverlay";

export function SessionBootError() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <ConnectionErrorModal onRetry={() => void navigate(location.pathname, { replace: true })} />
  );
}
