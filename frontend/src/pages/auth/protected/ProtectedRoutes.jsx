import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet } from "react-router-dom";
// import LoadingSpinner from "../../../components/common/LoadingSpinner";

function ProtectedRoutes() {
  const {
    data: authUser
    // isLoading
    // error,
    // isError
  } = useQuery({ queryKey: ["authUser"] });
  /*
  const {
    data: authUser,
    isLoading
    // error,
    // isError
  } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }

        console.log("Auth user is here: ", data);
        return data;
      } catch (err) {
        console.log(err);
        throw new Error(err);
      }
    }
  });

  */
  // if it's loading to confrim whether user is authenticated or not, the return null
  //   if (isLoading) {
  //     // we can decide to show a loading spinner
  //     // return null;
  //     return (
  //       <div className="h-screen flex justify-center items-center">
  //         <LoadingSpinner size="lg" />
  //       </div>
  //     );
  //   }

  // if it's loading to confrim whether user is authenticated or not, the return null
  //   if (isError) {
  //     // we can decide to show a loading spinner
  //     console.log("ERROR FOR AUTH USER : ", error);
  //     return null;
  //   }

  // if the user is logged in, all the  child route of this components will be render
  if (authUser) {
    return <Outlet />;
  }

  // if user is not authenticated, the redirect to home page
  // if the user is not logged in, the user will be redirected to the home page
  return <Navigate to="/login" replace />;
}

export default ProtectedRoutes;
