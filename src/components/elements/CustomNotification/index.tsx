import { Snackbar, SnackbarContent } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { removeNotification } from "@/stores/reducers/notificationReducer";
import React, { useEffect } from "react";
import { SnackbarProvider, enqueueSnackbar, useSnackbar } from "notistack";
const CustomNotification = () => {
  const { closeSnackbar } = useSnackbar();
  const dispatch = useDispatch();
  const notifications = useSelector(
    (state: any) => state.notifications.notifications
  );

  // Custom hook that might behave like useEffect with specific triggers
  useEffect(() => {
    notifications.forEach((notification: any) => {
      if (notification.open) {
        enqueueSnackbar(notification.message, {
          key: notification.id,
          variant: notification.severity,
          preventDuplicate: true,
          //  action: (key) => (
          //    <Button size="small" onClick={() => closeSnackbar(key)}>
          //      Dismiss
          //    </Button>
          //  ),
          autoHideDuration: 6000,
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "left",
          },
          onClose: () => handleCloseNotification(notification.id),
        });
        // Additional logic might be placed here if needed
      }
    });
  }, [notifications]); // Dependency array might need to be adjusted according to your actual use case

  // Handling closing notifications
  const handleCloseNotification = (id: number) => {
    dispatch(removeNotification(id));
  };

  return (
    <div className="fixed ">
      <SnackbarProvider maxSnack={3} />
    </div>
  );
};

export default CustomNotification;
