import { Route, Routes } from "react-router-dom";
import "./App.css";
import IndexPage from "./Pages/IndexPage";
import LoginPage from "./Pages/LoginPage";
import RegisterPage from "./Pages/RegisterPage";
import Layout from "./layout";
import axios from "axios";
import { UserContextProvider } from "./UserContext";
import ProfilePage from "./Pages/profilePage";
import PlacesPage from "./Pages/PlacesPage";
import PlacePage from "./Pages/PlacePage";
import PlacesFormPage from "./Pages/PlacesFormPage";
import BookingsPage from "./Pages/BookingsPage";
import BookingPage from "./Pages/BookingPage";

axios.defaults.baseURL = "http://localhost:4000";
axios.defaults.withCredentials = true;
function App() {
  return (
    <UserContextProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<IndexPage />} />
          <Route path="/Login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/account" element={<ProfilePage />} />
          <Route path="/account/places" element={<PlacesPage />} />
          <Route path="/place/:id" element={<PlacePage />} />
          <Route path="/account/places/new" element={<PlacesFormPage />} />
          <Route path="/account/places/:id" element={<PlacesFormPage />} />
          <Route path="/account/bookings" element={<BookingsPage />} />
          <Route path="/account/bookings/:id" element={<BookingPage />} />
        </Route>
      </Routes>
    </UserContextProvider>
  );
}

export default App;
