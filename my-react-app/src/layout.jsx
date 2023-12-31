import {Outlet} from "react-router-dom";
import Header from "./HeaderStyle";

export default function Layout() {
  return (
    
    <div className="py-4 px-4 flex flex-col min-h-screen max-w-4xl mx-auto">
      <Header />
      <Outlet />
    </div>
  );
}