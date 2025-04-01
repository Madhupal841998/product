import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../../../core/models/product.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss']
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;
  isEditMode = false;
  productId: string | null = null;
  loading = false;
  submitting = false;
  error: string | null = null;
  imagePreviews: string[] = [];
  imageFiles: File[] = [];
  deletedImageUrls: string[] = [];
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService
  ) {
    this.productForm = this.createProductForm();
  }

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.productId;
    
    if (this.isEditMode && this.productId) {
      this.loadProduct(this.productId);
    }
  }

  createProductForm(): FormGroup {
    return this.fb.group({
      sku: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.maxLength(100)]],
      price: ['', [Validators.required, Validators.min(0)]],
      description: [''],
      images: this.fb.array([]),
      isactive: [true]
    });
  }

  get imagesFormArray(): FormArray {
    return this.productForm.get('images') as FormArray;
  }

  addImageField(): void {
    this.imagesFormArray.push(this.fb.control(null));
    this.imagePreviews.push('');
    this.imageFiles.push(null);
  }

  removeImageField(index: number): void {
    if (this.imagePreviews[index] && !this.imageFiles[index]) {
      const imageUrl = this.imagePreviews[index].replace(environment.imageUrl, '');
      this.deletedImageUrls.push(imageUrl);
    }
    
    this.imagesFormArray.removeAt(index);
    this.imagePreviews.splice(index, 1);
    this.imageFiles.splice(index, 1);
  }

  onFileChange(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      this.imageFiles[index] = file;
      
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviews[index] = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  loadProduct(id: string): void {
    this.loading = true;
    this.error = null;
    
    this.productService.getProductById(id).subscribe(
      (product) => {
        this.updateFormWithProduct(product);
        this.loading = false;
      },
      (error) => {
        this.error = error;
        this.loading = false;
      }
    );
  }

  updateFormWithProduct(product: Product): void {
    this.productForm.patchValue({
      sku: product.sku,
      name: product.name,
      price: product.price,
      description: product.description,
      isactive: product.isactive
    });
    
    while (this.imagesFormArray.length) {
      this.imagesFormArray.removeAt(0);
    }
    
    if (product.images && product.images.length > 0) {
      product.images.forEach((image, index) => {
        this.imagesFormArray.push(this.fb.control(null));
        this.imagePreviews[index] = `${environment.imageUrl}${image}`;
      });
    }
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      Object.keys(this.productForm.controls).forEach(key => {
        const control = this.productForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
    
    this.submitting = true;
    this.error = null;
    
    const productData = this.productForm.value;
    
    if (this.isEditMode && this.productId) {
      productData.deletedImages = this.deletedImageUrls;
      this.productService.updateProduct(this.productId, productData).subscribe(
        () => {
          if (this.imageFiles.some(file => file !== null)) {
            const newImages = this.imageFiles.filter(file => file !== null);
            this.uploadImages(this.productId, newImages);
          } else {
            this.submitting = false;
            this.router.navigate(['/products']);
          }
        },
        (error) => {
          this.error = error;
          this.submitting = false;
        }
      );
    } else {
      if (this.imageFiles.length === 0 || this.imageFiles[0] === null) {
        this.error = 'At least one image is required';
        this.submitting = false;
        return;
      }

      const formData = new FormData();
      formData.append('sku', productData.sku);
      formData.append('name', productData.name);
      formData.append('price', productData.price);
      formData.append('description', productData.description || '');
      formData.append('isactive', productData.isactive ? 'true' : 'false');
      
      this.imageFiles.forEach((file, index) => {
        if (file) {
          formData.append(`image${index}`, file, file.name);
        }
      });

      this.productService.createProduct(formData).subscribe(
        () => {
          this.submitting = false;
          this.router.navigate(['/products']);
        },
        (error) => {
          this.error = error;
          this.submitting = false;
        }
      );
    }
  }

  uploadImages(productId: string, files: File[]): void {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`image${index}`, file, file.name);
    });

    this.productService.updateProductImages(productId, formData).subscribe(
      () => {
        this.submitting = false;
        this.router.navigate(['/products']);
      },
      (error) => {
        this.error = error;
        this.submitting = false;
      }
    );
  }
}