import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionButton?: {
    label: string;
    icon: LucideIcon;
    buttonClassName?: string;
    onClick: () => void;
  };
  actionDialog?: {
    trigger: ReactNode;
    content: ReactNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  };
}

const PageHeader = ({
  icon: Icon,
  title,
  description,
  actionButton,
  actionDialog,
}: PageHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Icon className="h-8 w-8 text-speedball-600" />
          {title}
        </h1>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>

      {/* Action Button or Dialog */}
      {actionButton && (
        <Button
          className={`gap-2 ${actionButton.buttonClassName || ""}`}
          onClick={actionButton.onClick}
        >
          <actionButton.icon className="h-4 w-4" />
          {actionButton.label}
        </Button>
      )}

      {actionDialog && (
        <Dialog
          open={actionDialog.open}
          onOpenChange={actionDialog.onOpenChange}
        >
          <DialogTrigger asChild>{actionDialog.trigger}</DialogTrigger>
            {actionDialog.content}
        </Dialog>
      )}
    </div>
  );
};

export default PageHeader;
