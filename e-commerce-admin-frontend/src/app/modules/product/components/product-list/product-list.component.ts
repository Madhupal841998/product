import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { Product } from '../../../../core/models/product.model';
import { environment } from 'src/environments/environment.prod';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  loading = false;
  error: string | null = null;
  currentPage = 1;
  itemsPerPage = 5;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.error = null;
    
    this.productService.getAllProducts().subscribe(
      (products) => {
        this.products = products.map(product => ({
          ...product,
          images: product.images ? product.images.map(image => `${environment.imageUrl}${image}`) : []
        }));
        this.loading = false;
      },
      (error) => {
        this.error = error;
        this.loading = false;
      }
    );
  }

  deleteProduct(id: string): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(id).subscribe(
        () => {
          this.products = this.products.filter(product => product.id !== id);
        },
        (error) => {
          this.error = error;
        }
      );
    }
  }

  changePage(page: number): void {
    this.currentPage = page;
  }

  get paginatedProducts(): Product[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.products.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.products.length / this.itemsPerPage);
  }
}