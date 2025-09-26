import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Player } from "@/types";
import Link from "next/link";

const PlayerCard = ({ player }: { player: Player }) => {
  return (
    <Link href={`/players/${player.id}`} key={player.id}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <CardTitle className="text-lg text-rowad-600">
            {player.name}
          </CardTitle>
          <CardDescription>
            {player.gender === "male" ? "👨" : "👩"} {player.ageGroup} • Age{" "}
            {player.age}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date of Birth:</span>
              <span>{formatDate(player.dateOfBirth)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gender:</span>
              <span className="capitalize">{player.gender}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Age Group:</span>
              <span className="font-medium text-speedball-600">
                {player.ageGroup}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Preferred Hand:</span>
              <span className="capitalize">{player.preferredHand}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default PlayerCard;
