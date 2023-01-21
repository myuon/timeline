import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { IndexLayout } from "./layout/Index";
import { IndexPage } from "./pages/Index";
import { LoginPage } from "./pages/Login";
import { UserPage } from "./pages/User";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <IndexLayout />,
      children: [
        {
          index: true,
          element: <IndexPage />,
        },
        {
          path: "/u/:username",
          element: <UserPage />,
        },
        {
          path: "/plugin/rssfeed",
          element: <div>PLUGIN: rssfeed</div>,
        },
      ],
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
