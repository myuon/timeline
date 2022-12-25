import { useEffect, useState } from "react";
import { auth } from "./firebase";

export const useAuthToken = () => {
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);
  useEffect(() => {
    void (async () => {
      const token = await auth.currentUser?.getIdToken();
      setAuthToken(token);
    })();
  }, []);

  return authToken;
};
