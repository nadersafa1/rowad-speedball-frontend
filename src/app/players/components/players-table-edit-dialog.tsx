import { Dialog } from "@/components/ui/dialog";
import { Player } from "@/types";
import PlayerForm from "@/components/players/player-form";

interface PlayersTableEditDialogProps {
  player: Player | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PlayersTableEditDialog = ({
  player,
  open,
  onOpenChange,
  onSuccess,
  onCancel,
}: PlayersTableEditDialogProps) => {
  if (!player) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <PlayerForm player={player} onSuccess={onSuccess} onCancel={onCancel} />
    </Dialog>
  );
};

