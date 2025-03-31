import React from "react";
import { Link } from "react-router-dom";
import { AppBar, Toolbar, Button, Box, Typography } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import icon from "/icon.png"; 

const Navbar = () => {
  const { isLoggedIn, isAdmin, logout, username } = useAuth();

  return (
    <AppBar position="static" sx={{ backgroundColor: "#001f3f" }}>
      <Toolbar>
        <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center" }}>
          <Button color="inherit" component={Link} to="/">
            Home
          </Button>
          {isAdmin ? (
            <Button color="inherit" component={Link} to="/admin/reviews">
              Admin Reviews
            </Button>
          ) : (
            <Button color="inherit" component={Link} to="/watchlist">
              Watchlist
            </Button>
          )}
        </Box>
        <Box sx={{ flexGrow: 0, textAlign: "center" }}>
          <Link to="/">
            <img
              src={icon}
              alt="Logo"
              style={{
                height: "40px", // Höhe des Icons
                cursor: "pointer",
              }}
            />
          </Link>
        </Box>
        <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
          {isLoggedIn ? (
            <>
              <Typography variant="body1" sx={{ marginRight: 2 }}>
                Willkommen, {username}!
              </Typography>
              <Button color="inherit" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login">
                Login
              </Button>
              <Button color="inherit" component={Link} to="/register">
                Registrieren
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;