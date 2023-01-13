import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { IndexPage } from "./pages/Index";
import { LoginPage } from "./pages/Login";
import { UserPage } from "./pages/User";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <IndexPage />,
      index: true,
    },
    {
      path: "/u/:username",
      element: <UserPage />,
    },
    {
      path: "/login",
      element: <LoginPage />,
    },
  ],
  {
    basename: "/web",
  }
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
