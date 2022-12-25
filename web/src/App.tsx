import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { IndexPage } from "./pages/Index";

const router = createBrowserRouter([
  {
    path: "/",
    element: <IndexPage />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
