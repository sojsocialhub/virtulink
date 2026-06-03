"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/lib/types';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="flex flex-col h-full group overflow-hidden hover:shadow-lg transition-all duration-300 border-none ring-1 ring-border">
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          data-ai-hint={product.type}
        />
        <div className="absolute top-3 left-3">
          <Badge className="bg-primary/90 text-primary-foreground capitalize">
            {product.type}
          </Badge>
        </div>
      </div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
            {product.name}
          </CardTitle>
          <span className="text-xl font-bold text-primary">${product.price.toFixed(2)}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {product.description}
        </p>
        <ul className="space-y-2">
          {product.features.slice(0, 3).map((feature, i) => (
            <li key={i} className="flex items-center text-xs font-medium">
              <Check className="h-3 w-3 text-accent mr-2" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="pt-0">
        <Link href={`/checkout/${product.id}`} className="w-full">
          <Button className="w-full group/btn" size="lg">
            Buy Now
            <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}