"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useClerk } from "@clerk/nextjs";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const AuthGateModal = ({ open, onClose }: Props) => {
  const clerk = useClerk();

  const handleSignIn = () => {
    onClose();
    clerk.openSignIn();
  };

  const handleSignUp = () => {
    onClose();
    clerk.openSignUp();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign in to keep building</DialogTitle>
          <DialogDescription>
            You&apos;ve used your 2 free generations. Create a free account to
            get 5 more, or sign in to continue.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-2">
          <Button onClick={handleSignUp}>Create free account</Button>
          <Button variant="outline" onClick={handleSignIn}>
            Sign in
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
