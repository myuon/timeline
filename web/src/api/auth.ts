import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import useSWR from "swr";

export const getAuthToken = async () => {
  if (auth.currentUser) {
    return await auth.currentUser?.getIdToken();
  } else {
    return new Promise<string | undefined>((resolve) => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        unsubscribe();
        resolve(await user?.getIdToken());
      });
    });
  }
};

export const useAuthToken = () => {
  return useSWR("/token", async () => getAuthToken());
};

export const useAuthGuard = () => {
  const navigate = useNavigate();
  useEffect(() => {
    void (async () => {
      const token = await getAuthToken();

      if (!token) {
        navigate("/login");
      }
    })();
  }, [navigate]);
};
