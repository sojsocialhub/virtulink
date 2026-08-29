"use client";

import { useMemo, useState } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";

import {
  useFirestore,
  useUser,
  useDoc,
  useCollection,
  useMemoFirebase,
} from "@/firebase";

import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const popularServices = [
  { platform: "Instagram", service: "Followers", quantity: 1000, costPrice: 800, sellingPrice: 1500, deliveryTime: "1-3 days" },
  { platform: "Instagram", service: "Likes", quantity: 100, costPrice: 150, sellingPrice: 300, deliveryTime: "Instant - 24 hours" },
  { platform: "Instagram", service: "Likes", quantity: 500, costPrice: 500, sellingPrice: 900, deliveryTime: "Instant - 24 hours" },
  { platform: "Instagram", service: "Views", quantity: 1000, costPrice: 100, sellingPrice: 250, deliveryTime: "Instant" },

  { platform: "TikTok", service: "Followers", quantity: 1000, costPrice: 900, sellingPrice: 1600, deliveryTime: "1-3 days" },
  { platform: "TikTok", service: "Likes", quantity: 1000, costPrice: 400, sellingPrice: 800, deliveryTime: "1-2 days" },
  { platform: "TikTok", service: "Views", quantity: 10000, costPrice: 300, sellingPrice: 700, deliveryTime: "Instant - 24 hours" },

  { platform: "Facebook", service: "Followers", quantity: 1000, costPrice: 1000, sellingPrice: 1800, deliveryTime: "1-3 days" },
  { platform: "Facebook", service: "Page Likes", quantity: 1000, costPrice: 900, sellingPrice: 1700, deliveryTime: "1-3 days" },
  { platform: "Facebook", service: "Post Likes", quantity: 500, costPrice: 300, sellingPrice: 650, deliveryTime: "Instant - 24 hours" },

  { platform: "YouTube", service: "Subscribers", quantity: 100, costPrice: 700, sellingPrice: 1200, deliveryTime: "1-5 days" },
  { platform: "YouTube", service: "Views", quantity: 1000, costPrice: 200, sellingPrice: 500, deliveryTime: "1-2 days" },
  { platform: "YouTube", service: "Likes", quantity: 100, costPrice: 150, sellingPrice: 350, deliveryTime: "1-2 days" },

  { platform: "X", service: "Followers", quantity: 1000, costPrice: 800, sellingPrice: 1500, deliveryTime: "1-3 days" },
  { platform: "X", service: "Likes", quantity: 500, costPrice: 250, sellingPrice: 600, deliveryTime: "1-2 days" },
];

export default function BoostPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    platform: "",
    service: "",
    quantity: "",
    costPrice: "",
    sellingPrice: "",
    deliveryTime: "",
  });

  const userDocRef = useMemoFirebase(
    () => (db && user ? doc(db, "users", user.uid) : null),
    [db, user]
  );

  const { data: userData } = useDoc(userDocRef);

  const servicesQuery = useMemoFirebase(() => {
    if (!db) return null;

    return query(
      collection(db, "social_services"),
      orderBy("platform")
    );
  }, [db]);

  const { data: services, loading } = useCollection(servicesQuery);

  const isAdmin = userData?.role === "admin";

  const addService = async (
    serviceData: {
      platform: string;
      service: string;
      quantity: number;
      costPrice: number;
      sellingPrice: number;
      deliveryTime: string;
    }
  ) => {
    if (!db || !isAdmin) return;

    await addDoc(collection(db, "social_services"), {
      category: "boost",
      platform: serviceData.platform,
      service: serviceData.service,
      quantity: Number(serviceData.quantity),
      costPrice: Number(serviceData.costPrice),
      sellingPrice: Number(serviceData.sellingPrice),
      deliveryTime: serviceData.deliveryTime,
      active: true,
      createdAt: serverTimestamp(),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!db || !isAdmin) return;

    if (
      !form.platform ||
      !form.service ||
      !form.quantity ||
      !form.sellingPrice
    ) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please complete the required fields.",
      });
      return;
    }

    setSaving(true);

    try {
      await addService({
        platform: form.platform,
        service: form.service,
        quantity: Number(form.quantity),
        costPrice: Number(form.costPrice || 0),
        sellingPrice: Number(form.sellingPrice),
        deliveryTime: form.deliveryTime || "Pending",
      });

      toast({
        title: "Service Added 🚀",
        description: "BOOST service created successfully.",
      });

      setForm({
        platform: "",
        service: "",
        quantity: "",
        costPrice: "",
        sellingPrice: "",
        deliveryTime: "",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Unable to add service.",
      });
    }

    setSaving(false);
  };

  const addPopularCatalog = async () => {
    if (!db || !isAdmin) return;

    const confirmed = window.confirm(
      `Add ${popularServices.length} popular BOOST services?`
    );

    if (!confirmed) return;

    setSaving(true);

    try {
      for (const service of popularServices) {
        await addService(service);
      }

      toast({
        title: "Catalog Added 🎉",
        description: `${popularServices.length} BOOST services were added.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Some services could not be added.",
      });
    }

    setSaving(false);
  };

  const removeService = async (serviceId: string) => {
    if (!db || !isAdmin) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this service?"
    );

    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "social_services", serviceId));

      toast({
        title: "Service Deleted",
        description: "The service has been removed.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Unable to delete service.",
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        Admin access required.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">

      <div>
        <h1 className="text-3xl font-black">
          BOOST Management 🚀
        </h1>

        <p className="text-muted-foreground">
          Manage your social media growth services
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Service Catalog ⚡</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Quickly add Instagram, TikTok, Facebook, YouTube and X service templates.
            You can adjust pricing later.
          </p>

          <Button
            onClick={addPopularCatalog}
            disabled={saving}
            className="w-full md:w-auto"
          >
            {saving
              ? "Adding Services..."
              : `Add ${popularServices.length} Popular Services 🚀`}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Custom Service</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">

            <div>
              <Label>Platform *</Label>
              <Input
                placeholder="Instagram"
                value={form.platform}
                onChange={(e) =>
                  setForm({ ...form, platform: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Service *</Label>
              <Input
                placeholder="Followers"
                value={form.service}
                onChange={(e) =>
                  setForm({ ...form, service: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Quantity *</Label>
              <Input
                type="number"
                placeholder="1000"
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Delivery Time</Label>
              <Input
                placeholder="1-3 days"
                value={form.deliveryTime}
                onChange={(e) =>
                  setForm({ ...form, deliveryTime: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Cost Price</Label>
              <Input
                type="number"
                placeholder="800"
                value={form.costPrice}
                onChange={(e) =>
                  setForm({ ...form, costPrice: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Selling Price *</Label>
              <Input
                type="number"
                placeholder="1500"
                value={form.sellingPrice}
                onChange={(e) =>
                  setForm({ ...form, sellingPrice: e.target.value })
                }
              />
            </div>

            <div className="md:col-span-2">
              <Button disabled={saving} className="w-full">
                {saving ? "Saving..." : "Add Service 🚀"}
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Existing Services ({services?.length || 0})
          </CardTitle>
        </CardHeader>

        <CardContent>

          {loading && (
            <p className="text-muted-foreground">
              Loading services...
            </p>
          )}

          <div className="space-y-3">

            {services?.map((service: any) => (
              <div
                key={service.id}
                className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div>
                  <p className="font-bold">
                    {service.platform} — {service.service}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {service.quantity} • ₦
                    {Number(
                      service.sellingPrice ??
                      service.sellingprice ??
                      0
                    ).toLocaleString()} •{" "}
                    {service.deliveryTime ??
                      service.deliverytime ??
                      "Pending"}
                  </p>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeService(service.id)}
                >
                  Delete
                </Button>
              </div>
            ))}

            {!loading && (!services || services.length === 0) && (
              <p className="text-muted-foreground">
                No BOOST services yet.
              </p>
            )}

          </div>
        </CardContent>
      </Card>

    </div>
  );
}
