"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Sparkles, ArrowLeft, Loader2, Plus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { generateProductDescription } from '@/ai/flows/generate-product-description';
import { ProductType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'virtual number' as ProductType,
    price: '',
    description: '',
    features: [''],
    targetAudience: '',
    tone: 'professional and persuasive'
  });

  const handleGenerateDescription = async () => {
    if (!formData.name) {
      toast({
        variant: "destructive",
        title: "Missing info",
        description: "Please enter a product name first to help the AI."
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateProductDescription({
        productType: formData.type,
        keyFeatures: formData.features.filter(f => f.trim() !== ''),
        targetAudience: formData.targetAudience || 'global travelers and digital professionals',
        tone: formData.tone
      });
      
      setFormData(prev => ({ ...prev, description: result.description }));
      toast({
        title: "AI Description Generated!",
        description: "The product description has been updated."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "AI generation failed",
        description: "There was an error generating the description. Please try again."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddFeature = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ''] }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);

    try {
      const cloudName = 'lgotzmv9';
      const uploadPreset = 'soj_social_products';

      if (!cloudName || !uploadPreset) {
        throw new Error('Cloudinary configuration is missing.');
      }

      const data = new FormData();
      data.append('file', file);
      data.append('upload_preset', uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: data,
        }
      );

      const result = await response.json();

      if (!response.ok || !result.secure_url) {
        throw new Error(result.error?.message || 'Image upload failed.');
      }

      setImageUrl(result.secure_url);

      toast({
        title: 'Image Uploaded',
        description: 'Product image uploaded successfully.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error?.message || 'Unable to upload product image.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Product Name Required',
        description: 'Please enter a product name.',
      });
      return;
    }

    const price = Number(formData.price);

    if (!Number.isFinite(price) || price <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Price',
        description: 'Please enter a valid product price.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { getFirestore, collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { getApp } = await import('firebase/app');

      const db = getFirestore(getApp());

      await addDoc(collection(db, 'Sociallogs'), {
        name: formData.name.trim(),
        type: formData.type,
        price,
        description: formData.description.trim(),
        imageUrl: imageUrl || '',
        features: formData.features.filter((item: string) => item.trim()),
        targetAudience: formData.targetAudience.trim(),
        tone: formData.tone,
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Product Created',
        description: `${formData.name} has been added successfully.`,
      });

      router.push('/admin');
    } catch (error: any) {
      console.error('Product creation error:', error);

      toast({
        variant: 'destructive',
        title: 'Product Creation Failed',
        description: error?.message || 'Unable to create the product.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <Link href="/admin" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="border-none ring-1 ring-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Create New Product - Social Log</CardTitle>
              <CardDescription>Fill in the details to list a new digital product on VirtuLink.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="product-image">Product Image</Label>

                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <label
                    htmlFor="product-image"
                    className="inline-flex items-center justify-center rounded-xl border border-dashed px-6 py-4 cursor-pointer hover:bg-muted transition-colors"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-5 w-5" />
                        Choose Product Image
                      </>
                    )}

                    <input
                      id="product-image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    />
                  </label>

                  {imageUrl && (
                    <div className="relative w-40 h-28 overflow-hidden rounded-xl border bg-muted">
                      <img
                        src={imageUrl}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  Choose the actual product picture from your phone.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. US Premium Virtual Number" 
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Product Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(v: ProductType) => setFormData(prev => ({ ...prev, type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="virtual number">Virtual Number</SelectItem>
                      <SelectItem value="eSIM">eSIM</SelectItem>
                      <SelectItem value="VPN subscription">VPN Subscription</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    value={formData.price}
                    onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Key Features</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={handleAddFeature}>
                    <Plus className="mr-1 h-4 w-4" /> Add Feature
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formData.features.map((feature, i) => (
                    <Input 
                      key={i}
                      placeholder={`Feature #${i+1}`}
                      value={feature}
                      onChange={e => handleFeatureChange(i, e.target.value)}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <Label className="flex items-center text-primary font-bold">
                      <Sparkles className="mr-2 h-4 w-4 text-accent" />
                      AI Description Tool
                    </Label>
                    <p className="text-xs text-muted-foreground">Automatically generate a professional description based on your features.</p>
                  </div>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="sm"
                    onClick={handleGenerateDescription}
                    disabled={isGenerating}
                    className="font-bold border-accent/20 border"
                  >
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Generate Description
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Tone</Label>
                    <Input 
                      placeholder="e.g. professional, exciting" 
                      value={formData.tone}
                      onChange={e => setFormData(prev => ({ ...prev, tone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Target Audience</Label>
                    <Input 
                      placeholder="e.g. crypto users, travelers" 
                      value={formData.targetAudience}
                      onChange={e => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Final Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Enter or generate a description..." 
                    className="h-32 leading-relaxed"
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-secondary/20 border-t flex justify-end gap-4 py-4">
              <Link href="/admin">
                <Button variant="ghost">Cancel</Button>
              </Link>
              <Button type="submit" disabled={isLoading} className="font-bold px-8">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Publish Product
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}