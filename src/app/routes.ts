import { createBrowserRouter } from "react-router";
import { HomePage } from "./components/HomePage";
import { LaunchDetail } from "./components/LaunchDetail";
import { ExplorePage } from "./components/ExplorePage";

export const router = createBrowserRouter([
  { path: "/", Component: HomePage },
  { path: "/explore", Component: ExplorePage },
  { path: "/launch/:id", Component: LaunchDetail },
]);
