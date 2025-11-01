import { ArrowLeft, Users } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { auth } from "@/lib/auth";
import { UserRow } from "./_components/user-row";

const AdminPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/auth/login");
  }

  const hasPermission = await auth.api.userHasPermission({
    headers: await headers(),
    body: { permission: { user: ["list"] } },
  });

  if (!hasPermission.success) {
    return redirect("/");
  }

  const users = await auth.api.listUsers({
    headers: await headers(),
    query: {
      limit: 100,
      sortBy: "createdAt",
      sortDirection: "desc",
    },
  });

  return (
    <div className="mx-auto container my-6 px-4">
      <Link href="/" className="inline-flex items-center mb-6">
        <ArrowLeft className="size-4 mr-2" />
        Back to Home
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({users.total})
          </CardTitle>
          <CardDescription>
            Manage user accounts, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.users.map((user) => (
                  <UserRow key={user.id} selfId={session.user.id} user={user} />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPage;
