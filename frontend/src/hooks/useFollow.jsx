import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const useFollow = () => {
  const queryClient = useQueryClient();

  const { mutate: follow, isPending } = useMutation({
    mutationFn: async (userId) => {
      try {
        const res = await fetch(`/api/users/follow/${userId}`, {
          method: "POST"
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }
        return data;
      } catch (err) {
        throw new Error(err.message);
      }
    },
    onSuccess: () => {
      // we will invalidate tewo different queries. The suggested users

      // we will invalidate the logged in users so that the record of the users he is following will be updated and the button will chnaged to unfollow after he follows the user
      // we will put them in a promise.all() so that they will run at the same time
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["suggestedUsers"] }),
        queryClient.invalidateQueries({ queryKey: ["authUser"] })
      ]);
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  return { follow, isPending };
};

export default useFollow;
