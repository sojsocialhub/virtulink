"use client";

import { doc, collection, query, updateDoc } from "firebase/firestore";
import {
  useFirestore,
  useUser,
  useDoc,
  useCollection,
  useMemoFirebase
} from "@/firebase";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function BoostOrdersPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(
    () => (db && user ? doc(db, "users", user.uid) : null),
    [db, user]
  );

  const { data: userData, loading: loadingUser } = useDoc(userDocRef);

  const isAdmin = userData?.role === "admin";

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;

    return query(collection(db, "boost_orders"));
  }, [db, isAdmin]);

  const { data: orders, loading } = useCollection(ordersQuery);

  const updateStatus = async (
    orderId: string,
    status: string
  ) => {
    if (!db) return;

    try {
      await updateDoc(
        doc(db, "boost_orders", orderId),
        {
          status
        }
      );

      toast({
        title: "Order Updated",
        description: `Order status changed to ${status}.`
      });

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Unable to update order."
      });
    }
  };

  if (loadingUser) {
    return (
      <div className="p-6">
        Loading...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        Admin access required.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Manage customer social media growth orders
          </p>

          <h1 className="text-3xl font-black">
            BOOST Orders 🚀
          </h1>
        </div>

        <Link href="/admin/boost">
          <Button variant="outline">
            ← BOOST Services
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              Total Orders
            </p>
            <p className="text-2xl font-black">
              {orders?.length || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              Pending
            </p>
            <p className="text-2xl font-black">
              {orders?.filter(
                (order: any) =>
                  String(order.status).toLowerCase() === "pending"
              ).length || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              Processing
            </p>
            <p className="text-2xl font-black">
              {orders?.filter(
                (order: any) =>
                  String(order.status).toLowerCase() === "processing"
              ).length || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              Completed
            </p>
            <p className="text-2xl font-black">
              {orders?.filter(
                (order: any) =>
                  String(order.status).toLowerCase() === "completed"
              ).length || 0}
            </p>
          </CardContent>
        </Card>

      </div>

      {loading && (
        <p className="text-muted-foreground">
          Loading BOOST orders...
        </p>
      )}

      {!loading && (!orders || orders.length === 0) && (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-lg font-bold">
              No BOOST orders yet 🚀
            </p>

            <p className="text-sm text-muted-foreground mt-2">
              Customer orders will appear here automatically.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">

        {orders?.map((order: any) => (

          <Card key={order.id}>

            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between gap-3">

                <div>
                  <CardTitle>
                    {order.platform} — {order.service}
                  </CardTitle>

                  <p className="text-sm text-muted-foreground mt-1">
                    {order.userEmail || "Customer"}
                  </p>
                </div>

                <div className="font-black">
                  ₦{Number(order.amount || 0).toLocaleString()}
                </div>

              </div>
            </CardHeader>

            <CardContent className="space-y-4">

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">

                <div>
                  <p className="text-muted-foreground">
                    Quantity
                  </p>
                  <b>{order.quantity}</b>
                </div>

                <div>
                  <p className="text-muted-foreground">
                    Delivery
                  </p>
                  <b>{order.deliveryTime || "-"}</b>
                </div>

                <div>
                  <p className="text-muted-foreground">
                    Status
                  </p>
                  <b>{order.status || "Pending"}</b>
                </div>

                <div>
                  <p className="text-muted-foreground">
                    Reference
                  </p>
                  <b className="text-xs">
                    {order.reference}
                  </b>
                </div>

              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Target Link
                </p>

                <a
                  href={order.targetLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-bold text-primary break-all underline"
                >
                  {order.targetLink}
                </a>
              </div>

              {order.comments && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Customer Comments
                  </p>

                  <p className="text-sm">
                    {order.comments}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    updateStatus(order.id, "Pending")
                  }
                >
                  Pending
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    updateStatus(order.id, "Processing")
                  }
                >
                  Processing
                </Button>

                <Button
                  size="sm"
                  onClick={() =>
                    updateStatus(order.id, "Completed")
                  }
                >
                  Completed
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    updateStatus(order.id, "Failed")
                  }
                >
                  Failed
                </Button>

              </div>

            </CardContent>

          </Card>

        ))}

      </div>

    </div>
  );
}
