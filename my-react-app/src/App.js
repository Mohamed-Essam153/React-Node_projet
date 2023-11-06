import { Route, Routes } from "react-router-dom";
import "./App.css";
import IndexPage from "./Pages/IndexPage";
import LoginPage from "./Pages/LoginPage";
import RegisterPage from "./Pages/RegisterPage";
import Layout from "./layout";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<IndexPage />} />
        <Route path="/Login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

    </Routes>
  );
}

export default App;
