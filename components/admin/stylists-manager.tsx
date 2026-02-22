"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit2, Trash2, Star } from "lucide-react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

interface Stylist {
  id: string;
  name: string;
  specialties: string[];
  rating: number;
  experience: string;
  phone?: string;
  createdAt?: any;
}

export function StylistsManager() {
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Stylist, "id">>({
    name: "",
    specialties: [],
    rating: 5,
    experience: "",
    phone: "",
  });
  const [specialtyInput, setSpecialtyInput] = useState("");

  useEffect(() => {
    fetchStylists();
  }, []);

  const fetchStylists = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "stylists"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Stylist[];
      setStylists(data);
    } catch (error) {
      console.error("Error fetching stylists:", error);
      toast.error("Failed to load stylists");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStylist = async () => {
    if (!formData.name.trim()) {
      toast.error("Stylist name is required");
      return;
    }

    try {
      await addDoc(collection(db, "stylists"), {
        ...formData,
        createdAt: Timestamp.now(),
      });
      toast.success("Stylist added successfully");
      setIsAddOpen(false);
      setFormData({
        name: "",
        specialties: [],
        rating: 5,
        experience: "",
        phone: "",
      });
      setSpecialtyInput("");
      fetchStylists();
    } catch (error) {
      console.error("Error adding stylist:", error);
      toast.error("Failed to add stylist");
    }
  };

  const handleEditStylist = async () => {
    if (!formData.name.trim()) {
      toast.error("Stylist name is required");
      return;
    }

    if (!editingId) return;

    try {
      await updateDoc(doc(db, "stylists", editingId), formData);
      toast.success("Stylist updated successfully");
      setIsEditOpen(false);
      setEditingId(null);
      setFormData({
        name: "",
        specialties: [],
        rating: 5,
        experience: "",
        phone: "",
      });
      setSpecialtyInput("");
      fetchStylists();
    } catch (error) {
      console.error("Error updating stylist:", error);
      toast.error("Failed to update stylist");
    }
  };

  const handleDeleteStylist = async (id: string) => {
    try {
      await deleteDoc(doc(db, "stylists", id));
      toast.success("Stylist deleted successfully");
      setDeleteId(null);
      fetchStylists();
    } catch (error) {
      console.error("Error deleting stylist:", error);
      toast.error("Failed to delete stylist");
    }
  };

  const startEdit = (stylist: Stylist) => {
    setFormData({
      name: stylist.name,
      specialties: stylist.specialties,
      rating: stylist.rating,
      experience: stylist.experience,
      phone: stylist.phone || "",
    });
    setEditingId(stylist.id);
    setIsEditOpen(true);
  };

  const addSpecialty = () => {
    if (specialtyInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        specialties: [...prev.specialties, specialtyInput.trim()],
      }));
      setSpecialtyInput("");
    }
  };

  const removeSpecialty = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index),
    }));
  };

  const handleAddDialogOpen = () => {
    setFormData({
      name: "",
      specialties: [],
      rating: 5,
      experience: "",
      phone: "",
    });
    setSpecialtyInput("");
    setIsAddOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Stylists Management</h2>
          <p className="text-gray-600">Manage your salon stylists and their profiles</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={handleAddDialogOpen}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Stylist
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Stylist</DialogTitle>
              <DialogDescription>
                Add a new stylist to your salon team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Stylist name"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="Phone number"
                />
              </div>

              <div>
                <Label htmlFor="experience">Experience</Label>
                <Input
                  id="experience"
                  value={formData.experience}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      experience: e.target.value,
                    }))
                  }
                  placeholder="e.g., 5+ years"
                />
              </div>

              <div>
                <Label htmlFor="rating">Rating (1-5)</Label>
                <Input
                  id="rating"
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={formData.rating}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      rating: parseFloat(e.target.value),
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="specialty">Specialties</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    id="specialty"
                    value={specialtyInput}
                    onChange={(e) => setSpecialtyInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSpecialty();
                      }
                    }}
                    placeholder="Add a specialty (e.g., Gel Manicure)"
                  />
                  <Button
                    type="button"
                    onClick={addSpecialty}
                    variant="outline"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.specialties.map((specialty, index) => (
                    <div
                      key={index}
                      className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {specialty}
                      <button
                        onClick={() => removeSpecialty(index)}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleAddStylist}
                  className="bg-purple-600 hover:bg-purple-700 flex-1"
                >
                  Add Stylist
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Stylists</CardTitle>
          <CardDescription>
            {stylists.length} stylist{stylists.length !== 1 ? "s" : ""} in your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : stylists.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No stylists yet. Add your first stylist to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Specialties</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stylists.map((stylist) => (
                    <TableRow key={stylist.id}>
                      <TableCell className="font-medium">{stylist.name}</TableCell>
                      <TableCell className="text-sm">
                        <div className="flex flex-wrap gap-1">
                          {stylist.specialties.slice(0, 2).map((specialty, i) => (
                            <span
                              key={i}
                              className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                            >
                              {specialty}
                            </span>
                          ))}
                          {stylist.specialties.length > 2 && (
                            <span className="text-gray-600 text-xs">
                              +{stylist.specialties.length - 2} more
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{stylist.experience}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {stylist.rating}
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{stylist.phone || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(stylist)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteId(stylist.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Global Dialogs moved outside the loop for performance */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Stylist</DialogTitle>
            <DialogDescription>Update stylist information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Stylist name"
              />
            </div>

            <div>
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="Phone number"
              />
            </div>

            <div>
              <Label htmlFor="edit-experience">Experience</Label>
              <Input
                id="edit-experience"
                value={formData.experience}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    experience: e.target.value,
                  }))
                }
                placeholder="e.g., 5+ years"
              />
            </div>

            <div>
              <Label htmlFor="edit-rating">Rating (1-5)</Label>
              <Input
                id="edit-rating"
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    rating: parseFloat(e.target.value),
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="edit-specialty">Specialties</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  id="edit-specialty"
                  value={specialtyInput}
                  onChange={(e) => setSpecialtyInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSpecialty();
                    }
                  }}
                  placeholder="Add a specialty"
                />
                <Button type="button" onClick={addSpecialty} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.specialties.map((specialty, index) => (
                  <div
                    key={index}
                    className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {specialty}
                    <button
                      onClick={() => removeSpecialty(index)}
                      className="text-purple-600 hover:text-purple-900"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleEditStylist}
                className="bg-purple-600 hover:bg-purple-700 flex-1"
              >
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditOpen(false);
                  setEditingId(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stylist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this stylist? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDeleteStylist(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
