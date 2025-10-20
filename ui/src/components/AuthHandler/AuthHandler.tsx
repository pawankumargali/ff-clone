import { useLocation, Navigate } from "react-router";
import { isAuthenticated } from "../../services/auth.service";

export default function AuthHandler() {
  console.log('start');
  const location = useLocation();

  console.log('loc');
  console.log(location);


  const url = new URL(window.location.href);
  const token = url.searchParams.get("token");

  // let redirectToLogin=true;
  // let nextPath="";

  if(token) {
    try {
      localStorage.setItem("userToken", token);
      url.searchParams.delete("token");
      // const cleanedSearch = url.searchParams.toString();
      // nextPath = `${location.pathname}${cleanedSearch ? `?${cleanedSearch}` : ""}${location.hash || ""}`;
    } catch(e) {
      console.log(e);
      alert('login failed. please try again');
    }
  } 

  return isAuthenticated() ? (
    <Navigate to={"/"} replace state={{ from: location }} />
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );

}