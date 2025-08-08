
"use client";

import { useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import type { UserData } from "@/lib/types";
import { Button } from "../ui/button";
import { RefreshCw } from "lucide-react";

// Helper function to convert ISO string to Date
const toDate = (timestamp: string | any): Date => {
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  // It might be a Firestore Timestamp object from server, convert it
  if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
  }
  return new Date(); // Fallback
};

const isOnline = (lastSeen: string | any): boolean => {
    if (!lastSeen) return false;
    const lastSeenDate = toDate(lastSeen);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastSeenDate > fiveMinutesAgo;
}

export function UserStatusTable() {
  const { allUsers, fetchAllUsers, isUserAdmin } = useAppContext();

  useEffect(() => {
    if (isUserAdmin) {
        fetchAllUsers(); // Initial fetch
        const interval = setInterval(fetchAllUsers, 30 * 1000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }
  }, [isUserAdmin, fetchAllUsers]);


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                 <CardTitle>User Status</CardTitle>
                <CardDescription>A list of all registered users and their online status.</CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={fetchAllUsers}>
                <RefreshCw className="h-4 w-4" />
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead className="hidden md:table-cell">User ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Seen</TableHead>
              <TableHead className="text-right">Total Balance</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Winnings</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              allUsers.map((user: UserData) => (
                <TableRow key={user.uid}>
                  <TableCell className="font-medium">{user.email || 'N/A'}</TableCell>
                  <TableCell className="hidden md:table-cell truncate max-w-[120px]">{user.uid}</TableCell>
                   <TableCell>
                    {isOnline(user.lastSeen) ? (
                        <Badge><span className="relative flex h-2 w-2 rounded-full bg-green-500 mr-2"></span>Online</Badge>
                    ) : (
                        <Badge variant="secondary"><span className="relative flex h-2 w-2 rounded-full bg-gray-500 mr-2"></span>Offline</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.lastSeen ? formatDistanceToNow(toDate(user.lastSeen), { addSuffix: true }) : 'Never'}
                  </TableCell>
                  <TableCell className="text-right">₹{((user.depositBalance ?? 0) + (user.winningsBalance ?? 0) + (user.bonusBalance ?? 0)).toFixed(2)}</TableCell>
                  <TableCell className="text-right hidden sm:table-cell">₹{(user.winningsBalance ?? 0).toFixed(2)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
