import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";

export const getAuthToken = async () => {
  if (auth.currentUser) {
    return await auth.currentUser?.getIdToken();
  } else {
    return new Promise<string>((resolve, reject) => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        unsubscribe();
        if (user) {
          resolve(await user.getIdToken());
        }
        reject();
      });
    });
  }
};

export const useAuthToken = () => {
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);
  const navigate = useNavigate();
  useEffect(() => {
    void (async () => {
      const token = await getAuthToken();

      if (!token) {
        navigate("/login");
      }
      setAuthToken(token);
    })();
  }, [navigate]);

  return authToken;
};
