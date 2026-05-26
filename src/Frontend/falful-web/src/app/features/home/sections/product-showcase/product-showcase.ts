import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollAnimateDirective } from '../../../../shared/directives/scroll-animate.directive';

interface Product {
  emoji: string;
  name: string;
  tag: string;
  tagColor: string;
  price: string;
  unit: string;
  rating: number;
  reviews: number;
}

@Component({
  selector: 'app-product-showcase',
  standalone: true,
  imports: [RouterLink, ScrollAnimateDirective],
  templateUrl: './product-showcase.html',
  styleUrl: './product-showcase.scss'
})
export class ProductShowcaseComponent {
  products: Product[] = [
    { emoji: '🍎', name: 'Fuji Apples',      tag: 'Best Seller', tagColor: 'amber', price: '220', unit: '/kg',  rating: 5, reviews: 128 },
    { emoji: '🥭', name: 'Alphonso Mango',   tag: 'Seasonal',    tagColor: 'green', price: '380', unit: '/kg',  rating: 5, reviews: 94  },
    { emoji: '🍓', name: 'Fresh Strawberry', tag: 'New',         tagColor: 'red',   price: '450', unit: '/box', rating: 4, reviews: 67  },
    { emoji: '🍱', name: 'Mixed Fruit Box',  tag: 'Popular',     tagColor: 'blue',  price: '650', unit: '/box', rating: 5, reviews: 210 },
    { emoji: '🍊', name: 'Nagpur Oranges',   tag: 'Fresh Today', tagColor: 'green', price: '180', unit: '/kg',  rating: 4, reviews: 85  },
    { emoji: '🍇', name: 'Black Grapes',     tag: 'Organic',     tagColor: 'purple',price: '320', unit: '/kg',  rating: 5, reviews: 52  },
  ];

  starsArray(n: number): number[] {
    return Array(n).fill(0);
  }
}
