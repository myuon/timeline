import { useNavigate } from "react-router-dom";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../api/firebase";

const provider = new GoogleAuthProvider();

export const LoginPage = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={async () => {
        await signInWithPopup(auth, provider);
        navigate("/");
      }}
    >
      Sign In With Google
    </button>
  );
};
