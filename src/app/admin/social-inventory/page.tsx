"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  ShieldCheck,
  PackagePlus,
} from "lucide-react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  serverTimestamp,
} from "firebase/firestore";

import {
  useFirestore,
  useCollection,
  useUser,
  useDoc,
  useMemoFirebase,
} from "@/firebase";

import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SocialInventoryPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    productId: "",
    username: "",
    email: "",
    password: "",
    extraDetails: "",
  });

  const userDocRef = useMemoFirebase(
    () => (db && user ? doc(db, "users", user.uid) : null),
    [db, user]
  );

  const { data: userData, loading: loadingProfile } = useDoc(userDocRef);
  const isAdmin = userData?.role === "admin";

  const productsQuery = useMemoFirebase(
    () => (db && isAdmin ? query(collection(db, "Sociallogs")) : null),
    [db, isAdmin]
  );

  const inventoryQuery = useMemoFirebase(
    () =>
      db && isAdmin
        ? query(collection(db, "social_log_inventory"))
        : null,
    [db, isAdmin]
  );

  const { data: products, loading: loadingProducts } =
    useCollection(productsQuery);

  const { data: inventory, loading: loadingInventory } =
    useCollection(inventoryQuery);

  const productMap = useMemo(() => {
    const map = new Map<string, any>();

    (products || []).forEach((product: any) => {
      map.set(product.id, product);
    });

    return map;
  }, [products]);

  const resetForm = () => {
    setForm({
      productId: "",
      username: "",
      email: "",
      password: "",
      extraDetails: "",
    });
  };

  const handleAddInventory = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!db || !isAdmin) return;

    if (
      !form.productId ||
      !form.username.trim() ||
      !form.password.trim()
    ) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description:
          "Please select a product and enter the username and password.",
      });
      return;
    }

    const selectedProduct = productMap.get(form.productId);

    if (!selectedProduct) {
      toast({
        variant: "destructive",
        title: "Invalid product",
        description: "The selected Social Log product was not found.",
      });
      return;
    }

    setSaving(true);

    try {
      await addDoc(collection(db, "social_log_inventory"), {
        productId: selectedProduct.id,
        productName: selectedProduct.name || "Social Account",
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
        extraDetails: form.extraDetails.trim(),
        status: "available",
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Inventory Added",
        description: `${selectedProduct.name} account is now available for sale.`,
      });

      resetForm();
      setOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Could not add inventory",
        description:
          error?.message || "Unable to save the Social Log account.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (inventoryId: string) => {
    if (!db || !isAdmin) return;

    const item = (inventory || []).find(
      (entry: any) => entry.id === inventoryId
    );

    if (!item) return;

    if (item.status === "sold") {
      toast({
        variant: "destructive",
        title: "Cannot delete sold account",
        description:
          "Sold inventory records should be kept for purchase history.",
      });
      return;
    }

    const confirmed = window.confirm(
      "Delete this available Social Log account from inventory?"
    );

    if (!confirmed) return;

    setDeletingId(inventoryId);

    try {
      await deleteDoc(doc(db, "social_log_inventory", inventoryId));

      toast({
        title: "Inventory Removed",
        description: "The account was removed from available inventory.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description:
          error?.message || "Unable to remove this inventory item.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen p-10 text-center">
        <ShieldCheck className="mx-auto h-16 w-16 text-destructive" />
        <h1 className="mt-4 text-2xl font-black">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">
          This area is reserved for administrators.
        </p>
        <Link href="/admin">
          <Button className="mt-6">Back to Admin</Button>
        </Link>
      </div>
    );
  }

  const loading = loadingProducts || loadingInventory;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin"
            className="mb-3 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Admin Hub
          </Link>

          <h1 className="text-3xl font-black text-primary">
            Social Log Inventory
          </h1>

          <p className="mt-1 text-muted-foreground">
            Manage the private accounts available for customer delivery.
          </p>
        </div>

        <Dialog
          open={open}
          onOpenChange={(value) => {
            if (!saving) {
              setOpen(value);
              if (!value) resetForm();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="font-bold">
              <Plus className="mr-2 h-4 w-4" />
              Add Account
            </Button>
          </DialogTrigger>

          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-black">
                <PackagePlus className="h-5 w-5 text-primary" />
                Add Social Log Account
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleAddInventory} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Social Log Product</Label>

                <Select
                  value={form.productId}
                  onValueChange={(value) =>
                    setForm((previous) => ({
                      ...previous,
                      productId: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>

                  <SelectContent>
                    {(products || []).map((product: any) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} — ₦
                        {Number(product.price || 0).toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Username / Account</Label>
                <Input
                  value={form.username}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      username: event.target.value,
                    }))
                  }
                  placeholder="Account username"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      email: event.target.value,
                    }))
                  }
                  placeholder="Account email"
                />
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="text"
                  value={form.password}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      password: event.target.value,
                    }))
                  }
                  placeholder="Account password"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Extra Details</Label>
                <Textarea
                  value={form.extraDetails}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      extraDetails: event.target.value,
                    }))
                  }
                  placeholder="Optional information about this account"
                />
              </div>

              <Button
                type="submit"
                disabled={saving || !products?.length}
                className="h-12 w-full font-black"
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PackagePlus className="mr-2 h-4 w-4" />
                )}
                {saving ? "Saving..." : "Save Account"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : inventory && inventory.length > 0 ? (
        <Card className="overflow-hidden border-none ring-1 ring-border">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-xl font-black">
              Private Account Inventory ({inventory.length})
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/20 text-left">
                    <th className="p-4 font-bold">Product</th>
                    <th className="p-4 font-bold">Username</th>
                    <th className="p-4 font-bold">Email</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 text-right font-bold">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {inventory.map((item: any) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="p-4 font-bold">
                        {item.productName ||
                          productMap.get(item.productId)?.name ||
                          "Social Account"}
                      </td>

                      <td className="p-4">{item.username || "—"}</td>

                      <td className="p-4">{item.email || "—"}</td>

                      <td className="p-4">
                        <Badge
                          variant={
                            item.status === "available"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {item.status || "unknown"}
                        </Badge>
                      </td>

                      <td className="p-4 text-right">
                        {item.status === "available" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={deletingId === item.id}
                            onClick={() => handleDelete(item.id)}
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        ) : (
                          <span className="text-xs font-medium text-muted-foreground">
                            Sold
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex min-h-[300px] flex-col items-center justify-center text-center">
            <PackagePlus className="h-12 w-12 text-muted-foreground/40" />
            <h2 className="mt-4 text-xl font-black">
              No Social Log Inventory
            </h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              Add your first Social Log account using the Add Account button.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
