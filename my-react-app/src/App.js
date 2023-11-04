import { Route, Routes } from "react-router-dom";
import "./App.css";
import IndexPage from "./Pages/IndexPage";
import LoginPage from "./Pages/LoginPage";


function App() {
  return (
    <Routes>
      <Route index element={<IndexPage/>} />
      <Route path="/Login" element={<LoginPage/>} />
    </Routes>
  );
}

export default App;
