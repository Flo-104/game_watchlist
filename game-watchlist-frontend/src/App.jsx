import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";
import Home from "./pages/Home";
import Register from "./pages/RegisterPage";
import Login from "./pages/LoginPage";
import Watchlist from "./pages/Watchlist";
import ReviewPage from "./pages/UserReviewPage";
import AdminReviewsPage from "./pages/AdminReviewPage";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh", // Stellt sicher, dass der Container die gesamte Höhe des Bildschirms einnimmt
          }}
        >
          <Navbar />
          <div style={{ flex: 1 }}> {/* Flexibler Bereich für den Hauptinhalt */}
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/review/:gameId" element={<ReviewPage />} />
              <Route path="/admin/reviews" element={<AdminReviewsPage />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;