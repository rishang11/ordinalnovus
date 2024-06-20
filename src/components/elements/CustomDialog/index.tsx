import React, { ReactNode } from "react";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import Slide from "@mui/material/Slide";

interface Action {
  node: ReactNode;
}

interface CustomDialogProps {
  open: boolean;
  handleClose: () => void;
  title: string;
  content: ReactNode;
  actions: Action[];
}

const Transition = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Slide>
>((props, ref) => {
  return <Slide direction="left" ref={ref} {...props} />;
});

// Adding a display name to the Transition component
Transition.displayName = "Transition";

const CustomDialog: React.FC<CustomDialogProps> = ({
  open,
  handleClose,
  title,
  content,
  actions,
}) => {
  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      keepMounted
      onClose={handleClose}
      aria-labelledby="custom-dialog-title"
      aria-describedby="custom-dialog-description"
      sx={{
        "& .MuiDialog-container": {},
        "& .MuiPaper-root": {
          backgroundColor: "transparent", // Apply transparent background here
          boxShadow: "none", // Optional: remove shadow if desired
        },
      }}
    >
      <div className="bg-primary text-white border-accent border-2 rounded-xl p-8">
        <p
          id="custom-dialog-title"
          className="text-3xl font-bold text-white capitalize"
        >
          {title}
        </p>
        <hr className="bg-gray-800 my-4" />
        <div>{content}</div>
        <div className="pt-4">
          <DialogActions>
            {actions.map((action, index) => (
              <React.Fragment key={index}>{action.node}</React.Fragment>
            ))}
          </DialogActions>
        </div>
      </div>
    </Dialog>
  );
};

export default CustomDialog;
